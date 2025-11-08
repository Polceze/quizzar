import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/useAuth';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // API call uses the proxy set up in vite.config.js
      const res = await axios.post('/api/auth/login', formData);

      // 1. Call the login function from AuthContext to update global state
      const { token, ...userWithoutToken } = res.data;
      login(userWithoutToken, token);
      
      // 2. Redirect to dashboard
      navigate('/dashboard', { replace: true });
    } catch (err) {
      // Display error message from backend (e.g., 'Invalid email or password.')
      setError(err.response?.data?.message || 'Login failed. Please check your network.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6 text-indigo-600">Quizzar Login</h2>
        <form onSubmit={handleSubmit}>
          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150"
          >
            Sign In
          </button>
        </form>
        <p className="text-center text-gray-600 text-sm mt-4">
          Don't have an account? <Link to="/register" className="text-indigo-600 hover:text-indigo-800 font-bold">Register here</Link>
        </p>
        {/* Back to home link */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-grey-600 hover:text-orange-800"
          >
            ← Back to Home
          </button>
        </div>  
      </div>
    </div>
  );
};

export default Login;