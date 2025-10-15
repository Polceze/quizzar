import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/useAuth';

const initialQuestionState = {
  text: '',
  questionType: 'MCQ',
  points: 1,
  options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }], // Four options for MCQ
  correctAnswerIndex: 0, // Index of the correct option
};

const AddQuestionModal = ({ unitId, onClose, onSuccess, existingQuestion }) => {
  const [formData, setFormData] = useState(initialQuestionState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  useEffect(() => {
    if (existingQuestion) {
        setFormData({
            ...existingQuestion,
            // Ensure fields that might be missing are handled gracefully
            options: existingQuestion.options || initialQuestionState.options,
            correctAnswerIndex: existingQuestion.correctAnswerIndex || 0
        });
    }
  }, [existingQuestion]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
        if (name === 'questionType') {
            // Reset options and answer index when type changes
            if (value === 'T/F') {
                return { 
                    ...prev, 
                    questionType: value, 
                    options: [{ text: 'True' }, { text: 'False' }], // Fixed T/F options
                    correctAnswerIndex: 0 // Default to True
                };
            }
            // Reset to MCQ defaults
            return { 
                ...prev, 
                questionType: value, 
                options: initialQuestionState.options,
                correctAnswerIndex: 0
            };
        }
        return { ...prev, [name]: value };
    });
    setError(null);
  };
  
  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index].text = value;
    setFormData({ ...formData, options: newOptions });
  };
  
  const handleCorrectAnswerChange = (index) => {
    setFormData({ ...formData, correctAnswerIndex: index });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    // Simple validation: ensure options aren't empty
    const hasEmptyOption = formData.options.some(opt => !opt.text.trim());
    if (hasEmptyOption) {
        setError('All four options must be filled out.');
        setLoading(false);
        return;
    }

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      };

      const payload = {
          ...formData,
          unit: unitId,
          _id: undefined, 
          teacher: undefined,
      }

      let res;
      if (existingQuestion) {
          // If editing, use PUT request to update
          res = await axios.put(`/api/questions/${existingQuestion._id}`, payload, config);
      } else {
          // If creating new, use POST request
          res = await axios.post('/api/questions', payload, config);
      }
      console.log('Response:', res.data);
      
      onSuccess(); // Signal success to parent component
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create question.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-green-700">Add New Question (MCQ)</h2>
        
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

        <form onSubmit={handleSubmit}>
          
          {/* Question Text */}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="text">Question Text</label>
            <textarea
              name="text"
              rows="3"
              value={formData.text}
              onChange={handleChange}
              className="shadow border rounded w-full py-2 px-3 text-gray-700"
              required
            />
          </div>

          {/* New: Question Type and Points in a row */}
          <div className="flex space-x-4 mb-4">
              {/* Question Type Dropdown */}
              <div className="w-2/3">
                  <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="questionType">Question Type</label>
                  <select
                      name="questionType"
                      value={formData.questionType}
                      onChange={handleChange}
                      className="shadow border rounded w-full py-2 px-3 text-gray-700 bg-white"
                      required
                  >
                      <option value="MCQ">Multiple Choice (MCQ)</option>
                      <option value="T/F">True / False (T/F)</option>
                  </select>
              </div>
              
              {/* Points (remains the same) */}
              <div className="w-1/3">
                  <label className="block text-gray-700 text-sm font-medium mb-2" htmlFor="points">Points</label>
                  <input
                      type="number"
                      name="points"
                      value={formData.points}
                      onChange={handleChange}
                      min="1"
                      className="shadow border rounded w-full py-2 px-3 text-gray-700"
                      required
                  />
              </div>
          </div>

          <h3 className="text-lg font-semibold mt-6 mb-3 text-gray-800 border-b pb-1">Options and Answer</h3>
          
          {/* Options Input - Conditional Rendering */}
          <div className="space-y-3">
              {formData.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={formData.correctAnswerIndex === index}
                    onChange={() => handleCorrectAnswerChange(index)}
                    className="form-radio h-5 w-5 text-green-600"
                    id={`option-${index}`}
                  />
                  <label htmlFor={`option-${index}`} className="font-medium w-6 text-center">
                      {formData.questionType === 'MCQ' ? String.fromCharCode(65 + index) : ''}
                  </label>
                  <input
                    type="text"
                    value={option.text}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    // Disable input for T/F since options are fixed
                    readOnly={formData.questionType === 'T/F'} 
                    className={`shadow border rounded w-full py-2 px-3 text-gray-700 ${formData.questionType === 'T/F' ? 'bg-gray-100' : ''}`}
                    placeholder={`Option ${index + 1} text`}
                    required
                  />
                </div>
              ))}
              <p className="text-sm text-green-600 font-medium pt-2">
                  The selected radio button marks the correct answer.
              </p>
          </div>
          
          <div className="flex justify-end space-x-3 mt-8">
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
              className="px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddQuestionModal;