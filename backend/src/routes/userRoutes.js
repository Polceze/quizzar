import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js'; // Import protect and restrictTo
import { 
    completeTeacherProfile, 
    completeStudentProfile,
    getProfile 
} from '../controllers/profileController.js'; // Import controllers

const router = express.Router();

// @desc    Get current logged-in user details
// @route   GET /api/users/profile
// @access  Private (requires token)
router.get('/profile', protect, (req, res) => {
  res.json({
    _id: req.user._id,
    email: req.user.email,
    role: req.user.role,
    isVerified: req.user.isVerified,
    createdAt: req.user.createdAt,
  });
});

// Profile Completion Routes (Protected)
router.post(
    '/teacher-profile', 
    protect, 
    restrictTo('teacher'), // Only teachers can access this
    completeTeacherProfile
);
router.post(
    '/student-profile', 
    protect, 
    restrictTo('student'), // Only students can access this
    completeStudentProfile
);

router.get('/profile', protect, getProfile);

export default router;