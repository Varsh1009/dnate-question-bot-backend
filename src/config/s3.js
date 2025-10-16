const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
require('dotenv').config();

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'dnate-practice-recordings';

// Generate pre-signed URL for uploading
async function generateUploadUrl(sessionId, fileType = 'video/webm') {
  const key = `recordings/${sessionId}/${Date.now()}.webm`;
  
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: fileType,
    Metadata: {
      sessionId: sessionId,
      uploadedAt: new Date().toISOString()
    }
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 600 });
  
  return {
    uploadUrl,
    key
  };
}

// Generate pre-signed URL for downloading
async function generateDownloadUrl(key) {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key
  });

  const downloadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  return downloadUrl;
}

module.exports = {
  generateUploadUrl,
  generateDownloadUrl,
  BUCKET_NAME,
  s3Client
};
