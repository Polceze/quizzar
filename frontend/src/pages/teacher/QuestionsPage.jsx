import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import AddQuestionModal from '../../components/AddQuestionModal'; 

const QuestionsPage = () => {
  const { unitId } = useParams(); // Get the Unit ID from the URL
  const [questions, setQuestions] = useState([]);
  const [unitName, setUnitName] = useState('Loading...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const { token } = useAuth();

  const handleDelete = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };
      // DELETE /api/questions/:questionId
      await axios.delete(`/api/questions/${questionId}`, config);
      
      // Update the local state to remove the deleted question
      setQuestions(questions.filter(q => q._id !== questionId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete question.');
    }
  };
  
  // Helper to fetch both the Unit details and its Questions
  const fetchUnitAndQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };
      
      // 1. Fetch Unit Details (GET /api/units/:unitId)
      const unitRes = await axios.get(`/api/units/${unitId}`, config);
      setUnitName(unitRes.data.name);

      // 2. Fetch Questions for the Unit (GET /api/questions/unit/:unitId) - NOTE: We need to define this backend route.
      const questionsRes = await axios.get(`/api/questions/unit/${unitId}`, config);
      setQuestions(questionsRes.data);

    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch unit and questions.';
      setError(errorMessage);
      setUnitName('Error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = (question) => {
      setEditingQuestion(question); 
      setShowModal(true);         
  };

  useEffect(() => {
    fetchUnitAndQuestions();
  }, [unitId, token]); // Re-fetch when unitId or token changes

  // Function to handle successful question addition
  const handleQuestionAdded = () => {
    setShowModal(false); // Close modal
    fetchUnitAndQuestions(); // Refresh list
  };

  if (loading) return <div className="p-8 text-center text-indigo-600">Loading Unit Content...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl">
      <Link to="/teacher/units" className="text-indigo-600 hover:text-indigo-800 text-sm mb-4 block">
        &larr; Back to Units
      </Link>
      
      <div className="flex justify-between items-center mb-6 border-b pb-3">
        <h1 className="text-3xl font-bold text-gray-800">Questions for: {unitName}</h1>
        <button
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          onClick={() => setShowModal(true)}
        >
          + Add New Question
        </button>
      </div>

      {questions.length === 0 ? (
        <div className="text-center p-10 bg-gray-50 border-dashed border-2 rounded-lg">
          <p className="text-gray-500">No questions found for this unit.</p>
          <p className="text-sm text-gray-400 mt-2">Use the button above to add the first question.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, index) => (
            <div
              key={q._id}
              className="p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm"
            >
              <p className="text-gray-700 font-semibold mb-2">Q{index + 1}: {q.text}</p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Type: {q.questionType}</span>
                <span>Points: {q.points}</span>
                <div className="space-x-2">
                  <button 
                    className="px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600"
                    onClick={() => handleEditClick(q)} 
                  >
                    Edit
                  </button>
                  <button 
                    className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
                    onClick={() => handleDelete(q._id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
              {/* Pass data to the modal component */}
              {showModal && (
                  <AddQuestionModal 
                      unitId={unitId} 
                      onClose={() => {
                          setShowModal(false);
                          setEditingQuestion(null); // Clear editing state on close
                      }} 
                      onSuccess={handleQuestionAdded} 
                      existingQuestion={editingQuestion} // <-- PASS EDITING DATA
                  />
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Question Creation Modal */}
      {showModal && <AddQuestionModal unitId={unitId} onClose={() => setShowModal(false)} onSuccess={handleQuestionAdded} />}
    </div>
  );
};

export default QuestionsPage;