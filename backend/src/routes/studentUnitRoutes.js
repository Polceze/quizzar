// Quizzar/backend/src/routes/studentUnitRoutes.js

import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { getEnrolledUnits } from '../controllers/studentUnitController.js';

const router = express.Router();
const studentOnly = [protect, restrictTo('student')];

// /api/student/units/enrolled
router.route('/units/enrolled')
    .get(studentOnly, getEnrolledUnits); // List enrolled units

export default router;