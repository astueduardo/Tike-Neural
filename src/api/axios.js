import axios from "axios";

const NGROK_AUTH = btoa("admin:devpass123");

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Basic ${NGROK_AUTH}`,
    'ngrok-skip-browser-warning': true
  },
  withCredentials: true // Permite enviar cookies y credenciales
});

// Interceptor para el token JWT
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

export default api;
