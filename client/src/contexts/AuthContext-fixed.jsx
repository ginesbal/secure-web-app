// client/src/contexts/AuthContext-fixed.jsx
// FIXED VERSION - Rename to AuthContext.jsx to use it
// Uses httpOnly cookies instead of localStorage

import axios from 'axios';
import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [csrfToken, setCsrfToken] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

    // Configure axios to send cookies with requests
    axios.defaults.withCredentials = true;

    useEffect(() => {
        // On mount, try to get user profile (will use httpOnly cookies)
        checkAuth();
    }, []);

    /**
     * Check if user is authenticated by fetching profile
     */
    const checkAuth = async () => {
        try {
            const response = await axios.get(`${API_URL}/auth/profile`);
            setUser(response.data);

            // Extract CSRF token from cookie (it's set as non-httpOnly)
            const csrf = getCookie('csrfToken');
            if (csrf) {
                setCsrfToken(csrf);
                axios.defaults.headers.common['X-CSRF-Token'] = csrf;
            }
        } catch (error) {
            // Not authenticated or session expired
            setUser(null);
            setCsrfToken(null);
            delete axios.defaults.headers.common['X-CSRF-Token'];
        } finally {
            setLoading(false);
        }
    };

    /**
     * Get cookie value by name
     */
    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            return parts.pop().split(';').shift();
        }
        return null;
    };

    /**
     * Login user
     */
    const login = async (username, password) => {
        try {
            const response = await axios.post(`${API_URL}/auth/login`, {
                username,
                password
            });

            const { user, csrfToken } = response.data;

            // Set CSRF token for future requests
            setCsrfToken(csrfToken);
            axios.defaults.headers.common['X-CSRF-Token'] = csrfToken;

            setUser(user);

            return { success: true };
        } catch (error) {
            // Check for rate limiting
            if (error.response?.status === 429) {
                return {
                    success: false,
                    message: 'Too many login attempts. Please try again later.'
                };
            }

            return {
                success: false,
                message: error.response?.data?.error || 'Login failed'
            };
        }
    };

    /**
     * Register new user
     */
    const register = async (username, email, password, captchaAnswer) => {
        try {
            const response = await axios.post(`${API_URL}/auth/register`, {
                username,
                email,
                password,
                captchaAnswer
            });

            return {
                success: true,
                message: response.data.message,
                verificationToken: response.data.verificationToken
            };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.error || 'Registration failed',
                field: error.response?.data?.field
            };
        }
    };

    /**
     * Logout user
     */
    const logout = async () => {
        try {
            await axios.post(`${API_URL}/auth/logout`);
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            // Clear state regardless of API call success
            setUser(null);
            setCsrfToken(null);
            delete axios.defaults.headers.common['X-CSRF-Token'];
        }
    };

    /**
     * Refresh access token
     */
    const refreshToken = async () => {
        try {
            const response = await axios.post(`${API_URL}/auth/refresh`);
            const { csrfToken } = response.data;

            // Update CSRF token
            setCsrfToken(csrfToken);
            axios.defaults.headers.common['X-CSRF-Token'] = csrfToken;

            return true;
        } catch (error) {
            // Refresh failed, user needs to login again
            setUser(null);
            setCsrfToken(null);
            delete axios.defaults.headers.common['X-CSRF-Token'];
            return false;
        }
    };

    const value = {
        user,
        loading,
        csrfToken,
        login,
        register,
        logout,
        refreshToken,
        checkAuth,
        isAuthenticated: !!user
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
