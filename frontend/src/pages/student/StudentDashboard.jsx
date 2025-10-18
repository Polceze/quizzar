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
        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: My Units & Enrollment */}
            <Link 
                to="/student/units" 
                className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition duration-300 transform hover:scale-[1.02] border-t-4 border-yellow-500"
            >
                <h2 className="text-xl font-semibold text-yellow-700 mb-2">My Units & Enrollment</h2>
                <p className="text-gray-600">View enrolled units and send new requests.</p>
            </Link>

            {/* Card 2: Available Exams */}
            <Link 
                to="/student/exams" 
                className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition duration-300 transform hover:scale-[1.02] border-t-4 border-green-500"
            >
                <h2 className="text-xl font-semibold text-green-700 mb-2">Available Exams</h2>
                <p className="text-gray-600">Start new quizzes and tests for your enrolled classes.</p>
            </Link>

            {/* Card 3: Exams Results */}
            <Link 
                to="/student/results" // Assuming a future results page
                className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition duration-300 transform hover:scale-[1.02] border-t-4 border-yellow-500"
            >
                <h2 className="text-xl font-semibold text-yellow-700 mb-2">My Results</h2>
                <p className="text-gray-600">View scores and attempt history for completed exams.</p>
            </Link>

            {/* Card 4: Profile/Settings */}
            <Link 
                to="/student/profile" 
                className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition duration-300 transform hover:scale-[1.02] border-t-4 border-indigo-500"
            >
                <h2 className="text-xl font-semibold text-indigo-700 mb-2">Update Profile</h2>
                <p className="text-gray-600">Update your student information and settings.</p>
            </Link>
        </div>
    </div>
  );
};

export default StudentDashboard;