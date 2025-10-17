const { HfInference } = require('@huggingface/inference');
const { docClient, TABLES } = require('../config/dynamodb');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Start conversational session
exports.startConversation = async (req, res) => {
  try {
    const { personaId } = req.body;
    const userId = req.user.userId;

    const personaResult = await docClient.get({
      TableName: TABLES.PERSONAS,
      Key: { personaId }
    }).promise();

    if (!personaResult.Item) {
      return res.status(404).json({ success: false, error: 'Persona not found' });
    }

    const persona = personaResult.Item;
    const sessionId = uuidv4();

    // Initial question
    const firstQuestion = persona.typical_questions[0];

    const session = {
      sessionId,
      userId,
      personaId,
      personaName: persona.name,
      conversationHistory: [
        {
          role: 'assistant',
          message: `Hello, I'm ${persona.name}, ${persona.title}. ${firstQuestion}`,
          timestamp: Date.now()
        }
      ],
      status: 'active',
      createdAt: Date.now()
    };

    await docClient.put({
      TableName: TABLES.SESSIONS,
      Item: session
    }).promise();

    res.json({
      success: true,
      sessionId,
      personaName: persona.name,
      message: session.conversationHistory[0].message
    });
  } catch (error) {
    console.error('Start conversation error:', error);
    res.status(500).json({ success: false, error: 'Failed to start conversation' });
  }
};

// Send message and get bot response
exports.sendMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message } = req.body;
    const userId = req.user.userId;

    const sessionResult = await docClient.get({
      TableName: TABLES.SESSIONS,
      Key: { sessionId }
    }).promise();

    if (!sessionResult.Item || sessionResult.Item.userId !== userId) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    const session = sessionResult.Item;
    const personaResult = await docClient.get({
      TableName: TABLES.PERSONAS,
      Key: { personaId: session.personaId }
    }).promise();
    const persona = personaResult.Item;

    // Add user message to history
    session.conversationHistory.push({
      role: 'user',
      message,
      timestamp: Date.now()
    });

    // Generate bot response with AI
    const conversationContext = session.conversationHistory
      .map(m => `${m.role === 'user' ? 'MSL' : persona.name}: ${m.message}`)
      .join('\n');

    const prompt = `You are ${persona.name}, a ${persona.specialty} specialist. You are ${persona.communication_style.tone}.

Conversation so far:
${conversationContext}

The MSL just answered. You should:
1. Briefly evaluate their answer (1 sentence - was it good/weak?)
2. Ask ONE tough follow-up question or probe deeper into their answer
3. Stay in character as a ${persona.communication_style.tone} physician

Keep response under 100 words. Be direct and challenging.`;

    const result = await hf.chatCompletion({
      model: 'meta-llama/Meta-Llama-3-8B-Instruct',
      messages: [
        { role: 'system', content: `You are ${persona.name}, a skeptical physician.` },
        { role: 'user', content: prompt }
      ],
      max_tokens: 200,
      temperature: 0.8
    });

    const botResponse = result.choices[0].message.content;

    // Add bot response to history
    session.conversationHistory.push({
      role: 'assistant',
      message: botResponse,
      timestamp: Date.now()
    });

    // Update session
    await docClient.update({
      TableName: TABLES.SESSIONS,
      Key: { sessionId },
      UpdateExpression: 'SET conversationHistory = :history',
      ExpressionAttributeValues: {
        ':history': session.conversationHistory
      }
    }).promise();

    res.json({
      success: true,
      message: botResponse,
      conversationLength: session.conversationHistory.length
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
};

// Get conversation history
exports.getConversation = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    const sessionResult = await docClient.get({
      TableName: TABLES.SESSIONS,
      Key: { sessionId }
    }).promise();

    if (!sessionResult.Item || sessionResult.Item.userId !== userId) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    res.json({
      success: true,
      conversationHistory: sessionResult.Item.conversationHistory,
      personaName: sessionResult.Item.personaName
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({ success: false, error: 'Failed to get conversation' });
  }
};

// End conversation and get final evaluation
exports.endConversation = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    const sessionResult = await docClient.get({
      TableName: TABLES.SESSIONS,
      Key: { sessionId }
    }).promise();

    if (!sessionResult.Item || sessionResult.Item.userId !== userId) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    await docClient.update({
      TableName: TABLES.SESSIONS,
      Key: { sessionId },
      UpdateExpression: 'SET #status = :status, completedAt = :completedAt',
      ExpressionAttributeNames: { '#status': 'status' },
      ExpressionAttributeValues: {
        ':status': 'completed',
        ':completedAt': Date.now()
      }
    }).promise();

    res.json({
      success: true,
      message: 'Conversation ended',
      totalMessages: sessionResult.Item.conversationHistory.length
    });
  } catch (error) {
    console.error('End conversation error:', error);
    res.status(500).json({ success: false, error: 'Failed to end conversation' });
  }
};
