import React from 'react';

const ExamHeader = ({ examName, timeRemaining, violationCount, onSubmit, isSubmitting }) => {
  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (timeRemaining < 300) return 'text-red-600 bg-red-100'; // 5 minutes
    if (timeRemaining < 600) return 'text-orange-600 bg-orange-100'; // 10 minutes
    return 'text-green-600 bg-green-100';
  };

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-bold text-gray-800">{examName}</h1>
            <div className={`px-3 py-1 rounded-full font-mono font-bold ${getTimeColor()}`}>
              ⏱️ {formatTime(timeRemaining)}
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {violationCount > 0 && (
              <div className="text-red-600 text-sm">
                ⚠️ Violations: {violationCount}/3
              </div>
            )}
            
            <button
              onClick={onSubmit}
              disabled={isSubmitting}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-semibold"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Exam'}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ExamHeader;