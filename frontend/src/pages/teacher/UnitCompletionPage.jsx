import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import axios from 'axios';

const UnitCompletionPage = () => {
  const { unitId } = useParams();
  const [completionData, setCompletionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useAuth();

  const fetchCompletionData = useCallback(async () => {
    try {
        setLoading(true);
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const res = await axios.get(`/api/teacher/analytics/units/${unitId}/completion`, config);
        setCompletionData(res.data);
    } catch (err) {
        setError('Failed to load completion data');
        console.error('Completion data fetch error:', err);
    } finally {
        setLoading(false);
    }
    }, [unitId, token]); // Include all dependencies used inside the function

    useEffect(() => {
    fetchCompletionData();
    }, [fetchCompletionData]);

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-xl">
        <div className="text-center py-8">Loading completion data...</div>
      </div>
    );
  }

  if (error || !completionData) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-xl">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error || 'Failed to load completion data'}
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

      <div className="mb-6 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800">Completion Status</h1>
        <p className="text-gray-600">
          {completionData.unit.name} ({completionData.unit.code}) •{' '}
          {completionData.unit.totalStudents} students
        </p>
      </div>

      {/* Overall Completion */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-800">Total Exams</h3>
          <p className="text-2xl font-bold text-blue-600">{completionData.overallCompletion.totalExams}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border border-green-200">
          <h3 className="text-sm font-medium text-green-800">Average Completion Rate</h3>
          <p className="text-2xl font-bold text-green-600">
            {completionData.overallCompletion.averageCompletionRate.toFixed(1)}%
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h3 className="text-sm font-medium text-purple-800">Total Students</h3>
          <p className="text-2xl font-bold text-purple-600">{completionData.unit.totalStudents}</p>
        </div>
      </div>

      {/* Exams Completion */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-800">Exam Completion Status</h2>
        {completionData.exams.map((examData) => (
          <div key={examData.exam._id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">{examData.exam.name}</h3>
                <p className="text-sm text-gray-600">
                  {examData.exam.totalMarks} marks •{' '}
                  {new Date(examData.exam.scheduledEnd).toLocaleDateString()}
                </p>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  examData.exam.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {examData.exam.status.toUpperCase()}
              </span>
            </div>

            {/* Completion Progress */}
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Completion Progress</span>
                <span>
                  {examData.completion.completed} / {examData.completion.totalStudents} students
                </span>
              </div>
              <div className="bg-gray-200 rounded-full h-3">
                <div
                  className="bg-green-600 h-3 rounded-full"
                  style={{
                    width: `${examData.completion.completionRate}%`,
                  }}
                ></div>
              </div>
              <div className="text-right text-sm text-gray-500 mt-1">
                {examData.completion.completionRate.toFixed(1)}% complete
              </div>
            </div>

            {/* Average Score */}
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Average Score:</span>
              <span className="font-medium">
                {examData.averageScore.toFixed(1)} / {examData.exam.totalMarks}
              </span>
            </div>

            {/* Pending Students */}
            {examData.pendingStudents.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">
                  Pending: {examData.pendingStudents.length} student(s)
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                  <div className="text-sm text-yellow-800">
                    {examData.pendingStudents.slice(0, 3).map((student) => (
                      <div key={student._id} className="flex justify-between">
                        <span>{student.fullName}</span>
                        <span>{student.admissionNumber}</span>
                      </div>
                    ))}
                    {examData.pendingStudents.length > 3 && (
                      <div className="text-center mt-2">
                        +{examData.pendingStudents.length - 3} more students
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default UnitCompletionPage;