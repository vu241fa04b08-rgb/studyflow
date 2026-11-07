import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const axiosClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token from localStorage if available
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('studyflow_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle session expirations
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Don't auto redirect if we are already on login or signup
      if (
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/signup') &&
        window.location.pathname !== '/'
      ) {
        localStorage.removeItem('studyflow_token');
        localStorage.removeItem('studyflow_user');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
