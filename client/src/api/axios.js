import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL;
let baseURL;
if (rawApiUrl) {
    // Explicit env var set (e.g. in local dev pointing to dev server)
    const trimmed = rawApiUrl.replace(/\/$/, '');
    baseURL = trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
} else {
    // Production (Render): frontend is served by the same Express server,
    // so use a relative URL — calls go to the same origin/host automatically.
    baseURL = '/api';
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
