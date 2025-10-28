import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { 
  createSchool, 
  getSchools, 
  joinSchool, 
  getAdminSchool,
  createSchoolWithAdmin
} from '../controllers/schoolController.js';

const router = express.Router();

// Public route - get all schools
router.get('/', getSchools);
router.post('/create-with-admin', createSchoolWithAdmin);

// Protected routes
router.use(protect);
router.post('/', createSchool);
router.post('/:schoolId/join', joinSchool);

// Admin only routes
router.get('/admin', restrictTo('admin'), getAdminSchool);

export default router;