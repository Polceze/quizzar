import mongoose from 'mongoose';
import StudentExamAttempt from '../models/StudentExamAttempt.js';
import Result from '../models/Result.js';
import StudentProfile from '../models/StudentProfile.js';

// @desc    Get student's overall performance dashboard
// @route   GET /api/student/analytics/overview
// @access  Private/Student
export const getStudentOverview = async (req, res) => {
  const studentId = req.user._id;

  try {
    // Get student's enrolled units
    const studentProfile = await StudentProfile.findOne({ user: studentId })
      .populate('unitsEnrolled', 'name code');
    
    if (!studentProfile) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }

    // Get all completed exam attempts WITH RELEASED RESULTS
    const completedResults = await Result.find({
      student: studentId,
      resultsReleased: true // ONLY include released results
    })
    .populate('exam', 'name unit totalMarks')
    .populate('unit', 'name code');

    // Calculate overall statistics (only from released results)
    const totalExams = completedResults.length;
    const totalScore = completedResults.reduce((sum, result) => sum + result.score, 0);
    const totalPossibleScore = completedResults.reduce((sum, result) => sum + result.totalMarks, 0);
    const averagePercentage = totalExams > 0 ? (totalScore / totalPossibleScore) * 100 : 0;

    // Performance by unit (only released results)
    const unitPerformance = studentProfile.unitsEnrolled.map(unit => {
      const unitResults = completedResults.filter(result => 
        result.unit._id.toString() === unit._id.toString()
      );
      
      const unitTotalScore = unitResults.reduce((sum, result) => sum + result.score, 0);
      const unitTotalPossible = unitResults.reduce((sum, result) => sum + result.totalMarks, 0);
      const unitAverage = unitResults.length > 0 ? (unitTotalScore / unitTotalPossible) * 100 : 0;

      return {
        unit: {
          _id: unit._id,
          name: unit.name,
          code: unit.code,
        },
        stats: {
          totalExams: unitResults.length,
          averageScore: unitTotalScore,
          totalPossibleScore: unitTotalPossible,
          averagePercentage: Math.round(unitAverage * 100) / 100,
        },
        recentExams: unitResults.slice(0, 3).map(result => ({
          exam: result.exam.name,
          score: result.score,
          percentage: (result.score / result.totalMarks) * 100,
          submittedAt: result.finishTime,
        }))
      };
    });

    // Recent activity (only released results)
    const recentActivity = completedResults
      .sort((a, b) => new Date(b.finishTime) - new Date(a.finishTime))
      .slice(0, 5)
      .map(result => ({
        exam: result.exam.name,
        unit: result.unit.name,
        score: result.score,
        percentage: (result.score / result.totalMarks) * 100,
        submittedAt: result.finishTime,
        status: 'released',
      }));

    // Performance trends (only released results, last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyPerformance = await Result.aggregate([
      {
        $match: {
          student: new mongoose.Types.ObjectId(studentId),
          resultsReleased: true, // ONLY released results
          finishTime: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$finishTime' },
            month: { $month: '$finishTime' }
          },
          averagePercentage: { 
            $avg: { 
              $multiply: [
                { $divide: ['$score', '$totalMarks'] },
                100
              ]
            } 
          },
          examCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ]);

    res.status(200).json({
      overview: {
        totalExams,
        totalScore: Math.round(totalScore * 100) / 100,
        totalPossibleScore: Math.round(totalPossibleScore * 100) / 100,
        averagePercentage: Math.round(averagePercentage * 100) / 100,
        enrolledUnits: studentProfile.unitsEnrolled.length,
        completedUnits: unitPerformance.filter(unit => unit.stats.totalExams > 0).length,
      },
      unitPerformance,
      recentActivity,
      performanceTrend: monthlyPerformance.map(month => ({
        period: `${month._id.year}-${month._id.month.toString().padStart(2, '0')}`,
        averagePercentage: Math.round(month.averagePercentage * 100) / 100,
        examCount: month.examCount,
      }))
    });

  } catch (error) {
    console.error('Get student overview error:', error);
    res.status(500).json({ message: 'Failed to fetch student overview: ' + error.message });
  }
};

// @desc    Get student's exam results history
// @route   GET /api/student/analytics/results
// @access  Private/Student
export const getStudentResults = async (req, res) => {
  const studentId = req.user._id;
  const { unit, page = 1, limit = 10 } = req.query;

  try {
    // Build filter - ONLY include released results
    const filter = { 
      student: studentId,
      resultsReleased: true // CRITICAL: Only show released results
    };
    if (unit && mongoose.Types.ObjectId.isValid(unit)) {
      filter.unit = new mongoose.Types.ObjectId(unit);
    }

    // Get paginated results (only released)
    const results = await Result.find(filter)
      .populate('exam', 'name unit durationMinutes totalMarks')
      .populate('unit', 'name code')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    // Get total count for pagination (only released)
    const total = await Result.countDocuments(filter);

    // Get available units for filter
    const studentProfile = await StudentProfile.findOne({ user: studentId })
      .populate('unitsEnrolled', 'name code');
    
    const availableUnits = studentProfile?.unitsEnrolled || [];

    res.status(200).json({
      results: results.map(result => ({
        _id: result._id,
        exam: result.exam,
        unit: result.unit,
        score: result.score,
        totalMarks: result.totalMarks,
        percentage: (result.score / result.totalMarks) * 100,
        startTime: result.startTime,
        finishTime: result.finishTime,
        attemptNumber: result.attemptNumber,
        resultsReleased: result.resultsReleased,
      })),
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalResults: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
      availableUnits,
    });

  } catch (error) {
    console.error('Get student results error:', error);
    res.status(500).json({ message: 'Failed to fetch student results: ' + error.message });
  }
};

// @desc    Get detailed result for a specific exam attempt
// @route   GET /api/student/analytics/results/:resultId
// @access  Private/Student
export const getDetailedResult = async (req, res) => {
  const { resultId } = req.params; // Changed from attemptId to resultId
  const studentId = req.user._id;

  try {
    // First, try to find the Result document
    const result = await Result.findOne({
      _id: resultId,
      student: studentId,
    }).populate('exam', 'name unit totalMarks durationMinutes')
      .populate('unit', 'name code');

    if (!result) {
      return res.status(404).json({ message: 'Result not found or access denied.' });
    }

    // Check if results are released
    if (!result.resultsReleased) {
      return res.status(403).json({ 
        message: 'Results for this exam are not yet released by your teacher.' 
      });
    }

    // Get the corresponding exam attempt for detailed question analysis
    const attempt = await StudentExamAttempt.findOne({
      student: studentId,
      exam: result.exam._id,
      status: { $in: ['submitted', 'graded'] }
    })
    .populate('questionResults.question', 'text options points questionType');

    if (!attempt) {
      return res.status(404).json({ message: 'Exam attempt details not found.' });
    }

    // Calculate performance statistics
    const totalQuestions = attempt.questionResults.length;
    const correctAnswers = attempt.questionResults.filter(q => q.isCorrect).length;
    const accuracy = (correctAnswers / totalQuestions) * 100;

    // Time analysis
    const totalTimeSpent = attempt.questionResults.reduce((sum, q) => sum + (q.timeSpent || 0), 0);
    const averageTimePerQuestion = totalQuestions > 0 ? totalTimeSpent / totalQuestions : 0;

    // Question-wise performance
    const questionAnalysis = attempt.questionResults.map((qResult, index) => {
      const question = qResult.question;
      return {
        questionNumber: index + 1,
        questionText: question?.text || 'Question not available',
        questionType: question?.questionType,
        points: question?.points || 0,
        selectedOptionIndex: qResult.selectedOptionIndex,
        correctOptionIndex: qResult.correctOptionIndex,
        isCorrect: qResult.isCorrect,
        pointsAwarded: qResult.pointsAwarded,
        timeSpent: qResult.timeSpent,
        options: question?.options || [],
      };
    });

    // Performance by question type
    const performanceByType = attempt.questionResults.reduce((acc, qResult) => {
      const type = qResult.question?.questionType || 'Unknown';
      if (!acc[type]) {
        acc[type] = { total: 0, correct: 0 };
      }
      acc[type].total++;
      if (qResult.isCorrect) acc[type].correct++;
      return acc;
    }, {});

    // Convert to array with percentages
    const performanceByTypeArray = Object.entries(performanceByType).map(([type, stats]) => ({
      type,
      correct: stats.correct,
      total: stats.total,
      accuracy: (stats.correct / stats.total) * 100,
    }));

    res.status(200).json({
      exam: result.exam,
      unit: result.unit,
      attemptDetails: {
        startTime: attempt.startTime,
        endTime: attempt.endTime,
        timeSpent: Math.floor((attempt.endTime - attempt.startTime) / 60000), // minutes
        violationCount: attempt.violationCount,
        status: attempt.status,
      },
      performance: {
        score: result.score,
        totalMarks: result.totalMarks,
        percentage: (result.score / result.totalMarks) * 100,
        correctAnswers,
        totalQuestions,
        accuracy: Math.round(accuracy * 100) / 100,
        averageTimePerQuestion: Math.round(averageTimePerQuestion),
        totalTimeSpent: Math.round(totalTimeSpent / 60), // convert to minutes
      },
      questionAnalysis,
      performanceByType: performanceByTypeArray,
      comparison: {
        classAverage: null,
        highestScore: null,
        performanceBand: getPerformanceBand((result.score / result.totalMarks) * 100),
      }
    });

  } catch (error) {
    console.error('Get detailed result error:', error);
    res.status(500).json({ message: 'Failed to fetch detailed result: ' + error.message });
  }
};

// @desc    Get student's comparative analytics
// @route   GET /api/student/analytics/comparative
// @access  Private/Student
export const getComparativeAnalytics = async (req, res) => {
  const studentId = req.user._id;

  try {
    // Get student's enrolled units
    const studentProfile = await StudentProfile.findOne({ user: studentId })
      .populate('unitsEnrolled', 'name code');
    
    if (!studentProfile) {
      return res.status(404).json({ message: 'Student profile not found.' });
    }

    // Get student's released results
    const studentResults = await Result.find({
      student: studentId,
      resultsReleased: true // ONLY released results
    }).populate('exam unit');

    // If no released results, return empty data
    if (studentResults.length === 0) {
      return res.status(200).json({
        overall: {
          studentAverage: 0,
          classAverage: 0,
          performanceGap: 0,
          totalUnits: 0,
          unitsAboveAverage: 0,
          unitsBelowAverage: 0,
        },
        unitPerformance: [],
        strengths: [],
        areasForImprovement: [],
        message: "No results released yet by your teachers."
      });
    }

    const unitPerformance = await Promise.all(
      studentProfile.unitsEnrolled.map(async (unit) => {
        // Get student's performance in this unit (only released)
        const studentUnitResults = studentResults.filter(result => 
          result.unit._id.toString() === unit._id.toString()
        );

        if (studentUnitResults.length === 0) {
          return null; // Skip units with no released results
        }

        const studentAvg = studentUnitResults.reduce((sum, result) => 
          sum + (result.score / result.totalMarks) * 100, 0
        ) / studentUnitResults.length;

        // Get class performance for this unit (only released results from other students)
        const unitExams = studentUnitResults.map(result => result.exam._id);
        
        const classResults = await Result.find({
          exam: { $in: unitExams },
          resultsReleased: true, // ONLY released results
          student: { $ne: studentId } // Exclude current student
        });

        if (classResults.length === 0) {
          return {
            unit: {
              _id: unit._id,
              name: unit.name,
              code: unit.code,
            },
            studentPerformance: Math.round(studentAvg * 100) / 100,
            classAverage: null,
            percentile: null,
            examCount: studentUnitResults.length,
            performanceGap: null,
            trend: 'no-data',
          };
        }

        const classAvg = classResults.reduce((sum, result) => 
          sum + (result.score / result.totalMarks) * 100, 0
        ) / classResults.length;

        // Calculate percentile
        const studentPercentile = (classResults.filter(result => 
          (result.score / result.totalMarks) * 100 < studentAvg
        ).length / classResults.length) * 100;

        return {
          unit: {
            _id: unit._id,
            name: unit.name,
            code: unit.code,
          },
          studentPerformance: Math.round(studentAvg * 100) / 100,
          classAverage: Math.round(classAvg * 100) / 100,
          percentile: Math.round(studentPercentile * 100) / 100,
          examCount: studentUnitResults.length,
          performanceGap: Math.round((studentAvg - classAvg) * 100) / 100,
          trend: studentAvg > classAvg ? 'above' : studentAvg < classAvg ? 'below' : 'equal',
        };
      })
    );

    // Filter out null units (no released results)
    const validUnitPerformance = unitPerformance.filter(unit => unit !== null);

    // Overall comparative stats
    const overallStudentAvg = validUnitPerformance.length > 0
      ? validUnitPerformance.reduce((sum, unit) => sum + unit.studentPerformance, 0) / validUnitPerformance.length
      : 0;

    const overallClassAvg = validUnitPerformance.filter(unit => unit.classAverage !== null).length > 0
      ? validUnitPerformance.filter(unit => unit.classAverage !== null)
          .reduce((sum, unit) => sum + unit.classAverage, 0) / validUnitPerformance.filter(unit => unit.classAverage !== null).length
      : 0;

    res.status(200).json({
      overall: {
        studentAverage: Math.round(overallStudentAvg * 100) / 100,
        classAverage: Math.round(overallClassAvg * 100) / 100,
        performanceGap: Math.round((overallStudentAvg - overallClassAvg) * 100) / 100,
        totalUnits: validUnitPerformance.length,
        unitsAboveAverage: validUnitPerformance.filter(unit => unit.trend === 'above').length,
        unitsBelowAverage: validUnitPerformance.filter(unit => unit.trend === 'below').length,
      },
      unitPerformance: validUnitPerformance,
      strengths: validUnitPerformance
        .filter(unit => unit.trend === 'above' && unit.percentile >= 75)
        .map(unit => unit.unit.name),
      areasForImprovement: validUnitPerformance
        .filter(unit => unit.trend === 'below' && unit.percentile <= 25)
        .map(unit => unit.unit.name),
    });

  } catch (error) {
    console.error('Get comparative analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch comparative analytics: ' + error.message });
  }
};

// Helper function to determine performance band
function getPerformanceBand(percentage) {
  if (percentage >= 90) return 'Excellent';
  if (percentage >= 80) return 'Very Good';
  if (percentage >= 70) return 'Good';
  if (percentage >= 60) return 'Satisfactory';
  if (percentage >= 50) return 'Needs Improvement';
  return 'Poor';
}