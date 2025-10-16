const { HfInference } = require('@huggingface/inference');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
require('dotenv').config();

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

// Transcribe audio from S3 using Whisper
async function transcribeRecording(s3Key) {
  try {
    console.log('Fetching recording from S3:', s3Key);
    
    // Get audio file from S3
    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME,
      Key: s3Key
    });
    
    const response = await s3Client.send(command);
    const audioBuffer = await streamToBuffer(response.Body);
    
    console.log('Transcribing with Whisper...');
    
    // Use Whisper for speech-to-text
    const result = await hf.automaticSpeechRecognition({
      model: 'openai/whisper-base',
      data: audioBuffer
    });
    
    return result.text;
  } catch (error) {
    console.error('Transcription error:', error);
    throw new Error('Failed to transcribe recording: ' + error.message);
  }
}

// Helper to convert stream to buffer
async function streamToBuffer(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

module.exports = {
  transcribeRecording
};
