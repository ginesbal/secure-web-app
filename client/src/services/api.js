import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refreshToken');
                const response = await api.post('/auth/refresh', { refreshToken });
                const { accessToken } = response.data;

                localStorage.setItem('accessToken', accessToken);
                originalRequest.headers.Authorization = `Bearer ${accessToken}`;

                return api(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    logout: () => api.post('/auth/logout'),
    refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken })
};

export const userAPI = {
    getProfile: () => api.get('/users/profile'),
    getUsers: () => api.get('/users'),
    updateProfile: (data) => api.put('/users/profile', data),
    deleteUser: (userId) => api.delete(`/users/${userId}`)
};

export const securityAPI = {
    getActivityLogs: () => api.get('/activity'),
    getSecurityEvents: () => api.get('/security-events'),
    getStatistics: () => api.get('/stats'),
    testXSS: (data) => api.post('/demo/xss', data),
    testSQL: (data) => api.post('/demo/sql', data),
    testCSRF: (data) => api.post('/demo/csrf', data),
    testPathTraversal: (data) => api.post('/demo/path-traversal', data)
};

export default api;