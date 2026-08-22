
import axios from 'axios';

const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// ============================================================
// REQUEST INTERCEPTOR
// Attach JWT token to authenticated requests
// ============================================================

apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');

        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }

        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
            delete config.headers['content-type'];
        }

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// ============================================================
// RESPONSE INTERCEPTOR
// Handle expired / invalid JWT tokens
// ============================================================

apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        const status = error.response?.status;
        const requestUrl = error.config?.url || '';

        // IMPORTANT:
        // Do NOT treat a failed login request as an expired session.
        const isLoginRequest =
            requestUrl.includes('/auth/login');

        if (status === 401 && !isLoginRequest) {
            console.warn('Token expired or invalid.');

            localStorage.removeItem('token');

            // Redirect only when we are actually
            // on an authenticated request.
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }

        return Promise.reject(error);
    }
);

export default apiClient;
