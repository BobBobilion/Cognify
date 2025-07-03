# Cognify Smart Flashcard Generator - n8n Workflow Setup

## 📋 Overview

This n8n workflow implements an advanced iterative flashcard generation system that:
- Generates initial flashcards from transcript content
- Analyzes quality with AI (comprehensiveness, complexity, quality scores)
- Iteratively improves flashcards up to 5 times based on analysis
- Returns optimized flashcards with detailed metadata

## 🚀 Import Instructions

### 1. Import the Workflow
1. Open your n8n instance
2. Go to **Workflows** → **Import from File**
3. Upload the `n8n-flashcard-workflow.json` file
4. Click **Import**

### 2. Configure OpenAI Credentials
1. Go to **Settings** → **Credentials**
2. Click **Add Credential** → **OpenAI**
3. Enter your OpenAI API key
4. Save as "OpenAI API Key"
5. Update all OpenAI nodes in the workflow to use this credential

### 3. Activate the Workflow
1. Open the imported workflow
2. Click **Activate** in the top right
3. The webhook will be available at: `https://your-n8n-instance.com/webhook/generate-flashcards`

## 📡 API Usage

### Request Format
```bash
POST https://your-n8n-instance.com/webhook/generate-flashcards
Content-Type: application/json

{
  "transcript": "Your session transcript text here...",
  "sessionId": "optional-session-id"
}
```

### Enhanced Response Format
```json
{
  "success": true,
  "flashcards": [
    {
      "question": "What is machine learning?",
      "answer": "Machine learning is a subset of AI that enables computers to learn and improve from experience without being explicitly programmed."
    }
  ],
  "metadata": {
    "totalCards": 8,
    "sessionId": "session-123",
    "generatedAt": "2024-07-02T16:00:00.000Z",
    "generationMethod": "concept-based-improved",
    "improved": true,
    "processingComplete": true,
    "conceptAnalysis": {
      "totalConcepts": 12,
      "priorityBreakdown": {
        "high": 6,
        "medium": 4,
        "low": 2
      },
      "coverageRatio": "0.67",
      "qualityScores": {
        "overall": 8.2,
        "coverage": 8.5,
        "priority": 7.8,
        "depth": 8.0,
        "distribution": 7.5,
        "variety": 8.3,
        "comprehensiveness": 9.0,
        "integration": 7.2,
        "educational": 8.8
      },
      "coverageMetrics": {
        "highPriorityCoverage": 83.3,
        "mediumPriorityCoverage": 75.0,
        "overallCoverage": 71.4
      },
      "cognitiveAnalysis": {
        "recallPercentage": 25.0,
        "higherOrderPercentage": 37.5,
        "distribution": {
          "recall": 2,
          "understanding": 3,
          "application": 2,
          "analysis": 1
        }
      },
      "missingConcepts": ["Advanced Optimization Techniques"],
      "recommendations": [
        "Add flashcards for missing high-priority concepts",
        "Increase cognitive complexity with application questions"
      ],
      "improvementReasons": ["High-priority coverage only 83.3%"]
    }
  }
}
```

## 🏗️ Workflow Architecture

### Enhanced 12-Node Workflow Architecture:
1. **Webhook Trigger** - Receives transcript data
2. **Initialize Variables** - Sets up iteration counters and session data
3. **Extract Concepts** - AI extracts structured concepts with categories and priorities
4. **Parse Concepts** - Validates and organizes concept data
5. **Generate Flashcards** - Creates targeted flashcards based on extracted concepts
6. **Parse Flashcards** - Validates and extracts flashcard JSON
7. **Concept Coverage Analysis** - GPT-4o-mini performs comprehensive quality assessment
8. **Parse Coverage Analysis** - Analyzes coverage metrics and makes improvement decisions  
9. **Need Improvement?** - Routes to enhancement or completion based on sophisticated logic
10. **Improve Flashcards** - Enhances flashcards using detailed coverage analysis feedback
11. **Parse Improvements** - Validates enhanced flashcards
12. **→ Loops back to Step 7** - **Re-analyzes improved flashcards for iterative validation**
13. **Final Response Builder** - Prepares comprehensive response with coverage metadata  
14. **Send Response** - Returns results with detailed analytics

**🔄 Iterative Quality Loop**: Steps 7-12 repeat until quality targets are met or max iterations reached, ensuring each improvement cycle is validated against the original quality criteria.

### Quality Criteria:
- **Comprehensiveness**: Coverage of important concepts (1-10)
- **Complexity**: Appropriate difficulty level (1-10)  
- **Quality**: Question clarity and answer accuracy (1-10)
- **Overall Score**: Average of all criteria

### Enhanced AI-Powered Concept Coverage Logic:

**🧠 Two-Stage AI Processing:**
1. **Concept Extraction**: AI extracts 8-15 structured concepts with categories, importance levels, and key details
2. **Coverage Analysis**: GPT-4o-mini performs comprehensive quality assessment with 8 evaluation criteria

**📊 Advanced Quality Metrics:**
- **Concept Coverage Completeness** (0-10): How well flashcards cover extracted concepts
- **Priority Concept Focus** (0-10): Adequate representation of high-priority concepts  
- **Coverage Depth Quality** (0-10): Tests understanding vs just memorization
- **Coverage Distribution** (0-10): Balanced across concept categories
- **Question Type Variety** (0-10): Different cognitive levels (recall, application, analysis)
- **Answer Comprehensiveness** (0-10): Sufficient detail and context
- **Concept Integration** (0-10): Shows relationships between concepts
- **Educational Value** (0-10): Effectiveness for student learning

**🎯 Sophisticated Improvement Decision Logic:**
Recommends improvement if ANY of these conditions are met:
- Overall score < 7.5 OR Priority focus < 7.0 OR Coverage completeness < 7.0 OR Educational value < 7.0
- High-priority concept coverage < 80% OR Overall concept coverage < 70%
- Too many recall questions (>70%) OR Insufficient higher-order thinking (<20%)
- Missing > 2 critical concepts OR Answer quality < 6.5 OR < 6 total flashcards

**🔄 Iterative Enhancement Process with Feedback Loop:**
- **Step 1**: Analyzes coverage quality and identifies specific gaps
- **Step 2**: Generates targeted improvements addressing identified weaknesses
- **Step 3**: **Re-analyzes improved flashcards** to validate enhancement effectiveness
- **Step 4**: Continues loop until quality targets met or max iterations reached
- Targets cognitive level distribution (30% recall, 35% understanding, 25% application, 10% analysis)
- **Ensures improvements actually solve identified problems** rather than improving blindly

**📈 Comprehensive Response Metadata:**
- Quality scores for all 8 evaluation criteria
- Coverage metrics for high/medium/low priority concepts
- Cognitive complexity analysis and distribution
- Missing concepts list and improvement recommendations
- Specific reasons for improvement decisions

## 🔧 Cognify Integration

### Update Your Electron App

Replace your current flashcard generation function with a webhook call:

```javascript
// In your main.js or flashcard handler
async function generateFlashcardsViaWebhook(transcriptionText) {
    try {
        const response = await fetch('https://your-n8n-instance.com/webhook/generate-flashcards', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                transcript: transcriptionText,
                sessionId: sessionData.id
            })
        });

        const result = await response.json();
        
        if (result.success) {
            console.log(`✅ Generated ${result.flashcards.length} flashcards in ${result.metadata.iterations} iterations`);
            console.log(`📊 Quality Score: ${result.metadata.finalAnalysis?.overallScore}/10`);
            
            return {
                success: true,
                flashcards: result.flashcards,
                metadata: result.metadata
            };
        } else {
            throw new Error('Webhook returned unsuccessful result');
        }
    } catch (error) {
        console.error('❌ Error calling flashcard webhook:', error);
        return {
            success: false,
            error: error.message
        };
    }
}
```

### Update IPC Handler

```javascript
// In main.js
ipcMain.handle('generate-flashcards', async (event, transcriptionText) => {
    console.log('🚀 Starting webhook-based flashcard generation...');
    return await generateFlashcardsViaWebhook(transcriptionText);
});
```

## 🛠️ Customization Options

### Adjust Quality Thresholds
In the "Quality Decision" node, modify the improvement logic:
```javascript
const needsImprovement = (
    analysis.overallScore < 8.0 ||  // Raise threshold to 8.0
    analysis.comprehensiveness < 7 || // Raise to 7
    analysis.complexity < 7 || 
    analysis.quality < 7
) && flashcardsData.iteration < flashcardsData.maxIterations;
```

### Change Maximum Iterations
In the "Initialize Variables" node:
```javascript
{
  "id": "maxIterations",
  "name": "maxIterations",
  "value": 3,  // Change from 5 to 3
  "type": "number"
}
```

### Modify Flashcard Count
In the "Generate Flashcards" system prompt:
```
Create 8-15 flashcards that:  // Change from 6-12
```

## 🔍 Monitoring & Debugging

### Workflow Execution Logs
- Check n8n execution history for detailed logs
- Each node logs progress with emojis for easy tracking
- Quality scores are logged for each iteration

### Common Issues:
1. **OpenAI API Limits**: Monitor your usage and rate limits
2. **Parsing Errors**: Check JSON extraction in Parse nodes
3. **Infinite Loops**: Maximum iterations prevent this
4. **Credential Issues**: Ensure OpenAI credentials are properly configured

## 📈 Benefits Over Direct API Calls

1. **Visual Workflow**: Easy to understand and modify the process
2. **Error Handling**: Robust fallback mechanisms at each step
3. **Monitoring**: Built-in execution tracking and logging
4. **Scalability**: n8n can handle multiple concurrent requests
5. **Flexibility**: Easy to add new features or modify logic
6. **No Code Dependencies**: Reduce complexity in your Electron app

## 🎯 Next Steps

1. Import and test the workflow with sample data
2. Update your Cognify app to use the webhook
3. Monitor performance and adjust quality thresholds as needed
4. Consider adding additional features like:
   - Different flashcard formats (multiple choice, fill-in-blank)
   - Subject-specific generation strategies
   - Integration with spaced repetition algorithms

## 🔧 **CRITICAL: Correct OpenAI Node Configuration**

**⚠️ IMPORTANT**: All OpenAI nodes MUST use the correct configuration:

**✅ Correct Configuration:**
- **Resource:** `Chat`
- **Operation:** `Complete` 
- **Messages Format:**
```json
{
  "messageValues": [
    {
      "role": "user",
      "content": "Your prompt content here..."
    }
  ]
}
```

**❌ INVALID Configurations:**
- ~~Resource: Text with Operation: message~~ 
- ~~Operation: message~~ (Not valid for any resource)
- ~~Operation: completion~~ (Should be "Complete" not "completion")
- ~~Single text parameter~~ (Use messages array instead)

**📚 Reference:** [n8n OpenAI Documentation](https://docs.n8n.io/integrations/builtin/app-nodes/n8n-nodes-langchain.openai/)

## ⚠️ Critical Fix: Iterative Feedback Loop

**IMPORTANT**: The coverage analysis is now **part of the improvement cycle**, creating a proper feedback loop:

```
Initial: Parse Flashcards → Coverage Analysis → Need Improvement?
Loop: Improve → Parse Improvements → Coverage Analysis → Need Improvement? (repeat)
Final: → Final Response Builder
```

This ensures that:
- **Each improvement is validated** against the original quality criteria
- **Problems are actually fixed** rather than hoped to be fixed
- **Iteration tracking** shows quality progression over multiple cycles
- **No blind improvements** - every enhancement is measured and verified

## 💡 Pro Tips

- **Test First**: Use n8n's test feature with sample transcript data
- **Monitor Costs**: OpenAI usage will increase with iterations and re-analysis
- **Track Iterations**: Watch the logs to see quality improvement across cycles
- **Backup Workflows**: Export your customized workflow as backup
- **Version Control**: Tag different versions of your workflow setup

## 🚨 Troubleshooting Fallback Flashcards

### **If you receive these generic flashcards, the workflow failed early:**
```json
{
  "question": "What are the main concepts covered in this educational content?",
  "answer": "The content covers several important concepts..."
}
```

### **Debugging Steps:**

#### **1. Check n8n Execution Logs**
Look for these specific error messages:
- `❌ CRITICAL: PARSE CONCEPTS FAILED - USING FALLBACK!`
- `❌ CRITICAL: PARSE FLASHCARDS FAILED - USING FALLBACK!`

#### **2. Common Failure Points:**

**🔴 OpenAI API Issues:**
- **Invalid Node Configuration**: Use `resource: "chat"` with `operation: "Complete"` (NOT "message" or "completion")
- **API Key Invalid**: Check credentials in n8n settings
- **Rate Limits**: Monitor OpenAI usage dashboard
- **Model Access**: Ensure you have access to GPT-3.5/4
- **Token Limits**: Reduce transcript length for testing

**🔴 Transcript Issues:**
- **Empty/Invalid Transcript**: Check the input data
- **Special Characters**: Clean transcript of unusual formatting
- **Length**: Very short (<100 chars) or very long (>10k chars) transcripts

**🔴 JSON Parsing Issues:**
- **Malformed AI Response**: AI didn't return valid JSON
- **Missing Fields**: AI response missing required concept/flashcard fields
- **Encoding Issues**: Check for special characters in responses

#### **3. Quick Test with Minimal Data:**
```json
{
  "transcript": "Machine learning is a method of data analysis that automates analytical model building. It uses algorithms that iteratively learn from data without being explicitly programmed.",
  "sessionId": "test-123"
}
```

#### **4. Step-by-Step Debugging:**
1. **Test Extract Concepts**: Check if concepts are extracted successfully
2. **Test Generate Flashcards**: Verify flashcard generation from concepts  
3. **Test Coverage Analysis**: Ensure quality analysis works
4. **Test Improvements**: Verify enhancement logic functions

#### **5. Fallback Behavior:**
- **Parse Concepts fails** → Uses 3 generic concepts → May still generate decent flashcards
- **Parse Flashcards fails** → Uses 3 generic flashcards → **NO IMPROVEMENT POSSIBLE**
- **Coverage Analysis fails** → Uses basic improvement logic

#### **6. Quick Fixes:**
- **Restart Workflow**: Sometimes temporary API issues resolve
- **Reduce Input Size**: Test with shorter transcript
- **Check OpenAI Status**: Visit status.openai.com
- **Verify Credentials**: Re-enter OpenAI API key
- **Test Individual Nodes**: Run nodes manually in n8n

#### **7. Expected Success Logs:**
```
✅ Extracted 8 concepts:
   📍 High Priority: 4
   📍 Medium Priority: 3
   📍 Low Priority: 1
✅ Generated 10 flashcards from 8 concepts
🔄 Analyzing initial flashcards
📊 HIGH PRIORITY COVERAGE: 75.0%
🔄 Needs Improvement: true
🔄 Iteration 2: Improved to 12 flashcards
```

Happy flashcard generating! 🎓✨ 