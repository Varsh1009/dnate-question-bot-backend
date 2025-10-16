const { HfInference } = require('@huggingface/inference');
require('dotenv').config();

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Analyze transcribed answer for quality, clarity, confidence
async function analyzeAnswer(transcription, question, persona) {
  const prompt = `You are analyzing an MSL's practice answer to a physician question.

Question: ${question}
Physician: ${persona.name} (${persona.specialty})
MSL's Answer: ${transcription}

Analyze this answer and provide scores (0-10) for:
1. Clarity - How clear and understandable is the response?
2. Confidence - Does the MSL sound confident and knowledgeable?
3. Relevance - Does it address the physician's question?
4. Medical Accuracy - Is the information scientifically sound?
5. Professionalism - Is the tone appropriate?

Also provide 3 specific improvement suggestions.

Return ONLY valid JSON:
{
  "scores": {
    "clarity": 7.5,
    "confidence": 8.0,
    "relevance": 9.0,
    "accuracy": 8.5,
    "professionalism": 9.0,
    "overall": 8.4
  },
  "strengths": ["point 1", "point 2"],
  "improvements": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "summary": "Brief overall feedback"
}`;

  try {
    const result = await hf.textGeneration({
      model: 'meta-llama/Meta-Llama-3-8B-Instruct',
      inputs: prompt,
      parameters: {
        max_new_tokens: 800,
        temperature: 0.3,
        return_full_text: false
      }
    });

    const responseText = result.generated_text;
    
    // Extract JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Failed to parse analysis JSON');
  } catch (error) {
    console.error('Analysis error:', error);
    throw new Error('Failed to analyze answer: ' + error.message);
  }
}

module.exports = {
  analyzeAnswer
};
