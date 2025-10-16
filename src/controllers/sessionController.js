const { v4: uuidv4 } = require('uuid');
const { docClient, TABLES } = require('../config/dynamodb');
const { generateQuestions } = require('../config/ai');

exports.startSession = async (req, res) => {
  try {
    const { personaId, difficulty, questionCount } = req.body;
    const userId = req.user.userId;

    if (!personaId) {
      return res.status(400).json({ 
        success: false,
        error: 'Persona ID required' 
      });
    }

    const personaResult = await docClient.get({
      TableName: TABLES.PERSONAS,
      Key: { personaId }
    }).promise();

    if (!personaResult.Item) {
      return res.status(404).json({ 
        success: false,
        error: 'Persona not found' 
      });
    }

    const persona = personaResult.Item;
    const questions = await generateQuestions(
      persona, 
      difficulty || 'medium', 
      questionCount || 5
    );

    const sessionId = uuidv4();
    const session = {
      sessionId,
      userId,
      personaId,
      personaName: persona.name,
      difficulty: difficulty || 'medium',
      questions,
      currentQuestionIndex: 0,
      answers: [],
      status: 'in_progress',
      createdAt: Date.now()
    };

    await docClient.put({
      TableName: TABLES.SESSIONS,
      Item: session
    }).promise();

    res.status(201).json({
      success: true,
      message: 'Session started',
      session: {
        sessionId,
        personaId,
        personaName: persona.name,
        questions,
        totalQuestions: questions.length
      }
    });
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to start session' 
    });
  }
};

exports.submitAnswer = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { questionIndex, answer, timeTaken, confidence } = req.body;
    const userId = req.user.userId;

    const sessionResult = await docClient.get({
      TableName: TABLES.SESSIONS,
      Key: { sessionId }
    }).promise();

    if (!sessionResult.Item) {
      return res.status(404).json({ 
        success: false,
        error: 'Session not found' 
      });
    }

    const session = sessionResult.Item;

    if (session.userId !== userId) {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized' 
      });
    }

    const answers = session.answers || [];
    answers.push({
      questionIndex,
      answer,
      timeTaken,
      confidence,
      submittedAt: Date.now()
    });

    await docClient.update({
      TableName: TABLES.SESSIONS,
      Key: { sessionId },
      UpdateExpression: 'SET answers = :answers, currentQuestionIndex = :nextIndex',
      ExpressionAttributeValues: {
        ':answers': answers,
        ':nextIndex': questionIndex + 1
      }
    }).promise();

    res.json({
      success: true,
      message: 'Answer submitted',
      nextQuestionIndex: questionIndex + 1
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to submit answer' 
    });
  }
};

exports.completeSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    const sessionResult = await docClient.get({
      TableName: TABLES.SESSIONS,
      Key: { sessionId }
    }).promise();

    if (!sessionResult.Item) {
      return res.status(404).json({ 
        success: false,
        error: 'Session not found' 
      });
    }

    const session = sessionResult.Item;

    if (session.userId !== userId) {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized' 
      });
    }

    const totalTime = session.answers.reduce((sum, a) => sum + (a.timeTaken || 0), 0);
    const avgConfidence = session.answers.length > 0 
      ? session.answers.reduce((sum, a) => sum + (a.confidence || 0), 0) / session.answers.length
      : 0;

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
      message: 'Session completed',
      stats: {
        totalQuestions: session.questions.length,
        totalTime,
        avgConfidence: avgConfidence.toFixed(2)
      }
    });
  } catch (error) {
    console.error('Complete session error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to complete session' 
    });
  }
};

exports.getUserSessions = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await docClient.query({
      TableName: TABLES.SESSIONS,
      IndexName: 'UserSessionsIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId },
      ScanIndexForward: false
    }).promise();

    res.json({
      success: true,
      count: result.Items.length,
      sessions: result.Items
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch sessions' 
    });
  }
};

exports.getSessionById = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user.userId;

    const result = await docClient.get({
      TableName: TABLES.SESSIONS,
      Key: { sessionId }
    }).promise();

    if (!result.Item) {
      return res.status(404).json({ 
        success: false,
        error: 'Session not found' 
      });
    }

    if (result.Item.userId !== userId) {
      return res.status(403).json({ 
        success: false,
        error: 'Unauthorized' 
      });
    }

    res.json({
      success: true,
      session: result.Item
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch session' 
    });
  }
};
