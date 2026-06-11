import axios from 'axios';

const PRODUCTION_API_URL = 'https://cheonan-api.xmincloud.com';
const configuredApiUrl = import.meta.env.VITE_API_URL;
const isBrowser = typeof window !== 'undefined';
const isLocalHost = isBrowser && ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
const pointsToLoopback = configuredApiUrl && /^(https?:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)/i.test(configuredApiUrl);
const apiBaseUrl = !isLocalHost && pointsToLoopback
  ? PRODUCTION_API_URL
  : (configuredApiUrl || PRODUCTION_API_URL);

const api = axios.create({
  baseURL: apiBaseUrl,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

export default api;
