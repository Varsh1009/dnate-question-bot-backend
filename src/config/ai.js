const { HfInference } = require('@huggingface/inference');
require('dotenv').config();

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

async function generateQuestions(persona, difficulty = 'medium', count = 5) {
  const prompt = `Generate ${count} realistic, challenging questions that ${persona.name} (${persona.title}, ${persona.specialty}) would ask an MSL.

Context: ${persona.practice_setting.type}, ${persona.communication_style.tone}
Key Priorities: ${persona.priorities.slice(0, 3).join(', ')}

Return ONLY a JSON array:
[{"question":"text","category":"Clinical","difficulty":"${difficulty}","timeLimit":90}]`;

  try {
    const result = await hf.chatCompletion({
      model: 'meta-llama/Meta-Llama-3-8B-Instruct',
      messages: [
        { role: 'system', content: 'You generate medical questions. Return only valid JSON.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 1500,
      temperature: 0.7
    });

    const responseText = result.choices[0].message.content;
    
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    throw new Error('Failed to parse JSON');
  } catch (error) {
    console.error('HF Error:', error.message);
    throw new Error('Failed to generate questions: ' + error.message);
  }
}

module.exports = { generateQuestions };
