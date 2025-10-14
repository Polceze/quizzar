import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

const StudentDashboard = () => {
  const { user } = useAuth();
  
  // Force profile completion if the student is not verified
  if (user.role === 'student' && !user.isVerified) {
    return <Navigate to="/student/profile" replace />; 
  }

  // Full Student Dashboard View (Only reaches here if user.isVerified is true)
  return (
    <div className="p-8 bg-blue-100 rounded-lg shadow-xl">
      <h1 className="text-3xl font-bold text-blue-700 mb-4">Student Dashboard</h1>
      <p className="mb-6">Welcome! You are now verified and have full access to Quizzar.</p>
      {/* Navigation for full student features */}
      <div className="flex space-x-4">
        <Link to="/student/enrollments" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">My Classes</Link>
        <Link to="/student/profile" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Update Profile</Link>
      </div>
    </div>
  );
};

export default StudentDashboard;