import React from 'react';

const ViewQuestionModal = ({ question, onClose, onEdit }) => {
  if (!question) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-blue-700">View Question</h2>
          <div className="flex gap-2">
            <button
              onClick={onEdit}
              className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition"
            >
              Edit
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 text-white bg-red-400 rounded-lg hover:bg-red-500 transition"
            >
              Close
            </button>
          </div>
        </div>

        {/* Question Type Badge */}
        <div className="mb-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            question.isAIGenerated 
              ? 'bg-teal-100 text-teal-800' 
              : 'bg-orange-100 text-orange-800'
          }`}>
            {question.isAIGenerated ? '🤖 AI Generated' : '👤 Teacher-composed'}
          </span>
          <span className="ml-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
            {question.questionType}
          </span>
        </div>

        {/* Show modification status */}
        {question.isAIGenerated && question.isAIContentModified && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="text-sm font-medium text-yellow-800 mb-2">Modification Notice</h4>
            <p className="text-sm text-yellow-700">
              This AI-generated question has been modified by a teacher.
            </p>
            {question.modificationHistory && question.modificationHistory.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-medium text-yellow-800">Modification History:</p>
                <ul className="text-xs text-yellow-700 list-disc list-inside">
                  {question.modificationHistory.slice(-3).map((mod, index) => (
                    <li key={index}>
                      {new Date(mod.modifiedAt).toLocaleDateString()}: {mod.changes}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
        )}

        {/* Question Details */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-3 bg-blue-50 rounded-lg flex items-center justify-between">
            <label className="text-gray-700 text-sm font-medium">Points</label>
            <p className="text-gray-800 font-semibold">{question.points}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg flex items-center justify-between">
            <label className="text-gray-700 text-sm font-medium">Difficulty</label>
            <p className="text-gray-800 font-semibold">{question.difficulty || 'Medium'}</p>
          </div>
        </div>

        {/* Question Text */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <label className="block text-gray-700 text-sm font-medium mb-2">Question Text</label>
          <p className="text-gray-800 text-lg">{question.text}</p>
        </div>

        {/* Options and Correct Answer */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 text-gray-800 border-b pb-1">
            Options and Correct Answer
          </h3>
          
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <div 
                key={index} 
                className={`flex items-center space-x-3 p-3 rounded-lg border ${
                  index === question.correctAnswerIndex 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className={`flex items-center justify-center w-6 h-6 rounded-full ${
                  index === question.correctAnswerIndex 
                    ? 'bg-green-500 text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {question.questionType === 'MCQ' ? String.fromCharCode(65 + index) : ''}
                </div>
                <span className={`font-medium ${
                  index === question.correctAnswerIndex ? 'text-green-700' : 'text-gray-700'
                }`}>
                  {option.text}
                </span>
                {index === question.correctAnswerIndex && (
                  <span className="ml-auto text-green-600 font-semibold text-sm">
                    ✓ Correct Answer
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* AI Generation Info (if applicable) */}
        {question.isAIGenerated && (
          <div className="mt-6 p-4 bg-teal-50 rounded-lg border border-teal-200">
            <h4 className="text-sm font-medium text-teal-800 mb-2">AI Generation Information</h4>
            <p className="text-sm text-teal-700">
              <strong>Model:</strong> {question.aiModelUsed || 'Google Gemini'}
            </p>
            {/* {question.aiGenerationNotes && (
              <p className="text-sm text-teal-700 mt-1">
                <strong>Source:</strong> {question.aiGenerationNotes}
              </p>
            )} */}
          </div>
        )}
      </div>
    </div>
  );
};

export default ViewQuestionModal;