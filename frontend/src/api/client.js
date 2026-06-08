import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://cheonan-api.xmincloud.com',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export default api;
