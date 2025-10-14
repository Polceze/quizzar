import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/useAuth';
import { useNavigate } from 'react-router-dom';

const StudentProfileForm = () => {
  const { user, token, login } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState(null);
  
  // NOTE: If user.isVerified is true, they have already completed the profile.
  if (user?.isVerified) {
      return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-green-600">Profile Complete</h2>
            <p className="text-gray-700">Your student profile is complete and verified. You may proceed to your dashboard.</p>
            <button 
                onClick={() => navigate('/dashboard')}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
                Go to Dashboard
            </button>
        </div>
      );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage('');

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };

      // POST to backend student profile endpoint
      await axios.post('/api/users/student-profile', { fullName }, config);
      
      // Update local state: The backend automatically sets isVerified: true
      // We simulate a re-login to update the global state and local storage
      const updatedUser = { ...user, isVerified: true };
      login(updatedUser, token);

      setMessage('Student profile completed successfully! Redirecting...');
      setTimeout(() => navigate('/student/dashboard'), 1500);

    } catch (err) {
      setError(err.response?.data?.message || 'Profile completion failed.');
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-xl max-w-lg mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-indigo-600">Complete Your Student Profile</h2>
      {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
      {message && <p className="text-green-600 mb-4 text-center font-semibold">{message}</p>}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fullName">Full Name</label>
          <input
            type="text"
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="shadow border rounded w-full py-2 px-3 text-gray-700 focus:ring-indigo-500"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition"
        >
          Submit Profile
        </button>
      </form>
    </div>
  );
};

export default StudentProfileForm;