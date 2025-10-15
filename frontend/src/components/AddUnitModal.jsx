import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/useAuth';

const AddUnitModal = ({ onClose, onSuccess }) => {
  const [formData, setFormData] = useState({ name: '', code: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };
      // POST /api/units (Create new unit)
      await axios.post('/api/units', formData, config);
      
      onSuccess(); // Signal success to parent component
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create unit.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-2xl w-full max-w-sm">
        <h2 className="text-2xl font-bold mb-4 text-indigo-700">Add New Unit</h2>
        
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="name">Unit Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="shadow border rounded w-full py-2 px-3 text-gray-700"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="code">Unit Code</label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              className="shadow border rounded w-full py-2 px-3 text-gray-700"
              required
              maxLength="10"
            />
          </div>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Adding...' : 'Add Unit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddUnitModal;