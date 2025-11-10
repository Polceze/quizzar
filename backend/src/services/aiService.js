class AIService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY; // Get from https://groq.com
    this.apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
  }

  async generateQuestions(studyMaterial, specifications) {
    const models = [
      "llama-3.1-8b-instant", // Fast & free
      "llama-3.2-3b-preview", // Lightweight
      "mixtral-8x7b-32768"    // Higher quality
    ];

    for (const model of models) {
      try {
        const response = await fetch(this.apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: [{
              role: "user", 
              content: this.buildPrompt(studyMaterial, specifications)
            }],
            temperature: 0.7,
            max_tokens: 2000
          })
        });

        if (response.ok) {
          const data = await response.json();
          return this.parseAIResponse(data.choices[0].message.content);
        }
      } catch (error) {
        continue;
      }
    }
    throw new Error('Groq services are busy. Please try again.');
  }

  // buildPrompt specifically designed for free iter openrouter.ai
  buildPrompt(studyMaterial, numQuestions, questionTypes, difficulty) {
    return `
You are an expert educational content creator. Generate ${numQuestions} exam questions based on the following study material.

STUDY MATERIAL:
${studyMaterial}

SPECIFICATIONS:
- Number of questions: ${numQuestions}
- Question types: ONLY ${questionTypes.join(' and ')}
- Difficulty level: ${difficulty}

CRITICAL INSTRUCTIONS:
1. Generate exactly ${numQuestions} questions
2. ONLY use these question types: ${questionTypes.join(', ')}
3. For MULTIPLE CHOICE questions:
   - Provide exactly 4 options (A, B, C, D)
   - "correctAnswer" should be the INDEX (0-3) of the correct option
   - Options should be plausible and educational
4. For TRUE/FALSE questions:
   - Provide exactly 2 options: ["True", "False"]
   - "correctAnswer" should be 0 for "True" or 1 for "False"
5. Format your response as a valid JSON array
6. Each question object must have:
   - "questionText": clear and concise question
   - "questionType": "multiple_choice" or "true_false"
   - "options": array of answer choices
   - "correctAnswer": number (index of correct option)
   - "explanation": brief explanation

EXAMPLE FORMAT:
[
  {
    "questionText": "What is the capital of France?",
    "questionType": "multiple_choice",
    "options": ["London", "Berlin", "Paris", "Madrid"],
    "correctAnswer": 2,
    "explanation": "Paris is the capital and most populous city of France."
  },
  {
    "questionText": "The Earth is flat.",
    "questionType": "true_false", 
    "options": ["True", "False"],
    "correctAnswer": 1,
    "explanation": "The Earth is an oblate spheroid, not flat."
  }
]

Generate the questions now. ONLY include ${questionTypes.join(' and ')} questions:
`;
  }

  parseAIResponse(responseText) {
    try {
      // Extract JSON from the response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON array found in AI response');
      }
      
      const questions = JSON.parse(jsonMatch[0]);
      
      // Validate the structure and filter only allowed types
      if (!Array.isArray(questions)) {
        throw new Error('AI response is not an array');
      }
      
      const validQuestions = questions.map((q, index) => {
        // Ensure question type is valid
        const validType = q.questionType === 'true_false' ? 'true_false' : 'multiple_choice';
        
        // Ensure options array is properly formatted
        let options = q.options || [];
        if (validType === 'true_false' && options.length !== 2) {
          options = ['True', 'False'];
        }
        if (validType === 'multiple_choice' && options.length !== 4) {
          // If not 4 options, pad or truncate
          options = options.slice(0, 4);
          while (options.length < 4) {
            options.push(`Option ${options.length + 1}`);
          }
        }
        
        // Ensure correctAnswer is within bounds
        let correctAnswer = q.correctAnswer;
        if (correctAnswer < 0 || correctAnswer >= options.length) {
          correctAnswer = 0; // Default to first option if invalid
        }
        
        return {
          questionText: q.questionText || `Question ${index + 1}`,
          questionType: validType,
          options: options,
          correctAnswer: correctAnswer,
          explanation: q.explanation || 'No explanation provided.',
          order: index
        };
      });
      
      return validQuestions;
      
    } catch (error) {
      console.error('AI Response Parsing Error:', error);
      throw new Error(`Failed to parse AI response: ${error.message}. Raw response: ${responseText}`);
    }
  }
}

export default new AIService();