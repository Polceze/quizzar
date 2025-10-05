import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { createQuestion, getQuestionsByUnit } from '../controllers/questionController.js';

const router = express.Router();

// All question routes are restricted to teachers
router.route('/')
    .post(protect, restrictTo('teacher'), createQuestion);

router.route('/unit/:unitId')
    .get(protect, restrictTo('teacher'), getQuestionsByUnit);

export default router;