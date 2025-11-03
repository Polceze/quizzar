import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/useAuth';
import { Link } from 'react-router-dom';

const ExamListPage = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const { token } = useAuth();

  const fetchExams = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.get('/api/exams', config); 
      setExams(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch exams.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchExams();
  }, [fetchExams]);

  const handleDelete = async (examId, examName) => {
    if (!window.confirm(`Are you sure you want to delete the exam: "${examName}"? This action cannot be undone.`)) {
      return;
    }

    setError(null);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.delete(`/api/exams/${examId}`, config);
      alert(`Exam "${examName}" successfully deleted.`);
      fetchExams();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete exam.';
      setError(msg);
    }
  };

  const handlePublish = async (examId, examName) => {
    if (!window.confirm(`Publish exam "${examName}"? Students will be able to see and take this exam.`)) {
      return;
    }

    setActionLoading(examId);
    setError(null);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`/api/exams/${examId}/publish`, {}, config);
      alert(`Exam "${examName}" published successfully!`);
      fetchExams();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to publish exam.';
      setError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleArchive = async (examId, examName) => {
    if (!window.confirm(`Archive exam "${examName}"? This will hide it from students.`)) {
      return;
    }

    setActionLoading(examId);
    setError(null);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.put(`/api/exams/${examId}/archive`, {}, config);
      alert(`Exam "${examName}" archived successfully!`);
      fetchExams();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to archive exam.';
      setError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-500 text-white';
      case 'archived': return 'bg-gray-500 text-white';
      case 'draft': return 'bg-yellow-500 text-white';
      default: return 'bg-gray-300 text-gray-700';
    }
  };

  if (loading) return <div className="p-8 text-center text-red-600">Loading Exams...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl">
      <Link to="/teacher/dashboard" className="text-indigo-600 hover:text-indigo-800 text-sm mb-4 block">
        &larr; Back to Dashboard
      </Link>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Exams & Quizzes</h1>
        <Link 
          to="/teacher/exams/new"
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          + Create New Exam
        </Link>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 text-red-700 rounded">{error}</div>}

      {exams.length === 0 ? (
        <div className="text-center p-10 bg-gray-50 border-dashed border-2 rounded-lg">
          <p className="text-gray-500">You haven't created any exams yet.</p>
          <p className="text-sm text-gray-400 mt-2">Click "Create New Exam" to begin.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {exams.map((exam) => (
            <div
              key={exam._id}
              className={`flex justify-between items-center p-4 border rounded-lg shadow-sm ${
                exam.status === 'active' ? 'bg-green-50 border-green-300' : 
                exam.status === 'archived' ? 'bg-gray-50 border-gray-300' : 
                'bg-yellow-50 border-yellow-200'
              }`}
            >
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-700">{exam.title || exam.name}</h2>
                <p className="text-sm text-gray-500">
                  Unit: {exam.unit?.name || 'N/A'} 
                  | Questions: <span className='font-bold'>{exam.questionCount || 0}</span> 
                  | Marks: <span className='font-bold'>{exam.totalMarks || 0}</span>
                  | Duration: {exam.durationMinutes} mins
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${getStatusColor(exam.status)}`}>
                  {exam.status.toUpperCase()}
                </span>
                
                <Link
                  to={`/teacher/exams/${exam._id}/edit`}
                  className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Edit
                </Link>

                {/* Action buttons based on status */}
                {exam.status === 'draft' && (
                  <button
                    onClick={() => handlePublish(exam._id, exam.name || exam.title)}
                    disabled={actionLoading === exam._id}
                    className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                  >
                    {actionLoading === exam._id ? 'Publishing...' : 'Publish'}
                  </button>
                )}

                {exam.status === 'active' && (
                  <button
                    onClick={() => handleArchive(exam._id, exam.name || exam.title)}
                    disabled={actionLoading === exam._id}
                    className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                  >
                    {actionLoading === exam._id ? 'Archiving...' : 'Archive'}
                  </button>
                )}

                {exam.status === 'draft' && (
                  <button
                    onClick={() => handleDelete(exam._id, exam.name || exam.title)}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExamListPage;