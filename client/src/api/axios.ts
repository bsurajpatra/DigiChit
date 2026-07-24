import axios from 'axios';
import { config } from '../config/env';

const api = axios.create({
    baseURL: config.apiUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle auth errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle 401 Unauthorized errors
        if (error.response?.status === 401) {
            const errorCode = error.response?.data?.errorCode;
            
            // Exclude credential validation errors on login attempt
            const isLoginCredError = ['AUTH_INCORRECT_PASSWORD', 'AUTH_EMAIL_NOT_FOUND', 'AUTH_EMAIL_UNVERIFIED'].includes(errorCode);

            if (!isLoginCredError) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');

                const currentPath = window.location.pathname;
                const isAuthPage = ['/login', '/signup', '/verify-email', '/verify-email-info', '/forgot-password', '/reset-password'].includes(currentPath);

                if (!isAuthPage) {
                    window.location.href = '/login?expired=true';
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
