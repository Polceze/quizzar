import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import {
  getExamAnalytics,
  getExamDetailedAnalytics,
  getStudentPerformance,
  toggleResultsRelease,
  getUnitCompletionStatus,
} from '../controllers/teacherAnalyticsController.js';

const router = express.Router();

// All routes are restricted to teachers only
const teacherOnly = [protect, restrictTo('teacher')];

// Exam analytics routes
router.route('/exams')
  .get(teacherOnly, getExamAnalytics);

router.route('/exams/:examId')
  .get(teacherOnly, getExamDetailedAnalytics);

router.route('/exams/:examId/results-release')
  .put(teacherOnly, toggleResultsRelease);

// Student performance routes
router.route('/students')
  .get(teacherOnly, getStudentPerformance);

// Unit completion routes
router.route('/units/:unitId/completion')
  .get(teacherOnly, getUnitCompletionStatus);

export default router;