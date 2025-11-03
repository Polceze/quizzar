import Exam from '../models/Exam.js';
import Unit from '../models/Unit.js';

// Helper function to validate required fields and teacher ownership
const validateExamCreation = async (unitId, teacherId) => {
  if (!mongoose.Types.ObjectId.isValid(unitId)) {
    return { error: 'Invalid unit ID.', status: 400 };
  }
  
  const existingUnit = await Unit.findById(unitId);
  if (!existingUnit) {
    return { error: 'Unit not found.', status: 404 };
  }
  
  if (existingUnit.teacher.toString() !== teacherId.toString()) {
    return { error: 'You are not the teacher of this unit.', status: 403 };
  }
  
  return { unit: existingUnit };
};

// @desc    Create a new Exam/Quiz
// @route   POST /api/exams
// @access  Private/Teacher
export const createExam = async (req, res) => {
  const { unit, name, description, questions, durationMinutes, totalMarks, scheduledStart, scheduledEnd } = req.body;
  const creatorId = req.user._id;

  // Basic validation
  if (!name || !durationMinutes) {
    return res.status(400).json({ message: 'Name and duration are required fields.' });
  }

  try {
    const validation = await validateExamCreation(unit, creatorId);
    if (validation.error) return res.status(validation.status).json({ message: validation.error });

    // Validate scheduled times if provided
    if (scheduledStart && scheduledEnd && new Date(scheduledStart) >= new Date(scheduledEnd)) {
      return res.status(400).json({ message: 'Scheduled end time must be after start time.' });
    }

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
    // First check if exam exists and user has permission
    const existingExam = await Exam.findById(examId);
    if (!existingExam) {
      return res.status(404).json({ message: 'Exam not found.' });
    }

    if (existingExam.creator.toString() !== teacherId.toString()) {
      return res.status(403).json({ message: 'Unauthorized access to this exam.' });
    }

    // Prevent updating active exams
    if (existingExam.status === 'active') {
      return res.status(400).json({ message: 'Cannot update an active exam.' });
    }

    // Validate status transitions
    if (status && !['draft', 'archived'].includes(status)) {
      return res.status(400).json({ 
        message: 'Invalid status transition. Can only change to draft or archived.' 
      });
    }

    const updatedExam = await Exam.findByIdAndUpdate(
      examId,
      { 
        questions: questions,
        totalMarks: totalMarks,
        durationMinutes: durationMinutes,
        ...(status && { status: status }),
        ...otherUpdates
      },
      { new: true, runValidators: true }
    );

    res.status(200).json(updatedExam);

  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error', 
        errors: error.errors 
      });
    }
    res.status(500).json({ message: error.message });
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

// @desc    Publish an exam (draft → active)
// @route   PUT /api/exams/:examId/publish
// @access  Private/Teacher
export const publishExam = async (req, res) => {
  const { examId } = req.params;
  const teacherId = req.user._id;

  try {
    const exam = await Exam.findById(examId);
    
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found.' });
    }

    if (exam.creator.toString() !== teacherId.toString()) {
      return res.status(403).json({ message: 'Unauthorized access to this exam.' });
    }

    if (exam.status !== 'draft') {
      return res.status(400).json({ 
        message: 'Only exams in draft status can be published.' 
      });
    }

    // Validate that exam has questions before publishing
    if (!exam.questions || exam.questions.length === 0) {
      return res.status(400).json({ 
        message: 'Cannot publish an exam without questions.' 
      });
    }

    exam.status = 'active';
    await exam.save();

    res.status(200).json({ 
      message: 'Exam published successfully.', 
      exam 
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Archive an exam (active → archived)
// @route   PUT /api/exams/:examId/archive
// @access  Private/Teacher
export const archiveExam = async (req, res) => {
  const { examId } = req.params;
  const teacherId = req.user._id;

  try {
    const exam = await Exam.findById(examId);
    
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found.' });
    }

    if (exam.creator.toString() !== teacherId.toString()) {
      return res.status(403).json({ message: 'Unauthorized access to this exam.' });
    }

    if (exam.status !== 'active') {
      return res.status(400).json({ 
        message: 'Only active exams can be archived.' 
      });
    }

    exam.status = 'archived';
    await exam.save();

    res.status(200).json({ 
      message: 'Exam archived successfully.', 
      exam 
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};