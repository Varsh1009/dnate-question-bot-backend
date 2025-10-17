const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { testConnection } = require('../config/dynamodb');

const authController = require('../controllers/authController');
const personaController = require('../controllers/personaController');
const sessionController = require('../controllers/sessionController');
const recordingController = require('../controllers/recordingController');
const questionController = require('../controllers/questionController');

// Health check
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

// Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticateToken, authController.me);

// Persona routes
router.get('/personas', authenticateToken, personaController.getAllPersonas);
router.get('/personas/:id', authenticateToken, personaController.getPersonaById);

// Question routes (NEW!)
router.get('/questions', authenticateToken, questionController.getAllQuestions);
router.get('/questions/filter', authenticateToken, questionController.filterQuestions);
router.get('/questions/categories', authenticateToken, questionController.getCategories);
router.get('/questions/category/:category', authenticateToken, questionController.getQuestionsByCategory);
router.get('/questions/persona/:personaId', authenticateToken, questionController.getQuestionsByPersona);
router.get('/questions/difficulty/:difficulty', authenticateToken, questionController.getQuestionsByDifficulty);
router.get('/questions/:id', authenticateToken, questionController.getQuestionById);

// Session routes
router.post('/sessions/start', authenticateToken, sessionController.startSession);
router.post('/sessions/:sessionId/answer', authenticateToken, sessionController.submitAnswer);
router.post('/sessions/:sessionId/complete', authenticateToken, sessionController.completeSession);
router.get('/sessions', authenticateToken, sessionController.getUserSessions);
router.get('/sessions/:sessionId', authenticateToken, sessionController.getSessionById);

// Recording routes
router.post('/sessions/:sessionId/recording/upload-url', authenticateToken, recordingController.getUploadUrl);
router.post('/sessions/:sessionId/recording/process', authenticateToken, recordingController.processRecording);
router.get('/sessions/:sessionId/recording/:recordingIndex', authenticateToken, recordingController.getRecording);
router.get('/sessions/:sessionId/recordings', authenticateToken, recordingController.getSessionRecordings);

module.exports = router;
