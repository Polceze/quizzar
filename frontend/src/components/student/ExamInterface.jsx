import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/useAuth';
import ExamHeader from './ExamHeader';
import QuestionNavigation from './QuestionNavigation';
import QuestionDisplay from './QuestionDisplay';
import ViolationMonitor from './ViolationMonitor';

const ExamInterface = ({ examData, attemptId, onExamComplete }) => {
  const { token } = useAuth();
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set());
  const [timeRemaining, setTimeRemaining] = useState(examData.durationMinutes * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState(null);
  const [violationCount, setViolationCount] = useState(0);

  // Handle force submit (timeout or violations)
  const handleForceSubmit = useCallback(async (reason) => {
    if (isSubmitting) return; // Prevent multiple submissions
    
    setIsSubmitting(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(`/api/student/exams/${attemptId}/submit`, {}, config);
      
      alert(`Exam automatically submitted: ${reason}`);
      onExamComplete();
      
    } catch (error) {
      console.error('Failed to auto-submit exam:', error);
      // Even if submission fails, navigate away
      alert(`Exam violation detected: ${reason}. Navigating away from exam.`);
      onExamComplete();
    }
  }, [attemptId, token, onExamComplete, isSubmitting]);

  // Auto-save answers
  const saveAnswer = useCallback(async (questionId, selectedOptionIndex, isFlagged = false) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`/api/student/attempts/${attemptId}/answer`, {
        questionId,
        selectedOptionIndex,
        isFlagged
      }, config);
      
      setLastSaveTime(new Date());
    } catch (error) {
      console.error('Failed to save answer:', error);
    }
  }, [attemptId, token]);

  // Handle answer selection
  const handleAnswerSelect = useCallback((questionId, selectedOptionIndex) => {
    const newAnswers = { ...answers, [questionId]: selectedOptionIndex };
    setAnswers(newAnswers);
    
    saveAnswer(questionId, selectedOptionIndex, flaggedQuestions.has(questionId));
  }, [answers, flaggedQuestions, saveAnswer]);

  // Handle flag question
  const handleFlagQuestion = useCallback((questionId) => {
    const newFlagged = new Set(flaggedQuestions);
    if (newFlagged.has(questionId)) {
      newFlagged.delete(questionId);
    } else {
      newFlagged.add(questionId);
    }
    setFlaggedQuestions(newFlagged);
    
    saveAnswer(questionId, answers[questionId] || null, newFlagged.has(questionId));
  }, [flaggedQuestions, answers, saveAnswer]);

  // Handle navigation
  const handleQuestionNavigate = useCallback((index) => {
    setCurrentQuestionIndex(index);
  }, []);

  // Handle violation detection
  const handleViolation = useCallback(async (type, details) => {
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(`/api/student/attempts/${attemptId}/violation`, {
        type,
        details
      }, config);
      
      setViolationCount(response.data.violationCount);
      
    } catch (error) {
      console.error('Failed to record violation:', error);
    }
  }, [attemptId, token]);

  // Handle exam submission
  const handleSubmitExam = useCallback(async (retryCount = 0) => {
    if (!window.confirm('Are you sure you want to submit your exam? You cannot change your answers after submission.')) {
      return;
    }

    setIsSubmitting(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const response = await axios.post(`/api/student/exams/${attemptId}/submit`, {}, config);
      
      if (response.data.success) {
        alert(response.data.message);
        onExamComplete();
      } else {
        throw new Error(response.data.message);
      }
      
    } catch (error) {
      console.error('Failed to submit exam:', error);
      
      if ((error.response?.data?.retry || error.response?.status === 409) && retryCount < 3) {
        console.log(`Retrying submission (${retryCount + 1}/3)...`);
        setTimeout(() => {
          handleSubmitExam(retryCount + 1);
        }, 1000 * (retryCount + 1));
        return;
      }
      
      alert('Failed to submit exam. Please try again.');
      setIsSubmitting(false);
    }
  }, [attemptId, token, onExamComplete]);

  // Timer effect
  useEffect(() => {
    if (timeRemaining <= 0) {
      handleForceSubmit('Time has expired.');
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, handleForceSubmit]);

  // Auto-save progress every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const currentQuestion = examData?.questions?.[currentQuestionIndex];
      if (currentQuestion && answers[currentQuestion._id] !== undefined) {
        saveAnswer(currentQuestion._id, answers[currentQuestion._id], flaggedQuestions.has(currentQuestion._id));
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [currentQuestionIndex, examData?.questions, answers, flaggedQuestions, saveAnswer]);

  // Check if exam data is loaded properly
  if (!examData || !examData.questions || examData.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading exam questions...</p>
          <button
            onClick={() => onExamComplete()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Exam List
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = examData.questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Updated ViolationMonitor with onForceSubmit prop */}
      <ViolationMonitor 
        onViolation={handleViolation}
        onForceSubmit={handleForceSubmit}
      />
      
      <ExamHeader
        examName={examData.name}
        timeRemaining={timeRemaining}
        violationCount={violationCount}
        onSubmit={handleSubmitExam}
        isSubmitting={isSubmitting}
      />
      
      <div className="max-w-6xl mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigation Sidebar */}
          <div className="lg:col-span-1">
            <QuestionNavigation
              questions={examData.questions}
              currentIndex={currentQuestionIndex}
              answers={answers}
              flaggedQuestions={flaggedQuestions}
              onQuestionSelect={handleQuestionNavigate}
            />
          </div>
          
          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <QuestionDisplay
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={examData.questions.length}
              selectedAnswer={answers[currentQuestion?._id]}
              onAnswerSelect={(optionIndex) => handleAnswerSelect(currentQuestion._id, optionIndex)}
              isFlagged={flaggedQuestions.has(currentQuestion?._id)}
              onFlagToggle={() => handleFlagQuestion(currentQuestion._id)}
              onNavigatePrev={() => currentQuestionIndex > 0 && setCurrentQuestionIndex(currentQuestionIndex - 1)}
              onNavigateNext={() => currentQuestionIndex < examData.questions.length - 1 && setCurrentQuestionIndex(currentQuestionIndex + 1)}
              canNavigatePrev={currentQuestionIndex > 0}
              canNavigateNext={currentQuestionIndex < examData.questions.length - 1}
            />
            
            {/* Save Status */}
            {lastSaveTime && (
              <div className="mt-4 text-sm text-green-600 text-center">
                Last saved: {lastSaveTime.toLocaleTimeString()}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamInterface;