import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import axios from 'axios';

const StudentResultDetailsPage = () => {
  const { attemptId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const { token } = useAuth();

  const fetchResultDetails = useCallback(async () => {
    try {
        setLoading(true);
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.get(`/api/student/analytics/results/${attemptId}`, config);
        setResult(res.data);
    } catch (err) {
        if (err.response?.status === 403) {
        setError('Results for this exam are not yet released by your teacher.');
        } else {
        setError('Failed to load result details');
        }
        console.error('Result details fetch error:', err);
    } finally {
        setLoading(false);
    }
  }, [attemptId, token]); 

  useEffect(() => {
  fetchResultDetails();
  }, [fetchResultDetails]); 

  const getPerformanceColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 70) return 'text-blue-600 bg-blue-100';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const formatTime = (seconds) => {
    if (!seconds) return 'N/A';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-xl">
        <div className="text-center py-8">Loading result details...</div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-xl">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Failed to load result details'}
        </div>
        <Link to="/student/results" className="text-indigo-600 hover:text-indigo-800">
          ← Back to Results
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl">
      <Link to="/student/results" className="text-indigo-600 hover:text-indigo-800 text-sm mb-4 block">
        &larr; Back to Results
      </Link>

      {/* Header */}
      <div className="mb-6 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800">{result.exam.name}</h1>
        <p className="text-gray-600">
          {result.unit.name} • {result.exam.totalMarks} marks • {result.exam.durationMinutes} minutes
        </p>
        <div className="flex items-center space-x-4 mt-2">
          <span
            className={`px-4 py-2 rounded-full text-lg font-bold ${getPerformanceColor(
              result.performance.percentage
            )}`}
          >
            {result.performance.percentage.toFixed(1)}%
          </span>
          <span className="text-lg font-semibold text-gray-700">
            {result.performance.score} / {result.performance.totalMarks} marks
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Overview' },
            { id: 'questions', name: 'Question Analysis' },
            { id: 'performance', name: 'Performance Insights' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Performance Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-800">Correct Answers</h3>
              <p className="text-2xl font-bold text-blue-600">
                {result.performance.correctAnswers} / {result.performance.totalQuestions}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-sm font-medium text-green-800">Accuracy</h3>
              <p className="text-2xl font-bold text-green-600">
                {result.performance.accuracy.toFixed(1)}%
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="text-sm font-medium text-purple-800">Time Spent</h3>
              <p className="text-2xl font-bold text-purple-600">
                {result.performance.totalTimeSpent} min
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h3 className="text-sm font-medium text-orange-800">Avg Time/Question</h3>
              <p className="text-2xl font-bold text-orange-600">
                {formatTime(result.performance.averageTimePerQuestion)}
              </p>
            </div>
          </div>

          {/* Exam Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Exam Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Start Time:</span>
                  <span className="font-medium">{formatDate(result.attemptDetails.startTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">End Time:</span>
                  <span className="font-medium">{formatDate(result.attemptDetails.endTime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{result.attemptDetails.timeSpent} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Violations:</span>
                  <span className="font-medium">{result.attemptDetails.violationCount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium capitalize">{result.attemptDetails.status}</span>
                </div>
              </div>
            </div>

            {/* Performance Band */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Performance Assessment</h3>
              <div className="text-center">
                <div className={`inline-block px-4 py-3 rounded-lg text-lg font-bold mb-2 ${getPerformanceColor(result.performance.percentage)}`}>
                  {result.comparison.performanceBand}
                </div>
                <p className="text-sm text-gray-600">
                  You scored in the <strong>{result.comparison.performanceBand}</strong> range
                </p>
                {result.comparison.classAverage && (
                  <p className="text-sm text-gray-600 mt-2">
                    Class Average: {result.comparison.classAverage}%
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Performance by Question Type */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Performance by Question Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {result.performanceByType.map((typeStats, index) => (
                <div key={index} className="bg-white border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-800 mb-2">{typeStats.type}</h4>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Accuracy</span>
                    <span className={`px-2 py-1 rounded text-sm font-medium ${getPerformanceColor(typeStats.accuracy)}`}>
                      {typeStats.accuracy.toFixed(1)}%
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    {typeStats.correct} / {typeStats.total} correct
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Question Analysis Tab */}
      {activeTab === 'questions' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-800">Question-by-Question Analysis</h3>
          {result.questionAnalysis.map((question, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${
                question.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="flex items-start space-x-3">
                    <span
                      className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        question.isCorrect
                          ? 'bg-green-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}
                    >
                      {index + 1}
                    </span>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-800 mb-2">
                        {question.questionText}
                      </h4>
                      {question.questionType === 'MCQ' && question.options && (
                        <div className="space-y-1">
                          {question.options.map((option, optIndex) => (
                            <div
                              key={optIndex}
                              className={`flex items-center space-x-2 p-2 rounded ${
                                optIndex === question.correctOptionIndex
                                  ? 'bg-green-100 border border-green-300'
                                  : optIndex === question.selectedOptionIndex && !question.isCorrect
                                  ? 'bg-red-100 border border-red-300'
                                  : 'bg-gray-100'
                              }`}
                            >
                              <span className="w-4 h-4 rounded border border-gray-400 flex items-center justify-center text-xs">
                                {String.fromCharCode(65 + optIndex)}
                              </span>
                              <span className="text-sm">{option.text}</span>
                              {optIndex === question.correctOptionIndex && (
                                <span className="text-green-600 text-xs font-medium">✓ Correct</span>
                              )}
                              {optIndex === question.selectedOptionIndex && !question.isCorrect && (
                                <span className="text-red-600 text-xs font-medium">✗ Your Answer</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-sm">
                <div className="flex space-x-4">
                  <span className="text-gray-600">
                    Points: {question.pointsAwarded} / {question.points}
                  </span>
                  <span className="text-gray-600">
                    Time: {formatTime(question.timeSpent)}
                  </span>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    question.isCorrect
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {question.isCorrect ? 'Correct' : 'Incorrect'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Performance Insights Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Strengths and Weaknesses */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-3">Strengths</h3>
              {result.performanceByType.filter(type => type.accuracy >= 70).length === 0 ? (
                <p className="text-green-700">No particular strengths identified in this exam.</p>
              ) : (
                <ul className="space-y-2">
                  {result.performanceByType
                    .filter(type => type.accuracy >= 70)
                    .map((type, index) => (
                      <li key={index} className="flex items-center text-green-700">
                        <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                        {type.type} questions ({type.accuracy.toFixed(1)}% accuracy)
                      </li>
                    ))}
                </ul>
              )}
            </div>

            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h3 className="text-lg font-semibold text-red-800 mb-3">Areas for Improvement</h3>
              {result.performanceByType.filter(type => type.accuracy < 70).length === 0 ? (
                <p className="text-red-700">No significant areas for improvement identified.</p>
              ) : (
                <ul className="space-y-2">
                  {result.performanceByType
                    .filter(type => type.accuracy < 70)
                    .map((type, index) => (
                      <li key={index} className="flex items-center text-red-700">
                        <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                        {type.type} questions ({type.accuracy.toFixed(1)}% accuracy)
                      </li>
                    ))}
                </ul>
              )}
            </div>
          </div>

          {/* Time Management */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">Time Management</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-blue-700">Total exam time:</span>
                <span className="font-medium">{result.attemptDetails.timeSpent} minutes</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-700">Average time per question:</span>
                <span className="font-medium">{formatTime(result.performance.averageTimePerQuestion)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-700">Allocated time per question:</span>
                <span className="font-medium">
                  {Math.floor((result.exam.durationMinutes * 60) / result.performance.totalQuestions)} seconds
                </span>
              </div>
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3">Study Recommendations</h3>
            <div className="space-y-2">
              {result.performance.percentage >= 80 ? (
                <p className="text-yellow-700">
                  Excellent performance! Continue maintaining your study habits and focus on advanced topics.
                </p>
              ) : result.performance.percentage >= 60 ? (
                <p className="text-yellow-700">
                  Good performance. Review the questions you missed and focus on those specific areas.
                </p>
              ) : (
                <p className="text-yellow-700">
                  Consider reviewing the fundamental concepts and practicing more questions in your weaker areas.
                </p>
              )}
              
              {result.performanceByType.some(type => type.accuracy < 50) && (
                <p className="text-yellow-700 mt-2">
                  Pay special attention to: {result.performanceByType
                    .filter(type => type.accuracy < 50)
                    .map(type => type.type)
                    .join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentResultDetailsPage;