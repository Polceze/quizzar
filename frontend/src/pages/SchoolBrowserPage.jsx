import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const SchoolBrowserPage = () => {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchSchools();
  }, []);

  const fetchSchools = async () => {
    try {
      const res = await axios.get('/api/schools');
      setSchools(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load schools.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinSchool = (schoolId) => {
    // Navigate to registration with school pre-selected
    navigate(`/register?schoolId=${schoolId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading schools...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-2xl font-bold text-indigo-600">Quizzar</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-600 hover:text-indigo-600 font-medium">
                Sign In
              </Link>
              <Link 
                to="/create-school" 
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm"
              >
                Create School
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Join an Existing School</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Select your school from the list below to create your account and get started with Quizzar.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {schools.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🏫</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">No Schools Available</h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              There are no schools set up yet. Be the first to create a school and start using Quizzar!
            </p>
            <Link 
              to="/create-school" 
              className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition font-medium"
            >
              Create the First School
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {schools.map((school) => (
              <div key={school._id} className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{school.name}</h3>
                  <p className="text-gray-600 mb-4 line-clamp-2">
                    {school.description || 'No description provided.'}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <span>Admin: {school.admin?.email}</span>
                    <span>Created: {new Date(school.createdAt).toLocaleDateString()}</span>
                  </div>

                  <button
                    onClick={() => handleJoinSchool(school._id)}
                    className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition font-medium"
                  >
                    Join This School
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Alternative CTA */}
        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">Don't see your school?</p>
          <Link 
            to="/create-school" 
            className="bg-white text-indigo-600 border border-indigo-600 px-6 py-3 rounded-lg hover:bg-indigo-50 transition font-medium"
          >
            Create a New School
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SchoolBrowserPage;