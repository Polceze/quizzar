class AIService {
  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY;
    this.apiUrl = 'https://api.deepseek.com/v1/chat/completions';
  }

  // Test API connection
  async testConnection() {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [{ role: "user", content: "Hello" }],
          max_tokens: 10
        })
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      return { success: true, message: 'DeepSeek API connected successfully' };
    } catch (error) {
      console.error('DeepSeek API Connection Error:', error);
      return { success: false, message: `DeepSeek API connection failed: ${error.message}` };
    }
  }

  // Generate questions from study material (ONLY MCQ and True/False)
  async generateQuestions(studyMaterial, specifications) {
    try {
      const { numQuestions, questionTypes, difficulty } = specifications;
      
      const prompt = this.buildPrompt(studyMaterial, numQuestions, questionTypes, difficulty);
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 4000,
          stream: false
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.choices[0].message.content;
      
      return this.parseAIResponse(text);
      
    } catch (error) {
      console.error('AI Question Generation Error:', error);
      throw new Error(`Failed to generate questions: ${error.message}`);
    }
  }

  // Keep the same buildPrompt and parseAIResponse methods
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