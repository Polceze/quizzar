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
      <h1 className="text-3xl font-bold text-green-700 mb-6">Teacher Dashboard</h1>
      <p className="mb-8">Welcome, {user.email}. Manage your units, questions, and exams here.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card 2: Enrollment Requests */}
        <Link 
            to="/teacher/units/requests" 
            className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition duration-300 transform hover:scale-[1.02] border-t-4 border-yellow-500"
        >
            <h2 className="text-xl font-semibold text-yellow-700 mb-2">Review Enrollment Requests</h2>
            <p className="text-gray-600">Approve or reject students requesting to join your units.</p>
        </Link>

        {/* Card 3: Student management */}
        <Link 
          to="/teacher/students" 
          className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition duration-300 transform hover:scale-[1.02] border-t-4 border-green-500"
        >
          <h2 className="text-xl font-semibold text-green-700 mb-2">Manage Students</h2>
          <p className="text-gray-600">View and manage students in your units, remove enrollments.</p>
        </Link>

        {/* Card 1: Unit & Question Management */}
        <Link 
            to="/teacher/units" 
            className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition duration-300 transform hover:scale-[1.02] border-t-4 border-blue-500"
        >
            <h2 className="text-xl font-semibold text-blue-700 mb-2">Manage Units & Questions</h2>
            <p className="text-gray-600">Create, view, and edit your classes/subjects and their questions.</p>
        </Link>

        {/* Card 4: Exam Management */}
        <Link 
            to="/teacher/exams" 
            className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition duration-300 transform hover:scale-[1.02] border-t-4 border-blue-500"
        >
            <h2 className="text-xl font-semibold text-blue-700 mb-2">Manage Exams</h2>
            <p className="text-gray-600">Create, publish, review, and delete quizzes and tests.</p>
        </Link>
      
        {/* Card: Analytics Dashboard */}
        <Link 
          to="/teacher/analytics" 
          className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition duration-300 transform hover:scale-[1.02] border-t-4 border-purple-500"
        >
          <h2 className="text-xl font-semibold text-purple-700 mb-2">Results & Exam Analytics</h2>
          <p className="text-gray-600">Manage results release, view performance insights, and track students progress</p>
        </Link>

        {/* Card 5: Profile/Settings */}
        <Link 
            to="/teacher/profile/form" 
            className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition duration-300 transform hover:scale-[1.02] border-t-4 border-red-800"
        >
            <h2 className="text-xl font-semibold text-red-900 mb-2">My Profile & Settings</h2>
            <p className="text-gray-600">Update account information and view credentials.</p>
        </Link>

        {/* Card 6: Admin only - School administration */}
        {user.role === 'admin' && (
          <Link 
            to="/admin/school" 
            className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition duration-300 transform hover:scale-[1.02] border-t-4 border-purple-500"
          >
            <h2 className="text-xl font-semibold text-purple-700 mb-2">School Administration</h2>
            <p className="text-gray-600">Manage school settings, teachers, and students.</p>
          </Link>
        )}
        
      </div>
    </div>
  );
};

export default TeacherDashboard;