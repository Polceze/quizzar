import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import AddQuestionModal from '../../components/AddQuestionModal'; 
import ViewQuestionModal from '../../components/ViewQuestionModal';
import AIGenerator from '../../components/AIGenerator';

const QuestionsPage = () => {
  const { unitId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [unitName, setUnitName] = useState('Loading...');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [viewingQuestion, setViewingQuestion] = useState(null);
  const { token } = useAuth();

  const handleDelete = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };
      await axios.delete(`/api/questions/${questionId}`, config);
      setQuestions(questions.filter(q => q._id !== questionId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete question.');
    }
  };
  
  useEffect(() => {
    const fetchUnitAndQuestions = async () => {
      setLoading(true);
      setError(null);
      try {
        const config = {
          headers: { Authorization: `Bearer ${token}` },
        };
        
        const unitRes = await axios.get(`/api/units/${unitId}`, config);
        setUnitName(unitRes.data.name);

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

    fetchUnitAndQuestions();
  }, [unitId, token]);

  const handleEditClick = (question) => {
      setEditingQuestion(question); 
      setShowModal(true);         
  };

  const handleViewClick = (question) => {
      setViewingQuestion(question);
      setShowViewModal(true);
  };

  const handleQuestionAdded = () => {
    setShowModal(false);
    setShowAIModal(false);
    setEditingQuestion(null);
    refreshQuestions();
  };

  const refreshQuestions = async () => {
    setLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const questionsRes = await axios.get(`/api/questions/unit/${unitId}`, config);
      setQuestions(questionsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to refresh questions.');
    } finally {
      setLoading(false);
    }
  };

  const handleAIGeneratedQuestions = (generatedQuestions) => {
    // No need to save individually anymore - backend handles saving
    alert(`${generatedQuestions.length} questions generated successfully!`);
    setShowAIModal(false);
    refreshQuestions();
  };

  // Calculate AI statistics - FIXED: using isAIGenerated field
  const aiGeneratedCount = questions.filter(q => q.isAIGenerated).length;
  const manualCount = questions.length - aiGeneratedCount;

  if (loading) return <div className="p-8 text-center text-indigo-600">Loading Unit Content...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;

  return (
    <div className="p-6 bg-white rounded-lg shadow-xl">
      <Link to="/teacher/units" className="text-indigo-600 hover:text-indigo-800 text-sm mb-4 block">
        &larr; Back to Units
      </Link>
      
      <div className="flex justify-between items-center mb-6 border-b pb-3">
        <h1 className="text-3xl font-bold text-gray-800">Questions for: {unitName}</h1>
        <div className="flex gap-3">
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            onClick={() => setShowAIModal(true)}
          >
            🚀 AI Generate Questions
          </button>
          <button
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            onClick={() => {
              setEditingQuestion(null);
              setShowModal(true);
            }}
          >
            + Add Manual Question
          </button>
        </div>
      </div>

      {/* Enhanced Question Statistics with AI indicators */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-sm font-medium text-blue-800">Total Questions</h3>
          <p className="text-2xl font-bold text-blue-600">{questions.length}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-300">
          <h3 className="text-sm font-medium text-blue-800">Total Points</h3>
          <p className="text-2xl font-bold text-blue-600">
            {questions.reduce((sum, q) => sum + (q.points || 0), 0)}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-300">
          <h3 className="text-sm font-medium text-purple-700">Multiple Choice</h3>
          <p className="text-2xl font-bold text-purple-600">
            {questions.filter(q => q.questionType === 'MCQ').length}
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <h3 className="text-sm font-medium text-purple-800">True/False</h3>
          <p className="text-2xl font-bold text-purple-600">
            {questions.filter(q => q.questionType === 'T/F').length}
          </p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
          <h3 className="text-sm font-medium text-orange-800">Manual</h3>
          <p className="text-2xl font-bold text-orange-800">{manualCount}</p>
        </div>
        <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
          <h3 className="text-sm font-medium text-teal-800">AI Generated</h3>
          <p className="text-2xl font-bold text-teal-600">{aiGeneratedCount}</p>
        </div>
      </div>

      {questions.length === 0 ? (
        <div className="text-center p-10 bg-gray-50 border-dashed border-2 rounded-lg">
          <p className="text-gray-500">No questions found for this unit.</p>
          <p className="text-sm text-gray-400 mt-2">
            Use the buttons above to add questions manually or generate them with AI.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((q, index) => (
            <div
              key={q._id}
              className="p-4 bg-gray-50 border border-gray-200 rounded-lg shadow-sm hover:bg-gray-100 transition relative"
            >
              {/* AI Generation Badge */}
              {q.isAIGenerated ? (
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-teal-100 text-teal-800 rounded-full">
                    🤖 AI Generated
                  </span>
                </div>
              ) : (
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                    👤 Teacher-composed
                  </span>
                </div>
              )}
              
              <div className="pr-24">
                <p className="text-gray-700 font-semibold mb-2">Q{index + 1}: {q.text}</p>
                
                {/* Show options for MCQ questions */}
                {/* {q.questionType === 'MCQ' && q.options && (
                  <div className="ml-4 mb-2">
                    {q.options.map((option, optIndex) => (
                      <div 
                        key={optIndex} 
                        className={`text-sm ${
                          optIndex === q.correctAnswerIndex 
                            ? 'text-green-600 font-semibold' 
                            : 'text-gray-600'
                        }`}
                      >
                        {String.fromCharCode(65 + optIndex)}. {option.text}
                        {optIndex === q.correctAnswerIndex && ' ✓'}
                      </div>
                    ))}
                  </div>
                )} */}
                
                {/* Show correct answer for T/F questions */}
                {/* {q.questionType === 'T/F' && (
                  <div className="ml-4 mb-2 text-sm text-gray-600">
                    Correct Answer: <span className="font-semibold">
                      {q.correctAnswerIndex === 0 ? 'True' : 'False'}
                    </span>
                  </div>
                )} */}

                <div className="flex justify-between items-center text-sm text-gray-500">
                  <div className="flex gap-4">
                    <span className="px-2 py-1 bg-gray-200 rounded">Type: {q.questionType}</span>
                    <span className="px-2 py-1 bg-gray-200 rounded">Points: {q.points}</span>
                    <span className="px-2 py-1 bg-gray-200 rounded">Difficulty: {q.difficulty || 'Medium'}</span>
                  </div>
                  <div className="space-x-2">
                    <button 
                      className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
                      onClick={() => handleViewClick(q)}
                    >
                      View
                    </button>
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
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Manual Question Creation/Editing Modal */}
      {showModal && (
        <AddQuestionModal 
          unitId={unitId} 
          onClose={() => {
            setShowModal(false);
            setEditingQuestion(null);
          }} 
          onSuccess={handleQuestionAdded} 
          existingQuestion={editingQuestion}
        />
      )}

      {/* View Question Modal */}
      {showViewModal && (
        <ViewQuestionModal 
          question={viewingQuestion}
          onClose={() => {
            setShowViewModal(false);
            setViewingQuestion(null);
          }}
          onEdit={() => {
            setShowViewModal(false);
            setEditingQuestion(viewingQuestion);
            setShowModal(true);
          }}
        />
      )}

      {/* AI Generation Modal */}
      {showAIModal && (
        <AIGenerator
          unitId={unitId}
          onClose={() => setShowAIModal(false)}
          onQuestionsGenerated={handleAIGeneratedQuestions}
        />
      )}
    </div>
  );
};

export default QuestionsPage;