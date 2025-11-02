import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/useAuth';

const AIQuestionGenerator = ({ onQuestionsGenerated }) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  const [setSelectedFile] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [studyText, setStudyText] = useState('');
  
  const [specifications, setSpecifications] = useState({
    numQuestions: 5,
    questionTypes: ['multiple_choice'], // Default to MCQ only
    difficulty: 'medium'
  });

  const { token } = useAuth();

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile(file);
    setError('');
    setMessage('');

    const allowedTypes = ['.pdf', '.txt'];
    const fileExtension = file.name.toLowerCase().split('.').pop();
    
    if (!allowedTypes.includes(`.${fileExtension}`)) {
      setError('Please select a PDF or TXT file');
      setSelectedFile(null);
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const config = {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      };

      const res = await axios.post('/api/study-material/extract', formData, config);
      
      setExtractedText(res.data.extractedText);
      setMessage(`Text extracted successfully (${res.data.characterCount} characters)`);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to extract text from file');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQuestions = async () => {
    const studyMaterial = activeTab === 'upload' ? extractedText : studyText;
    
    if (!studyMaterial.trim()) {
      setError('Please provide study material');
      return;
    }

    if (studyMaterial.length < 100) {
      setError('Study material seems too short. Please provide more content.');
      return;
    }

    setLoading(true);
    setError('');
    setMessage('');

    try {
      const config = {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      };

      const payload = {
        studyMaterial,
        specifications
      };

      const res = await axios.post('/api/ai/generate-questions', payload, config);
      
      setMessage(`Successfully generated ${res.data.count} questions!`);
      
      if (onQuestionsGenerated) {
        onQuestionsGenerated(res.data.questions);
      }
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate questions');
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionTypeChange = (type) => {
    setSpecifications(prev => {
      const types = [...prev.questionTypes];
      if (types.includes(type)) {
        return {
          ...prev,
          questionTypes: types.filter(t => t !== type)
        };
      } else {
        return {
          ...prev,
          questionTypes: [...types, type]
        };
      }
    });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md border">
      <h2 className="text-2xl font-bold mb-4 text-indigo-700">AI Question Generator</h2>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {message}
        </div>
      )}

      {/* Input Method Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('upload')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'upload'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📁 Upload File
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'text'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              📝 Paste Text
            </button>
          </nav>
        </div>
      </div>

      {/* File Upload Section */}
      {activeTab === 'upload' && (
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Upload Study Material (PDF or TXT)
          </label>
          <input
            type="file"
            accept=".pdf,.txt"
            onChange={handleFileUpload}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            Maximum file size: 10MB. Supported formats: PDF, TXT
          </p>

          {extractedText && (
            <div className="mt-4">
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Extracted Text Preview
              </label>
              <div className="border border-gray-300 rounded-lg p-3 bg-gray-50 max-h-40 overflow-y-auto">
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {extractedText.length > 500 
                    ? `${extractedText.substring(0, 500)}...` 
                    : extractedText
                  }
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {extractedText.length} characters extracted
              </p>
            </div>
          )}
        </div>
      )}

      {/* Text Input Section */}
      {activeTab === 'text' && (
        <div className="mb-6">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Paste Study Material
          </label>
          <textarea
            value={studyText}
            onChange={(e) => setStudyText(e.target.value)}
            placeholder="Paste your study material, textbook content, or notes here..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 h-40"
            disabled={loading}
          />
          <p className="text-xs text-gray-500 mt-1">
            {studyText.length} characters (minimum 100 recommended)
          </p>
        </div>
      )}

      {/* Specifications Section */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium mb-3">Question Specifications</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Number of Questions */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Number of Questions
            </label>
            <select
              value={specifications.numQuestions}
              onChange={(e) => setSpecifications(prev => ({
                ...prev,
                numQuestions: parseInt(e.target.value)
              }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            >
              {[3, 5, 10, 15, 20].map(num => (
                <option key={num} value={num}>{num} questions</option>
              ))}
            </select>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-gray-700 text-sm font-medium mb-2">
              Difficulty Level
            </label>
            <select
              value={specifications.difficulty}
              onChange={(e) => setSpecifications(prev => ({
                ...prev,
                difficulty: e.target.value
              }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={loading}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Question Types - ONLY MCQ and True/False */}
        <div className="mt-4">
          <label className="block text-gray-700 text-sm font-medium mb-2">
            Question Types
          </label>
          <div className="flex flex-wrap gap-3">
            {[
              { value: 'multiple_choice', label: 'Multiple Choice' },
              { value: 'true_false', label: 'True/False' }
            ].map(type => (
              <label key={type.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={specifications.questionTypes.includes(type.value)}
                  onChange={() => handleQuestionTypeChange(type.value)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  disabled={loading}
                />
                <span className="text-sm text-gray-700">{type.label}</span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Select one or both question types
          </p>
        </div>
      </div>

      {/* Generate Button */}
      <button
        onClick={handleGenerateQuestions}
        disabled={loading || (!extractedText && !studyText.trim()) || specifications.questionTypes.length === 0}
        className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition duration-150"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating Questions...
          </span>
        ) : (
          'Generate Questions with AI'
        )}
      </button>

      <p className="text-xs text-gray-500 mt-3 text-center">
        Powered by Google Gemini AI. Generates Multiple Choice and True/False questions only.
      </p>
    </div>
  );
};

export default AIQuestionGenerator;