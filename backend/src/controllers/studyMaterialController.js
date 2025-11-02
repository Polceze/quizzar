import AIService from '../services/aiService.js';
import * as pdfParse from 'pdf-parse';
import multer from 'multer';
import path from 'path';

// Configure multer for file uploads
const storage = multer.memoryStorage();
export const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.txt'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF and TXT files are allowed'), false);
    }
  }
});

// @desc    Test Gemini API connection
// @route   GET /api/ai/test
// @access  Private/Teacher
export const testAIConnection = async (req, res) => {
  try {
    const result = await AIService.testConnection();
    
    if (result.success) {
      res.status(200).json({ message: result.message });
    } else {
      res.status(500).json({ message: result.message });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Extract text from uploaded study material
// @route   POST /api/study-material/extract
// @access  Private/Teacher
export const extractStudyMaterial = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let extractedText = '';

    if (req.file.mimetype === 'application/pdf') {
      // Extract text from PDF
      const pdfData = await pdfParse(req.file.buffer);
      extractedText = pdfData.text;
      
      if (!extractedText.trim()) {
        return res.status(400).json({ message: 'No readable text found in PDF' });
      }
    } else if (req.file.mimetype === 'text/plain') {
      // Extract text from TXT
      extractedText = req.file.buffer.toString('utf8');
    }

    // Clean and limit text length (Gemini has token limits)
    const cleanedText = extractedText
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 10000); // Limit to ~10k characters

    res.status(200).json({
      message: 'Text extracted successfully',
      extractedText: cleanedText,
      characterCount: cleanedText.length
    });

  } catch (error) {
    console.error('Text extraction error:', error);
    res.status(500).json({ message: `Text extraction failed: ${error.message}` });
  }
};

// @desc    Generate questions from study material
// @route   POST /api/ai/generate-questions
// @access  Private/Teacher
export const generateQuestions = async (req, res) => {
  try {
    const { studyMaterial, specifications } = req.body;

    if (!studyMaterial || !studyMaterial.trim()) {
      return res.status(400).json({ message: 'Study material is required' });
    }

    if (!specifications || !specifications.numQuestions || !specifications.questionTypes) {
      return res.status(400).json({ message: 'Question specifications are required' });
    }

    // Validate specifications - ONLY allow MCQ and True/False
    const validQuestionTypes = ['multiple_choice', 'true_false'];
    const questionTypes = specifications.questionTypes.filter(type => 
      validQuestionTypes.includes(type)
    );

    if (questionTypes.length === 0) {
      return res.status(400).json({ 
        message: 'Please select at least one question type: Multiple Choice or True/False' 
      });
    }

    const finalSpecifications = {
      numQuestions: Math.min(specifications.numQuestions, 20), // Limit to 20 questions
      questionTypes: questionTypes,
      difficulty: specifications.difficulty || 'medium'
    };

    const generatedQuestions = await AIService.generateQuestions(
      studyMaterial, 
      finalSpecifications
    );

    res.status(200).json({
      message: 'Questions generated successfully',
      questions: generatedQuestions,
      count: generatedQuestions.length
    });

  } catch (error) {
    console.error('Question generation error:', error);
    
    if (error.message.includes('API key') || error.message.includes('quota')) {
      res.status(503).json({ 
        message: 'AI service temporarily unavailable. Please try again later.' 
      });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
};