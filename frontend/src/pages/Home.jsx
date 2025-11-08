import React from 'react';
import { Link } from 'react-router-dom';

const Home = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">Quizzar</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-600 hover:text-indigo-600 font-medium">
                Sign In
              </Link>
              <Link 
                to="/schools" 
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition text-sm"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            AI-Powered Examination Platform
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Create intelligent exams, manage classrooms, and streamline assessments with Quizzar. 
            Perfect for educational institutions looking to modernize their examination process.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16">
            <Link
              to="/create-school"
              className="bg-indigo-600 text-white px-8 py-4 rounded-lg hover:bg-indigo-700 transition font-medium text-lg w-full sm:w-auto text-center"
            >
              Create New School
            </Link>
            <Link
              to="/schools"
              className="bg-white text-indigo-600 border border-indigo-600 px-8 py-4 rounded-lg hover:bg-indigo-50 transition font-medium text-lg w-full sm:w-auto text-center"
            >
              Join Existing School
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center mb-6">
              <span className="text-blue-600 text-2xl">🎯</span>
            </div>
            <h3 className="text-xl font-semibold mb-4">AI-Powered Exams</h3>
            <p className="text-gray-600">
              Generate intelligent exam questions from study materials using advanced AI technology.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center mb-6">
              <span className="text-green-600 text-2xl">👨‍🏫</span>
            </div>
            <h3 className="text-xl font-semibold mb-4">School Management</h3>
            <p className="text-gray-600">
              Complete school administration with teacher approvals, student management, and class organization.
            </p>
          </div>
          
          <div className="bg-white p-8 rounded-lg shadow-sm">
            <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center mb-6">
              <span className="text-purple-600 text-2xl">🛡️</span>
            </div>
            <h3 className="text-xl font-semibold mb-4">Exam Integrity</h3>
            <p className="text-gray-600">
              Advanced anti-cheating features including tab-switch and application switch detection.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <h2 className="text-3xl font-bold mb-8">Getting Started is Easy</h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 text-xl font-bold">1</span>
              </div>
              <h3 className="font-semibold mb-2">Create or Join</h3>
              <p className="text-sm text-gray-600">Create a new school or join an existing one</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 text-xl font-bold">2</span>
              </div>
              <h3 className="font-semibold mb-2">Set Up Account</h3>
              <p className="text-sm text-gray-600">Complete your profile as teacher or student</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 text-xl font-bold">3</span>
              </div>
              <h3 className="font-semibold mb-2">Manage Units</h3>
              <p className="text-sm text-gray-600">Teachers create units, students enroll</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-indigo-600 text-xl font-bold">4</span>
              </div>
              <h3 className="font-semibold mb-2">Create & Take Exams</h3>
              <p className="text-sm text-gray-600">AI-powered exam creation and secure testing</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;