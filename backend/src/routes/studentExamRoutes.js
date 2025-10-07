import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { listAvailableExams, startExam, submitExam } from '../controllers/studentExamController.js';

const router = express.Router();
const studentOnly = [protect, restrictTo('student')];

// List available exams
router.route('/exams')
    .get(studentOnly, listAvailableExams);

// Start an exam (securely)
router.route('/exams/:examId/start')
    .get(studentOnly, startExam);

// Submit and grade the exam
router.route('/exams/:attemptId/submit')
    .post(studentOnly, submitExam);
    
export default router;