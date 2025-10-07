import Exam from '../models/Exam.js';
import User from '../models/User.js';
import Result from '../models/Result.js';
import StudentProfile from '../models/StudentProfile.js';
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
        .select('title unit durationMinutes totalMarks allowMultipleAttempts');
        
        // 3. Check for previous attempts for each exam
        const examsWithAttempts = await Promise.all(availableExams.map(async (exam) => {
            const attempts = await Result.countDocuments({ student: studentId, exam: exam._id });
            return {
                ...exam.toObject(),
                attemptsMade: attempts,
                isAllowed: exam.allowMultipleAttempts || attempts === 0,
            };
        }));

        res.status(200).json(examsWithAttempts.filter(exam => exam.isAllowed));

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Start an exam instance
// @route   GET /api/student/exams/:examId/start
// @access  Private/Student
export const startExam = async (req, res) => {
    const { examId } = req.params;
    const studentId = req.user._id;

    try {
        // 1. Authorization & Validity Checks
        const exam = await Exam.findById(examId).populate('questions');
        if (!exam || exam.status !== 'active') {
            return res.status(404).json({ message: 'Exam not found or not currently active.' });
        }
        
        // Check if student is enrolled in the unit (requires joining Unit model, but for simplicity, check profile)
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
        const existingAttempts = await Result.countDocuments({ student: studentId, exam: exam._id });
        if (existingAttempts > 0 && !exam.allowMultipleAttempts) {
             return res.status(403).json({ message: 'You have already completed this exam and multiple attempts are not allowed.' });
        }
        
        // 2. Sanitize Questions (CRITICAL SECURITY STEP)
        let questions = exam.questions.map(q => {
            // Remove correct answers and creator/unit IDs before sending to student
            const safeQuestion = q.toObject();
            delete safeQuestion.correctAnswer;
            delete safeQuestion.creator;
            delete safeQuestion.unit;
            
            // For MCQ: shuffle options if configured, but remove isCorrect field
            if (safeQuestion.questionType === 'MCQ' && safeQuestion.options) {
                safeQuestion.options = safeQuestion.options.map(opt => {
                    delete opt.isCorrect;
                    return opt;
                });
            }
            return safeQuestion;
        });

        // 3. Randomization
        if (exam.isRandomized) {
            questions = shuffleArray(questions);
        }
        
        // 4. Record the start time (Create a new Result document in PENDING state)
        const newAttempt = await Result.create({
            student: studentId,
            exam: examId,
            unit: exam.unit,
            score: 0,
            totalMarks: exam.totalMarks,
            startTime: now,
            attemptNumber: existingAttempts + 1,
            // responses array will be empty initially
        });

        res.status(200).json({
            examDetails: {
                id: exam._id,
                title: exam.title,
                durationMinutes: exam.durationMinutes,
                totalQuestions: questions.length,
            },
            attemptId: newAttempt._id, // Send the new attempt ID for submission
            questions: questions, // Send the sanitized questions
            startTime: now,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Helper function to compare student answer with correct answer
const checkAnswer = (question, studentAnswer) => {
    const { questionType, correctAnswer, options } = question;
    let isCorrect = false;
    let marksAwarded = 0; // Default to 0 marks

    // Simple grading logic (1 point per correct answer)
    if (questionType === 'MCQ') {
        // Find the option the student selected
        const selectedOption = options.find(opt => opt._id.toString() === studentAnswer);
        if (selectedOption && selectedOption.isCorrect) {
            isCorrect = true;
            marksAwarded = 1;
        }
    } else if (questionType === 'TrueFalse') {
        // Compare boolean string/value
        const correctBool = String(correctAnswer).toLowerCase();
        const studentBool = String(studentAnswer).toLowerCase();
        if (correctBool === studentBool) {
            isCorrect = true;
            marksAwarded = 1;
        }
    } else if (questionType === 'FillBlank') {
        // Case-insensitive exact match for a single answer blank
        // (More complex logic for multiple blanks or partial credit would be needed in a production app)
        const correctText = String(correctAnswer).trim().toLowerCase();
        const studentText = String(studentAnswer).trim().toLowerCase();
        if (correctText === studentText) {
            isCorrect = true;
            marksAwarded = 1;
        }
    }

    return { isCorrect, marksAwarded };
};

// @desc    Submit student's answers for grading
// @route   POST /api/student/exams/:attemptId/submit
// @access  Private/Student
export const submitExam = async (req, res) => {
    const { attemptId } = req.params;
    const { studentResponses } = req.body; 
    const studentId = req.user._id;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // 1. Fetch the attempt and ensure it belongs to the student
        const attempt = await Result.findById(attemptId).session(session);

        if (!attempt || attempt.student.toString() !== studentId.toString()) {
            await session.abortTransaction();
            session.endSession();
            return res.status(403).json({ message: 'Attempt not found or unauthorized.' });
        }

        if (attempt.finishTime) {
            await session.abortTransaction();
            session.endSession();
            return res.status(400).json({ message: 'Exam has already been submitted.' });
        }

        // 2. Fetch the corresponding Exam and all Questions (including correct answers)
        const exam = await Exam.findById(attempt.exam).populate('questions').session(session);
        if (!exam) {
            await session.abortTransaction();
            session.endSession();
            return res.status(404).json({ message: 'Corresponding exam not found.' });
        }
        
        // 3. Automated Grading Process
        let finalScore = 0;
        const gradedResponses = [];

        // Map exam questions for quick lookup
        const questionsMap = new Map(exam.questions.map(q => [q._id.toString(), q]));
        
        for (const studentResponse of studentResponses) {
            const questionId = studentResponse.questionId;
            const studentAnswer = studentResponse.answer;
            const question = questionsMap.get(questionId);

            if (!question) continue; // Skip if question ID is invalid

            const { isCorrect, marksAwarded } = checkAnswer(question, studentAnswer);
            
            finalScore += marksAwarded;

            gradedResponses.push({
                question: questionId,
                answer: studentAnswer,
                isCorrect: isCorrect,
                marksAwarded: marksAwarded,
            });
        }
        
        // 4. Update the Result document
        attempt.responses = gradedResponses;
        attempt.score = finalScore;
        attempt.finishTime = new Date(); // Record submission time
        
        await attempt.save({ session });

        // 5. Commit transaction
        await session.commitTransaction();
        session.endSession();

        // 6. Return the final result to the student
        res.status(200).json({
            message: 'Exam submitted and graded successfully.',
            result: {
                attemptId: attempt._id,
                score: finalScore,
                totalMarks: attempt.totalMarks,
                finishTime: attempt.finishTime,
                // Only return general result, not the detailed responses for security/UX
            }
        });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(500).json({ message: `Submission failed: ${error.message}` });
    }
};