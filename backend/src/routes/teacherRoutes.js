import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { getTeacherProfile, createOrUpdateTeacherProfile } from '../controllers/teacherProfileController.js';

const router = express.Router();

// All routes here are private and restricted to teachers
router.use(protect, restrictTo('teacher'));

// Teacher Profile Routes
router.route('/profile') 
    .get(getTeacherProfile)
    .post(createOrUpdateTeacherProfile);

export default router;