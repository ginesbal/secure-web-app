// client/src/services/api-fixed.js
// FIXED VERSION - Rename to api.js to use it
// Works with httpOnly cookies and CSRF tokens

import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true // CRITICAL: Send cookies with requests
});

/**
 * Get CSRF token from cookie
 */
function getCSRFToken() {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; csrfToken=`);
    if (parts.length === 2) {
        return parts.pop().split(';').shift();
    }
    return null;
}

// Request interceptor - Add CSRF token to all state-changing requests
api.interceptors.request.use(
    config => {
        // Add CSRF token for state-changing operations
        if (['post', 'put', 'delete', 'patch'].includes(config.method.toLowerCase())) {
            const csrfToken = getCSRFToken();
            if (csrfToken) {
                config.headers['X-CSRF-Token'] = csrfToken;
            }
        }

        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

// Response interceptor - Handle token refresh
api.interceptors.response.use(
    response => response,
    async error => {
        const originalRequest = error.config;

        // If 401 and haven't retried yet, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                // Try to refresh the access token
                await api.post('/auth/refresh');

                // Retry original request with new token (from cookie)
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed, redirect to login
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        // Handle CSRF token errors
        if (error.response?.status === 403 && error.response?.data?.error?.includes('CSRF')) {
            // CSRF token invalid or expired, try to get a new one by refreshing
            try {
                await api.post('/auth/refresh');
                return api(originalRequest);
            } catch (refreshError) {
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);

/**
 * Authentication API
 * Note: These don't need explicit token handling - cookies are automatic
 */
export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    verifyEmail: (token) => api.post('/auth/verify-email', { token }),
    logout: () => api.post('/auth/logout'),
    refresh: () => api.post('/auth/refresh'),
    getProfile: () => api.get('/auth/profile')
};

/**
 * User API
 */
export const userAPI = {
    getProfile: () => api.get('/auth/profile'),
    getUsers: () => api.get('/users'),
    updateProfile: (data) => api.put('/users/profile', data),
    deleteUser: (userId) => api.delete(`/users/${userId}`)
};

/**
 * Security API
 */
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
