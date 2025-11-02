import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { 
    createUnit, 
    getTeacherUnits,
    deleteUnit,
    getUnitDetails,
    requestEnrollment,
    getPendingRequests, 
    handleEnrollmentApproval,
    getUnitStudents,
    removeStudentFromUnit
} from '../controllers/unitController.js';

const router = express.Router();

// Teacher creates and lists their units (Handles GET /api/units)
router.route('/')
    .post(
        protect, 
        restrictTo('teacher'), 
        createUnit
    )
    .get( 
        protect, 
        restrictTo('teacher'), // Only teachers can manage/list their units
        getTeacherUnits
    );

// Manage a single unit by ID (GET and DELETE)
router.route('/:id')
    .get( 
        protect, 
        restrictTo('teacher'), 
        getUnitDetails
    )
    .delete(
        protect, 
        restrictTo('teacher'), 
        deleteUnit
    );


// Student requests enrollment in a unit
router.post(
    '/request-enroll', 
    protect, 
    restrictTo('student'), 
    requestEnrollment
);

// Teacher Management Routes
router.get(
    '/requests/pending', 
    protect, 
    restrictTo('teacher'), 
    getPendingRequests 
);

router.put(
    '/requests/:requestId', 
    protect, 
    restrictTo('teacher'), 
    handleEnrollmentApproval 
);

router.get(
  '/:unitId/students',
  protect,
  restrictTo('teacher'),
  getUnitStudents
);

router.delete(
  '/:unitId/students/:studentId',
  protect,
  restrictTo('teacher'),
  removeStudentFromUnit
);

export default router;