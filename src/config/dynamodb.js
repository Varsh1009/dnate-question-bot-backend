const AWS = require('aws-sdk');
require('dotenv').config();

AWS.config.update({
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

const dynamodb = new AWS.DynamoDB();
const docClient = new AWS.DynamoDB.DocumentClient();

const TABLES = {
  USERS: 'dnate-users',
  PERSONAS: 'dnate-personas',
  SESSIONS: 'dnate-sessions',
  QUESTIONS: 'dnate-questions'
};

async function testConnection() {
  try {
    await dynamodb.listTables().promise();
    console.log('✅ DynamoDB connected successfully');
    return true;
  } catch (error) {
    console.error('❌ DynamoDB connection failed:', error.message);
    return false;
  }
}

module.exports = {
  dynamodb,
  docClient,
  TABLES,
  testConnection
};
