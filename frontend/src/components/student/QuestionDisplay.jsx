import React from 'react';

const QuestionDisplay = ({
  question,
  questionNumber,
  totalQuestions,
  selectedAnswer,
  onAnswerSelect,
  isFlagged,
  onFlagToggle,
  onNavigatePrev,
  onNavigateNext,
  canNavigatePrev,
  canNavigateNext
}) => {
  if (!question) return null;

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      {/* Question Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Question {questionNumber} of {totalQuestions}
          </h2>
          <div className="flex items-center space-x-3 text-sm text-gray-600">
            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
              {question.questionType}
            </span>
            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">
              {question.points} point{question.points !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        
        <button
          onClick={onFlagToggle}
          className={`px-3 py-1 rounded-lg text-sm font-medium ${
            isFlagged 
              ? 'bg-yellow-100 text-yellow-700 border border-yellow-300' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {isFlagged ? '⚐ Flagged' : '⚐ Flag'}
        </button>
      </div>

      {/* Question Text */}
      <div className="mb-6">
        <p className="text-lg text-gray-800 leading-relaxed">{question.text}</p>
      </div>

      {/* Answer Options */}
      <div className="space-y-3 mb-8">
        {question.questionType === 'MCQ' && question.options?.map((option, index) => (
          <div
            key={index}
            onClick={() => onAnswerSelect(index)}
            className={`p-4 border rounded-lg cursor-pointer transition-all ${
              selectedAnswer === index
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center">
              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
                selectedAnswer === index
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : 'border-gray-400'
              }`}>
                {selectedAnswer === index && '✓'}
              </div>
              <span className="text-gray-800">{option.text}</span>
            </div>
          </div>
        ))}
        
        {question.questionType === 'T/F' && (
          <div className="grid grid-cols-2 gap-4">
            {['True', 'False'].map((option, index) => (
              <div
                key={index}
                onClick={() => onAnswerSelect(index)}
                className={`p-4 border rounded-lg cursor-pointer transition-all text-center ${
                  selectedAnswer === index
                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
                    selectedAnswer === index
                      ? 'border-blue-500 bg-blue-500 text-white'
                      : 'border-gray-400'
                  }`}>
                    {selectedAnswer === index && '✓'}
                  </div>
                  <span className="text-gray-800 font-medium">{option}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Navigation Controls */}
      <div className="flex justify-between items-center pt-4 border-t">
        <button
          onClick={onNavigatePrev}
          disabled={!canNavigatePrev}
          className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
        
        <button
          onClick={onNavigateNext}
          disabled={!canNavigateNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
};

export default QuestionDisplay;