const { generateUploadUrl, generateDownloadUrl } = require('../config/s3');
const { docClient, TABLES } = require('../config/dynamodb');
const { transcribeRecording } = require('../services/transcriptionService');
const { analyzeAnswer } = require('../services/analysisService');

// Get pre-signed URL for uploading
exports.getUploadUrl = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { fileType } = req.body;
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

    if (sessionResult.Item.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const { uploadUrl, key } = await generateUploadUrl(
      sessionId, 
      fileType || 'video/webm'
    );

    res.json({
      success: true,
      uploadUrl,
      key,
      expiresIn: 600
    });
  } catch (error) {
    console.error('Get upload URL error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate upload URL'
    });
  }
};

// Process recording: transcribe + analyze
exports.processRecording = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { s3Key, duration, questionIndex } = req.body;
    const userId = req.user.userId;

    console.log('Processing recording:', s3Key);

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

    const question = session.questions[questionIndex];
    const personaResult = await docClient.get({
      TableName: TABLES.PERSONAS,
      Key: { personaId: session.personaId }
    }).promise();
    const persona = personaResult.Item;

    console.log('Step 1: Transcribing...');
    const transcription = await transcribeRecording(s3Key);
    console.log('Transcription:', transcription.substring(0, 100));

    console.log('Step 2: Analyzing...');
    const analysis = await analyzeAnswer(
      transcription,
      question.question,
      persona
    );

    const recordings = session.recordings || [];
    recordings.push({
      s3Key,
      duration,
      questionIndex,
      transcription,
      analysis,
      processedAt: Date.now(),
      uploadedAt: Date.now()
    });

    await docClient.update({
      TableName: TABLES.SESSIONS,
      Key: { sessionId },
      UpdateExpression: 'SET recordings = :recordings',
      ExpressionAttributeValues: {
        ':recordings': recordings
      }
    }).promise();

    res.json({
      success: true,
      message: 'Recording processed successfully',
      transcription,
      analysis,
      recordingIndex: recordings.length - 1
    });
  } catch (error) {
    console.error('Process recording error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process recording: ' + error.message
    });
  }
};

// Get recording with analysis
exports.getRecording = async (req, res) => {
  try {
    const { sessionId, recordingIndex } = req.params;
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

    if (sessionResult.Item.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const recordings = sessionResult.Item.recordings || [];
    const recording = recordings[parseInt(recordingIndex)];

    if (!recording) {
      return res.status(404).json({
        success: false,
        error: 'Recording not found'
      });
    }

    const downloadUrl = await generateDownloadUrl(recording.s3Key);

    res.json({
      success: true,
      downloadUrl,
      transcription: recording.transcription,
      analysis: recording.analysis,
      duration: recording.duration,
      uploadedAt: recording.uploadedAt,
      expiresIn: 3600
    });
  } catch (error) {
    console.error('Get recording error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recording'
    });
  }
};

// Get all recordings for session
exports.getSessionRecordings = async (req, res) => {
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

    if (sessionResult.Item.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const recordings = sessionResult.Item.recordings || [];

    res.json({
      success: true,
      count: recordings.length,
      recordings: recordings.map((r, index) => ({
        index,
        duration: r.duration,
        uploadedAt: r.uploadedAt,
        hasTranscription: !!r.transcription,
        hasAnalysis: !!r.analysis,
        overallScore: r.analysis?.scores?.overall
      }))
    });
  } catch (error) {
    console.error('Get recordings error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recordings'
    });
  }
};
