const OpenAI = require('openai');

class FlashcardGenerator {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.maxIterations = 5;
  }

  // Main workflow function - LangGraph-inspired
  async generateFlashcards(transcriptionText) {
    console.log('🚀 Starting iterative flashcard generation workflow...');
    
    let currentIteration = 0;
    let flashcards = [];
    let analysisHistory = [];
    
    while (currentIteration < this.maxIterations) {
      currentIteration++;
      console.log(`📝 Iteration ${currentIteration}/${this.maxIterations}`);
      
      try {
        // Step 1: Generate or improve flashcards
        if (currentIteration === 1) {
          flashcards = await this.generateInitialFlashcards(transcriptionText);
        } else {
          flashcards = await this.improveFlashcards(
            transcriptionText, 
            flashcards, 
            analysisHistory[analysisHistory.length - 1]
          );
        }
        
        console.log(`📚 Generated ${flashcards.length} flashcards`);
        
        // Step 2: Analyze flashcard quality
        const analysis = await this.analyzeFlashcards(transcriptionText, flashcards);
        analysisHistory.push(analysis);
        
        console.log(`🔍 Analysis Score: ${analysis.overallScore}/10`);
        console.log(`📊 Comprehensiveness: ${analysis.comprehensiveness}/10`);
        console.log(`🎯 Complexity: ${analysis.complexity}/10`);
        console.log(`✨ Quality: ${analysis.quality}/10`);
        
        // Step 3: Decision node - should we continue?
        if (this.shouldContinueIteration(analysis, currentIteration)) {
          console.log(`🔄 Analysis suggests improvement needed. Continuing...`);
          console.log(`💡 Suggestions: ${analysis.suggestions.join(', ')}`);
        } else {
          console.log(`✅ Flashcards meet quality standards! Stopping iteration.`);
          break;
        }
        
      } catch (error) {
        console.error(`❌ Error in iteration ${currentIteration}:`, error);
        if (currentIteration === 1) {
          // Fall back to simple generation on first iteration failure
          flashcards = await this.generateSimpleFlashcards(transcriptionText);
        }
        break;
      }
    }
    
    console.log(`🎉 Flashcard generation complete after ${currentIteration} iterations`);
    return {
      success: true,
      flashcards: flashcards,
      iterations: currentIteration,
      finalAnalysis: analysisHistory[analysisHistory.length - 1] || null
    };
  }

  // Node 1: Generate initial flashcards
  async generateInitialFlashcards(transcriptionText) {
    console.log('🌱 Generating initial flashcards...');
    
    const prompt = `You are an expert educational content creator. Generate comprehensive flashcards from the following transcript.

    INSTRUCTIONS:
    - Create 8-12 high-quality flashcards covering the main concepts
    - Include a mix of factual, conceptual, and application questions
    - Ensure questions are clear and specific
    - Provide detailed but concise answers
    - Cover different difficulty levels from basic to advanced
    - Focus on the most important learning objectives

    TRANSCRIPT:
    ${transcriptionText}

    FORMAT: Return a JSON array of objects with "question" and "answer" fields.`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    });

    return this.parseFlashcards(completion.choices[0].message.content);
  }

  // Node 2: Analyze flashcard quality
  async analyzeFlashcards(transcriptionText, flashcards) {
    console.log('🔬 Analyzing flashcard quality...');
    
    const prompt = `You are an educational assessment expert. Analyze these flashcards for quality and completeness.

    ORIGINAL TRANSCRIPT:
    ${transcriptionText}

    FLASHCARDS TO ANALYZE:
    ${JSON.stringify(flashcards, null, 2)}

    ANALYSIS CRITERIA:
    1. COMPREHENSIVENESS (1-10): Do the flashcards cover all major concepts from the transcript?
    2. COMPLEXITY (1-10): Is there appropriate variety in difficulty levels?
    3. QUALITY (1-10): Are questions clear, specific, and educationally sound?

    EVALUATION RUBRIC:
    - 8-10: Excellent, minimal improvement needed
    - 6-7: Good, some improvements would help
    - 4-5: Fair, significant improvements needed
    - 1-3: Poor, major revision required

    Return a JSON object with:
    {
      "comprehensiveness": <score 1-10>,
      "complexity": <score 1-10>, 
      "quality": <score 1-10>,
      "overallScore": <average score>,
      "missingTopics": ["topic1", "topic2"],
      "suggestions": ["specific improvement 1", "specific improvement 2"],
      "shouldContinue": <boolean>
    }`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 1000,
    });

    return this.parseAnalysis(completion.choices[0].message.content);
  }

  // Node 3: Improve flashcards based on analysis
  async improveFlashcards(transcriptionText, currentFlashcards, analysis) {
    console.log('🛠️ Improving flashcards based on analysis...');
    
    const prompt = `You are an expert educational content improver. Based on the analysis, improve the existing flashcards.

    ORIGINAL TRANSCRIPT:
    ${transcriptionText}

    CURRENT FLASHCARDS:
    ${JSON.stringify(currentFlashcards, null, 2)}

    ANALYSIS FEEDBACK:
    - Comprehensiveness: ${analysis.comprehensiveness}/10
    - Complexity: ${analysis.complexity}/10
    - Quality: ${analysis.quality}/10
    - Missing Topics: ${analysis.missingTopics?.join(', ') || 'None identified'}
    - Suggestions: ${analysis.suggestions?.join('; ') || 'None provided'}

    IMPROVEMENT INSTRUCTIONS:
    1. Keep the best existing flashcards
    2. Improve weak flashcards by making them clearer and more specific
    3. Add new flashcards for missing topics
    4. Ensure variety in difficulty levels
    5. Target 10-15 total flashcards for comprehensive coverage

    FORMAT: Return a JSON array of improved/new flashcard objects with "question" and "answer" fields.`;

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.6,
      max_tokens: 2500,
    });

    return this.parseFlashcards(completion.choices[0].message.content);
  }

  // Decision node: Should we continue iterating?
  shouldContinueIteration(analysis, currentIteration) {
    // Continue if:
    // 1. Overall score is below 7.5 AND we haven't hit max iterations
    // 2. Any individual score is below 6
    // 3. There are significant missing topics
    
    if (currentIteration >= this.maxIterations) return false;
    
    const hasLowOverallScore = analysis.overallScore < 7.5;
    const hasLowIndividualScores = 
      analysis.comprehensiveness < 6 || 
      analysis.complexity < 6 || 
      analysis.quality < 6;
    const hasMissingTopics = analysis.missingTopics && analysis.missingTopics.length > 2;
    
    return hasLowOverallScore || hasLowIndividualScores || hasMissingTopics;
  }

  // Utility: Parse flashcards from AI response
  parseFlashcards(response) {
    try {
      // Try to parse as JSON first
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback: parse from text format
      return this.parseFlashcardsFromText(response);
    } catch (error) {
      console.warn('Failed to parse flashcards, using fallback generation');
      return this.getFallbackFlashcards();
    }
  }

  // Utility: Parse analysis from AI response
  parseAnalysis(response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // Calculate overall score if not provided
        if (!parsed.overallScore) {
          parsed.overallScore = Math.round(
            (parsed.comprehensiveness + parsed.complexity + parsed.quality) / 3 * 10
          ) / 10;
        }
        return parsed;
      }
    } catch (error) {
      console.warn('Failed to parse analysis, using default');
    }
    
    // Fallback analysis
    return {
      comprehensiveness: 6,
      complexity: 6,
      quality: 6,
      overallScore: 6.0,
      missingTopics: [],
      suggestions: ['General improvements needed'],
      shouldContinue: false
    };
  }

  // Fallback: Simple flashcard generation (original method)
  async generateSimpleFlashcards(transcriptionText) {
    console.log('🔄 Using fallback simple generation...');
    
    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Generate educational flashcards from the transcript. Return only a JSON array of objects with "question" and "answer" fields.'
        },
        {
          role: 'user',
          content: `Create flashcards from: ${transcriptionText}`
        }
      ],
      temperature: 0.3,
    });
    
    return this.parseFlashcards(completion.choices[0].message.content);
  }

  // Utility: Parse flashcards from text format
  parseFlashcardsFromText(text) {
    const flashcards = [];
    const lines = text.split('\n');
    let currentQuestion = '';
    let currentAnswer = '';
    let isAnswer = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.toLowerCase().includes('question') || trimmed.startsWith('Q:')) {
        if (currentQuestion && currentAnswer) {
          flashcards.push({ question: currentQuestion.trim(), answer: currentAnswer.trim() });
        }
        currentQuestion = trimmed.replace(/^(question|Q):\s*/i, '');
        currentAnswer = '';
        isAnswer = false;
      } else if (trimmed.toLowerCase().includes('answer') || trimmed.startsWith('A:')) {
        currentAnswer = trimmed.replace(/^(answer|A):\s*/i, '');
        isAnswer = true;
      } else if (trimmed && isAnswer) {
        currentAnswer += ' ' + trimmed;
      } else if (trimmed && !isAnswer && currentQuestion) {
        currentQuestion += ' ' + trimmed;
      }
    }
    
    if (currentQuestion && currentAnswer) {
      flashcards.push({ question: currentQuestion.trim(), answer: currentAnswer.trim() });
    }
    
    return flashcards.length > 0 ? flashcards : this.getFallbackFlashcards();
  }

  // Utility: Fallback flashcards if all else fails
  getFallbackFlashcards() {
    return [
      {
        question: 'What were the main topics covered in this session?',
        answer: 'Please refer to the session transcript for the main topics discussed.'
      },
      {
        question: 'What key concepts should be reviewed from this session?',
        answer: 'Review the transcript to identify the most important concepts and ideas presented.'
      }
    ];
  }
}

module.exports = FlashcardGenerator; 