import axios from 'axios';

const api = axios.create({
  baseURL: 'https://quick-bill-system-idg3toun4-sagar-sisodiyas-projects.vercel.app/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('qb_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('qb_token');
      localStorage.removeItem('qb_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
