import axios from 'axios';

const rawApiUrl = import.meta.env.VITE_API_URL;
let baseURL;
if (rawApiUrl) {
    // Set VITE_API_URL in Vercel env vars to your Render backend URL
    // e.g. https://your-app.onrender.com
    const trimmed = rawApiUrl.replace(/\/$/, '');
    baseURL = trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
} else {
    // Local dev fallback
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
