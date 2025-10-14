import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const Layout = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Bar */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <Link to="/" className="text-2xl font-bold text-indigo-600">
            Quizzar
          </Link>
          <nav className="flex space-x-4 items-center">
            {isAuthenticated ? (
              <>
                <span className="text-gray-700 text-sm font-medium hidden sm:inline">
                  Welcome, {user?.email} ({user?.role})
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-700 hover:text-indigo-600">Login</Link>
                <Link to="/register" className="px-3 py-1 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition">Register</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <Outlet /> {/* Renders the current route's element */}
      </main>
    </div>
  );
};

export default Layout;