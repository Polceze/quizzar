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
import StudentExamPage from './pages/student/StudentExamPage';
import ExamInstructionsPage from './pages/student/ExamInstructionsPage';
import StudentEnrolledUnitsPage from './pages/student/StudentEnrolledUnitsPage';
import StudentUnitRequestPage from './pages/student/StudentUnitRequestPage';
import TeacherUnitRequestsPage from './pages/teacher/TeacherUnitRequestsPage';
import TeacherProfileForm from './pages/teacher/TeacherProfileForm';
import SchoolAdminDashboard from './pages/admin/SchoolAdminDashboard';
import CreateSchoolWizard from './pages/CreateSchoolWizard';
import SchoolBrowserPage from './pages/SchoolBrowserPage';
import TeacherStudentsPage from './pages/teacher/TeacherStudentsPage';
import TeacherAnalyticsPage from './pages/teacher/TeacherAnalyticsPage';
import ExamDetailedAnalyticsPage from './pages/teacher/ExamDetailedAnalyticsPage';
import UnitCompletionPage from './pages/teacher/UnitCompletionPage';
import StudentAnalyticsPage from './pages/student/StudentAnalyticsPage';
import StudentResultsPage from './pages/student/StudentResultsPage';
import StudentResultDetailsPage from './pages/student/StudentResultDetailsPage';
import BatchResultManagementPage from './pages/teacher/BatchResultManagementPage';

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
            <Route path="/student/exams/:examId/take" element={<StudentExamPage />} />
            <Route path="/student/exams/:examId/instructions" element={<ExamInstructionsPage />} />
            <Route path="/student/analytics" element={<StudentAnalyticsPage />} />
            <Route path="/student/results" element={<StudentResultsPage />} />
            <Route path="/student/results/:resultId" element={<StudentResultDetailsPage />} />
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
            <Route path="/teacher/students" element={<TeacherStudentsPage />} />
            <Route path="/teacher/exams" element={<ExamListPage />} />
            <Route path="/teacher/exams/new" element={<ExamCreationPage />} /> 
            <Route path="/teacher/exams/:examId/edit" element={<ExamEditPage />} />
            <Route path="/teacher/analytics" element={<TeacherAnalyticsPage />} />
            <Route path="/teacher/analytics/exams/:examId" element={<ExamDetailedAnalyticsPage />} />
            <Route path="/teacher/units/:unitId/completion" element={<UnitCompletionPage />} />
            <Route path="/teacher/results/batch" element={<BatchResultManagementPage />} />
          </Route>
        </Route>
      </Route>
      
      {/* Fallback Route */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
