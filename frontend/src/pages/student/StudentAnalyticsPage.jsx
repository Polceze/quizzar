import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import axios from 'axios';

const StudentAnalyticsPage = () => {
  const [overview, setOverview] = useState(null);
  const [comparative, setComparative] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();

  const fetchOverview = useCallback(async () => {
    try {
        setLoading(true);
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.get('/api/student/analytics/overview', config);
        setOverview(res.data);
    } catch (err) {
        setError('Failed to load analytics data');
        console.error('Overview fetch error:', err);
    } finally {
        setLoading(false);
    }
    }, [token]); // Include token as dependency

    useEffect(() => {
    fetchOverview();
    }, [fetchOverview]);

  const fetchComparative = async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('/api/student/analytics/comparative', config);
      setComparative(res.data);
    } catch (err) {
      setError('Failed to load comparative data');
      console.error('Comparative fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'comparative' && !comparative) {
      fetchComparative();
    }
  };

  const getPerformanceColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 70) return 'text-blue-600 bg-blue-100';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  if (loading && !overview) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-xl">
        <div className="text-center py-8">Loading analytics...</div>
      </div>
    );
  }

  if (error && !overview) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-xl">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <Link to="/student/dashboard" className="text-indigo-600 hover:text-indigo-800">
          ← Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl">
      <Link to="/student/dashboard" className="text-indigo-600 hover:text-indigo-800 text-sm mb-4 block">
        &larr; Back to Dashboard
      </Link>

      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Performance</h1>
          <p className="text-gray-600">Track your academic progress and performance insights</p>
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
            { id: 'overview', name: 'Overview' },
            { id: 'comparative', name: 'Comparative Analytics' },
            { id: 'results', name: 'All Results' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => tab.id === 'results' ? window.location.href = '/student/results' : handleTabChange(tab.id)}
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
      {activeTab === 'overview' && overview && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-sm font-medium text-blue-800">Total Exams</h3>
              <p className="text-2xl font-bold text-blue-600">{overview.overview.totalExams}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h3 className="text-sm font-medium text-green-800">Average Performance</h3>
              <p className="text-2xl font-bold text-green-600">
                {overview.overview.averagePercentage.toFixed(1)}%
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h3 className="text-sm font-medium text-purple-800">Enrolled Units</h3>
              <p className="text-2xl font-bold text-purple-600">{overview.overview.enrolledUnits}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h3 className="text-sm font-medium text-orange-800">Completed Units</h3>
              <p className="text-2xl font-bold text-orange-600">{overview.overview.completedUnits}</p>
            </div>
          </div>

          {/* Unit Performance */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Unit Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {overview.unitPerformance.map((unit) => (
                <div
                  key={unit.unit._id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{unit.unit.name}</h3>
                      <p className="text-sm text-gray-600">{unit.unit.code}</p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getPerformanceColor(
                        unit.stats.averagePercentage
                      )}`}
                    >
                      {unit.stats.averagePercentage.toFixed(1)}%
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <p className="text-sm text-gray-600">Exams Taken</p>
                      <p className="font-semibold">{unit.stats.totalExams}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Average Score</p>
                      <p className="font-semibold">
                        {unit.stats.averageScore.toFixed(1)} / {unit.stats.totalPossibleScore.toFixed(1)}
                      </p>
                    </div>
                  </div>

                  {unit.recentExams.length > 0 && (
                    <div>
                      <p className="text-sm text-gray-600 mb-2">Recent Exams</p>
                      <div className="space-y-2">
                        {unit.recentExams.map((exam, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span className="text-gray-700 truncate">{exam.exam}</span>
                            <span className={`font-medium ${getPerformanceColor(exam.percentage)} px-2 py-1 rounded`}>
                              {exam.percentage.toFixed(1)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Activity</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              {overview.recentActivity.length === 0 ? (
                <p className="text-gray-500 text-center">No recent exam activity</p>
              ) : (
                <div className="space-y-3">
                  {overview.recentActivity.map((activity, index) => (
                    <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-0">
                      <div>
                        <p className="font-medium text-gray-800">{activity.exam}</p>
                        <p className="text-sm text-gray-600">{activity.unit}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-1 rounded text-sm font-medium ${getPerformanceColor(activity.percentage)}`}>
                          {activity.percentage.toFixed(1)}%
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.submittedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Comparative Analytics Tab */}
      {activeTab === 'comparative' && (
        <div>
          {loading ? (
            <div className="text-center py-8">Loading comparative analytics...</div>
          ) : comparative ? (
            <div className="space-y-6">
              {/* Overall Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h3 className="text-sm font-medium text-blue-800">Your Average</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {comparative.overall.studentAverage.toFixed(1)}%
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="text-sm font-medium text-green-800">Class Average</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {comparative.overall.classAverage.toFixed(1)}%
                  </p>
                </div>
                <div className={`p-4 rounded-lg border ${
                  comparative.overall.performanceGap >= 0
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <h3 className="text-sm font-medium text-gray-800">Performance Gap</h3>
                  <p className={`text-2xl font-bold ${
                    comparative.overall.performanceGap >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {comparative.overall.performanceGap >= 0 ? '+' : ''}
                    {comparative.overall.performanceGap.toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Strengths & Areas for Improvement */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h3 className="text-lg font-semibold text-green-800 mb-3">Strengths</h3>
                  {comparative.strengths.length === 0 ? (
                    <p className="text-green-700">No significant strengths identified yet.</p>
                  ) : (
                    <ul className="space-y-2">
                      {comparative.strengths.map((strength, index) => (
                        <li key={index} className="flex items-center text-green-700">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                          {strength}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h3 className="text-lg font-semibold text-red-800 mb-3">Areas for Improvement</h3>
                  {comparative.areasForImprovement.length === 0 ? (
                    <p className="text-red-700">No significant areas for improvement identified.</p>
                  ) : (
                    <ul className="space-y-2">
                      {comparative.areasForImprovement.map((area, index) => (
                        <li key={index} className="flex items-center text-red-700">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-3"></span>
                          {area}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Unit-wise Comparison */}
              <div>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Unit Performance Comparison</h2>
                <div className="space-y-4">
                  {comparative.unitPerformance.map((unit) => (
                    <div
                      key={unit.unit._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">{unit.unit.name}</h3>
                          <p className="text-sm text-gray-600">{unit.unit.code}</p>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                            unit.trend === 'above' ? 'bg-green-100 text-green-800' :
                            unit.trend === 'below' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {unit.trend === 'above' ? 'Above Average' :
                             unit.trend === 'below' ? 'Below Average' : 'Equal to Average'}
                          </span>
                          <p className="text-sm text-gray-600 mt-1">
                            Percentile: {unit.percentile.toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Your Score</p>
                          <p className="font-semibold text-blue-600">{unit.studentPerformance.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Class Average</p>
                          <p className="font-semibold text-gray-600">{unit.classAverage.toFixed(1)}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Performance Gap</p>
                          <p className={`font-semibold ${
                            unit.performanceGap >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {unit.performanceGap >= 0 ? '+' : ''}{unit.performanceGap.toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Exams Taken</p>
                          <p className="font-semibold">{unit.examCount}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
              <p className="text-gray-500">No comparative data available.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentAnalyticsPage;