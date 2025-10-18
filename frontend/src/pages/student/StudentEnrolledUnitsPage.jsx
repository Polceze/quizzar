import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/useAuth';
import { Link } from 'react-router-dom';

const StudentEnrolledUnitsPage = () => {
    const [enrolledUnits, setEnrolledUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { token } = useAuth();

    const fetchEnrolledUnits = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            // GET /api/student/units/enrolled
            const res = await axios.get('/api/student/units/enrolled', config);
            setEnrolledUnits(res.data);

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch enrolled units.');
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchEnrolledUnits();
    }, [fetchEnrolledUnits]);


    if (loading) return <div className="p-8 text-center text-blue-600">Loading Enrolled Units...</div>;
    if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;

    return (
        <div className="p-6 bg-white rounded-lg shadow-xl">
            <Link to="/student/dashboard" className="text-blue-600 hover:text-blue-800 text-sm mb-4 block">
                &larr; Back to Dashboard
            </Link>
            
            <div className="flex justify-between items-center mb-6 border-b pb-3">
                <h1 className="text-3xl font-bold text-gray-800">My Enrolled Units</h1>
                <Link 
                    to="/student/units/request" // Link to a new page for sending requests
                    className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                    Request New Enrollment
                </Link>
            </div>

            {enrolledUnits.length === 0 ? (
                <div className="text-center p-10 bg-gray-50 border-dashed border-2 rounded-lg">
                    <p className="text-gray-500">You are not currently enrolled in any units. Request enrollment above.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {enrolledUnits.map((unit) => (
                        <div
                            key={unit._id}
                            className={`p-4 border rounded-lg shadow-sm bg-green-50 border-green-300`}
                        >
                            <h2 className="text-xl font-semibold text-gray-700">{unit.name} ({unit.code})</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Taught by: <span className="font-medium">
                                    {/* Access nested full name from the profile */}
                                    {unit.teacher?.teacherProfile?.fullName || unit.teacher?.email || 'N/A'}
                                </span> 
                            </p> 
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentEnrolledUnitsPage;