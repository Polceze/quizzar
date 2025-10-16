import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/useAuth';
import { useNavigate } from 'react-router-dom';

const ExamCreationPage = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    unit: '', // Selected Unit ID
    durationMinutes: 60,
    totalPoints: 0, 
    questionCount: 0, 
  });
  const [isSaving, setIsSaving] = useState(false);

  // Fetch Teacher's Units (required for exam creation)
  useEffect(() => {
    const fetchUnits = async () => {
      setLoading(true);
      setError(null);
      try {
        const config = { headers: { Authorization: `Bearer ${token}` } };
        const response = await axios.get('/api/units', config);
        setUnits(response.data);
        if (response.data.length > 0) {
            setFormData(prev => ({ ...prev, unit: response.data[0]._id }));
        }
      } catch (err) {
        console.error('Failed to load units:', err);
        setError('Failed to load units. Cannot create exam.');
      } finally {
        setLoading(false);
      }
    };
    fetchUnits();
  }, [token, setLoading, setError]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(null);
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    
    try {
        const config = {
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        };
        
        const response = await axios.post('/api/exams', formData, config);
        
        alert(`Exam "${response.data.name}" created successfully!`);
        navigate('/teacher/exams'); 

    } catch (err) {
        console.error('Failed to create exam:', err);
        setError(err.response?.data?.message || 'Failed to create exam.');
    } finally {
        setIsSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading Data...</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-red-700 border-b pb-2">Create New Exam/Quiz</h1>

      {error && <p className="text-red-500 mb-4 p-3 bg-red-50 rounded">{error}</p>}
      
      {units.length === 0 ? (
        <p className="text-center p-6 text-gray-500">Please create a Unit first before creating an Exam.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          
          {/* Exam Name */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Exam Title</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="shadow border rounded w-full py-2 px-3 text-gray-700"
              required
            />
          </div>

          {/* Related Unit Selection */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Related Unit/Class</label>
            <select
              name="unit"
              value={formData.unit}
              onChange={handleChange}
              className="shadow border rounded w-full py-2 px-3 text-gray-700 bg-white"
              required
            >
              {units.map(unit => (
                <option key={unit._id} value={unit._id}>{unit.name} ({unit.code})</option>
              ))}
            </select>
          </div>

          {/* Duration (in Minutes) */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Duration (Minutes)</label>
            <input
              type="number"
              name="durationMinutes"
              value={formData.durationMinutes}
              onChange={handleChange}
              min="10"
              className="shadow border rounded w-full py-2 px-3 text-gray-700"
              required
            />
          </div>
          
          {/* Placeholder for future complexity (Question selection/Total Points) */}
          <p className="text-sm text-yellow-700 bg-yellow-100 p-3 rounded mb-6">
            Note: Question selection will be implemented in the next phase. For now, this step creates the exam shell.
          </p>

          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded transition disabled:opacity-50"
            disabled={isSaving || units.length === 0}
          >
            {isSaving ? 'Creating Exam...' : 'Create Exam Shell'}
          </button>
        </form>
      )}
    </div>
  );
};

export default ExamCreationPage;