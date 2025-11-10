import axios from 'axios';

const API_BASE_URL = (
  (typeof globalThis !== 'undefined' && globalThis.process?.env?.REACT_APP_API_URL) || 
  '/' // <-- CRITICAL: Use relative path as default for proxy
);

console.log('🔧 API Base URL:', API_BASE_URL); // Debug log

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, 
});

export default api;