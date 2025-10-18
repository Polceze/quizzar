import Exam from '../models/Exam.js';
import Unit from '../models/Unit.js';

// Helper function to validate required fields and teacher ownership
const validateExamCreation = async (unit, teacherId) => {
  const existingUnit = await Unit.findById(unit); // Use 'unit' here
  if (!existingUnit || existingUnit.teacher.toString() !== teacherId.toString()) {
    return { error: 'Unit not found or you are not the unit teacher.', status: 403 };
  }
  return { unit: existingUnit };
};

// @desc    Create a new Exam/Quiz
// @route   POST /api/exams
// @access  Private/Teacher
export const createExam = async (req, res) => {
  const { unit, name, description, questions, durationMinutes, totalMarks, scheduledStart, scheduledEnd } = req.body;
  const creatorId = req.user._id;

  try {
    const validation = await validateExamCreation(unit, creatorId);
    if (validation.error) return res.status(validation.status).json({ message: validation.error });

    // Calculate actual total marks based on provided questions
    const actualTotalMarks = questions && questions.length > 0 
      ? totalMarks 
      : 0; // Set to 0 if no questions provided

    // Note: We are allowing a teacher to create an exam without questions initially (status: 'draft')
    const newExam = await Exam.create({
      creator: creatorId,
      unit: unit,
      name,
      description,
      questions: questions || [], // Start with an empty array if none provided
      durationMinutes,
      totalMarks: actualTotalMarks,
      scheduledStart,
      scheduledEnd,
      status: 'draft', // Always start in draft mode
    });

    res.status(201).json(newExam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all Exams created by the teacher
// @route   GET /api/exams
// @access  Private/Teacher
export const getTeacherExams = async (req, res) => {
  const teacherId = req.user._id;

  try {
    const exams = await Exam.aggregate([
      { $match: { creator: teacherId } },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'units', 
          localField: 'unit',
          foreignField: '_id',
          as: 'unitDetails'
        }
      },
      { $unwind: { path: '$unitDetails', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          name: 1,
          title: '$name', // Ensure consistent field naming
          durationMinutes: 1,
          status: 1,
          totalMarks: 1, // This will now show 0 for exams with no questions
          questionCount: { $size: '$questions' }, 
          unit: { name: '$unitDetails.name', code: '$unitDetails.code' }
        }
      }
    ]);

    res.status(200).json(exams);
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
    const validation = await validateExamCreation(unit, teacherId);
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
      .populate('unit', 'name code') // Populate unit name/code
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
  const { questions, totalMarks, durationMinutes, status, ...otherUpdates } = req.body;

  try {
    const updatedExam = await Exam.findOneAndUpdate(
        { _id: examId, creator: teacherId, status: { $ne: 'active' } }, // Prevent updating active exams
        { 
            questions: questions,
            totalMarks: totalMarks,
            durationMinutes: durationMinutes,
            ...(status && { status: status }),
            ...otherUpdates // Apply any other safe updates
        },
        { new: true, runValidators: true }
    );

    if (!updatedExam) {
        const examCheck = await Exam.findById(examId);
        if(examCheck && examCheck.status === 'active') {
             return res.status(400).json({ message: 'Cannot update an exam once it is active.' });
        }
        return res.status(404).json({ message: 'Exam not found or unauthorized.' });
    }

    res.status(200).json(updatedExam);

  } catch (error) {
    res.status(400).json({ message: error.message }); // Return 400 for validation errors
  }
};

// @desc    Delete an exam by ID
// @route   DELETE /api/exams/:examId
// @access  Private/Teacher
export const deleteExam = async (req, res) => {
    const { examId } = req.params;
    const teacherId = req.user._id;

    try {
        // Find and delete the exam, ensuring the user is the creator AND the exam is a 'draft'
        const exam = await Exam.findOneAndDelete({
            _id: examId,
            creator: teacherId,
            status: 'draft' // CRITICAL: Prevent deletion of published/active exams
        });

        if (!exam) {
            // Check if it failed because it wasn't found or because of the status
            const check = await Exam.findById(examId);
            if (check && check.status !== 'draft') {
                return res.status(400).json({ message: 'Only exams in "draft" status can be deleted.' });
            }
            return res.status(404).json({ message: 'Exam not found or you are not authorized to delete it.' });
        }

        res.status(200).json({ message: `Exam "${exam.name}" successfully deleted.` });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};