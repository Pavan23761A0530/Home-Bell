import axios from 'axios';
const API_BASE_URL = import.meta.env.PROD 
    ? (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api')
    : `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
});
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);
api.interceptors.response.use(
    (response) => response,
    (error) => {
        return Promise.reject(error);
    }
);
export default api;
