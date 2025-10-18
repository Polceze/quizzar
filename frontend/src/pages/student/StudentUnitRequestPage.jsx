// frontend/src/pages/student/StudentUnitRequestPage.jsx

import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/useAuth';
import { Link } from 'react-router-dom';

const StudentUnitRequestPage = () => {
    const [unitCode, setUnitCode] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const { token } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError(null);
        setLoading(true);

        try {
            const config = { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } };
            
            // POST /api/units/request-enroll
            const res = await axios.post('/api/units/request-enroll', { unitCode }, config);
            
            setMessage(res.data.message);
            setUnitCode(''); // Clear input on success

        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send enrollment request.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-xl max-w-lg mx-auto">
            <Link to="/student/units" className="text-blue-600 hover:text-blue-800 text-sm mb-4 block">
                &larr; Back to Enrolled Units
            </Link>
            
            <h1 className="text-2xl font-bold mb-6 text-gray-800">Request Unit Enrollment</h1>
            
            {message && <p className="text-green-600 mb-4 p-3 bg-green-50 rounded">{message}</p>}
            {error && <p className="text-red-500 mb-4 p-3 bg-red-50 rounded">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="unitCode" className="block text-sm font-medium text-gray-700">
                        Unit Code (Provided by your Teacher)
                    </label>
                    <input
                        id="unitCode"
                        type="text"
                        value={unitCode}
                        onChange={(e) => setUnitCode(e.target.value.toUpperCase())}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 uppercase"
                        placeholder="E.g., MATH101"
                        disabled={loading}
                    />
                </div>
                
                <button
                    type="submit"
                    disabled={loading || unitCode.length < 3}
                    className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {loading ? 'Sending Request...' : 'Send Enrollment Request'}
                </button>
            </form>
            
            <p className="mt-6 text-xs text-gray-500">Your teacher must approve this request before the unit appears in your enrolled list and before you can see associated exams.</p>
        </div>
    );
};

export default StudentUnitRequestPage;