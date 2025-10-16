const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { docClient, TABLES } = require('../config/dynamodb');

exports.register = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false,
        error: 'Email, password, and name required' 
      });
    }

    const existingUser = await docClient.query({
      TableName: TABLES.USERS,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email }
    }).promise();

    if (existingUser.Items.length > 0) {
      return res.status(409).json({ 
        success: false,
        error: 'User already exists' 
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    
    const user = {
      userId,
      email,
      password: hashedPassword,
      name,
      createdAt: Date.now(),
      totalSessions: 0
    };

    await docClient.put({
      TableName: TABLES.USERS,
      Item: user
    }).promise();

    const token = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token,
      user: { userId, email, name }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Registration failed' 
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        error: 'Email and password required' 
      });
    }

    const result = await docClient.query({
      TableName: TABLES.USERS,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: { ':email': email }
    }).promise();

    if (result.Items.length === 0) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }

    const user = result.Items[0];
    const validPassword = await bcrypt.compare(password, user.password);
    
    if (!validPassword) {
      return res.status(401).json({ 
        success: false,
        error: 'Invalid credentials' 
      });
    }

    const token = jwt.sign(
      { userId: user.userId, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        userId: user.userId,
        email: user.email,
        name: user.name,
        totalSessions: user.totalSessions || 0
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Login failed' 
    });
  }
};

exports.me = async (req, res) => {
  try {
    const result = await docClient.get({
      TableName: TABLES.USERS,
      Key: { userId: req.user.userId }
    }).promise();

    if (!result.Item) {
      return res.status(404).json({ 
        success: false,
        error: 'User not found' 
      });
    }

    const { password, ...userWithoutPassword } = result.Item;
    res.json({ 
      success: true,
      user: userWithoutPassword 
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch user' 
    });
  }
};
