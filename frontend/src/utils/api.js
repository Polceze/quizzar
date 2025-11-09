import axios from 'axios';

// Use environment variable or hardcode the Render URL
const API_BASE_URL = (typeof globalThis !== 'undefined' && globalThis.process?.env?.REACT_APP_API_URL) || 'https://quizzar-llj0.onrender.com';

console.log('🔧 API Base URL:', API_BASE_URL); // Debug log

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export default api;