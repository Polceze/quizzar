import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { 
  manageTeacher, 
  removeStudent, 
  getSchoolStats 
} from '../controllers/schoolAdminController.js';

const router = express.Router();

// All routes are protected and restricted to admin only
router.use(protect, restrictTo('admin'));

router.put('/teachers/:teacherId', manageTeacher);
router.delete('/students/:studentId', removeStudent);
router.get('/admin/stats', getSchoolStats);

export default router;