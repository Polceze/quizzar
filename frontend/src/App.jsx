import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/useAuth';
import ProtectedRoute from './components/ProtectedRoute';

// Import Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/student/StudentDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import NotFound from './pages/NotFound';

function App() {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return <div className="text-center p-8">Loading Application...</div>;
  }

  // Helper to determine the correct dashboard path
  const getDashboardPath = () => {
    if (role === 'student') return '/student/dashboard';
    if (role === 'teacher' || role === 'pending_teacher' || role === 'admin') return '/teacher/dashboard';
    return '/login'; // Fallback
  }

  return (
    <Routes>
      {/* 1. Root Route: Redirects if logged in, otherwise shows Home */}
      <Route path="/" element={
        isAuthenticated 
          ? <Navigate to={getDashboardPath()} replace /> 
          : <Home />
      } />
      
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* 2. Primary Dashboard Redirect (Handles manual navigation to /dashboard) */}
      <Route path="/dashboard" element={
        isAuthenticated 
          ? <Navigate to={getDashboardPath()} replace />
          : <Navigate to="/login" replace />
      } />

      {/* 3. Protected Routes */}
      <Route element={<ProtectedRoute allowedRoles={['student', 'teacher', 'admin', 'pending_teacher']} />}>
        
        {/* Student Routes */}
        <Route element={<ProtectedRoute allowedRoles={['student']} />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
        </Route>

        {/* Teacher/Admin Routes (Access for PENDING and approved teachers) */}
        <Route element={<ProtectedRoute allowedRoles={['teacher', 'admin', 'pending_teacher']} />}>
          <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
        </Route>
      </Route>
      
      {/* Fallback Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
