import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import axios from 'axios';

const TeacherAnalyticsPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [examAnalytics, setExamAnalytics] = useState([]);
  const [studentPerformance, setStudentPerformance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();
  const navigate = useNavigate();

  const fetchExamAnalytics = useCallback(async () => {
    try {
        setLoading(true);
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.get('/api/teacher/analytics/exams', config);
        setExamAnalytics(res.data);
    } catch (err) {
        setError('Failed to load analytics data');
        console.error('Analytics fetch error:', err);
    } finally {
        setLoading(false);
    }
    }, [token]);

    useEffect(() => {
    fetchExamAnalytics();
    }, [fetchExamAnalytics]);

  const fetchStudentPerformance = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('/api/teacher/analytics/students', config);
      setStudentPerformance(res.data);
    } catch (err) {
      setError('Failed to load student performance data');
      console.error('Student performance fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'students' && !studentPerformance) {
      fetchStudentPerformance();
    }
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 70) return 'text-blue-600 bg-blue-100';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading && activeTab === 'overview') {
    return (
      <div className="p-6 bg-white rounded-lg shadow-xl">
        <div className="text-center py-8">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl">
      <Link to="/teacher/dashboard" className="text-indigo-600 hover:text-indigo-800 text-sm mb-4 block">
        &larr; Back to Dashboard
      </Link>

      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Exam Analytics</h1>
          <p className="text-gray-600">Track performance and student progress</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', name: 'Exam Overview' },
            { id: 'students', name: 'Student Performance' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
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
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-800">Total Exams</h3>
              <p className="text-2xl font-bold text-blue-600">{examAnalytics.length}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-sm font-medium text-green-800">Active Exams</h3>
              <p className="text-2xl font-bold text-green-600">
                {examAnalytics.filter(exam => exam.exam.status === 'active').length}
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="text-sm font-medium text-purple-800">Average Performance</h3>
              <p className="text-2xl font-bold text-purple-600">
                {examAnalytics.length > 0
                  ? Math.round(
                      examAnalytics.reduce((sum, exam) => sum + exam.statistics.averagePercentage, 0) /
                        examAnalytics.length
                    )
                  : 0}
                %
              </p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h3 className="text-sm font-medium text-orange-800">Total Students</h3>
              <p className="text-2xl font-bold text-orange-600">
                {examAnalytics.reduce((sum, exam) => sum + exam.statistics.totalStudents, 0)}
              </p>
            </div>
          </div>

          {/* Exams List */}
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Exam Performance</h2>
            {examAnalytics.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-500">No exam data available yet.</p>
                <p className="text-sm text-gray-400 mt-2">
                  Create and publish exams to see analytics here.
                </p>
              </div>
            ) : (
              examAnalytics.map((analytics) => (
                <div
                  key={analytics.exam._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {analytics.exam.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {analytics.exam.unit?.name} • {analytics.exam.questionCount} questions •{' '}
                        {analytics.exam.totalMarks} marks
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        analytics.exam.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : analytics.exam.status === 'draft'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {analytics.exam.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-600">Students</p>
                      <p className="font-semibold">{analytics.statistics.totalStudents}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Average Score</p>
                      <p className="font-semibold">
                        {analytics.statistics.averageScore.toFixed(1)} / {analytics.exam.totalMarks}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Average %</p>
                      <p
                        className={`font-semibold ${getPerformanceColor(
                          analytics.statistics.averagePercentage
                        )} px-2 py-1 rounded`}
                      >
                        {analytics.statistics.averagePercentage.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Completion</p>
                      <p className="font-semibold">
                        {analytics.statistics.completionRate.toFixed(1)}%
                      </p>
                    </div>
                  </div>

                  {/* Score Distribution */}
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-2">Score Distribution</p>
                    <div className="flex space-x-2 text-xs">
                      <div className="flex-1 text-center bg-green-100 text-green-800 py-1 rounded">
                        Excellent: {analytics.statistics.scoreDistribution.excellent}
                      </div>
                      <div className="flex-1 text-center bg-blue-100 text-blue-800 py-1 rounded">
                        Good: {analytics.statistics.scoreDistribution.good}
                      </div>
                      <div className="flex-1 text-center bg-yellow-100 text-yellow-800 py-1 rounded">
                        Average: {analytics.statistics.scoreDistribution.average}
                      </div>
                      <div className="flex-1 text-center bg-red-100 text-red-800 py-1 rounded">
                        Poor: {analytics.statistics.scoreDistribution.poor}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <button
                      onClick={() => navigate(`/teacher/analytics/exams/${analytics.exam._id}`)}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      View Detailed Analytics →
                    </button>
                    <button
                      onClick={() => navigate(`/teacher/units/${analytics.exam.unit?._id}/completion`)}
                      className="text-gray-600 hover:text-gray-800 text-sm"
                    >
                      Completion Status
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Student Performance Tab */}
      {activeTab === 'students' && (
        <div>
          {loading ? (
            <div className="text-center py-8">Loading student performance...</div>
          ) : studentPerformance ? (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-sm font-medium text-blue-800">Total Students</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {studentPerformance.summary.totalStudents}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="text-sm font-medium text-green-800">Average Performance</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {studentPerformance.summary.averagePerformance.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <h3 className="text-sm font-medium text-purple-800">Total Units</h3>
                  <p className="text-2xl font-bold text-purple-600">
                    {studentPerformance.summary.totalUnits}
                  </p>
                </div>
              </div>

              {/* Students List */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">Student Performance</h2>
                {studentPerformance.students.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No student performance data available.</p>
                  </div>
                ) : (
                  studentPerformance.students.map((studentData) => (
                    <div
                      key={studentData.student._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            {studentData.student.fullName}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {studentData.student.admissionNumber} • {studentData.student.email}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(
                            studentData.overallStats.averagePercentage
                          )}`}
                        >
                          {studentData.overallStats.averagePercentage.toFixed(1)}%
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-600">Total Exams</p>
                          <p className="font-semibold">{studentData.overallStats.totalExams}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Average Score</p>
                          <p className="font-semibold">
                            {studentData.overallStats.totalScore.toFixed(1)} /{' '}
                            {studentData.overallStats.totalPossibleScore.toFixed(1)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Overall %</p>
                          <p className="font-semibold">
                            {studentData.overallStats.averagePercentage.toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      {/* Unit Performance */}
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Unit Performance</p>
                        <div className="space-y-2">
                          {studentData.units.map((unitData) => (
                            <div
                              key={unitData.unit._id}
                              className="flex justify-between items-center text-sm"
                            >
                              <span className="text-gray-700">{unitData.unit.name}</span>
                              <div className="flex items-center space-x-4">
                                <span
                                  className={`px-2 py-1 rounded ${getPerformanceColor(
                                    unitData.stats.averagePercentage
                                  )}`}
                                >
                                  {unitData.stats.averagePercentage.toFixed(1)}%
                                </span>
                                <span className="text-gray-500">
                                  {unitData.totalExams} exam(s)
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No student performance data available.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TeacherAnalyticsPage;