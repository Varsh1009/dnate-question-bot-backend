const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { testConnection } = require('../config/dynamodb');

const authController = require('../controllers/authController');
const personaController = require('../controllers/personaController');
const questionController = require('../controllers/questionController');
const sessionController = require('../controllers/sessionController');
const recordingController = require('../controllers/recordingController');
const conversationController = require('../controllers/conversationController');

// Health
router.get('/health', async (req, res) => {
  try {
    const dbConnected = await testConnection();
    res.json({
      status: dbConnected ? '🟢 HEALTHY' : '🔴 UNHEALTHY',
      database: dbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ status: '🔴 UNHEALTHY', error: error.message });
  }
});

// Auth
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticateToken, authController.me);

// Personas
router.get('/personas', authenticateToken, personaController.getAllPersonas);
router.get('/personas/:id', authenticateToken, personaController.getPersonaById);

// Questions
router.get('/questions', authenticateToken, questionController.getAllQuestions);
router.get('/questions/filter', authenticateToken, questionController.filterQuestions);
router.get('/questions/categories', authenticateToken, questionController.getCategories);
router.get('/questions/category/:category', authenticateToken, questionController.getQuestionsByCategory);
router.get('/questions/persona/:personaId', authenticateToken, questionController.getQuestionsByPersona);
router.get('/questions/difficulty/:difficulty', authenticateToken, questionController.getQuestionsByDifficulty);
router.get('/questions/:id', authenticateToken, questionController.getQuestionById);

// Sessions
router.post('/sessions/start', authenticateToken, sessionController.startSession);
router.post('/sessions/:sessionId/answer', authenticateToken, sessionController.submitAnswer);
router.post('/sessions/:sessionId/complete', authenticateToken, sessionController.completeSession);
router.get('/sessions', authenticateToken, sessionController.getUserSessions);
router.get('/sessions/:sessionId', authenticateToken, sessionController.getSessionById);

// Recordings
router.post('/sessions/:sessionId/recording/upload-url', authenticateToken, recordingController.getUploadUrl);
router.post('/sessions/:sessionId/recording/process', authenticateToken, recordingController.processRecording);
router.get('/sessions/:sessionId/recording/:recordingIndex', authenticateToken, recordingController.getRecording);
router.get('/sessions/:sessionId/recordings', authenticateToken, recordingController.getSessionRecordings);

// Conversation History & Analytics (NEW!)
router.get('/sessions/:sessionId/conversation', authenticateToken, conversationController.getConversationHistory);
router.get('/history', authenticateToken, conversationController.getPracticeHistory);
router.post('/history/compare', authenticateToken, conversationController.comparePerformance);

module.exports = router;
