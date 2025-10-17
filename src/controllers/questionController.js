const questionsData = require('../data/questions.json');

// Get all questions
exports.getAllQuestions = async (req, res) => {
  try {
    res.json({
      success: true,
      count: questionsData.questions.length,
      metadata: questionsData.metadata,
      questions: questionsData.questions
    });
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch questions'
    });
  }
};

// Get single question by ID
exports.getQuestionById = async (req, res) => {
  try {
    const { id } = req.params;
    const question = questionsData.questions.find(q => q.id === parseInt(id));

    if (!question) {
      return res.status(404).json({
        success: false,
        error: 'Question not found'
      });
    }

    res.json({
      success: true,
      question
    });
  } catch (error) {
    console.error('Get question error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch question'
    });
  }
};

// Get questions by category
exports.getQuestionsByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const questions = questionsData.questions.filter(
      q => q.category.toLowerCase() === category.toLowerCase()
    );

    res.json({
      success: true,
      count: questions.length,
      category,
      questions
    });
  } catch (error) {
    console.error('Get questions by category error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch questions'
    });
  }
};

// Get questions by persona
exports.getQuestionsByPersona = async (req, res) => {
  try {
    const { personaId } = req.params;
    const questions = questionsData.questions.filter(
      q => q.persona.includes(personaId)
    );

    res.json({
      success: true,
      count: questions.length,
      personaId,
      questions
    });
  } catch (error) {
    console.error('Get questions by persona error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch questions'
    });
  }
};

// Get questions by difficulty
exports.getQuestionsByDifficulty = async (req, res) => {
  try {
    const { difficulty } = req.params;
    const questions = questionsData.questions.filter(
      q => q.difficulty === difficulty
    );

    res.json({
      success: true,
      count: questions.length,
      difficulty,
      questions
    });
  } catch (error) {
    console.error('Get questions by difficulty error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch questions'
    });
  }
};

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    res.json({
      success: true,
      categories: questionsData.categories
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
};

// Filter questions with multiple criteria
exports.filterQuestions = async (req, res) => {
  try {
    const { category, difficulty, persona } = req.query;
    
    let filtered = questionsData.questions;

    if (category) {
      filtered = filtered.filter(q => 
        q.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (difficulty) {
      filtered = filtered.filter(q => q.difficulty === difficulty);
    }

    if (persona) {
      filtered = filtered.filter(q => q.persona.includes(persona));
    }

    res.json({
      success: true,
      count: filtered.length,
      filters: { category, difficulty, persona },
      questions: filtered
    });
  } catch (error) {
    console.error('Filter questions error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to filter questions'
    });
  }
};
