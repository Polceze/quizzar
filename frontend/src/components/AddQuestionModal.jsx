import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/useAuth';

const initialQuestionState = {
  text: '',
  questionType: 'MCQ',
  points: 1,
  options: [{ text: '' }, { text: '' }, { text: '' }, { text: '' }],
  correctAnswerIndex: 0,
};

const AddQuestionModal = ({ unitId, onClose, onSuccess, existingQuestion }) => {
  const [formData, setFormData] = useState(initialQuestionState);
  const [originalData, setOriginalData] = useState(null);
  const [convertToManual, setConvertToManual] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { token } = useAuth();

  // Check if form has changes
  const hasChanges = () => {
    if (!existingQuestion) return true; // Always enabled for new questions
    
    // Compare current form data with original data
    return JSON.stringify(formData) !== JSON.stringify(originalData) || convertToManual;
  };

  useEffect(() => {
    if (existingQuestion) {
        const existingData = {
            ...existingQuestion,
            options: existingQuestion.options || initialQuestionState.options,
            correctAnswerIndex: existingQuestion.correctAnswerIndex || 0
        };
        setFormData(existingData);
        setOriginalData(existingData);
        setConvertToManual(false);
    } else {
        setOriginalData(null);
    }
  }, [existingQuestion]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
        if (name === 'questionType') {
            if (value === 'T/F') {
                return { 
                    ...prev, 
                    questionType: value, 
                    options: [{ text: 'True' }, { text: 'False' }],
                    correctAnswerIndex: 0
                };
            }
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
    
    // Double check if there are changes (in case of race condition)
    if (existingQuestion && !hasChanges()) {
      setError('No changes detected. Please make changes before updating.');
      return;
    }

    setLoading(true);
    setError(null);
    
    // Validation
    const hasEmptyOption = formData.options.some(opt => !opt.text.trim());
    if (hasEmptyOption && formData.questionType === 'MCQ') {
        setError('All four options must be filled out for MCQ questions.');
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

      // Create payload without modificationHistory and other internal fields
      const payload = {
        text: formData.text,
        questionType: formData.questionType,
        points: formData.points,
        options: formData.options,
        correctAnswerIndex: formData.correctAnswerIndex,
        unit: unitId,
      };

      // If editing an AI-generated question and convertToManual is checked
      if (existingQuestion && existingQuestion.isAIGenerated && convertToManual) {
        payload.convertToManual = true;
      }

      if (existingQuestion) {
          await axios.put(`/api/questions/${existingQuestion._id}`, payload, config);
      } else {
          // For new questions, include isAIGenerated flag
          await axios.post('/api/questions', {
            ...payload,
            isAIGenerated: false // Explicitly mark as teacher-composed
          }, config);
      }
      
      onSuccess();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save question.');
      setLoading(false);
    }
  };

  const modalTitle = existingQuestion ? 'Edit Question' : 'Add New Question';
  const submitButtonText = existingQuestion ? 'Update Question' : 'Save Question';
  const isSubmitDisabled = existingQuestion ? !hasChanges() : false;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4 text-green-700">{modalTitle}</h2>
        
        {/* Show AI warning if editing AI-generated question */}
        {existingQuestion && existingQuestion.isAIGenerated && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  AI-Generated Question
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    This question was AI-generated. Any modifications will be tracked.
                  </p>
                  <div className="mt-2 flex items-center">
                    <input
                      id="convert-to-manual"
                      name="convert-to-manual"
                      type="checkbox"
                      checked={convertToManual}
                      onChange={(e) => setConvertToManual(e.target.checked)}
                      className="h-4 w-4 text-yellow-600 focus:ring-yellow-500 border-gray-300 rounded"
                    />
                    <label htmlFor="convert-to-manual" className="ml-2 block text-sm text-yellow-800">
                      Convert to teacher-composed question (works only if major changes are made).
                    </label>
                  </div>
                  <p className="text-xs mt-1 text-yellow-600">
                    This will remove the AI attribution and mark it as a manually created question.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {error && <p className="text-red-500 mb-4 text-sm">{error}</p>}

        {/* No changes message */}
        {existingQuestion && !hasChanges() && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700 text-center">
              No changes made to the question.
            </p>
          </div>
        )}

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

          {/* Question Type and Points */}
          <div className="flex space-x-4 mb-4">
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
          
          {/* Options Input */}
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
              className={`px-4 py-2 text-white rounded-lg transition ${
                isSubmitDisabled 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-green-600 hover:bg-green-700'
              }`}
              disabled={loading || isSubmitDisabled}
            >
              {loading ? 'Saving...' : submitButtonText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddQuestionModal;