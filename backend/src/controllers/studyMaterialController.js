import AIService from '../services/aiService.js';
import multer from 'multer';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const PDFParser = require('pdf2json');
const { createWorker } = require('tesseract.js');

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

// Function to convert PDF to images and perform OCR
async function extractTextWithOCR(pdfBuffer) {  
  const worker = await createWorker('eng');
  let extractedText = '';

  try {
    // For now, we'll handle this as a simple approach
    // In a real implementation, you'd convert PDF pages to images first
    console.log('⚠️ PDF appears to be image-based. OCR required for full text extraction.');
    
    // Return a message suggesting manual input for now
    throw new Error('This PDF appears to be image-based and requires OCR. Please copy and paste the text content manually, or use a text-based PDF.');
    
  } finally {
    await worker.terminate();
  }
}

// @desc    Extract text from uploaded study material
// @route   POST /api/study-material/extract
// @access  Private/Teacher
export const extractStudyMaterial = async (req, res) => {
  try {
    console.log('📁 File upload received:', {
      file: req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : 'No file'
    });

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    let extractedText = '';

    if (req.file.mimetype === 'application/pdf') {      
      // First try standard text extraction
      try {
        extractedText = await new Promise((resolve, reject) => {
          const pdfParser = new PDFParser();
          
          pdfParser.on('pdfParser_dataError', (error) => {
            reject(new Error(`PDF parsing failed: ${error.parserError}`));
          });
          
          pdfParser.on('pdfParser_dataReady', (pdfData) => {
            try {
              const rawText = pdfParser.getRawTextContent();
              resolve(rawText || '');
            } catch (error) {
              reject(new Error(`Failed to extract text: ${error.message}`));
            }
          });

          const timeout = setTimeout(() => {
            reject(new Error('PDF parsing timeout'));
          }, 30000);

          pdfParser.on('pdfParser_dataReady', () => clearTimeout(timeout));
          pdfParser.on('pdfParser_dataError', () => clearTimeout(timeout));

          pdfParser.parseBuffer(req.file.buffer);
        });
        
        if (!extractedText.trim()) {
          // If standard extraction failed, try OCR approach
          return res.status(400).json({ 
            message: 'This PDF appears to be a scanned image or uses non-standard text encoding. Text extraction from image-based PDFs requires additional processing. Please either:\n\n1. Use a text-based PDF (where you can select and copy text)\n2. Copy and paste the text content manually\n3. Use the manual text input option instead',
            requiresManualInput: true
          });
        }
        
      } catch (error) {
        console.error('PDF extraction error:', error);
        return res.status(400).json({ 
          message: `PDF processing failed: ${error.message}. Please try using the manual text input option.`,
          requiresManualInput: true
        });
      }

    } else if (req.file.mimetype === 'text/plain') {
      extractedText = req.file.buffer.toString('utf8');
    }

    // Clean and limit text length
    const cleanedText = extractedText
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 10000);

    res.status(200).json({
      message: 'Text extracted successfully',
      extractedText: cleanedText,
      characterCount: cleanedText.length
    });

  } catch (error) {
    console.error('💥 Text extraction error:', error);
    res.status(500).json({ 
      message: `Text extraction failed: ${error.message}` 
    });
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