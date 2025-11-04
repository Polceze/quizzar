// frontend/src/pages/student/StudentExamPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import ExamInterface from '../../components/student/ExamInterface';

const StudentExamPage = () => {
  const { examId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  
  const [examData, setExamData] = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const startExam = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // POST /api/student/exams/:examId/start
      const response = await axios.post(`/api/student/exams/${examId}/start`, {}, config);
      
      setExamData({
        ...response.data.examDetails,
        questions: response.data.questions
      });
      setAttemptId(response.data.attemptId);
      
    } catch (err) {
      console.error('Failed to start exam:', err);
      const errorMessage = err.response?.data?.message || 'Failed to start exam.';
      setError(errorMessage);
      
      // Redirect back to exam list if exam cannot be started
      if (err.response?.status === 400 || err.response?.status === 403 || err.response?.status === 404) {
        setTimeout(() => navigate('/student/exams'), 3000);
      }
    } finally {
      setLoading(false);
    }
  }, [examId, token, navigate]);

  useEffect(() => {
    startExam();
  }, [startExam]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Starting exam session...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a few moments</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-500 text-center">
            <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <h2 className="text-xl font-bold mb-2">Cannot Start Exam</h2>
            <p className="mb-4">{error}</p>
            <button
              onClick={() => navigate('/student/exams')}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Back to Exam List
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!examData || !attemptId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>Failed to load exam data. Please try again.</p>
          <button
            onClick={() => navigate('/student/exams')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Exam List
          </button>
        </div>
      </div>
    );
  }

  // Check if questions are loaded
  if (!examData.questions || examData.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading exam questions...</p>
          <p className="text-sm text-gray-500 mt-2">Preparing {examData.totalQuestions} questions</p>
        </div>
      </div>
    );
  }

  return (
    <ExamInterface
      examData={examData}
      attemptId={attemptId}
      onExamComplete={() => navigate('/student/exams')}
    />
  );
};

export default StudentExamPage;