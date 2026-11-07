import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

// Tự động đính kèm Bearer token cho mọi request tới Backend
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('kids_token');
  if (token) {
    // Axios 1.x uses AxiosHeaders in the browser. Use its setter when
    // available so the Authorization header is never silently dropped.
    if (typeof config.headers?.set === 'function') {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default API;
