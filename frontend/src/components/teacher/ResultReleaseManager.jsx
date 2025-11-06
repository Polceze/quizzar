import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/useAuth';

const ResultReleaseManager = ({ examId, onResultsReleased }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { token } = useAuth();

  const handleReleaseResults = async (release) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(
        `/api/teacher/analytics/exams/${examId}/results-release`,
        { release },
        config
      );

      setSuccess(`Results ${release ? 'released' : 'hidden'} successfully!`);
      if (onResultsReleased) {
        onResultsReleased(release);
      }

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || `Failed to ${release ? 'release' : 'hide'} results`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">Result Release Management</h3>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-3">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-3">
          {success}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => handleReleaseResults(true)}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            'Release Results to Students'
          )}
        </button>

        <button
          onClick={() => handleReleaseResults(false)}
          disabled={loading}
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
        >
          Hide Results from Students
        </button>
      </div>

      <p className="text-sm text-gray-600 mt-2">
        Releasing results allows students to view their scores and detailed performance analysis.
        Hiding results will prevent students from accessing this exam's results.
      </p>
    </div>
  );
};

export default ResultReleaseManager;