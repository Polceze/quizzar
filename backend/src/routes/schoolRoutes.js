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

// Test route to check database connection
router.get('/test', async (req, res) => {
  try {
    const schoolCount = await School.countDocuments();
    res.status(200).json({ 
      message: 'Database connection successful',
      schoolCount 
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ 
      message: 'Database connection failed',
      error: error.message 
    });
  }
});

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