import axios from 'axios';

// During dev, Vite proxy forwards /api → http://localhost:5000/api.
// In production, set VITE_API_URL to the absolute backend URL if it differs.
const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

const apiClient = axios.create({
  baseURL:         API_BASE,
  timeout:         30_000,
  withCredentials: false,
  headers: { 'Content-Type': 'application/json' },
});

// ── Response interceptor ──────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
