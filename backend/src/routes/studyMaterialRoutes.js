import express from 'express';
import { protect, restrictTo } from '../middleware/authMiddleware.js';
import { 
  testAIConnection,
  extractStudyMaterial,
  generateQuestions,
  upload
} from '../controllers/studyMaterialController.js';

const router = express.Router();

// All routes are protected and restricted to teachers
router.use(protect, restrictTo('teacher'));

// Test AI connection
router.get('/ai/test', testAIConnection);

// Extract text from uploaded file
router.post('/study-material/extract', upload.single('file'), extractStudyMaterial);

// Generate questions from study material
router.post('/ai/generate-questions', generateQuestions);

export default router;