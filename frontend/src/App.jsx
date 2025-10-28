import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Import Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/student/StudentDashboard';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import NotFound from './pages/NotFound';
import StudentProfileForm from './pages/student/StudentProfileForm';
import TeacherProfileGate from './pages/teacher/TeacherProfileGate';
import UnitsPage from './pages/teacher/UnitsPage';
import QuestionsPage from './pages/teacher/QuestionsPage';
import ExamCreationPage from './pages/teacher/ExamCreationPage'; 
import ExamListPage from './pages/teacher/ExamListPage';
import ExamEditPage from './pages/teacher/ExamEditPage';
import StudentExamListPage from './pages/student/StudentExamListPage';
import StudentEnrolledUnitsPage from './pages/student/StudentEnrolledUnitsPage';
import StudentUnitRequestPage from './pages/student/StudentUnitRequestPage';
import TeacherUnitRequestsPage from './pages/teacher/TeacherUnitRequestsPage';
import TeacherProfileForm from './pages/teacher/TeacherProfileForm';
import SchoolAdminDashboard from './pages/admin/SchoolAdminDashboard';
import CreateSchoolWizard from './pages/CreateSchoolWizard';
import SchoolBrowserPage from './pages/SchoolBrowserPage';

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
      {/* Routes outside of Layout (Auth pages) */}
      <Route path="/" element={
        isAuthenticated 
          ? <Navigate to={getDashboardPath()} replace /> 
          : <Home />
      } />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/create-school" element={<CreateSchoolWizard />} />
      <Route path="/schools" element={<SchoolBrowserPage />} />
      <Route path="*" element={<NotFound />} /> {/* Keep 404 outside layout to catch all errors */}


      {/* Protected Routes - Inside Layout */}
      <Route element={<Layout />}>
        <Route element={<ProtectedRoute allowedRoles={['student', 'teacher', 'admin', 'pending_teacher']} />}>
          
          {/* Dashboard Redirects */}
          <Route path="/dashboard" element={<Navigate to={getDashboardPath()} replace />} />

          {/* Student Routes */}
          <Route element={<ProtectedRoute allowedRoles={['student']} />}>
            <Route path="/student/dashboard" element={<StudentDashboard />} />
            <Route path="/student/exams" element={<StudentExamListPage />} />
            <Route path="/student/units" element={<StudentEnrolledUnitsPage />} />
            <Route path="/student/units/request" element={<StudentUnitRequestPage />} />
            <Route path="/student/profile" element={<StudentProfileForm />} />
          </Route>

          {/* Teacher/Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['teacher', 'admin', 'pending_teacher']} />}>
            <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
            <Route path="/admin/school" element={<SchoolAdminDashboard />} />
            <Route path="/teacher/profile" element={<TeacherProfileGate />} />
            <Route path="/teacher/units" element={<UnitsPage />} />
            <Route path="/teacher/units/requests" element={<TeacherUnitRequestsPage />} />
            <Route path="/teacher/units/:unitId/questions" element={<QuestionsPage />} />
            <Route path="/teacher/profile/form" element={<TeacherProfileForm />} />
            {/* Exam Management Routes */}
            <Route path="/teacher/exams" element={<ExamListPage />} />
            <Route path="/teacher/exams/new" element={<ExamCreationPage />} /> 
            <Route path="/teacher/exams/:examId/edit" element={<ExamEditPage />} />
          </Route>
        </Route>
      </Route>
      
      {/* Fallback Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
