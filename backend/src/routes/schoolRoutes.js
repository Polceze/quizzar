import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { 
  createSchool, 
  getSchools, 
  joinSchool, 
  getAdminSchool 
} from '../controllers/schoolController.js';

const router = express.Router();

// Public route - get all schools
router.get('/', getSchools);

// Protected routes
router.use(protect);

// Create school (any authenticated user)
router.post('/', createSchool);

// Join school
router.post('/:schoolId/join', joinSchool);

// Admin only routes
router.get('/admin', restrictTo('admin'), getAdminSchool);

export default router;