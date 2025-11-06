import React from 'react';

const PerformanceCharts = ({ performanceData, questionAnalysis }) => {
  const { score, totalMarks, accuracy, correctAnswers, totalQuestions } = performanceData;

  // Score distribution for visual representation
  const scoreDistribution = [
    { range: '90-100%', color: 'bg-green-500', count: questionAnalysis.filter(q => (q.pointsAwarded / q.points) * 100 >= 90).length },
    { range: '80-89%', color: 'bg-blue-500', count: questionAnalysis.filter(q => (q.pointsAwarded / q.points) * 100 >= 80 && (q.pointsAwarded / q.points) * 100 < 90).length },
    { range: '70-79%', color: 'bg-yellow-500', count: questionAnalysis.filter(q => (q.pointsAwarded / q.points) * 100 >= 70 && (q.pointsAwarded / q.points) * 100 < 80).length },
    { range: 'Below 70%', color: 'bg-red-500', count: questionAnalysis.filter(q => (q.pointsAwarded / q.points) * 100 < 70).length },
  ];

  // Time spent analysis
  const timeRanges = [
    { range: '< 30s', color: 'bg-green-500', count: questionAnalysis.filter(q => q.timeSpent < 30).length },
    { range: '30-60s', color: 'bg-blue-500', count: questionAnalysis.filter(q => q.timeSpent >= 30 && q.timeSpent < 60).length },
    { range: '1-2min', color: 'bg-yellow-500', count: questionAnalysis.filter(q => q.timeSpent >= 60 && q.timeSpent < 120).length },
    { range: '> 2min', color: 'bg-red-500', count: questionAnalysis.filter(q => q.timeSpent >= 120).length },
  ];

  const totalCount = questionAnalysis.length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
      {/* Score Distribution Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Score Distribution</h3>
        <div className="space-y-3">
          {scoreDistribution.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded ${item.color}`}></div>
                <span className="text-sm text-gray-600">{item.range}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${item.color}`}
                    style={{
                      width: `${totalCount > 0 ? (item.count / totalCount) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-700 w-8">
                  {item.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Time Management Chart */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Time Management</h3>
        <div className="space-y-3">
          {timeRanges.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded ${item.color}`}></div>
                <span className="text-sm text-gray-600">{item.range}</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${item.color}`}
                    style={{
                      width: `${totalCount > 0 ? (item.count / totalCount) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-700 w-8">
                  {item.count}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Accuracy Gauge */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Overall Accuracy</h3>
        <div className="text-center">
          <div className="relative inline-block">
            <svg className="w-32 h-32" viewBox="0 0 36 36">
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={accuracy >= 70 ? '#10B981' : accuracy >= 50 ? '#F59E0B' : '#EF4444'}
                strokeWidth="3"
                strokeDasharray={`${accuracy}, 100`}
              />
              <text x="18" y="20.5" textAnchor="middle" fill="#374151" fontSize="8" fontWeight="bold">
                {accuracy.toFixed(1)}%
              </text>
              <text x="18" y="25" textAnchor="middle" fill="#6B7280" fontSize="4">
                ACCURACY
              </text>
            </svg>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {correctAnswers} out of {totalQuestions} questions correct
          </p>
        </div>
      </div>

      {/* Score Progress */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Score Progress</h3>
        <div className="text-center">
          <div className="relative inline-block">
            <svg className="w-32 h-32" viewBox="0 0 36 36">
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="3"
              />
              <path
                d="M18 2.0845
                  a 15.9155 15.9155 0 0 1 0 31.831
                  a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke={(score / totalMarks) * 100 >= 70 ? '#10B981' : (score / totalMarks) * 100 >= 50 ? '#F59E0B' : '#EF4444'}
                strokeWidth="3"
                strokeDasharray={`${(score / totalMarks) * 100}, 100`}
              />
              <text x="18" y="20.5" textAnchor="middle" fill="#374151" fontSize="8" fontWeight="bold">
                {score}/{totalMarks}
              </text>
              <text x="18" y="25" textAnchor="middle" fill="#6B7280" fontSize="4">
                SCORE
              </text>
            </svg>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            {((score / totalMarks) * 100).toFixed(1)}% of total marks
          </p>
        </div>
      </div>
    </div>
  );
};

export default PerformanceCharts;