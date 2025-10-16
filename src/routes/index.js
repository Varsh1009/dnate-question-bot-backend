const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

const authController = require('../controllers/authController');
const personaController = require('../controllers/personaController');
const sessionController = require('../controllers/sessionController');

// Health check - simple synchronous version
router.get('/health', (req, res) => {
  res.json({
    status: '🟢 HEALTHY',
    database: 'connected',
    timestamp: new Date().toISOString(),
    service: 'DNATE Question Bot API'
  });
});

// Auth routes
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticateToken, authController.me);

// Persona routes
router.get('/personas', authenticateToken, personaController.getAllPersonas);
router.get('/personas/:id', authenticateToken, personaController.getPersonaById);

// Session routes
router.post('/sessions/start', authenticateToken, sessionController.startSession);
router.post('/sessions/:sessionId/answer', authenticateToken, sessionController.submitAnswer);
router.post('/sessions/:sessionId/complete', authenticateToken, sessionController.completeSession);
router.get('/sessions', authenticateToken, sessionController.getUserSessions);
router.get('/sessions/:sessionId', authenticateToken, sessionController.getSessionById);

module.exports = router;
