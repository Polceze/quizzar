import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { 
    createUnit, 
    getTeacherUnits,
    deleteUnit,
    getUnitDetails,
    requestEnrollment,
    getPendingRequests, 
    handleEnrollmentApproval
} from '../controllers/unitController.js';

const router = express.Router();

// 1. Teacher creates and lists their units (Handles GET /api/units)
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


// 2. Student requests enrollment in a unit
router.post(
    '/request-enroll', 
    protect, 
    restrictTo('student'), 
    requestEnrollment
);

// 3. Teacher Management Routes
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

export default router;