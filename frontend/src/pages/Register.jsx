import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../context/useAuth';

const Register = () => {
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    role: 'student',
    school: '' // NEW: Required school field
  });
  const [schools, setSchools] = useState([]);
  // const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // NEW: Get pre-selected school from URL params (for "Join Existing School" flow)
  const preselectedSchoolId = searchParams.get('schoolId');

  useEffect(() => {
    fetchSchools();
    
    // If schoolId provided in URL, pre-fill the form
    if (preselectedSchoolId) {
      setFormData(prev => ({ ...prev, school: preselectedSchoolId }));
    }
  }, [preselectedSchoolId]);

  const fetchSchools = async () => {
    try {
      const res = await api.get('/api/schools'); 
      
      // Ensure the response data is an array before setting state
      if (Array.isArray(res.data)) {
        setSchools(res.data);
      } else {
        // If the backend returns an object (e.g., { message: '...' })
        // or anything non-array, log it and safely set schools to empty array.
        console.error('API returned non-array data for schools:', res.data);
        setSchools([]); 
      }
    } catch (err) {
      console.error('Error fetching schools:', err);
      // On error, ensure schools is an empty array to prevent the map error
      setSchools([]); 
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // NEW: Validate school selection
    if (!formData.school) {
      setError('Please select a school to join.');
      return;
    }

    try {
      const res = await api.post('/api/auth/register', formData);
      const { token, ...userWithoutToken } = res.data;
      login(userWithoutToken, token);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6 text-indigo-600">Join Quizzar</h2>
        <form onSubmit={handleSubmit}>
          {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
          
          {/* School Selection - REQUIRED */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="school">
              Select School *
            </label>
            <select
              id="school"
              name="school"
              value={formData.school}
              onChange={handleChange}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="">Choose a school...</option>
              {schools.map(school => (
                <option key={school._id} value={school._id}>
                  {school.name}
                </option>
              ))}
            </select>
            {schools.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                No schools available. <Link to="/" className="text-indigo-600 hover:text-indigo-800">Create the first school?</Link>
              </p>
            )}
          </div>

          {/* Email Field */}
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

          {/* Password Field */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
              minLength="6"
            />
          </div>

          {/* Role Selection */}
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">I am a...</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150"
            disabled={schools.length === 0} // Disable if no schools available
          >
            {schools.length === 0 ? 'No Schools Available' : 'Join School'}
          </button>
        </form>
        <p className="text-center text-gray-600 text-sm mt-4">
          Already have an account? <Link to="/login" className="text-indigo-600 hover:text-indigo-800 font-bold">Sign In</Link>
        </p>
        
        {/* NEW: School Creation CTA */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800 text-center mb-2">
            Want to start your own school?
          </p>
          <Link 
            to="/create-school" 
            className="block text-center bg-white text-blue-600 border border-blue-600 px-4 py-2 rounded hover:bg-blue-50 transition font-medium text-sm"
          >
            Create a New School
          </Link>
        </div>
        {/* Back to home link */}
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/')}
            className="text-sm text-orange-600 hover:text-orange-800"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;