import Exam from '../models/Exam.js';
import StudentProfile from '../models/StudentProfile.js';
import StudentExamAttempt from '../models/StudentExamAttempt.js';
import Result from '../models/Result.js'; 
import mongoose from 'mongoose';

// Utility function to randomize an array (Fisher-Yates shuffle)
const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
};

// @desc    Get list of all ACTIVE and available exams for the student's enrolled units
// @route   GET /api/student/exams
// @access  Private/Student
export const listAvailableExams = async (req, res) => {
    const studentId = req.user._id;

    try {
        // 1. Find the student's enrolled units
        const profile = await StudentProfile.findOne({ user: studentId }).select('unitsEnrolled');
        if (!profile) {
            return res.status(404).json({ message: 'Student profile not found.' });
        }
        const enrolledUnitIds = profile.unitsEnrolled;

        // 2. Find exams that are active, available for the enrolled units, and within the time window
        const now = new Date();
        const availableExams = await Exam.find({
            unit: { $in: enrolledUnitIds },
            status: 'active',
            scheduledStart: { $lte: now }, // Exam has started
            $or: [
                { scheduledEnd: { $gte: now } }, // Exam has not ended
                { scheduledEnd: null } // Exam has no end time
            ]
        })
        .populate('unit', 'name code')
        .select('name unit durationMinutes totalMarks allowMultipleAttempts scheduledStart scheduledEnd'); 

        // 3. Check for previous attempts and active attempts
        const examsWithAttempts = await Promise.all(availableExams.map(async (exam) => {
            const previousResults = await Result.countDocuments({ student: studentId, exam: exam._id });
            const activeAttempt = await StudentExamAttempt.findOne({ 
                student: studentId, 
                exam: exam._id,
                status: { $in: ['not_started', 'in_progress'] }
            });

            return {
                _id: exam._id,
                name: exam.name,
                unit: exam.unit,
                durationMinutes: exam.durationMinutes,
                totalMarks: exam.totalMarks,
                scheduledStart: exam.scheduledStart,
                scheduledEnd: exam.scheduledEnd,
                attemptsMade: previousResults,
                isAllowed: exam.allowMultipleAttempts || previousResults === 0,
                hasActiveAttempt: !!activeAttempt,
                activeAttemptId: activeAttempt?._id
            };
        }));

        res.status(200).json(examsWithAttempts.filter(exam => exam.isAllowed));

    } catch (error) {
        console.error('List available exams error:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Start an exam instance
// @route   POST /api/student/exams/:examId/start
// @access  Private/Student
export const startExam = async (req, res) => {
    const { examId } = req.params;
    const studentId = req.user._id;

    let exam; // Declare exam at the top so it's available in catch block

    try {
        // 1. Authorization & Validity Checks
        exam = await Exam.findById(examId).populate('questions');
        if (!exam || exam.status !== 'active') {
            return res.status(404).json({ message: 'Exam not found or not currently active.' });
        }
        
        // Check if student is enrolled in the unit
        const profile = await StudentProfile.findOne({ user: studentId });
        if (!profile || !profile.unitsEnrolled.includes(exam.unit)) {
             return res.status(403).json({ message: 'You are not enrolled in the unit for this exam.' });
        }

        // Check time constraints
        const now = new Date();
        if (exam.scheduledStart > now || (exam.scheduledEnd && exam.scheduledEnd < now)) {
            return res.status(400).json({ message: 'Exam is not currently available.' });
        }
        
        // Check attempt constraints
        const existingResults = await Result.countDocuments({ student: studentId, exam: exam._id });
        if (existingResults > 0 && !exam.allowMultipleAttempts) {
             return res.status(403).json({ message: 'You have already completed this exam and multiple attempts are not allowed.' });
        }

        // Check for existing active attempt
        let existingAttempt = await StudentExamAttempt.findOne({
            student: studentId,
            exam: examId,
            status: { $in: ['not_started', 'in_progress'] }
        });

        if (existingAttempt) {
            // Resume existing attempt
            const timeElapsed = Math.floor((now - existingAttempt.startTime) / 1000);
            const timeRemaining = (exam.durationMinutes * 60) - timeElapsed;
            
            if (timeRemaining <= 0) {
                // Auto-submit if time expired
                existingAttempt.status = 'submitted';
                existingAttempt.endTime = now;
                existingAttempt.timeRemaining = 0;
                await existingAttempt.save();
                return res.status(400).json({ message: 'Exam time has expired.' });
            }

            // Update the existing attempt
            existingAttempt.timeRemaining = timeRemaining;
            existingAttempt.status = 'in_progress';
            await existingAttempt.save();

            // Get existing answers as a simple object for frontend
            const existingAnswers = {};
            existingAttempt.answers.forEach(answer => {
                if (answer.selectedOptionIndex !== null && answer.selectedOptionIndex !== undefined) {
                    existingAnswers[answer.question.toString()] = answer.selectedOptionIndex;
                }
            });

            return res.status(200).json({
                message: 'Resuming exam attempt',
                attemptId: existingAttempt._id,
                examDetails: {
                    id: exam._id,
                    name: exam.name,
                    durationMinutes: exam.durationMinutes,
                    totalQuestions: exam.questions.length,
                },
                timeRemaining: timeRemaining,
                existingAnswers: existingAnswers
            });
        }

        // 2. Sanitize Questions (CRITICAL SECURITY STEP)
        let questions = exam.questions.map(q => {
            // Remove correct answers and creator/unit IDs before sending to student
            const safeQuestion = q.toObject();
            delete safeQuestion.correctAnswerIndex;
            delete safeQuestion.teacher;
            delete safeQuestion.unit;
            
            // For MCQ: shuffle options if exam is randomized
            if (safeQuestion.questionType === 'MCQ' && safeQuestion.options && exam.isRandomized) {
                safeQuestion.options = shuffleArray(safeQuestion.options);
            }
            return safeQuestion;
        });

        // 3. Randomize question order if configured
        if (exam.isRandomized) {
            questions = shuffleArray(questions);
        }
        
        // 4. Create new StudentExamAttempt for real-time tracking
        // Use regular create and handle duplicate key error
        try {
            const newAttempt = await StudentExamAttempt.create({
                student: studentId,
                exam: examId,
                unit: exam.unit,
                status: 'in_progress',
                startTime: now,
                timeRemaining: exam.durationMinutes * 60,
                totalPossibleScore: exam.totalMarks,
                answers: questions.map(question => ({
                    question: question._id
                }))
            });

            res.status(200).json({
                message: 'Exam started successfully',
                attemptId: newAttempt._id,
                examDetails: {
                    id: exam._id,
                    name: exam.name,
                    durationMinutes: exam.durationMinutes,
                    totalQuestions: questions.length,
                },
                questions: questions,
                startTime: now,
                timeRemaining: exam.durationMinutes * 60
            });

        } catch (createError) {
            // Handle duplicate key error - this means another attempt was created concurrently
            if (createError.code === 11000) {
                // Find the existing attempt that was just created
                const existingAttempt = await StudentExamAttempt.findOne({
                    student: studentId,
                    exam: examId,
                    status: { $in: ['not_started', 'in_progress'] }
                });

                if (existingAttempt) {
                    // Get existing answers as a simple object for frontend
                    const existingAnswers = {};
                    existingAttempt.answers.forEach(answer => {
                        if (answer.selectedOptionIndex !== null && answer.selectedOptionIndex !== undefined) {
                            existingAnswers[answer.question.toString()] = answer.selectedOptionIndex;
                        }
                    });

                    return res.status(200).json({
                        message: 'Exam started successfully (recovered from race condition)',
                        attemptId: existingAttempt._id,
                        examDetails: {
                            id: exam._id,
                            name: exam.name,
                            durationMinutes: exam.durationMinutes,
                            totalQuestions: questions.length,
                        },
                        questions: questions,
                        startTime: existingAttempt.startTime,
                        timeRemaining: existingAttempt.timeRemaining,
                        existingAnswers: existingAnswers
                    });
                } else {
                    throw new Error('Race condition occurred but could not find existing attempt');
                }
            } else {
                throw createError;
            }
        }

    } catch (error) {
        console.error('Start exam error:', error);
        
        // Handle specific MongoDB errors
        if (error.code === 11000) {
            // Final fallback - try to find ANY existing attempt
            const existingAttempt = await StudentExamAttempt.findOne({
                student: studentId,
                exam: examId
            });
            
            if (existingAttempt && exam) { // Added check for exam existence
                // Get existing answers as a simple object for frontend
                const existingAnswers = {};
                existingAttempt.answers.forEach(answer => {
                    if (answer.selectedOptionIndex !== null && answer.selectedOptionIndex !== undefined) {
                        existingAnswers[answer.question.toString()] = answer.selectedOptionIndex;
                    }
                });

                return res.status(200).json({
                    message: 'Exam started successfully (final recovery)',
                    attemptId: existingAttempt._id,
                    examDetails: {
                        id: exam._id,
                        name: exam.name,
                        durationMinutes: exam.durationMinutes,
                        totalQuestions: exam.questions?.length || 0,
                    },
                    questions: exam?.questions ? exam.questions.map(q => {
                        const safeQuestion = q.toObject();
                        delete safeQuestion.correctAnswerIndex;
                        delete safeQuestion.teacher;
                        delete safeQuestion.unit;
                        return safeQuestion;
                    }) : [],
                    startTime: existingAttempt.startTime,
                    timeRemaining: existingAttempt.timeRemaining,
                    existingAnswers: existingAnswers
                });
            }
        }
        
        res.status(500).json({ 
            message: error.message || 'Failed to start exam',
            errorCode: error.code
        });
    }
};

// @desc    Save student answer during exam (REAL-TIME)
// @route   PUT /api/student/attempts/:attemptId/answer
// @access  Private/Student
export const saveAnswer = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { questionId, selectedOptionIndex, isFlagged } = req.body;
    const studentId = req.user._id;

    const attempt = await StudentExamAttempt.findOne({
      _id: attemptId,
      student: studentId,
      status: 'in_progress'
    });

    if (!attempt) {
      return res.status(404).json({ message: 'Active exam attempt not found.' });
    }

    // Update time remaining based on current time
    const now = new Date();
    const timeElapsed = Math.floor((now - attempt.startTime) / 1000);
    const examDuration = attempt.timeRemaining || (await Exam.findById(attempt.exam)).durationMinutes * 60;
    const timeRemaining = Math.max(0, examDuration - timeElapsed);
    
    attempt.timeRemaining = timeRemaining;

    // Update or add answer
    const answerIndex = attempt.answers.findIndex(
      answer => answer.question.toString() === questionId
    );

    if (answerIndex >= 0) {
      attempt.answers[answerIndex].selectedOptionIndex = selectedOptionIndex;
      attempt.answers[answerIndex].answeredAt = new Date();
      attempt.answers[answerIndex].isFlagged = isFlagged || false;
    } else {
      attempt.answers.push({
        question: questionId,
        selectedOptionIndex: selectedOptionIndex,
        answeredAt: new Date(),
        isFlagged: isFlagged || false
      });
    }

    // Use findOneAndUpdate to avoid version conflicts
    const updatedAttempt = await StudentExamAttempt.findOneAndUpdate(
      { _id: attemptId, student: studentId },
      { 
        $set: { 
          timeRemaining: timeRemaining,
          answers: attempt.answers
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedAttempt) {
      return res.status(404).json({ message: 'Failed to save answer. Attempt not found.' });
    }

    res.status(200).json({
      message: 'Answer saved successfully',
      answeredAt: new Date(),
      timeRemaining: timeRemaining
    });

  } catch (error) {
    console.error('Save answer error:', error);
    
    if (error.name === 'VersionError') {
      res.status(409).json({ 
        message: 'Save conflicted. Please try again.',
        retry: true
      });
    } else {
      res.status(500).json({ message: 'Failed to save answer: ' + error.message });
    }
  }
};

// @desc    Record violation during exam
// @route   POST /api/student/attempts/:attemptId/violation
// @access  Private/Student
export const recordViolation = async (req, res) => {
  try {
    const { attemptId } = req.params;
    const { type, details } = req.body;
    const studentId = req.user._id;

    // Normalize violation type to match enum values
    const normalizedType = type.toLowerCase().replace(' ', '_');
    
    // Use findOneAndUpdate to avoid version conflicts
    const updatedAttempt = await StudentExamAttempt.findOneAndUpdate(
      {
        _id: attemptId,
        student: studentId,
        status: 'in_progress'
      },
      {
        $inc: { violationCount: 1 },
        $push: {
          violations: {
            type: normalizedType,
            timestamp: new Date(),
            details: details || ''
          }
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedAttempt) {
      return res.status(404).json({ message: 'Active exam attempt not found.' });
    }

    let response = {
      message: 'Violation recorded',
      violationCount: updatedAttempt.violationCount,
      status: updatedAttempt.status
    };

    // Auto-submit after 3 violations
    if (updatedAttempt.violationCount >= 3) {
      await StudentExamAttempt.findOneAndUpdate(
        { _id: attemptId },
        { 
          $set: { 
            status: 'violation',
            endTime: new Date()
          }
        }
      );
      response.status = 'violation';
      response.message = 'Exam automatically submitted due to multiple violations.';
    }

    res.status(200).json(response);

  } catch (error) {
    console.error('Record violation error:', error);
    
    if (error.name === 'ValidationError') {
      res.status(400).json({ 
        message: 'Invalid violation type.',
        error: error.message 
      });
    } else {
      res.status(500).json({ 
        message: 'Failed to record violation: ' + error.message 
      });
    }
  }
};

// @desc    Submit student's answers for grading
// @route   POST /api/student/exams/:attemptId/submit
// @access  Private/Student
export const submitExam = async (req, res) => {
  const { attemptId } = req.params;
  const studentId = req.user._id;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Fetch the attempt with session for transaction
    const attempt = await StudentExamAttempt.findOne({
      _id: attemptId,
      student: studentId,
      status: 'in_progress'
    }).session(session);

    if (!attempt) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: 'Active exam attempt not found or already submitted.' });
    }

    // 2. Immediately update status to prevent concurrent submissions
    // attempt.status = 'submitting';
    // await attempt.save({ session });

    // 3. Fetch the corresponding Exam and all Questions
    const exam = await Exam.findById(attempt.exam)
      .populate('questions')
      .session(session);
    
    if (!exam) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Corresponding exam not found.' });
    }
    
    // 4. Automated Grading Process
    let finalScore = 0;
    const questionResults = [];

    // Map exam questions for quick lookup
    const questionsMap = new Map(exam.questions.map(q => [q._id.toString(), q]));
    
    for (const studentAnswer of attempt.answers) {
      const questionId = studentAnswer.question.toString();
      const selectedOptionIndex = studentAnswer.selectedOptionIndex;
      const question = questionsMap.get(questionId);

      if (!question) continue;

      let isCorrect = false;
      let pointsAwarded = 0;

      if (selectedOptionIndex !== null && selectedOptionIndex !== undefined && 
          selectedOptionIndex === question.correctAnswerIndex) {
        isCorrect = true;
        pointsAwarded = question.points || 1; // Default to 1 point if not specified
        finalScore += pointsAwarded;
      }

      const timeSpent = studentAnswer.answeredAt ? 
        Math.floor((studentAnswer.answeredAt - attempt.startTime) / 1000) : 0;

      questionResults.push({
        question: questionId,
        selectedOptionIndex: selectedOptionIndex,
        correctOptionIndex: question.correctAnswerIndex,
        isCorrect: isCorrect,
        pointsAwarded: pointsAwarded,
        timeSpent: timeSpent
      });
    }
    
    // 5. Update the StudentExamAttempt with results
    attempt.status = 'submitted';
    attempt.endTime = new Date();
    attempt.score = finalScore;
    attempt.percentage = exam.totalMarks > 0 ? (finalScore / exam.totalMarks) * 100 : 0;
    attempt.questionResults = questionResults;
    attempt.gradedAt = new Date();
    
    await attempt.save({ session });

    // 6. Create final Result record
    const attemptCount = await Result.countDocuments({ 
      student: studentId, 
      exam: attempt.exam 
    }).session(session);

    await Result.create([{
      student: studentId,
      exam: attempt.exam,
      unit: attempt.unit,
      score: finalScore,
      totalMarks: exam.totalMarks,
      percentage: attempt.percentage,
      startTime: attempt.startTime,
      endTime: attempt.endTime,
      attemptNumber: attemptCount + 1,
      responses: questionResults,
      violationCount: attempt.violationCount,
      resultsReleased: false
    }], { session });

    // 7. Commit transaction
    await session.commitTransaction();
    session.endSession();

    // 8. Return success message
    res.status(200).json({
      message: 'Exam submitted successfully! Your results will be available once released by your teacher.',
      success: true
    });

  } catch (error) {
    // 9. Abort transaction on error
    await session.abortTransaction();
    session.endSession();
    
    console.error('Submit exam error:', error);
    
    // Handle specific error types
    if (error.name === 'VersionError') {
      res.status(409).json({ 
        message: 'Exam submission conflicted with another operation. Please try again.',
        success: false,
        retry: true
      });
    } else {
      res.status(500).json({ 
        message: `Submission failed: ${error.message}`,
        success: false
      });
    }
  }
};

// @desc    Get exam attempt details
// @route   GET /api/student/attempts/:attemptId
// @access  Private/Student
export const getExamAttempt = async (req, res) => {
    try {
        const { attemptId } = req.params;
        const studentId = req.user._id;

        const attempt = await StudentExamAttempt.findOne({
            _id: attemptId,
            student: studentId
        }).populate('exam', 'name durationMinutes totalMarks');

        if (!attempt) {
            return res.status(404).json({ message: 'Exam attempt not found.' });
        }

        res.status(200).json({
            attempt: attempt,
            exam: attempt.exam
        });

    } catch (error) {
        console.error('Get exam attempt error:', error);
        res.status(500).json({ message: 'Failed to fetch exam attempt: ' + error.message });
    }
};

// @desc    Get exam details for student (without sensitive information)
// @route   GET /api/student/exams/:examId/details
// @access  Private/Student
export const getExamDetails = async (req, res) => {
    const { examId } = req.params;
    const studentId = req.user._id;

    console.log('🔍 getExamDetails called - examId:', examId);
    console.log('🔍 User ID:', studentId);

    // Validate examId format
    if (!mongoose.Types.ObjectId.isValid(examId)) {
        return res.status(400).json({ message: 'Invalid exam ID format.' });
    }

    try {
        // 1. Authorization & Validity Checks
        const exam = await Exam.findById(examId)
            .populate('unit', 'name code')
            .select('name durationMinutes totalMarks questions allowMultipleAttempts unit scheduledStart scheduledEnd status');
        
        console.log('🔍 Exam found:', exam ? {
            id: exam._id,
            name: exam.name,
            status: exam.status,
            unit: exam.unit
        } : 'NOT FOUND');
        
        if (!exam || exam.status !== 'active') {
            return res.status(404).json({ message: 'Exam not found or not currently active.' });
        }
        
        // Check if student is enrolled in the unit
        const profile = await StudentProfile.findOne({ user: studentId });
        console.log('🔍 Student profile:', profile ? {
            userId: profile.user,
            enrolledUnits: profile.unitsEnrolled
        } : 'NOT FOUND');
        
        if (!profile) {
            return res.status(403).json({ message: 'Student profile not found.' });
        }

        const isEnrolled = profile.unitsEnrolled.includes(exam.unit._id);
        console.log('🔍 Enrollment check:', {
            examUnit: exam.unit._id,
            enrolledUnits: profile.unitsEnrolled.map(u => u.toString()),
            isEnrolled: isEnrolled
        });

        if (!isEnrolled) {
            return res.status(403).json({ 
                message: 'You are not enrolled in the unit for this exam.',
                details: {
                    examUnit: exam.unit._id,
                    yourUnits: profile.unitsEnrolled
                }
            });
        }

        // Check time constraints
        const now = new Date();
        console.log('🔍 Time check:', {
            now: now,
            scheduledStart: exam.scheduledStart,
            scheduledEnd: exam.scheduledEnd,
            isBeforeStart: exam.scheduledStart > now,
            isAfterEnd: exam.scheduledEnd && exam.scheduledEnd < now
        });

        if (exam.scheduledStart > now) {
            return res.status(400).json({ 
                message: 'Exam has not started yet.',
                scheduledStart: exam.scheduledStart
            });
        }

        if (exam.scheduledEnd && exam.scheduledEnd < now) {
            return res.status(400).json({ 
                message: 'Exam has already ended.',
                scheduledEnd: exam.scheduledEnd
            });
        }

        // Return safe exam details (without questions or answers)
        const safeExamDetails = {
            _id: exam._id,
            name: exam.name,
            durationMinutes: exam.durationMinutes,
            totalMarks: exam.totalMarks,
            totalQuestions: exam.questions?.length || 0,
            allowMultipleAttempts: exam.allowMultipleAttempts,
            unit: exam.unit,
            scheduledStart: exam.scheduledStart,
            scheduledEnd: exam.scheduledEnd
        };

        console.log('✅ Returning exam details:', safeExamDetails);
        res.status(200).json(safeExamDetails);

    } catch (error) {
        console.error('❌ Get exam details error:', error);
        res.status(500).json({ message: 'Failed to fetch exam details: ' + error.message });
    }
};