import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { 
    createUnit, 
    requestEnrollment,
    getPendingRequests, 
    handleEnrollmentApproval
} from '../controllers/unitController.js';

const router = express.Router();

// 1. Teacher creates a new unit
router.post(
    '/', 
    protect, 
    restrictTo('teacher'), 
    createUnit
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
    getPendingRequests // Fetches all requests for their units
);

router.put(
    '/requests/:requestId', 
    protect, 
    restrictTo('teacher'), 
    handleEnrollmentApproval // Approves or rejects a specific request
);

export default router;