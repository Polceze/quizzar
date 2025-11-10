import Question from '../models/Question.js';
import Unit from '../models/Unit.js';
import AIService from '../services/aiService.js';

// Free AI API configuration
const AI_API_KEY = process.env.AI_API_KEY || 'free';
const AI_API_URL = 'https://api.mistral.ai/v1/chat/completions';

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

    // Generate questions using AI
    console.log('🚀 Starting AI question generation...');
    const generatedQuestions = await generateQuestionsWithAI(
      studyMaterial,
      finalMcqCount,
      finalTfCount,
      finalDifficulty
    );

    console.log(`✅ Generated ${generatedQuestions.length} questions`);

    // Check if we got enough questions
    const expectedTotal = finalMcqCount + finalTfCount;
    if (generatedQuestions.length < expectedTotal) {
      // If we got some questions but not all, still save what we have
      if (generatedQuestions.length > 0) {
        console.log(`⚠️ Got ${generatedQuestions.length} out of ${expectedTotal} questions, saving available questions`);
      } else {
        return res.status(400).json({ 
          message: `AI could not generate any questions. Please try again with different study material.`,
          questions: []
        });
      }
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
        aiModelUsed: 'AI Service',
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

// Generate questions using AI
const generateQuestionsWithAI = async (studyMaterial, mcqCount, tfCount, difficulty) => {
  try {
    const prompt = createGenerationPrompt(studyMaterial, mcqCount, tfCount, difficulty);
    
    console.log('📝 Sending prompt to AI service...');
    
    // Try multiple free models
    const models = [
      "google/gemma-7b-it:free",
      "meta-llama/llama-3.1-8b-instruct:free",
      "microsoft/wizardlm-2-8x22b:free"
    ];
    
    let lastError = null;
    
    for (const model of models) {
      try {
        console.log(`🔄 Trying model: ${model}`);
        
        const response = await fetch(AI_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${AI_API_KEY}`,
            'HTTP-Referer': 'http://localhost:3000',
            'X-Title': 'Quizzar App'
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.7,
            max_tokens: 2000, // Reduced to stay within free limits
          }),
          timeout: 30000 // 30 second timeout
        });

        console.log(`📨 ${model} response status:`, response.status);
        
        if (response.status === 429) {
          console.log('⏳ Rate limited, trying next model...');
          lastError = new Error('Rate limited');
          continue;
        }
        
        if (response.status === 401) {
          console.log('🔐 Authentication required, trying next model...');
          lastError = new Error('Authentication required');
          continue;
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.log(`❌ ${model} error:`, errorText.substring(0, 200));
          lastError = new Error(`API error: ${response.status}`);
          continue;
        }

        const data = await response.json();
        console.log('✅ AI API response received');
        
        const text = data.choices[0].message.content;
        console.log('📄 Raw AI response:', text.substring(0, 200) + '...');
        
        const questions = parseAIResponse(text, mcqCount, tfCount);
        
        if (questions.length > 0) {
          console.log(`✅ Successfully generated ${questions.length} questions using ${model}`);
          return questions;
        } else {
          console.log('❌ No questions parsed, trying next model...');
          lastError = new Error('No questions parsed');
          continue;
        }
        
      } catch (error) {
        console.log(`❌ ${model} failed:`, error.message);
        lastError = error;
        continue;
      }
    }
    
    // If all models failed, use fallback
    console.log('🔁 All AI models failed, using fallback generation');
    return generateFallbackQuestions(studyMaterial, mcqCount, tfCount, difficulty);
    
  } catch (error) {
    console.error('❌ AI API error, using fallback:', error);
    return generateFallbackQuestions(studyMaterial, mcqCount, tfCount, difficulty);
  }
};

// Improved fallback question generation
const generateFallbackQuestions = (studyMaterial, mcqCount, tfCount, difficulty) => {
  console.log('🔄 Generating fallback questions...');
  
  const questions = [];
  const lines = studyMaterial.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    // If no lines, create generic questions
    for (let i = 0; i < tfCount; i++) {
      questions.push({
        text: `This statement relates to concepts in the study material.`,
        questionType: 'true-false',
        correctAnswer: Math.random() > 0.5,
        points: difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1,
        explanation: 'Refer to your study materials for detailed information.',
        options: []
      });
    }
    
    for (let i = 0; i < mcqCount; i++) {
      questions.push({
        text: `Which of the following best describes a key concept from the study material?`,
        questionType: 'multiple-choice',
        options: [
          `Correct concept based on study material`,
          `Plausible but incorrect alternative`,
          `Another incorrect option`, 
          `Clearly wrong alternative`
        ],
        correctOption: 0,
        points: difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1,
        explanation: 'Please review the study material for comprehensive understanding.'
      });
    }
  } else {
    // Generate True/False questions from actual content
    for (let i = 0; i < tfCount && i < lines.length; i++) {
      const line = lines[i];
      if (line.trim()) {
        // Create a statement based on the line
        const statement = createStatementFromLine(line);
        questions.push({
          text: statement.text,
          questionType: 'true-false',
          correctAnswer: statement.isTrue,
          points: difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1,
          explanation: statement.isTrue 
            ? 'This statement is correct based on the study material.' 
            : 'This statement is incorrect according to the study material.',
          options: []
        });
      }
    }
    
    // Generate MCQ questions from actual content
    for (let i = 0; i < mcqCount && i < lines.length; i++) {
      const line = lines[i];
      if (line.trim()) {
        const keyTerm = extractKeyTerm(line);
        questions.push({
          text: `Which of the following best describes "${keyTerm}"?`,
          questionType: 'multiple-choice',
          options: generatePlausibleOptions(keyTerm, line),
          correctOption: 0,
          points: difficulty === 'hard' ? 3 : difficulty === 'medium' ? 2 : 1,
          explanation: `"${keyTerm}" is explained in the study material.`
        });
      }
    }
  }
  
  // If we still don't have enough questions, fill with generic ones
  while (questions.length < mcqCount + tfCount) {
    if (questions.length % 2 === 0 && mcqCount > 0) {
      questions.push({
        text: `Which option correctly represents a concept from the study material?`,
        questionType: 'multiple-choice',
        options: ['Correct concept', 'Incorrect option 1', 'Incorrect option 2', 'Incorrect option 3'],
        correctOption: 0,
        points: 1,
        explanation: 'Review the study material for accurate information.'
      });
    } else {
      questions.push({
        text: `This statement is based on concepts from the study material.`,
        questionType: 'true-false',
        correctAnswer: Math.random() > 0.5,
        points: 1,
        explanation: 'Refer to your study materials.',
        options: []
      });
    }
  }
  
  console.log(`✅ Generated ${questions.length} fallback questions`);
  return questions.slice(0, mcqCount + tfCount); // Ensure we don't return more than requested
};

// Helper function to create statements from lines
const createStatementFromLine = (line) => {
  const words = line.split(' ').filter(word => word.length > 3);
  const randomWord = words[Math.floor(Math.random() * words.length)] || 'concept';
  
  // Simple logic to create plausible true/false statements
  const templates = [
    { text: `The term "${randomWord}" is mentioned in the study material.`, isTrue: true },
    { text: `"${randomWord}" is the main focus of the entire study material.`, isTrue: false },
    { text: `The study material provides detailed information about "${randomWord}".`, isTrue: true },
    { text: `"${randomWord}" is not relevant to the study material.`, isTrue: false }
  ];
  
  return templates[Math.floor(Math.random() * templates.length)];
};

// Helper function to extract key terms
const extractKeyTerm = (line) => {
  // Extract the first significant term (before colon or first few words)
  const match = line.match(/^([^:]+):/) || line.match(/(\w+\s+\w+)/);
  return match ? match[1].trim() : 'key concept';
};

// Helper function to generate plausible options
const generatePlausibleOptions = (keyTerm, line) => {
  const options = [`Correct description of ${keyTerm}`];
  
  // Add plausible incorrect options
  const incorrectOptions = [
    `Alternative interpretation of ${keyTerm}`,
    `Common misconception about ${keyTerm}`,
    `Unrelated concept often confused with ${keyTerm}`,
    `Simplified but inaccurate version of ${keyTerm}`
  ];
  
  // Shuffle and take 3 incorrect options
  const shuffled = [...incorrectOptions].sort(() => 0.5 - Math.random());
  options.push(...shuffled.slice(0, 3));
  
  return options;
};

// Keep the same prompt creation function
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

Return exactly the specified number of questions in the format above. Do not include any additional commentary or text outside the specified format.
`;
};

// parsing logic
const parseAIResponse = (text, expectedMCQCount, expectedTFCount) => {
  return parseGeminiResponse(text, expectedMCQCount, expectedTFCount);
};

// parsing function
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