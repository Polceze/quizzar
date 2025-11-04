import React from 'react';

const QuestionNavigation = ({ questions, currentIndex, answers, flaggedQuestions, onQuestionSelect }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4 sticky top-24">
      <h3 className="font-semibold text-gray-700 mb-3">Questions</h3>
      <div className="grid grid-cols-5 gap-2">
        {questions.map((question, index) => {
          const isAnswered = answers[question._id] !== undefined;
          const isFlagged = flaggedQuestions.has(question._id);
          const isCurrent = index === currentIndex;
          
          let bgColor = 'bg-gray-100 hover:bg-gray-200';
          if (isCurrent) bgColor = 'bg-blue-500 text-white';
          else if (isAnswered && isFlagged) bgColor = 'bg-yellow-400 hover:bg-yellow-500';
          else if (isAnswered) bgColor = 'bg-green-500 text-white hover:bg-green-600';
          else if (isFlagged) bgColor = 'bg-yellow-100 hover:bg-yellow-200';
          
          return (
            <button
              key={question._id}
              onClick={() => onQuestionSelect(index)}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${bgColor}`}
              title={`Question ${index + 1}${isFlagged ? ' (Flagged)' : ''}${isAnswered ? ' (Answered)' : ''}`}
            >
              {index + 1}
              {isFlagged && !isAnswered && !isCurrent && ' ⚐'}
            </button>
          );
        })}
      </div>
      
      <div className="mt-4 text-xs text-gray-500 space-y-1">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded mr-2"></div>
          <span>Answered</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-yellow-400 rounded mr-2"></div>
          <span>Flagged</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded mr-2"></div>
          <span>Current</span>
        </div>
      </div>
    </div>
  );
};

export default QuestionNavigation;