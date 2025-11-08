import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import axios from 'axios';

const BatchResultManagementPage = () => {
  const [exams, setExams] = useState([]);
  const [selectedExams, setSelectedExams] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { token } = useAuth();

  const fetchExamsWithResults = useCallback(async () => {
    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // Get teacher's exams
      const examsRes = await axios.get('/api/exams', config);
      const examsData = examsRes.data;

      // Get detailed analytics for each exam to check result release status
      const examsWithResults = await Promise.all(
        examsData.map(async (exam) => {
          try {
            const resultsRes = await axios.get(`/api/teacher/analytics/exams/${exam._id}`, config);
            const analytics = resultsRes.data;
            
            return {
              ...exam,
              totalAttempts: analytics.studentPerformance.length,
              releasedCount: analytics.areResultsReleased ? analytics.studentPerformance.length : 0,
              areResultsReleased: analytics.areResultsReleased || false,
              updatedAt: exam.updatedAt || exam.createdAt || new Date().toISOString(),
              analyticsData: analytics
            };
          } catch (err) {
            console.error(`Error fetching analytics for exam ${exam._id}:`, err);
            return {
              ...exam,
              totalAttempts: 0,
              releasedCount: 0,
              areResultsReleased: false,
              updatedAt: exam.updatedAt || exam.createdAt || new Date().toISOString(),
              analyticsData: null
            };
          }
        })
      );

      setExams(examsWithResults);
    } catch (err) {
      setError('Failed to load exams data');
      console.error('Fetch exams error:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchExamsWithResults();
  }, [fetchExamsWithResults]);

  const handleSelectExam = (examId) => {
    const newSelected = new Set(selectedExams);
    if (newSelected.has(examId)) {
      newSelected.delete(examId);
    } else {
      newSelected.add(examId);
    }
    setSelectedExams(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedExams.size === exams.length) {
      setSelectedExams(new Set());
    } else {
      setSelectedExams(new Set(exams.map(exam => exam._id)));
    }
  };

  // Calculate batch action counts
  const getBatchActionCounts = () => {
    const selectedExamData = exams.filter(exam => selectedExams.has(exam._id));
    const releaseCount = selectedExamData.filter(exam => !exam.areResultsReleased).length;
    const hideCount = selectedExamData.filter(exam => exam.areResultsReleased).length;
    
    return { releaseCount, hideCount };
  };

  const handleBatchAction = async (action) => {
    if (selectedExams.size === 0) {
      setError('Please select at least one exam');
      return;
    }

    const { releaseCount, hideCount } = getBatchActionCounts();
    
    // Check if there are any exams that can actually be processed for this action
    if ((action === 'release' && releaseCount === 0) || (action === 'hide' && hideCount === 0)) {
      setError(`No exams available to ${action === 'release' ? 'release' : 'hide'} results. Selected exams are already in the desired state.`);
      return;
    }

    try {
      setActionLoading(true);
      setError('');
      setSuccess('');

      const config = { headers: { Authorization: `Bearer ${token}` } };
      // const examIds = Array.from(selectedExams);

      // Filter exams that actually need this action
      const examsToProcess = exams.filter(exam => 
        selectedExams.has(exam._id) && 
        ((action === 'release' && !exam.areResultsReleased) || 
         (action === 'hide' && exam.areResultsReleased))
      );

      // Perform batch action for each selected exam that needs processing
      await Promise.all(
        examsToProcess.map(exam =>
          axios.put(
            `/api/teacher/analytics/exams/${exam._id}/results-release`,
            { release: action === 'release' },
            config
          )
        )
      );

      const processedCount = examsToProcess.length;
      setSuccess(
        `Successfully ${action === 'release' ? 'released' : 'hidden'} results for ${processedCount} exam(s)`
      );
      
      // Refresh data
      fetchExamsWithResults();
      setSelectedExams(new Set());

      // Clear success message
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(`Failed to ${action} results: ${err.response?.data?.message || err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getReleaseStatusColor = (isReleased) => {
    return isReleased ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800';
  };

  const getReleaseStatusText = (isReleased) => {
    return isReleased ? 'Results Released' : 'Results Hidden';
  };

  const { releaseCount, hideCount } = getBatchActionCounts();

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-xl">
        <div className="text-center py-8">Loading exams...</div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl">
      <Link to="/teacher/analytics" className="text-indigo-600 hover:text-indigo-800 text-sm mb-4 block">
        &larr; Back to Analytics
      </Link>

      <div className="flex justify-between items-center mb-6 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Batch Result Management</h1>
          <p className="text-gray-600">Manage result release for multiple exams at once</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Batch Actions */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-semibold text-gray-800">
              {selectedExams.size} exam(s) selected
            </h3>
            <p className="text-sm text-gray-600">
              {releaseCount > 0 && `${releaseCount} can be released • `}
              {hideCount > 0 && `${hideCount} can be hidden`}
              {releaseCount === 0 && hideCount === 0 && selectedExams.size > 0 && 'All selected exams are already in the desired state'}
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => handleBatchAction('release')}
              disabled={actionLoading || releaseCount === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {actionLoading ? 'Processing...' : `Release ${releaseCount > 0 ? releaseCount : ''} Results`}
            </button>
            <button
              onClick={() => handleBatchAction('hide')}
              disabled={actionLoading || hideCount === 0}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {actionLoading ? 'Processing...' : `Hide ${hideCount > 0 ? hideCount : ''} Results`}
            </button>
          </div>
        </div>
      </div>

      {/* Exams List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Your Exams</h2>
          <button
            onClick={handleSelectAll}
            className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
          >
            {selectedExams.size === exams.length ? 'Deselect All' : 'Select All'}
          </button>
        </div>

        {exams.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No exams found.</p>
            <p className="text-sm text-gray-400 mt-2">
              Create and publish exams to manage results.
            </p>
          </div>
        ) : (
          exams.map((exam) => (
            <div
              key={exam._id}
              className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                selectedExams.has(exam._id) ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200'
              }`}
            >
              <div className="flex items-start space-x-4">
                <input
                  type="checkbox"
                  checked={selectedExams.has(exam._id)}
                  onChange={() => handleSelectExam(exam._id)}
                  className="mt-1 text-indigo-600 focus:ring-indigo-500"
                />
                
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-800">{exam.name || exam.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getReleaseStatusColor(exam.areResultsReleased)}`}>
                          {getReleaseStatusText(exam.areResultsReleased)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        {exam.unit?.name} • {exam.questionCount || 0} questions • {exam.totalMarks || 0} marks
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(exam.status)}`}>
                        {exam.status.toUpperCase()}
                      </span>
                      <Link
                        to={`/teacher/analytics/exams/${exam._id}`}
                        className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-gray-600">Total Attempts:</span>
                      <span className="font-medium ml-2">{exam.totalAttempts}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Released:</span>
                      <span className="font-medium ml-2">{exam.releasedCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Pending Release:</span>
                      <span className="font-medium ml-2">{exam.totalAttempts - exam.releasedCount}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Release Status:</span>
                      <span className="font-medium ml-2">
                        {exam.totalAttempts > 0 
                          ? ((exam.releasedCount / exam.totalAttempts) * 100).toFixed(1)
                          : 0
                        }%
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                      Last updated: {new Date(exam.updatedAt).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {exam.totalAttempts > 0 ? `${exam.totalAttempts} student(s) attempted` : 'No attempts yet'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BatchResultManagementPage;