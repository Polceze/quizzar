import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { createQuestion, getQuestionsByUnit, deleteQuestion, updateQuestion } from '../controllers/questionController.js';

const router = express.Router();

// 1. POST /api/questions (Create Question)
router.route('/')
    .post(
        protect, 
        restrictTo('teacher'),
        createQuestion
    );

// 2. GET /api/questions/unit/:unitId (Get all questions for a specific unit)
router.route('/unit/:unitId')
    .get(
        protect, 
        restrictTo('teacher', 'student'), // Allow teachers (to manage) and students (to take exams/view quizzes)
        getQuestionsByUnit 
    ); 

// 3. DELETE/PUT /api/questions/:questionId (Delete and Update Question)
router.route('/:id')
    .put( 
        protect, 
        restrictTo('teacher'), 
        updateQuestion
    )
    .delete(
        protect, 
        restrictTo('teacher'), 
        deleteQuestion
    );

export default router;