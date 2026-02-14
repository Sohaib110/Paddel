import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL;
let baseURL;
if (rawApiUrl) {
    const trimmed = rawApiUrl.replace(/\/$/, '');
    baseURL = trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
} else {
    baseURL = 'http://localhost:5000/api';
}

const api = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;
