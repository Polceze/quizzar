import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import axios from 'axios';

const ExamDetailedAnalyticsPage = () => {
  const { examId } = useParams();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [releasing, setReleasing] = useState(false);
  const { token } = useAuth();

  const fetchExamAnalytics = useCallback(async () => {
    try {
        setLoading(true);
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.get(`/api/teacher/analytics/exams/${examId}`, config);
        setAnalytics(res.data);
    } catch (err) {
        setError('Failed to load exam analytics');
        console.error('Exam analytics fetch error:', err);
    } finally {
        setLoading(false);
    }
    }, [examId, token]); // Include all dependencies used inside the function

    useEffect(() => {
    fetchExamAnalytics();
    }, [fetchExamAnalytics]); 

  const handleResultsRelease = async (release) => {
    try {
      setReleasing(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`/api/teacher/analytics/exams/${examId}/results-release`, 
        { release }, config);
      
      alert(`Results ${release ? 'released' : 'hidden'} successfully!`);
      fetchExamAnalytics(); // Refresh data
    } catch (err) {
      setError(`Failed to ${release ? 'release' : 'hide'} results`);
      console.error('Results release error:', err);
    } finally {
      setReleasing(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-xl">
        <div className="text-center py-8">Loading detailed analytics...</div>
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-xl">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Failed to load exam analytics'}
        </div>
        <Link to="/teacher/analytics" className="text-indigo-600 hover:text-indigo-800">
          ← Back to Analytics
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl">
      <Link to="/teacher/analytics" className="text-indigo-600 hover:text-indigo-800 text-sm mb-4 block">
        &larr; Back to Analytics
      </Link>

      <div className="flex justify-between items-start mb-6 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">{analytics.exam.name}</h1>
          <p className="text-gray-600">
            {analytics.exam.unit?.name} • {analytics.exam.questionCount} questions •{' '}
            {analytics.exam.totalMarks} marks • {analytics.exam.durationMinutes} minutes
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => handleResultsRelease(true)}
            disabled={releasing}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {releasing ? 'Releasing...' : 'Release Results'}
          </button>
          <button
            onClick={() => handleResultsRelease(false)}
            disabled={releasing}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
          >
            {releasing ? 'Hiding...' : 'Hide Results'}
          </button>
        </div>
      </div>

      {/* Overview Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-800">Total Students</h3>
          <p className="text-2xl font-bold text-blue-600">{analytics.overview.totalStudents}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="text-sm font-medium text-green-800">Average Score</h3>
          <p className="text-2xl font-bold text-green-600">
            {analytics.overview.averageScore.toFixed(1)} / {analytics.exam.totalMarks}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h3 className="text-sm font-medium text-purple-800">Average Percentage</h3>
          <p className="text-2xl font-bold text-purple-600">
            {analytics.overview.averagePercentage.toFixed(1)}%
          </p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <h3 className="text-sm font-medium text-orange-800">Completion Rate</h3>
          <p className="text-2xl font-bold text-orange-600">
            {analytics.overview.completionRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Score Distribution Chart */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Score Distribution</h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          {analytics.scoreDistribution.map((range) => (
            <div key={range.range} className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600 w-24">{range.range}</span>
              <div className="flex-1 mx-4">
                <div className="bg-gray-200 rounded-full h-4">
                  <div
                    className="bg-indigo-600 h-4 rounded-full"
                    style={{
                      width: `${
                        analytics.overview.totalStudents > 0
                          ? (range.count / analytics.overview.totalStudents) * 100
                          : 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>
              <span className="text-sm font-medium text-gray-700 w-12 text-right">
                {range.count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Question Analysis */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Question Analysis</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Question
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Correct Answers
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Accuracy
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {analytics.questionAnalysis.map((question) => (
                <tr key={question.questionId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900 max-w-xs truncate">
                    Q{question.questionNumber}: {question.questionText}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{question.points}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {question.correctAnswers} / {question.totalAttempts}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        question.accuracy >= 70
                          ? 'bg-green-100 text-green-800'
                          : question.accuracy >= 50
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {question.accuracy}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Performance */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Student Performance</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Score
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Percentage
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time Spent
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Violations
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {analytics.studentPerformance.map((performance) => (
                <tr key={performance.student._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {performance.student.fullName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {performance.student.admissionNumber}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {performance.score} / {analytics.exam.totalMarks}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        performance.percentage >= 70
                          ? 'bg-green-100 text-green-800'
                          : performance.percentage >= 50
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {performance.percentage.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {performance.timeSpent} min
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {performance.violationCount}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ExamDetailedAnalyticsPage;