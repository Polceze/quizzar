import axios from 'axios';
import process from 'react-router-dom';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://quizzar-llj0.onrender.com' 
  : 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export default api;