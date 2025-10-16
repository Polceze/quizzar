import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/useAuth';
import { Link } from 'react-router-dom';

const ExamListPage = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    const fetchExams = async () => {
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
    };

    fetchExams();
  }, [token]);

  if (loading) return <div className="p-8 text-center text-red-600">Loading Exams...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Exams & Quizzes</h1>
        <Link 
          to="/teacher/exams/new" // Route for creation page
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
        >
          + Create New Exam
        </Link>
      </div>

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
              className={`flex justify-between items-center p-4 border rounded-lg shadow-sm ${exam.status === 'active' ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}
            >
              <div>
                <h2 className="text-xl font-semibold text-gray-700">{exam.title}</h2>
                <p className="text-sm text-gray-500">
                  Unit: {exam.unit?.name || 'N/A'} | Questions: {exam.questions?.length || 0} | Duration: {exam.durationMinutes} mins
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                  exam.status === 'active' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
                }`}>
                  {exam.status.toUpperCase()}
                </span>
                
                <Link
                    to={`/teacher/exams/${exam._id}/edit`}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Edit/Publish
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExamListPage;