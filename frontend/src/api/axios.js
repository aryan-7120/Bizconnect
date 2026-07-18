import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// Attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('bizconnect_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('bizconnect_token');
      localStorage.removeItem('bizconnect_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
