import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { 
    listAvailableExams, 
    startExam, 
    submitExam,
    saveAnswer,
    recordViolation,
    getExamAttempt,
    getExamDetails
} from '../controllers/studentExamController.js';

const router = express.Router();
const studentOnly = [protect, restrictTo('student')];

// List available exams
router.route('/exams')
    .get(studentOnly, listAvailableExams);

// Get exam details for instructions page
router.route('/exams/:examId/details')
    .get(studentOnly, getExamDetails);

// Start an exam (securely)
router.route('/exams/:examId/start')
    .post(studentOnly, startExam);

// Get exam attempt details
router.route('/attempts/:attemptId')
    .get(studentOnly, getExamAttempt);

// Save answer during exam
router.route('/attempts/:attemptId/answer')
    .put(studentOnly, saveAnswer);

// Record violation during exam
router.route('/attempts/:attemptId/violation')
    .post(studentOnly, recordViolation);

// Submit and grade the exam
router.route('/exams/:attemptId/submit')
    .post(studentOnly, submitExam);

export default router;