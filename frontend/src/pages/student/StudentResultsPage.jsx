import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import axios from 'axios';

const StudentResultsPage = () => {
  const [results, setResults] = useState([]);
  const [availableUnits, setAvailableUnits] = useState([]);
  const [selectedUnit, setSelectedUnit] = useState('');
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();

  const fetchResults = useCallback(async (page = 1) => {
    try {
        setLoading(true);
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const params = new URLSearchParams({ page, limit: 10 });
        if (selectedUnit) params.append('unit', selectedUnit);

        const res = await axios.get(`/api/student/analytics/results?${params}`, config);
        setResults(res.data.results);
        setPagination(res.data.pagination);
        setAvailableUnits(res.data.availableUnits);
    } catch (err) {
        setError('Failed to load results');
        console.error('Results fetch error:', err);
    } finally {
        setLoading(false);
    }
    }, [selectedUnit, token]);

    useEffect(() => {
    fetchResults();
    }, [fetchResults]);

  const getPerformanceColor = (percentage) => {
    if (percentage >= 90) return 'text-green-600 bg-green-100';
    if (percentage >= 70) return 'text-blue-600 bg-blue-100';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading && results.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-xl">
        <div className="text-center py-8">Loading results...</div>
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
          <h1 className="text-3xl font-bold text-gray-800">My Results</h1>
          <p className="text-gray-600">View your exam scores and performance history</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-64">
          <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Unit</label>
          <select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Units</option>
            {availableUnits.map(unit => (
              <option key={unit._id} value={unit._id}>
                {unit.name} ({unit.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Results List */}
      {results.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No results found.</p>
          <p className="text-sm text-gray-400 mt-2">
            {selectedUnit ? 'No results for the selected unit.' : 'You haven\'t completed any exams yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((result) => (
            <div
              key={result._id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">{result.exam.name}</h3>
                  <p className="text-sm text-gray-600">
                    {result.unit.name} • Attempt #{result.attemptNumber} •{' '}
                    {formatDate(result.finishTime)}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getPerformanceColor(
                      result.percentage
                    )}`}
                  >
                    {result.percentage.toFixed(1)}%
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    {result.score} / {result.totalMarks} marks
                  </p>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  Duration: {result.exam.durationMinutes} minutes •{' '}
                  Submitted: {formatDate(result.finishTime)}
                </div>
                <div className="flex space-x-2">
                  <Link
                    to={`/student/results/${result._id}`}
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                  >
                    View Details →
                  </Link>
                  {!result.resultsReleased && (
                    <span className="text-yellow-600 text-sm bg-yellow-100 px-2 py-1 rounded">
                      Awaiting Release
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <button
            onClick={() => fetchResults(pagination.currentPage - 1)}
            disabled={!pagination.hasPrev}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Previous
          </button>
          
          <span className="text-sm text-gray-700">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          <button
            onClick={() => fetchResults(pagination.currentPage + 1)}
            disabled={!pagination.hasNext}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default StudentResultsPage;