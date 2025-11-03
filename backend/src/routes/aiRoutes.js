import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { generateQuestions } from '../controllers/aiController.js';

const router = express.Router();

router.post('/generate-questions', protect, restrictTo('teacher'), generateQuestions);

export default router;