import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
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
            
            // If the session has explicitly expired or is invalid
            if (errorCode === 'AUTH_SESSION_EXPIRED' || errorCode === 'AUTH_INVALID_TOKEN') {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                // Force a page reload to clear context and redirect to login
                window.location.href = '/login?expired=true';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
