import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/useAuth';

const ProtectedRoute = ({ allowedRoles }) => {
  const { isAuthenticated, role, isLoading } = useAuth();

  // Show a loading spinner or similar during initial state load
  if (isLoading) {
    return <div className="text-center p-8">Loading...</div>; 
  }

  // 1. Check Authentication: Must be logged in
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // 2. Check Authorization: Role must match one of the allowed roles
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Redirect unauthorized users to the dashboard or home
    return <Navigate to="/dashboard" replace />; 
  }

  // User is authenticated and authorized, render the child route
  return <Outlet />;
};

export default ProtectedRoute;