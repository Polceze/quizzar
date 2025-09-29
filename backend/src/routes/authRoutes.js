import express from 'express';
// Note the curly braces for named exports
import { registerUser, loginUser } from '../controllers/authController.js'; 

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);

export default router; // Use ES Module export