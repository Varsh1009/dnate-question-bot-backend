const { docClient, TABLES } = require('../config/dynamodb');

exports.getAllPersonas = async (req, res) => {
  try {
    const result = await docClient.scan({
      TableName: TABLES.PERSONAS
    }).promise();

    res.json({
      success: true,
      count: result.Items.length,
      personas: result.Items
    });
  } catch (error) {
    console.error('Get personas error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch personas' 
    });
  }
};

exports.getPersonaById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await docClient.get({
      TableName: TABLES.PERSONAS,
      Key: { personaId: id }
    }).promise();

    if (!result.Item) {
      return res.status(404).json({ 
        success: false,
        error: 'Persona not found' 
      });
    }

    res.json({
      success: true,
      persona: result.Item
    });
  } catch (error) {
    console.error('Get persona error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to fetch persona' 
    });
  }
};
