import Question from '../models/Question.js';
import Unit from '../models/Unit.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Google Gemini
const genAI = new GoogleGenerativeAI("AIzaSyDxfVTitxiKBQWSN1sDjkpaWyyAEXv_0UQ");

// @desc    Generate questions using Google Gemini AI
// @route   POST /api/ai/generate-questions
// @access  Private/Teacher
export const generateQuestions = async (req, res) => {
  try {
    console.log('🔍 Received AI generation request body:', req.body);
    
    const { studyMaterial, mcqCount, tfCount, difficulty, unitId } = req.body;
    const teacherId = req.user._id;

    // Validate input
    if (!studyMaterial || !studyMaterial.trim()) {
      return res.status(400).json({ 
        message: 'Study material is required to generate questions.' 
      });
    }

    // Parse counts as integers
    const finalMcqCount = parseInt(mcqCount) || 0;
    const finalTfCount = parseInt(tfCount) || 0;
    const finalDifficulty = difficulty || 'medium';

    const totalQuestions = finalMcqCount + finalTfCount;
    
    console.log(`📊 Question counts - MCQ: ${finalMcqCount}, TF: ${finalTfCount}, Total: ${totalQuestions}`);

    if (totalQuestions === 0) {
      return res.status(400).json({ 
        message: 'Please specify at least one question to generate (MCQ or T/F).' 
      });
    }

    if (totalQuestions > 20) {
      return res.status(400).json({ 
        message: 'Maximum 20 questions can be generated at once.' 
      });
    }

    // Generate questions using Google Gemini
    console.log('🚀 Starting AI question generation...');
    const generatedQuestions = await generateQuestionsWithGemini(
      studyMaterial,
      finalMcqCount,
      finalTfCount,
      finalDifficulty
    );

    console.log(`✅ Generated ${generatedQuestions.length} questions`);

    // Check if we got enough questions
    const expectedTotal = finalMcqCount + finalTfCount;
    if (generatedQuestions.length < expectedTotal) {
      return res.status(400).json({ 
        message: `AI could only generate ${generatedQuestions.length} out of ${expectedTotal} requested questions. Please try again with different study material.`,
        questions: []
      });
    }

    // Transform to match Question schema and save to database
    const savedQuestions = [];
    
    for (const question of generatedQuestions) {
      const baseQuestion = {
        text: question.text,
        points: question.points || 2,
        teacher: teacherId,
        unit: unitId,
        isAIGenerated: true,
        aiModelUsed: 'Google Gemini',
        aiGenerationNotes: studyMaterial.substring(0, 200) + (studyMaterial.length > 200 ? '...' : '')
      };

      let questionData;

      if (question.questionType === 'multiple-choice') {
        questionData = {
          ...baseQuestion,
          questionType: 'MCQ',
          options: question.options.map(opt => ({ text: opt })),
          correctAnswerIndex: question.correctOption
        };
      } else {
        // True/False question
        questionData = {
          ...baseQuestion,
          questionType: 'T/F',
          options: [
            { text: 'True' },
            { text: 'False' }
          ],
          correctAnswerIndex: question.correctAnswer ? 0 : 1 // 0 = True, 1 = False
        };
      }

      // Save question to database
      const savedQuestion = await Question.create(questionData);
      
      // Update the parent Unit
      await Unit.findByIdAndUpdate(unitId, {
        $push: { questions: savedQuestion._id }
      });

      savedQuestions.push(savedQuestion);
    }

    res.status(200).json({ 
      message: `${savedQuestions.length} questions generated and saved successfully!`,
      questions: savedQuestions,
      count: savedQuestions.length
    });

  } catch (error) {
    console.error('❌ AI generation error:', error);
    res.status(500).json({ message: 'Failed to generate questions: ' + error.message });
  }
};

// Generate questions using Google Gemini
const generateQuestionsWithGemini = async (studyMaterial, mcqCount, tfCount, difficulty) => {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-001" });

    const prompt = createGenerationPrompt(studyMaterial, mcqCount, tfCount, difficulty);
    
    console.log('📝 Sending prompt to Gemini...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('📨 Received response from Gemini');
    return parseGeminiResponse(text, mcqCount, tfCount);
  } catch (error) {
    console.error('❌ Google Gemini API error:', error);
    throw new Error('AI service is currently unavailable. Please try again later.');
  }
};

const createGenerationPrompt = (studyMaterial, mcqCount, tfCount, difficulty) => {
  const questionTypes = [];
  if (mcqCount > 0) {
    questionTypes.push(`${mcqCount} multiple-choice questions`);
  }
  if (tfCount > 0) {
    questionTypes.push(`${tfCount} true/false questions`);
  }

  const questionTypeText = questionTypes.join(' and ');

  return `
You are an expert educational content creator. Generate ${questionTypeText} based on the following learning materials.

LEARNING MATERIALS:
${studyMaterial}

CRITICAL INSTRUCTIONS:
- For MULTIPLE CHOICE questions: Create questions with "Which of the following..." format and provide 4 options
- For TRUE/FALSE questions: Create clear statements that can be definitively judged as true or false based on the materials

REQUIREMENTS:
- Difficulty level: ${difficulty}
- Questions should test understanding of key concepts from the materials
- Make questions clear and unambiguous

FORMAT FOR MULTIPLE CHOICE QUESTIONS:
[MCQ]
Q: [question text in "Which of the following..." format]
A) [option A]
B) [option B]
C) [option C]
D) [option D]
Correct: [A/B/C/D]
Points: [1-3 based on difficulty]
Explanation: [brief explanation why this is correct]
[/MCQ]

FORMAT FOR TRUE/FALSE QUESTIONS:
[TF]
Q: [clear statement that is either true or false, NOT a question]
Correct: [True/False]
Points: [1-3 based on difficulty]
Explanation: [brief explanation why this is correct/incorrect]
[/TF]

EXAMPLES OF GOOD TRUE/FALSE QUESTIONS:
- "DNA is composed of amino acids." (False)
- "Humans have 46 chromosomes." (True)
- "RNA contains thymine as one of its bases." (False)

Return exactly the specified number of questions in the format above. Do not include any additional commentary or text outside the specified format.
`;
};

const parseGeminiResponse = (text, expectedMCQCount, expectedTFCount) => {
  const questions = [];
  
  // Split by question blocks
  const mcqBlocks = text.split('[MCQ]');
  const tfBlocks = text.split('[TF]');
  
  let mcqCount = 0;
  let tfCount = 0;

  // Parse MCQ questions
  for (const block of mcqBlocks) {
    if (mcqCount >= expectedMCQCount) break;
    
    const lines = block.split('\n').filter(line => line.trim() && !line.includes('[/MCQ]'));
    let currentQuestion = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('Q:')) {
        if (currentQuestion) {
          questions.push(currentQuestion);
          mcqCount++;
        }
        currentQuestion = {
          text: trimmedLine.substring(2).trim(),
          questionType: 'multiple-choice',
          options: [],
          points: 1, // default
          difficulty: 'medium'
        };
      } 
      else if (trimmedLine.match(/^[A-D]\)/)) {
        if (currentQuestion?.options) {
          currentQuestion.options.push(trimmedLine.substring(3).trim());
        }
      }
      else if (trimmedLine.startsWith('Correct:')) {
        const correct = trimmedLine.substring(8).trim();
        if (currentQuestion) {
          currentQuestion.correctOption = ['A', 'B', 'C', 'D'].indexOf(correct);
        }
      }
      else if (trimmedLine.startsWith('Points:')) {
        if (currentQuestion) {
          currentQuestion.points = parseInt(trimmedLine.substring(7).trim()) || 2;
        }
      }
      else if (trimmedLine.startsWith('Explanation:')) {
        if (currentQuestion) {
          currentQuestion.explanation = trimmedLine.substring(12).trim();
        }
      }
    }
    
    if (currentQuestion && currentQuestion.text && currentQuestion.options?.length === 4) {
      questions.push(currentQuestion);
      mcqCount++;
    }
  }

  // Parse T/F questions
  for (const block of tfBlocks) {
    if (tfCount >= expectedTFCount) break;
    
    const lines = block.split('\n').filter(line => line.trim() && !line.includes('[/TF]'));
    let currentQuestion = null;
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      
      if (trimmedLine.startsWith('Q:')) {
        if (currentQuestion) {
          questions.push(currentQuestion);
          tfCount++;
        }
        currentQuestion = {
          text: trimmedLine.substring(2).trim(),
          questionType: 'true-false',
          points: 1, // default
          difficulty: 'medium'
        };
      }
      else if (trimmedLine.startsWith('Correct:')) {
        const correct = trimmedLine.substring(8).trim();
        if (currentQuestion) {
          currentQuestion.correctAnswer = correct.toLowerCase() === 'true';
        }
      }
      else if (trimmedLine.startsWith('Points:')) {
        if (currentQuestion) {
          currentQuestion.points = parseInt(trimmedLine.substring(7).trim()) || 1;
        }
      }
      else if (trimmedLine.startsWith('Explanation:')) {
        if (currentQuestion) {
          currentQuestion.explanation = trimmedLine.substring(12).trim();
        }
      }
    }
    
    if (currentQuestion && currentQuestion.text && currentQuestion.correctAnswer !== undefined) {
      questions.push(currentQuestion);
      tfCount++;
    }
  }

  return questions;
};