import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/useAuth';

const ResultReleaseManager = ({ examId, examStatus, areResultsReleased, onResultsReleased }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentReleaseStatus, setCurrentReleaseStatus] = useState(areResultsReleased);
  const { token } = useAuth();

  const isExamArchived = examStatus === 'archived';

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

      // Immediately update local state to reflect the new release status
      setCurrentReleaseStatus(release);
      
      setSuccess(`Results ${release ? 'released' : 'hidden'} successfully!`);
      
      // Notify parent component about the change
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
      
      {!isExamArchived && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded mb-3">
          <p className="font-medium">Exam must be archived to release results</p>
          <p className="text-sm mt-1">
            Results can only be released to students after the exam has been archived. 
            This ensures all students have completed the exam before results are visible.
          </p>
        </div>
      )}

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
          disabled={loading || !isExamArchived || currentReleaseStatus}
          className={`px-4 py-2 rounded-lg flex items-center justify-center transition ${
            !isExamArchived || currentReleaseStatus
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
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
          disabled={loading || !isExamArchived || !currentReleaseStatus}
          className={`px-4 py-2 rounded-lg transition ${
            !isExamArchived || !currentReleaseStatus
              ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
              : 'bg-orange-600 text-white hover:bg-orange-700'
          }`}
        >
          Hide Results from Students
        </button>
      </div>

      <div className="text-sm text-gray-600 mt-2 space-y-1">
        <p className="flex items-center">
          <span className={`w-2 h-2 rounded-full mr-2 ${isExamArchived ? 'bg-green-500' : 'bg-gray-400'}`}></span>
          Exam Status: <span className="font-medium ml-1">{isExamArchived ? 'Archived' : 'Active/Draft'}</span>
        </p>
        <p className="flex items-center">
          <span className={`w-2 h-2 rounded-full mr-2 ${currentReleaseStatus ? 'bg-green-500' : 'bg-gray-400'}`}></span>
          Results Status: <span className="font-medium ml-1">{currentReleaseStatus ? 'Released to Students' : 'Hidden from Students'}</span>
        </p>
      </div>
    </div>
  );
};

export default ResultReleaseManager;