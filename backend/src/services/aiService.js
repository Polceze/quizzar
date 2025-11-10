class AIService {
  constructor() {
    // Flexible configuration from environment variables
    this.apiKey = process.env.GEMINI_API_KEY || process.env.AI_API_KEY;
    this.apiUrl = process.env.AI_API_URL;
    this.model = process.env.AI_MODEL;
    
    console.log('🔧 AI Service Configuration:');
    console.log('🔐 API Key present:', !!this.apiKey);
    console.log('🌐 API URL:', this.apiUrl);
    console.log('🤖 Model:', this.model);
    
    if (!this.apiKey) {
      console.error('❌ AI_API_KEY or GEMINI_API_KEY is missing from environment variables');
    }
  }

  async generateQuestions(studyMaterial, specifications) {
    try {
      const { numQuestions, questionTypes, difficulty } = specifications;
      
      console.log('📝 Building prompt...');
      const prompt = this.buildPrompt(studyMaterial, numQuestions, questionTypes, difficulty);
      
      const requestBody = this.buildRequestBody(prompt);
      
      console.log('📤 Sending request to AI API...');
      console.log('🌐 Endpoint:', this.getApiEndpoint());
      
      const response = await fetch(this.getApiEndpoint(), {
        method: 'POST',
        headers: this.getApiHeaders(),
        body: JSON.stringify(requestBody)
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        let errorDetail;
        try {
          errorDetail = await response.text(); // Read as text first
          try {
            // Try to parse as JSON for better error messages
            const errorJson = JSON.parse(errorDetail);
            errorDetail = JSON.stringify(errorJson);
          } catch {
            // Keep as text if not JSON
          }
        } catch (e) {
          errorDetail = `Cannot read error response: ${e.message}`;
        }
        
        console.error('❌ AI API error details:', errorDetail);
        throw new Error(`AI API error: ${response.status} - ${errorDetail}`);
      }

      const data = await response.json();
      console.log('✅ AI API response received');
      
      const text = this.extractResponseText(data);
      console.log('📄 Response content preview:', text.substring(0, 200) + '...');
      
      const questions = this.parseAIResponse(text);
      console.log(`✅ Successfully parsed ${questions.length} questions`);
      return questions;
      
    } catch (error) {
      console.error('💥 AI Generation Error:', error);
      throw new Error(`Failed to generate questions: ${error.message}`);
    }
  }

  // Helper methods for different AI providers
  getApiEndpoint() {
    if (this.apiUrl.includes('generativelanguage.googleapis.com')) {
      // Gemini - API key in URL, ensure correct endpoint format
      let baseUrl = this.apiUrl;
      if (!baseUrl.includes(':generateContent')) {
        baseUrl = baseUrl.replace(/\/[^/]*$/, ':generateContent');
      }
      return `${baseUrl}?key=${this.apiKey}`;
    } else {
      // Other providers
      return this.apiUrl;
    }
  }

  getApiHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };

    if (this.apiUrl.includes('openrouter.ai')) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
      headers['HTTP-Referer'] = 'https://quizzar-black.vercel.app';
      headers['X-Title'] = 'Quizzar App';
    } else if (this.apiUrl.includes('api.mistral.ai') || this.apiUrl.includes('api.openai.com')) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    // Gemini doesn't need Authorization header - key is in URL

    return headers;
  }

  buildRequestBody(prompt) {
    if (this.apiUrl.includes('generativelanguage.googleapis.com')) {
      // Gemini format
      return {
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
          topP: 0.8,
          topK: 40
        }
      };
    } else {
      // OpenAI/Mistral/OpenRouter format
      return {
        model: this.model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 2000
      };
    }
  }

  extractResponseText(data) {
    if (this.apiUrl.includes('generativelanguage.googleapis.com')) {
      // Gemini format
      if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
        return data.candidates[0].content.parts[0].text;
      }
    } else {
      // OpenAI/Mistral/OpenRouter format
      if (data.choices?.[0]?.message?.content) {
        return data.choices[0].message.content;
      }
    }
    throw new Error('Unexpected response format from AI API');
  }

  async getErrorDetails(response) {
    try {
      const errorData = await response.json();
      return JSON.stringify(errorData);
    } catch (e) {
      return await response.text();
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
      
      let cleanText = responseText.trim();
      
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/```json\n?/, '').replace(/\n?```/, '');
      } else if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/```\n?/, '').replace(/\n?```/, '');
      }
      
      cleanText = cleanText.trim();

      const jsonMatch = cleanText.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.error('❌ No JSON array found in response');
        throw new Error('No valid JSON array found in AI response');
      }
      
      const questions = JSON.parse(jsonMatch[0]);
      console.log(`✅ Parsed ${questions.length} questions`);
      
      const validQuestions = questions.map((q, index) => {
        const validType = q.questionType === 'true_false' ? 'true_false' : 'multiple_choice';
        
        let options = q.options || [];
        if (validType === 'true_false') {
          options = ['True', 'False'];
        } else if (validType === 'multiple_choice' && options.length !== 4) {
          options = options.slice(0, 4);
          while (options.length < 4) {
            options.push(`Option ${options.length + 1}`);
          }
        }
        
        let correctAnswer = parseInt(q.correctAnswer) || 0;
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
      throw new Error(`Failed to parse AI response: ${error.message}`);
    }
  }

  async testConnection() {
    try {
      const testPrompt = "Reply with only the word 'Success'";
      const requestBody = this.buildRequestBody(testPrompt);
      
      const response = await fetch(this.getApiEndpoint(), {
        method: 'POST',
        headers: this.getApiHeaders(),
        body: JSON.stringify(requestBody)
      });

      console.log('🧪 Test response status:', response.status);
      
      if (!response.ok) {
        const errorDetail = await this.getErrorDetails(response);
        throw new Error(`API test failed: ${response.status} - ${errorDetail}`);
      }

      const data = await response.json();
      const text = this.extractResponseText(data);
      
      return { 
        success: true, 
        message: 'AI API connected successfully',
        provider: this.getProviderName(),
        model: this.model
      };
    } catch (error) {
      console.error('AI API Connection Error:', error);
      return { 
        success: false, 
        message: `AI API connection failed: ${error.message}` 
      };
    }
  }

  getProviderName() {
    if (this.apiUrl.includes('generativelanguage.googleapis.com')) return 'Gemini';
    if (this.apiUrl.includes('openrouter.ai')) return 'OpenRouter';
    if (this.apiUrl.includes('api.mistral.ai')) return 'Mistral';
    if (this.apiUrl.includes('api.openai.com')) return 'OpenAI';
    return 'Unknown';
  }
}

export default new AIService();