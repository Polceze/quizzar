// frontend/src/pages/student/StudentExamListPage.jsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/useAuth';
import { Link } from 'react-router-dom';

const StudentExamListPage = () => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token } = useAuth();

    const fetchExams = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            // GET /api/student/exams
            const res = await axios.get('/api/student/exams', config); 
            setExams(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch available exams.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchExams();
    }, [fetchExams]);


    if (loading) return <div className="p-8 text-center text-blue-600">Loading Available Exams...</div>;
    if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;

    return (
        <div className="p-6 bg-white rounded-lg shadow-xl">
            <Link to="/student/dashboard" className="text-blue-600 hover:text-blue-800 text-sm mb-4 block">
                &larr; Back to Dashboard
            </Link>
            
            <div className="flex justify-between items-center mb-6 border-b pb-3">
                <h1 className="text-3xl font-bold text-gray-800">Available Exams & Quizzes</h1>
                <p className="text-sm text-gray-500">Only published exams are shown here.</p>
            </div>

            {exams.length === 0 ? (
                <div className="text-center p-10 bg-gray-50 border-dashed border-2 rounded-lg">
                    <p className="text-gray-500">No exams are currently active for your units.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {exams.map((exam) => (
                        <div
                            key={exam._id}
                            className={`flex justify-between items-center p-4 border rounded-lg shadow-sm bg-blue-50 border-blue-300`}
                        >
                            <div>
                                <h2 className="text-xl font-semibold text-gray-700">{exam.name || exam.title}</h2>
                                <p className="text-sm text-gray-500">
                                    Unit: {exam.unit?.name || 'N/A'} 
                                    | Marks: {exam.totalMarks} 
                                    | Duration: <span className="text-red-600 font-semibold">{exam.durationMinutes} mins</span>
                                </p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <Link
                                    to={`/student/exams/${exam._id}/instructions`}
                                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                                    >
                                    {exam.hasActiveAttempt ? 'Resume Exam' : 'Start Exam'}
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentExamListPage;