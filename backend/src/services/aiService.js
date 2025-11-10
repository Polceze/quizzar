class AIService {
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
    this.apiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
    
    console.log('🔐 Gemini API Key present:', !!this.apiKey);
    if (!this.apiKey) {
      console.error('❌ GEMINI_API_KEY is missing from environment variables');
    }
  }

  async generateQuestions(studyMaterial, specifications) {
    try {
      const { numQuestions, questionTypes, difficulty } = specifications;
      
      console.log('📝 Building prompt...');
      const prompt = this.buildPrompt(studyMaterial, numQuestions, questionTypes, difficulty);
      
      const requestBody = {
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
          topP: 0.8,
          topK: 40
        }
      };

      console.log('📤 Sending request to Gemini API...');
      
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        let errorDetail = '';
        try {
          const errorData = await response.json();
          errorDetail = JSON.stringify(errorData);
          console.error('❌ Gemini API error details:', errorDetail);
        } catch (e) {
          errorDetail = await response.text();
          console.error('❌ Gemini API error text:', errorDetail);
        }
        
        throw new Error(`Gemini API error: ${response.status} - ${errorDetail}`);
      }

      const data = await response.json();
      console.log('✅ Gemini API response received');
      
      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const text = data.candidates[0].content.parts[0].text;
        console.log('📄 Response content preview:', text.substring(0, 200) + '...');
        
        const questions = this.parseAIResponse(text);
        console.log(`✅ Successfully parsed ${questions.length} questions`);
        return questions;
      } else {
        console.error('❌ Unexpected Gemini response format:', data);
        throw new Error('Unexpected response format from Gemini API');
      }
      
    } catch (error) {
      console.error('💥 Gemini AI Error:', error);
      throw new Error(`Failed to generate questions: ${error.message}`);
    }
  }

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

Generate the questions now. ONLY include ${questionTypes.join(' and ')} questions. Return ONLY the JSON array, no other text:
`;
  }

  parseAIResponse(responseText) {
    try {
      console.log('🔄 Parsing AI response...');
      
      // Clean the response text - remove markdown code blocks if present
      let cleanText = responseText.trim();
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json\n?/, '').replace(/\n?```/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```\n?/, '').replace(/\n?```/, '');
      }
      
      cleanText = cleanText.trim();

      // Extract JSON from the response
      const jsonMatch = cleanText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('❌ No JSON array found in response');
        console.log('📄 Raw response:', responseText);
        throw new Error('No valid JSON array found in AI response');
      }
      
      const questions = JSON.parse(jsonMatch[0]);
      console.log(`✅ Parsed ${questions.length} questions`);
      
      // Validate and normalize the questions
      const validQuestions = questions.map((q, index) => {
        const validType = q.questionType === 'true_false' ? 'true_false' : 'multiple_choice';
        
        let options = q.options || [];
        if (validType === 'true_false' && options.length !== 2) {
          options = ['True', 'False'];
        }
        if (validType === 'multiple_choice' && options.length !== 4) {
          options = options.slice(0, 4);
          while (options.length < 4) {
            options.push(`Option ${options.length + 1}`);
          }
        }
        
        let correctAnswer = q.correctAnswer;
        if (correctAnswer < 0 || correctAnswer >= options.length) {
          correctAnswer = 0;
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
      console.error('❌ AI Response Parsing Error:', error);
      console.log('📄 Raw response that failed to parse:', responseText);
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  }

  // Test method for Gemini
  async testConnection() {
    try {
      const response = await fetch(`${this.apiUrl}?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: "Say 'Hello World' in 3 words or less."
            }]
          }],
          generationConfig: {
            maxOutputTokens: 10
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API returned ${response.status}: ${response.statusText}`);
      }

      return { success: true, message: 'Gemini API connected successfully' };
    } catch (error) {
      console.error('Gemini API Connection Error:', error);
      return { success: false, message: `Gemini API connection failed: ${error.message}` };
    }
  }
}

export default new AIService();