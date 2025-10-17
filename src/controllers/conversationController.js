const { docClient, TABLES } = require('../config/dynamodb');

// Get complete conversation history for a session
exports.getConversationHistory = async (req, res) => {
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

    // Build conversation history
    const conversation = session.questions.map((q, index) => {
      const answer = session.answers?.find(a => a.questionIndex === index);
      const recording = session.recordings?.find(r => r.questionIndex === index);

      return {
        questionIndex: index,
        question: {
          text: q.question,
          category: q.category,
          difficulty: q.difficulty,
          timeLimit: q.timeLimit
        },
        answer: answer ? {
          text: answer.answer,
          timeTaken: answer.timeTaken,
          confidence: answer.confidence,
          submittedAt: answer.submittedAt
        } : null,
        recording: recording ? {
          transcription: recording.transcription,
          duration: recording.duration,
          analysis: recording.analysis,
          uploadedAt: recording.uploadedAt
        } : null
      };
    });

    res.json({
      success: true,
      sessionId,
      personaName: session.personaName,
      status: session.status,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      conversation,
      summary: {
        totalQuestions: session.questions.length,
        answeredQuestions: session.answers?.length || 0,
        recordedAnswers: session.recordings?.length || 0,
        overallScore: session.recordings?.length > 0
          ? (session.recordings.reduce((sum, r) => sum + (r.analysis?.scores?.overall || 0), 0) / session.recordings.length).toFixed(2)
          : null
      }
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch conversation'
    });
  }
};

// Get user's practice history with trends
exports.getPracticeHistory = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await docClient.query({
      TableName: TABLES.SESSIONS,
      IndexName: 'UserSessionsIndex',
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: { ':userId': userId },
      ScanIndexForward: false
    }).promise();

    const sessions = result.Items;

    // Calculate overall stats
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === 'completed');
    
    const allRecordings = sessions.flatMap(s => s.recordings || []);
    const avgOverallScore = allRecordings.length > 0
      ? (allRecordings.reduce((sum, r) => sum + (r.analysis?.scores?.overall || 0), 0) / allRecordings.length).toFixed(2)
      : 0;

    // Calculate score trends
    const scoreTrend = sessions
      .filter(s => s.recordings && s.recordings.length > 0)
      .map(s => ({
        date: new Date(s.createdAt).toISOString().split('T')[0],
        sessionId: s.sessionId,
        personaName: s.personaName,
        avgScore: (s.recordings.reduce((sum, r) => sum + (r.analysis?.scores?.overall || 0), 0) / s.recordings.length).toFixed(2)
      }))
      .reverse(); // Oldest first for trend

    // Category breakdown
    const categoryStats = {};
    sessions.forEach(s => {
      s.questions?.forEach(q => {
        if (!categoryStats[q.category]) {
          categoryStats[q.category] = { count: 0, totalScore: 0 };
        }
        categoryStats[q.category].count++;
      });
    });

    res.json({
      success: true,
      stats: {
        totalSessions,
        completedSessions: completedSessions.length,
        totalRecordings: allRecordings.length,
        avgOverallScore,
        categoryBreakdown: categoryStats
      },
      scoreTrend,
      recentSessions: sessions.slice(0, 10).map(s => ({
        sessionId: s.sessionId,
        personaName: s.personaName,
        status: s.status,
        questionsCount: s.questions?.length || 0,
        recordingsCount: s.recordings?.length || 0,
        createdAt: s.createdAt
      }))
    });
  } catch (error) {
    console.error('Get practice history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch practice history'
    });
  }
};

// Compare performance across sessions
exports.comparePerformance = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { sessionIds } = req.body; // Array of session IDs to compare

    if (!sessionIds || sessionIds.length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Provide at least 2 session IDs to compare'
      });
    }

    const comparisons = [];

    for (const sessionId of sessionIds) {
      const result = await docClient.get({
        TableName: TABLES.SESSIONS,
        Key: { sessionId }
      }).promise();

      if (result.Item && result.Item.userId === userId) {
        const session = result.Item;
        const recordings = session.recordings || [];
        
        const avgScores = recordings.length > 0 ? {
          clarity: (recordings.reduce((sum, r) => sum + (r.analysis?.scores?.clarity || 0), 0) / recordings.length).toFixed(2),
          confidence: (recordings.reduce((sum, r) => sum + (r.analysis?.scores?.confidence || 0), 0) / recordings.length).toFixed(2),
          relevance: (recordings.reduce((sum, r) => sum + (r.analysis?.scores?.relevance || 0), 0) / recordings.length).toFixed(2),
          accuracy: (recordings.reduce((sum, r) => sum + (r.analysis?.scores?.accuracy || 0), 0) / recordings.length).toFixed(2),
          overall: (recordings.reduce((sum, r) => sum + (r.analysis?.scores?.overall || 0), 0) / recordings.length).toFixed(2)
        } : null;

        comparisons.push({
          sessionId,
          personaName: session.personaName,
          date: new Date(session.createdAt).toISOString().split('T')[0],
          questionsAnswered: recordings.length,
          scores: avgScores
        });
      }
    }

    res.json({
      success: true,
      comparison: comparisons
    });
  } catch (error) {
    console.error('Compare performance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare performance'
    });
  }
};
