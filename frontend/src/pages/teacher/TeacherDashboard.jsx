import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

const TeacherDashboard = () => {
  const { user } = useAuth();

  // If the user is pending, show a restricted dashboard view
  if (user.role === 'pending_teacher') {
    return (
      <div className="p-8 bg-white rounded-lg shadow-xl text-center">
        <h1 className="text-3xl font-bold text-yellow-600 mb-4">Verification Pending</h1>
        <p className="text-gray-600 mb-6">
          You are currently a **Pending Teacher**. Full access to create units and exams will be granted once an administrator verifies your account.
        </p>
        <Link to="/teacher/profile" className="text-indigo-600 hover:text-indigo-800 font-medium">
          View Verification Status
        </Link>
      </div>
    );
  }
  
  // Full Teacher Dashboard View (only for role: 'teacher')
  return (
    <div className="p-8 bg-green-100 rounded-lg shadow-xl">
      <h1 className="text-3xl font-bold text-green-700 mb-4">Teacher Dashboard</h1>
      <p className="mb-6">Full access granted. Start creating your units and quizzes!</p>
      {/* Navigation for full teacher features */}
      <div className="flex space-x-4">
        <Link to="/teacher/units" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">Manage Units</Link>
        <Link to="/teacher/profile" className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">My Profile</Link>
      </div>
    </div>
  );
};

export default TeacherDashboard;