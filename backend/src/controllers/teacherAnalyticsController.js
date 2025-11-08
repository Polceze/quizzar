import mongoose from 'mongoose';
import Exam from '../models/Exam.js';
import StudentExamAttempt from '../models/StudentExamAttempt.js';
import Result from '../models/Result.js';
import Unit from '../models/Unit.js';
import User from '../models/user.js';

// @desc    Get exam performance analytics for teacher
// @route   GET /api/teacher/analytics/exams
// @access  Private/Teacher
export const getExamAnalytics = async (req, res) => {
  const teacherId = req.user._id;

  try {
    // Get all exams created by the teacher
    const exams = await Exam.find({ creator: teacherId })
      .populate('unit', 'name code')
      .select('name unit durationMinutes totalMarks status scheduledStart scheduledEnd questions');

    // Get analytics for each exam
    const examAnalytics = await Promise.all(
      exams.map(async (exam) => {
        // Get all attempts for this exam
        const attempts = await StudentExamAttempt.find({ exam: exam._id })
          .populate('student', 'fullName email')
          .select('student score percentage status startTime endTime violationCount');

        const submittedAttempts = attempts.filter(attempt => 
          ['submitted', 'graded', 'violation'].includes(attempt.status)
        );

        const totalStudents = submittedAttempts.length;
        const averageScore = totalStudents > 0 
          ? submittedAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / totalStudents 
          : 0;
        const averagePercentage = totalStudents > 0 
          ? submittedAttempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / totalStudents 
          : 0;

        // Calculate score distribution
        const scoreDistribution = {
          excellent: submittedAttempts.filter(a => a.percentage >= 90).length,
          good: submittedAttempts.filter(a => a.percentage >= 70 && a.percentage < 90).length,
          average: submittedAttempts.filter(a => a.percentage >= 50 && a.percentage < 70).length,
          poor: submittedAttempts.filter(a => a.percentage < 50).length,
        };

        return {
          exam: {
            _id: exam._id,
            name: exam.name,
            unit: exam.unit,
            totalMarks: exam.totalMarks,
            status: exam.status,
            questionCount: exam.questions?.length || 0,
            scheduledStart: exam.scheduledStart,
            scheduledEnd: exam.scheduledEnd,
          },
          statistics: {
            totalStudents,
            averageScore: Math.round(averageScore * 100) / 100,
            averagePercentage: Math.round(averagePercentage * 100) / 100,
            highestScore: totalStudents > 0 ? Math.max(...submittedAttempts.map(a => a.score)) : 0,
            lowestScore: totalStudents > 0 ? Math.min(...submittedAttempts.map(a => a.score)) : 0,
            completionRate: totalStudents > 0 ? (submittedAttempts.length / attempts.length) * 100 : 0,
            scoreDistribution,
          },
          recentAttempts: submittedAttempts.slice(0, 5).map(attempt => ({
            student: attempt.student,
            score: attempt.score,
            percentage: attempt.percentage,
            status: attempt.status,
            submittedAt: attempt.endTime,
            violationCount: attempt.violationCount,
          }))
        };
      })
    );

    res.status(200).json(examAnalytics);
  } catch (error) {
    console.error('Get exam analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch exam analytics: ' + error.message });
  }
};

// @desc    Get detailed analytics for a specific exam
// @route   GET /api/teacher/analytics/exams/:examId
// @access  Private/Teacher
export const getExamDetailedAnalytics = async (req, res) => {
  const { examId } = req.params;
  const teacherId = req.user._id;

  try {
    // Verify exam belongs to teacher
    const exam = await Exam.findOne({ _id: examId, creator: teacherId })
      .populate('unit', 'name code')
      .populate('questions');
    
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found or access denied.' });
    }

    // Check if results are released for this exam
    const anyResult = await Result.findOne({ exam: examId });
    const areResultsReleased = anyResult ? anyResult.resultsReleased : false;

    // Get all attempts for this exam - FIXED: Simplified student population
    const attempts = await StudentExamAttempt.find({ exam: examId })
      .populate({
        path: 'student',
        select: 'email studentProfile', // Get basic user info
        populate: {
          path: 'studentProfile',
          select: 'fullName admissionNumber yearOfStudy'
        }
      })
      .sort({ createdAt: -1 });

    const submittedAttempts = attempts.filter(attempt => 
      ['submitted', 'graded', 'violation'].includes(attempt.status)
    );

    // Calculate overall statistics
    const totalStudents = submittedAttempts.length;
    const averageScore = totalStudents > 0 
      ? submittedAttempts.reduce((sum, attempt) => sum + attempt.score, 0) / totalStudents 
      : 0;
    const averagePercentage = totalStudents > 0 
      ? submittedAttempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / totalStudents 
      : 0;

    // Question-wise analysis
    const questionAnalysis = exam.questions.map((question, index) => {
      const correctAnswers = submittedAttempts.filter(attempt => {
        const questionResult = attempt.questionResults?.find(qr => 
          qr.question.toString() === question._id.toString()
        );
        return questionResult?.isCorrect;
      }).length;

      const accuracy = totalStudents > 0 ? (correctAnswers / totalStudents) * 100 : 0;

      return {
        questionNumber: index + 1,
        questionId: question._id,
        questionText: question.text?.substring(0, 100) + (question.text?.length > 100 ? '...' : '') || 'Question text not available',
        points: question.points || 0,
        correctAnswers,
        accuracy: Math.round(accuracy * 100) / 100,
        totalAttempts: totalStudents,
      };
    });

    // Student performance data - FIXED: Handle StudentProfile data safely
    const studentPerformance = submittedAttempts.map(attempt => {
      // Safely get student data
      const student = attempt.student;
      const studentProfile = student.studentProfile || {};
      
      const fullName = studentProfile.fullName || student.email || 'Unknown Student';
      const admissionNumber = studentProfile.admissionNumber || 'N/A';

      return {
        student: {
          _id: student._id,
          fullName,
          admissionNumber,
          email: student.email,
          yearOfStudy: studentProfile.yearOfStudy || 'N/A'
        },
        score: attempt.score || 0,
        percentage: attempt.percentage || 0,
        status: attempt.status || 'unknown',
        startTime: attempt.startTime,
        endTime: attempt.endTime,
        timeSpent: attempt.endTime ? Math.floor((attempt.endTime - attempt.startTime) / 60000) : 0,
        violationCount: attempt.violationCount || 0,
        questionResults: attempt.questionResults || [],
      };
    });

    // Score distribution
    const scoreRanges = [
      { range: '90-100%', min: 90, max: 100, count: 0 },
      { range: '80-89%', min: 80, max: 89, count: 0 },
      { range: '70-79%', min: 70, max: 79, count: 0 },
      { range: '60-69%', min: 60, max: 69, count: 0 },
      { range: '50-59%', min: 50, max: 59, count: 0 },
      { range: 'Below 50%', min: 0, max: 49, count: 0 },
    ];

    submittedAttempts.forEach(attempt => {
      const percentage = attempt.percentage || 0;
      const range = scoreRanges.find(r => percentage >= r.min && percentage <= r.max);
      if (range) range.count++;
    });

    res.status(200).json({
      exam: {
        _id: exam._id,
        name: exam.name || 'Unnamed Exam',
        unit: exam.unit || { name: 'N/A', code: 'N/A' },
        totalMarks: exam.totalMarks || 0,
        durationMinutes: exam.durationMinutes || 0,
        questionCount: exam.questions?.length || 0,
        status: exam.status || 'draft',
        scheduledStart: exam.scheduledStart,
        scheduledEnd: exam.scheduledEnd,
      },
      overview: {
        totalStudents,
        averageScore: Math.round(averageScore * 100) / 100,
        averagePercentage: Math.round(averagePercentage * 100) / 100,
        highestScore: totalStudents > 0 ? Math.max(...submittedAttempts.map(a => a.score || 0)) : 0,
        lowestScore: totalStudents > 0 ? Math.min(...submittedAttempts.map(a => a.score || 0)) : 0,
        completionRate: totalStudents > 0 ? (submittedAttempts.length / attempts.length) * 100 : 0,
        totalViolations: submittedAttempts.reduce((sum, attempt) => sum + (attempt.violationCount || 0), 0),
      },
      questionAnalysis,
      studentPerformance,
      scoreDistribution: scoreRanges,
      areResultsReleased, // ADD THIS FIELD
    });

  } catch (error) {
    console.error('Get detailed exam analytics error:', error);
    res.status(500).json({ message: 'Failed to fetch detailed exam analytics: ' + error.message });
  }
};

// @desc    Get student-wise performance across all units
// @route   GET /api/teacher/analytics/students
// @access  Private/Teacher
export const getStudentPerformance = async (req, res) => {
  const teacherId = req.user._id;

  try {
    // Get all units taught by the teacher
    const units = await Unit.find({ teacher: teacherId }).select('_id name code');
    const unitIds = units.map(unit => unit._id);

    // Get all exams for these units
    const exams = await Exam.find({ unit: { $in: unitIds } }).select('_id name unit');
    
    // Get all attempts for these exams
    const attempts = await StudentExamAttempt.find({ 
      exam: { $in: exams.map(exam => exam._id) },
      status: { $in: ['submitted', 'graded'] }
    })
    .populate('student', 'fullName email admissionNumber yearOfStudy')
    .populate('exam', 'name unit totalMarks')
    .populate('unit', 'name code');

    // Group attempts by student
    const studentPerformanceMap = new Map();

    attempts.forEach(attempt => {
      const studentId = attempt.student._id.toString();
      
      if (!studentPerformanceMap.has(studentId)) {
        studentPerformanceMap.set(studentId, {
          student: attempt.student,
          units: new Map(),
          overallStats: {
            totalExams: 0,
            averagePercentage: 0,
            totalScore: 0,
            totalPossibleScore: 0,
          }
        });
      }

      const studentData = studentPerformanceMap.get(studentId);
      const unitId = attempt.unit._id.toString();

      // Initialize unit data if not exists
      if (!studentData.units.has(unitId)) {
        studentData.units.set(unitId, {
          unit: attempt.unit,
          exams: [],
          unitStats: {
            totalExams: 0,
            averagePercentage: 0,
            totalScore: 0,
            totalPossibleScore: 0,
          }
        });
      }

      const unitData = studentData.units.get(unitId);
      
      // Add exam attempt to unit
      unitData.exams.push({
        exam: attempt.exam,
        score: attempt.score,
        percentage: attempt.percentage,
        submittedAt: attempt.endTime,
        status: attempt.status,
      });

      // Update unit statistics
      unitData.unitStats.totalExams++;
      unitData.unitStats.totalScore += attempt.score;
      unitData.unitStats.totalPossibleScore += attempt.exam.totalMarks;
      unitData.unitStats.averagePercentage = unitData.unitStats.totalScore > 0 
        ? (unitData.unitStats.totalScore / unitData.unitStats.totalPossibleScore) * 100 
        : 0;

      // Update overall statistics
      studentData.overallStats.totalExams++;
      studentData.overallStats.totalScore += attempt.score;
      studentData.overallStats.totalPossibleScore += attempt.exam.totalMarks;
      studentData.overallStats.averagePercentage = studentData.overallStats.totalScore > 0 
        ? (studentData.overallStats.totalScore / studentData.overallStats.totalPossibleScore) * 100 
        : 0;
    });

    // Convert map to array and format response
    const studentPerformance = Array.from(studentPerformanceMap.values()).map(studentData => ({
      student: studentData.student,
      overallStats: {
        ...studentData.overallStats,
        averagePercentage: Math.round(studentData.overallStats.averagePercentage * 100) / 100,
      },
      units: Array.from(studentData.units.values()).map(unitData => ({
        unit: unitData.unit,
        stats: {
          ...unitData.unitStats,
          averagePercentage: Math.round(unitData.unitStats.averagePercentage * 100) / 100,
        },
        recentExams: unitData.exams.slice(0, 3), // Show only recent 3 exams
        totalExams: unitData.exams.length,
      })),
    }));

    res.status(200).json({
      students: studentPerformance,
      summary: {
        totalStudents: studentPerformance.length,
        totalUnits: units.length,
        totalExams: exams.length,
        averagePerformance: studentPerformance.length > 0 
          ? studentPerformance.reduce((sum, student) => sum + student.overallStats.averagePercentage, 0) / studentPerformance.length 
          : 0,
      }
    });

  } catch (error) {
    console.error('Get student performance error:', error);
    res.status(500).json({ message: 'Failed to fetch student performance: ' + error.message });
  }
};

// @desc    Toggle results release for an exam
// @route   PUT /api/teacher/analytics/exams/:examId/results-release
// @access  Private/Teacher
export const toggleResultsRelease = async (req, res) => {
  const { examId } = req.params;
  const { release } = req.body; // boolean: true to release, false to hide
  const teacherId = req.user._id;

  try {
    // Verify exam belongs to teacher
    const exam = await Exam.findOne({ _id: examId, creator: teacherId });
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found or access denied.' });
    }

    // Update all results for this exam
    await Result.updateMany(
      { exam: examId },
      { $set: { resultsReleased: release } }
    );

    res.status(200).json({
      message: `Results ${release ? 'released' : 'hidden'} successfully for exam: ${exam.name}`,
      released: release
    });

  } catch (error) {
    console.error('Toggle results release error:', error);
    res.status(500).json({ message: 'Failed to toggle results release: ' + error.message });
  }
};

// @desc    Get completion status for all exams in a unit
// @route   GET /api/teacher/analytics/units/:unitId/completion
// @access  Private/Teacher
export const getUnitCompletionStatus = async (req, res) => {
  const { unitId } = req.params;
  const teacherId = req.user._id;

  try {
    // Verify unit belongs to teacher
    const unit = await Unit.findOne({ _id: unitId, teacher: teacherId })
      .populate('students', 'fullName email admissionNumber');
    
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found or access denied.' });
    }

    // Get all exams for this unit
    const exams = await Exam.find({ unit: unitId }).select('name _id totalMarks status scheduledEnd');

    // Get completion data for each exam
    const examCompletionData = await Promise.all(
      exams.map(async (exam) => {
        const attempts = await StudentExamAttempt.find({ exam: exam._id })
          .populate('student', '_id')
          .select('student status score percentage');

        const submittedStudents = attempts
          .filter(attempt => ['submitted', 'graded', 'violation'].includes(attempt.status))
          .map(attempt => attempt.student._id.toString());

        const pendingStudents = unit.students.filter(student => 
          !submittedStudents.includes(student._id.toString())
        );

        return {
          exam: {
            _id: exam._id,
            name: exam.name,
            totalMarks: exam.totalMarks,
            status: exam.status,
            scheduledEnd: exam.scheduledEnd,
          },
          completion: {
            totalStudents: unit.students.length,
            completed: submittedStudents.length,
            pending: pendingStudents.length,
            completionRate: unit.students.length > 0 ? (submittedStudents.length / unit.students.length) * 100 : 0,
          },
          pendingStudents: pendingStudents.map(student => ({
            _id: student._id,
            fullName: student.fullName,
            email: student.email,
            admissionNumber: student.admissionNumber,
          })),
          averageScore: submittedStudents.length > 0 
            ? attempts.reduce((sum, attempt) => sum + attempt.score, 0) / submittedStudents.length 
            : 0,
        };
      })
    );

    res.status(200).json({
      unit: {
        _id: unit._id,
        name: unit.name,
        code: unit.code,
        totalStudents: unit.students.length,
      },
      exams: examCompletionData,
      overallCompletion: {
        totalExams: exams.length,
        averageCompletionRate: examCompletionData.length > 0 
          ? examCompletionData.reduce((sum, exam) => sum + exam.completion.completionRate, 0) / examCompletionData.length 
          : 0,
      }
    });

  } catch (error) {
    console.error('Get unit completion status error:', error);
    res.status(500).json({ message: 'Failed to fetch unit completion status: ' + error.message });
  }
};