import Exam from '../models/Exam.js';
import Unit from '../models/Unit.js';

// Helper function to validate required fields and teacher ownership
const validateExamCreation = async (unitId, teacherId) => {
  const unit = await Unit.findById(unitId);
  if (!unit || unit.teacher.toString() !== teacherId.toString()) {
    return { error: 'Unit not found or you are not the unit teacher.', status: 403 };
  }
  return { unit };
};

// @desc    Create a new Exam/Quiz
// @route   POST /api/exams
// @access  Private/Teacher
export const createExam = async (req, res) => {
  const { unitId, title, description, questions, durationMinutes, totalMarks, scheduledStart, scheduledEnd } = req.body;
  const creatorId = req.user._id;

  try {
    const validation = await validateExamCreation(unitId, creatorId);
    if (validation.error) return res.status(validation.status).json({ message: validation.error });
    
    // Note: We are allowing a teacher to create an exam without questions initially (status: 'draft')

    const newExam = await Exam.create({
      creator: creatorId,
      unit: unitId,
      title,
      description,
      questions: questions || [], // Start with an empty array if none provided
      durationMinutes,
      totalMarks,
      scheduledStart,
      scheduledEnd,
      status: 'draft', // Always start in draft mode
    });

    res.status(201).json(newExam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all Exams created by the teacher for a specific Unit
// @route   GET /api/exams/unit/:unitId
// @access  Private/Teacher
export const getExamsByUnit = async (req, res) => {
  const { unitId } = req.params;
  const teacherId = req.user._id;

  try {
    const validation = await validateExamCreation(unitId, teacherId);
    if (validation.error) return res.status(validation.status).json({ message: validation.error });

    const exams = await Exam.find({ unit: unitId, creator: teacherId })
      .populate('unit', 'name code')
      .select('-questions'); // Don't send all question data in the list view

    res.status(200).json(exams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get a single Exam by ID (for editing)
// @route   GET /api/exams/:examId
// @access  Private/Teacher
export const getExamById = async (req, res) => {
  const { examId } = req.params;
  const teacherId = req.user._id;

  try {
    const exam = await Exam.findById(examId)
      .populate('questions'); // Fully populate questions for editing

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found.' });
    }

    // Authorization check
    if (exam.creator.toString() !== teacherId.toString()) {
      return res.status(403).json({ message: 'Unauthorized access to this exam.' });
    }

    res.status(200).json(exam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update an existing Exam (Title, Settings, Questions)
// @route   PUT /api/exams/:examId
// @access  Private/Teacher
export const updateExam = async (req, res) => {
  const { examId } = req.params;
  const teacherId = req.user._id;
  const updates = req.body;

  try {
    const exam = await Exam.findById(examId);

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found.' });
    }

    // Authorization check
    if (exam.creator.toString() !== teacherId.toString()) {
      return res.status(403).json({ message: 'Unauthorized to update this exam.' });
    }

    // Prevent updates if the exam is already active
    if (exam.status === 'active') {
        return res.status(400).json({ message: 'Cannot update an exam once it is active.' });
    }
    
    // Apply updates
    Object.assign(exam, updates);

    const updatedExam = await exam.save();
    res.status(200).json(updatedExam);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};