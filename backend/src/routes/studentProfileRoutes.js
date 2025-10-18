import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { getStudentProfile, createOrUpdateStudentProfile } from '../controllers/studentProfileController.js';

const router = express.Router();
const studentOnly = [protect, restrictTo('student')];

// /api/student/profile routes
router.route('/profile')
    .get(studentOnly, getStudentProfile)
    .post(studentOnly, createOrUpdateStudentProfile);

export default router;