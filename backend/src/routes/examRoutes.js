import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { 
    createExam, 
    getExamsByUnit, 
    getExamById, 
    updateExam,
    getTeacherExams,
    deleteExam
} from '../controllers/examController.js';

const router = express.Router();

// All exam routes are restricted to teachers
const teacherOnly = [protect, restrictTo('teacher')];

// Create Exam
router.route('/')
    .post(teacherOnly, createExam)
    .get(teacherOnly, getTeacherExams);

// Get Exams by Unit
router.route('/unit/:unitId')
    .get(teacherOnly, getExamsByUnit);

// Get single Exam, Update Exam
router.route('/:examId')
    .get(teacherOnly, getExamById)
    .put(teacherOnly, updateExam)
    .delete(teacherOnly, deleteExam);

export default router;