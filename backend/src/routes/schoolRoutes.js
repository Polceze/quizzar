import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { 
  createSchool, 
  getSchools, 
  joinSchool, 
  getAdminSchool,
  createSchoolWithAdmin,
  deleteSchool
} from '../controllers/schoolController.js';
import schoolAdminRoutes from './schoolAdminRoutes.js';

const router = express.Router();

// Public route - get all schools
router.get('/', getSchools);
router.post('/create-with-admin', createSchoolWithAdmin);

// Protected routes
router.use(protect);
router.post('/', createSchool);
router.post('/:schoolId/join', joinSchool);

// Admin only routes
router.use('/', restrictTo('admin'), schoolAdminRoutes);
router.get('/admin', restrictTo('admin'), getAdminSchool);
router.delete('/:schoolId', protect, restrictTo('admin'), deleteSchool);

export default router;