import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/useAuth';
import AddUnitModal from '../../components/AddUnitModal';
import { Link } from 'react-router-dom';

const UnitsPage = () => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { token } = useAuth();

  const fetchUnits = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };
      // GET /api/units (List units for the current teacher)
      const res = await axios.get('/api/units', config);
      setUnits(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch units.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  const handleDelete = async (unitId) => {
    if (!window.confirm('Are you sure you want to delete this unit? This action cannot be undone.')) {
      return;
    }

    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };
      // DELETE /api/units/:unitId
      await axios.delete(`/api/units/${unitId}`, config);
      
      // Update the local state to remove the deleted unit
      setUnits(units.filter(unit => unit._id !== unitId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete unit.');
    }
  };

  const handleUnitAdded = () => {
      setShowModal(false); // Close modal
      fetchUnits();      // Refresh list
  };

    useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  if (loading) return <div className="p-8 text-center">Loading Units...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl">
      <Link to="/teacher/dashboard" className="text-indigo-600 hover:text-indigo-800 text-sm mb-4 block">
        &larr; Back to Dashboard
      </Link>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Teaching Units</h1>
        <button
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          onClick={() => setShowModal(true)} // <-- Show Modal
        >
          + Add New Unit
        </button>
      </div>

      {units.length === 0 ? (
        <div className="text-center p-10 bg-gray-50 border-dashed border-2 rounded-lg">
          <p className="text-gray-500">You haven't created any units yet.</p>
          <p className="text-sm text-gray-400 mt-2">Create a unit to start building questions and exams.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {units.map((unit) => (
            <div
              key={unit._id}
              className="flex justify-between items-center p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-indigo-50 transition duration-150"
            >
              <div>
                <h2 className="text-xl font-semibold text-indigo-700">{unit.name} ({unit.code})</h2>
                <p className="text-sm text-gray-500">
                  {unit.students.length} Students Enrolled | Created: {new Date(unit.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="space-x-2">
                <Link 
                    to={`/teacher/units/${unit._id}/questions`}
                    className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                    Content ({unit.questionCount || 0})
                </Link>
                <button 
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                    onClick={() => handleDelete(unit._id)}
                >
                    Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Unit Creation Modal */}
      {showModal && <AddUnitModal onClose={() => setShowModal(false)} onSuccess={handleUnitAdded} />}
    </div>
  );
};

export default UnitsPage;