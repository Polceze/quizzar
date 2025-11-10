import Question from '../models/Question.js';
import Unit from '../models/Unit.js';
import AIService from '../services/aiService.js';

// @desc    Generate questions using AI
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

    if (totalQuestions > 10) {
      return res.status(400).json({ 
        message: 'Maximum 10 questions can be generated at once.' 
      });
    }

    // Generate questions using the better AIService
    console.log('🚀 Starting AI question generation...');
    
    const questionTypes = [];
    if (finalMcqCount > 0) questionTypes.push('multiple_choice');
    if (finalTfCount > 0) questionTypes.push('true_false');

    const specifications = {
      numQuestions: totalQuestions,
      questionTypes: questionTypes,
      difficulty: finalDifficulty
    };

    const generatedQuestions = await AIService.generateQuestions(studyMaterial, specifications);

    console.log(`✅ Generated ${generatedQuestions.length} questions`);

    // Check if we got enough questions
    if (generatedQuestions.length < totalQuestions) {
      console.log(`⚠️ Got ${generatedQuestions.length} out of ${totalQuestions} questions`);
      
      if (generatedQuestions.length === 0) {
        return res.status(400).json({ 
          message: `The AI service could not generate any questions from the provided material. Please try again with more detailed study material or adjust your question specifications.`,
          questions: []
        });
      }
      
      // If we got some questions but not all, notify the user but still save what we have
      console.log(`ℹ️ Saving ${generatedQuestions.length} available questions`);
    }

    // Transform to match Question schema and save to database
    const savedQuestions = [];
    
    for (const question of generatedQuestions) {
      const baseQuestion = {
        text: question.questionText,
        points: question.points || (finalDifficulty === 'hard' ? 3 : finalDifficulty === 'medium' ? 2 : 1),
        teacher: teacherId,
        unit: unitId,
        isAIGenerated: true,
        aiModelUsed: 'DeepSeek',
        aiGenerationNotes: `Generated from study material: ${studyMaterial.substring(0, 100)}...`
      };

      let questionData;

      if (question.questionType === 'multiple_choice') {
        questionData = {
          ...baseQuestion,
          questionType: 'MCQ',
          options: question.options.map(opt => ({ text: opt })),
          correctAnswerIndex: question.correctAnswer
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
          correctAnswerIndex: question.correctAnswer // 0 for True, 1 for False (as parsed by AIService)
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

    let successMessage = `${savedQuestions.length} questions generated and saved successfully!`;
    
    if (savedQuestions.length < totalQuestions) {
      successMessage += ` (Requested ${totalQuestions}, but only ${savedQuestions.length} could be generated. Please try again with more detailed material if you need more questions.)`;
    }

    res.status(200).json({ 
      message: successMessage,
      questions: savedQuestions,
      count: savedQuestions.length
    });

  } catch (error) {
    console.error('❌ AI generation error:', error);
    
    // Provide specific error messages based on the error type
    let userMessage = 'Failed to generate questions. ';
    
    if (error.message.includes('API') || error.message.includes('connection')) {
      userMessage += 'The AI service is currently unavailable. Please try again in a few moments.';
    } else if (error.message.includes('parse') || error.message.includes('JSON')) {
      userMessage += 'The AI service returned an unexpected response. Please try again with different study material.';
    } else if (error.message.includes('material') || error.message.includes('content')) {
      userMessage += 'The study material may be too brief or unclear. Please provide more detailed content and try again.';
    } else {
      userMessage += 'Please check your study material and try again. If the problem persists, try simplifying the content.';
    }
    
    res.status(500).json({ 
      message: userMessage,
      detailedError: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};