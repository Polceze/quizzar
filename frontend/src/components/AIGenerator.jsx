import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/useAuth';

const AIGenerator = ({ unitId, onClose, onQuestionsGenerated }) => {
  const [studyMaterial, setStudyMaterial] = useState('');
  const [generating, setGenerating] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [specifications, setSpecifications] = useState({
    questionType: 'multiple-choice',
    count: 3,
    difficulty: 'medium'
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { token } = useAuth();

  // Handle file selection
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['.pdf', '.txt'];
      const fileExt = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
      
      if (!allowedTypes.includes(fileExt)) {
        alert('Please select a PDF or TXT file only.');
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10MB.');
        return;
      }

      setSelectedFile(file);
      setStudyMaterial(''); // Clear text input when file is selected
    }
  };

  // Handle file upload and text extraction
  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file first.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const config = {
        headers: { 
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}` 
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        }
      };

      console.log('📤 Uploading file:', {
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size
      });
      
      const response = await axios.post('/api/study-material/extract', formData, config);
      
      console.log('✅ Upload successful:', response.data);
      
      if (response.data.extractedText) {
        setStudyMaterial(response.data.extractedText);
        alert(`Text extracted successfully! ${response.data.characterCount} characters loaded.`);
      } else {
        alert('No text could be extracted from the file.');
      }
      
    } catch (error) {
      console.error('❌ File upload failed:', error);
      console.error('Error response:', error.response);
      
      // Get detailed error message
      let errorMessage = 'Upload failed: ';
      
      if (error.response) {
        // Server responded with error status
        errorMessage += error.response.data?.message || 
                      error.response.data?.error || 
                      `Server error (${error.response.status})`;
        
        console.error('Server error details:', error.response.data);
      } else if (error.request) {
        // Request made but no response received
        errorMessage += 'No response from server. Check your connection.';
      } else {
        // Something else happened
        errorMessage += error.message;
      }
      
      alert(errorMessage);
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // Remove selected file
  const handleRemoveFile = () => {
    setSelectedFile(null);
    setStudyMaterial('');
  };

  // Generate questions (existing function, unchanged)
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
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
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

          <div className="space-y-6">
            {/* File Upload Section */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">📁 Upload Study Material</h3>
              
              {!selectedFile ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-blue-300 border-dashed rounded-lg cursor-pointer bg-blue-50 hover:bg-blue-100 transition">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <svg className="w-8 h-8 mb-4 text-blue-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                        </svg>
                        <p className="mb-2 text-sm text-blue-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-blue-400">PDF or TXT (MAX. 10MB)</p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept=".pdf,.txt" 
                        onChange={handleFileSelect}
                      />
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-lg">
                        {selectedFile.name.endsWith('.pdf') ? '📄' : '📝'}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{selectedFile.name}</p>
                        <p className="text-sm text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveFile}
                      className="text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>

                  {!studyMaterial && (
                    <div className="space-y-2">
                      {uploading && (
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      )}
                      <button
                        onClick={handleFileUpload}
                        disabled={uploading}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                      >
                        {uploading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Extracting Text... {uploadProgress}%
                          </>
                        ) : (
                          'Extract Text from File'
                        )}
                      </button>
                    </div>
                  )}

                  {studyMaterial && (
                    <div className="p-2 bg-green-50 border border-green-200 rounded">
                      <p className="text-sm text-green-700">
                        ✅ Text extracted successfully! {studyMaterial.length} characters loaded.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OR</span>
              </div>
            </div>

            {/* Manual Input Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                📝 Paste Study Material Directly
                <span className="text-red-500 ml-1">*</span>
              </label>
              <textarea
                value={studyMaterial} 
                onChange={(e) => {
                  setStudyMaterial(e.target.value);
                  if (e.target.value) setSelectedFile(null); // Clear file when typing
                }}
                placeholder="Paste your textbook content, lecture notes, or any learning materials here. The AI will generate questions based on this content."
                rows={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
              <p className="text-sm text-gray-500 mt-1">
                Provide detailed content for better question generation. The more context you provide, the better the questions will be.
              </p>
            </div>

            {/* Question Specifications (unchanged) */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-3">Question Specifications</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

              <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Please generate one question type at a time for best results. 
                  If you need both Multiple Choice and True/False questions, generate them separately.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                disabled={generating || uploading}
              >
                Cancel
              </button>
              <button
                onClick={handleGenerate}
                disabled={generating || uploading || !studyMaterial.trim() || specifications.count === 0}
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