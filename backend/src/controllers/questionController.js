import Question from '../models/Question.js';
import Unit from '../models/Unit.js';

// @desc    Create a new question
// @route   POST /api/questions
// @access  Private/Teacher
export const createQuestion = async (req, res) => {
  const { unitId, questionText, questionType, options, correctAnswer, difficulty } = req.body;
  const creatorId = req.user._id;

  try {
    // 1. Authorization: Ensure the unit exists and belongs to the teacher
    const unit = await Unit.findById(unitId);
    if (!unit || unit.teacher.toString() !== creatorId.toString()) {
      return res.status(403).json({ message: 'Unit not found or you are not the unit teacher.' });
    }

    // 2. Create the question
    const newQuestion = await Question.create({
      creator: creatorId,
      unit: unitId,
      questionText,
      questionType,
      options: questionType === 'MCQ' ? options : undefined, // Only save options for MCQ
      correctAnswer,
      difficulty,
    });

    res.status(201).json(newQuestion);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all questions for a specific unit
// @route   GET /api/questions/unit/:unitId
// @access  Private/Teacher
export const getQuestionsByUnit = async (req, res) => {
  const { unitId } = req.params;
  const userId = req.user._id;

  try {
    // 1. Authorization: Ensure the user is the teacher of the unit
    const unit = await Unit.findById(unitId);
    if (!unit || unit.teacher.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Unauthorized access to questions for this unit.' });
    }

    // 2. Fetch questions
    const questions = await Question.find({ unit: unitId }).populate('creator', 'email');

    res.status(200).json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};