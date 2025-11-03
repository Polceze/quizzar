import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/useAuth';

const AIGenerator = ({ unitId, onClose, onQuestionsGenerated }) => {
  const [studyMaterial, setStudyMaterial] = useState('');
  const [generating, setGenerating] = useState(false);
  const [specifications, setSpecifications] = useState({
    questionType: 'multiple-choice', // Default to one type
    count: 3,
    difficulty: 'medium'
  });
  const { token } = useAuth();

  const handleGenerate = async () => {
    if (!studyMaterial.trim()) { 
      alert('Please provide some study material or content to generate questions from.');
      return;
    }

    if (specifications.count === 0) {
      alert('Please specify how many questions to generate.');
      return;
    }

    if (specifications.count > 10) {
      alert('Maximum 10 questions can be generated at once. Please reduce the count.');
      return;
    }

    setGenerating(true);
    try {
      const config = {
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        }
      };

      // Convert to backend format
      const payload = {
        studyMaterial: studyMaterial.trim(),
        mcqCount: specifications.questionType === 'multiple-choice' ? specifications.count : 0,
        tfCount: specifications.questionType === 'true-false' ? specifications.count : 0,
        difficulty: specifications.difficulty,
        unitId: unitId
      };

      const response = await axios.post('/api/ai/generate-questions', payload, config);
      onQuestionsGenerated(response.data.questions);
      
    } catch (error) {
      console.error('AI generation failed:', error);
      alert(`Failed to generate questions: ${error.response?.data?.message || error.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const handleCountChange = (value) => {
    const numValue = parseInt(value) || 0;
    if (numValue >= 0 && numValue <= 10) {
      setSpecifications(prev => ({
        ...prev,
        count: numValue
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">🚀 AI Question Generator</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            {/* Question Type Specifications */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Question Specifications</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Question Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Type
                  </label>
                  <select
                    value={specifications.questionType}
                    onChange={(e) => setSpecifications(prev => ({
                      ...prev,
                      questionType: e.target.value
                    }))}
                    className="w-3/4 border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-[0.9rem]"
                  >
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="true-false">True/False</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Select one question type at a time
                  </p>
                </div>

                {/* Count */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 text-[0.9rem]">
                    Number of Questions
                  </label>
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleCountChange(Math.max(0, specifications.count - 1))}
                      className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300 transition"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={specifications.count}
                      onChange={(e) => handleCountChange(e.target.value)}
                      min="1"
                      max="10"
                      className="w-16 text-center border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleCountChange(specifications.count + 1)}
                      className="w-8 h-8 flex items-center justify-center bg-gray-200 rounded-full hover:bg-gray-300 transition"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Difficulty */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Difficulty Level
                  </label>
                  <select
                    value={specifications.difficulty}
                    onChange={(e) => setSpecifications(prev => ({
                      ...prev,
                      difficulty: e.target.value
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500 text-[0.9rem]"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Info Message */}
              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Please generate one question type at a time for best results. 
                  If you need both Multiple Choice and True/False questions, generate them separately.
                </p>
              </div>
            </div>

            {/* Rest of your component remains the same... */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Study Material / Learning Content
                <span className="text-red-500 ml-1">*</span>
              </label>
              <textarea
                value={studyMaterial} 
                onChange={(e) => setStudyMaterial(e.target.value)} 
                placeholder="Paste your textbook content, lecture notes, or any learning materials here. The AI will generate questions based on this content."
                rows={8}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-sm text-gray-500 mt-1">
                Provide detailed content for better question generation. The more context you provide, the better the questions will be.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={generating}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating || !studyMaterial.trim() || specifications.count === 0}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating {specifications.count} {specifications.questionType === 'multiple-choice' ? 'MCQ' : 'T/F'} Questions...
                  </>
                ) : (
                  `Generate ${specifications.count} ${specifications.questionType === 'multiple-choice' ? 'MCQ' : 'T/F'} Question${specifications.count !== 1 ? 's' : ''}`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIGenerator;