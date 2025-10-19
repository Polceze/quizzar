import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/useAuth';
import { Link } from 'react-router-dom';

const TeacherUnitRequestsPage = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [message, setMessage] = useState('');
    const { token } = useAuth();

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            // GET /api/units/requests/pending
            const res = await axios.get('/api/units/requests/pending', config); 
            setRequests(res.data);

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch pending requests.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleAction = async (requestId, action, unitName, studentNameOrEmail) => {
        setMessage('');
        setError(null);
        
        const actionText = action === 'approve' ? 'approve' : 'reject';
        if (!window.confirm(`Are you sure you want to ${actionText} the enrollment request for ${unitName} by ${studentNameOrEmail}?`)) {
            return;
        }
        
        try {
            const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } };
            
            // PUT /api/units/requests/:requestId
            const res = await axios.put(`/api/units/requests/${requestId}`, { action }, config);
            
            setMessage(res.data.message);
            
            // Remove the request from the local state
            setRequests(prevRequests => prevRequests.filter(req => req._id !== requestId));

        } catch (err) {
            setError(err.response?.data?.message || `Failed to ${actionText} request.`);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-xl">
            <Link to="/teacher/dashboard" className="text-indigo-600 hover:text-indigo-800 text-sm mb-4 block">
                &larr; Back to Dashboard
            </Link>
            
            <div className="flex justify-between items-center mb-6 border-b pb-3">
                <h1 className="text-3xl font-bold text-gray-800">Pending Enrollment Requests</h1>
                <p className="text-sm text-gray-500">Review student requests for your units.</p>
            </div>

            {loading && <div className="p-8 text-center text-blue-600">Loading Requests...</div>}
            {error && <p className="text-red-500 mb-4 p-3 bg-red-50 rounded">{error}</p>}
            {message && <p className="text-green-600 mb-4 p-3 bg-green-50 rounded">{message}</p>}

            {!loading && requests.length === 0 ? (
                <div className="text-center p-10 bg-gray-50 border-dashed border-2 rounded-lg">
                    <p className="text-gray-500">You currently have no pending enrollment requests. 🎉</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {requests.map((request) => {
                        const studentName = request.student?.studentProfile?.fullName || request.student?.email;
                        
                        return (
                            <div
                                key={request._id}
                                className={`flex justify-between items-center p-4 border rounded-lg shadow-sm bg-yellow-50 border-yellow-300`}
                            >
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-700">
                                        Request for: {request.unit?.name} ({request.unit?.code})
                                    </h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        Student: <span className="font-medium">
                                            {/* Use fullName, fall back to email */}
                                            {studentName || 'N/A'} 
                                        </span>
                                        {request.student?.studentProfile?.admissionNumber && 
                                            <span className="ml-4 text-xs bg-gray-200 text-black-700 px-2 py-0.5 rounded-full">
                                                Adm No: {request.student.studentProfile.admissionNumber}
                                            </span>
                                        }
                                    </p>
                                </div>
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() => handleAction(request._id, 'reject', request.unit?.name, studentName)}
                                        className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600 transition"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => handleAction(request._id, 'approve', request.unit?.name, studentName)}
                                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition"
                                    >
                                        Approve
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default TeacherUnitRequestsPage;