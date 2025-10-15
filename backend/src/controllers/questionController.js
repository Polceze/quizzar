import Question from '../models/Question.js';
import Unit from '../models/Unit.js';

// @desc    Create a new question
// @route   POST /api/questions
// @access  Private/Teacher
export const createQuestion = async (req, res) => {
    try {
        const { unit, text, questionType, options, correctAnswerIndex, points } = req.body;
        const teacherId = req.user._id;

        // 1. Basic Validation
        if (!unit || !text || !questionType || !options || !points) {
            return res.status(400).json({ message: 'Missing required fields for question creation.' });
        }
        
        // Set option count based on question type
        if (questionType === 'MCQ' && options.length !== 4) {
            return res.status(400).json({ message: 'MCQ questions require exactly 4 options.' });
        }
        if (questionType === 'T/F' && options.length !== 2) {
             return res.status(400).json({ message: 'T/F questions require exactly 2 options (True, False).' });
        }
        
        // 2. Authorization and Data Integrity Check
        const relatedUnit = await Unit.findOne({ _id: unit, teacher: teacherId });

        if (!relatedUnit) {
            return res.status(403).json({ message: 'Forbidden: Unit not found or you do not own this unit.' });
        }

        // 3. Create the Question
        const question = await Question.create({
            unit,
            teacher: teacherId,
            text,
            questionType,
            options,
            correctAnswerIndex,
            points,
        });
        
        // 4. Update the parent Unit
        await Unit.findByIdAndUpdate(unit, {
            $push: { questions: question._id }
        });

        res.status(201).json({ 
            message: 'Question created successfully.', 
            data: question 
        });

    } catch (error) {
        console.error('Error creating question:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all questions for a specific unit
// @route   GET /api/questions/unit/:unitId
// @access  Private/Teacher, Student
export const getQuestionsByUnit = async (req, res) => {
    try {
        const { unitId } = req.params;
        const userId = req.user._id;
        
        // Authorization Check: Teacher must own the unit OR Student must be enrolled
        const unit = await Unit.findById(unitId);

        if (!unit) {
            return res.status(404).json({ message: 'Unit not found.' });
        }

        // Check if the logged-in user is the teacher of this unit
        if (unit.teacher.toString() !== userId.toString()) {
            return res.status(403).json({ message: 'Forbidden: Access denied to unit questions.' });
        }
        
        // Fetch the questions
        const questions = await Question.find({ unit: unitId, teacher: userId }).sort({ createdAt: 1 });

        res.status(200).json(questions);
    } catch (error) {
        // Handle invalid ID format
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid Unit ID format.' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a specific question
// @route   DELETE /api/questions/:id
// @access  Private/Teacher
export const deleteQuestion = async (req, res) => {
    try {
        const questionId = req.params.id;
        const teacherId = req.user._id;

        // Find and delete the question, ensuring it belongs to the teacher
        const question = await Question.findOneAndDelete({ 
            _id: questionId, 
            teacher: teacherId 
        });

        if (!question) {
            return res.status(404).json({ message: 'Question not found or you do not have permission to delete it.' });
        }
        
        // CLEANUP: Remove the question reference from the parent Unit's array
        await Unit.findByIdAndUpdate(question.unit, {
            $pull: { questions: questionId }
        });

        res.status(200).json({ message: 'Question successfully deleted.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update a specific question
// @route   PUT /api/questions/:id
// @access  Private/Teacher
export const updateQuestion = async (req, res) => {
    try {
        const questionId = req.params.id;
        const teacherId = req.user._id;
        const updates = req.body;

        // Ensure the question exists and belongs to the teacher before updating
        const question = await Question.findOneAndUpdate(
            { _id: questionId, teacher: teacherId },
            updates,
            { new: true, runValidators: true } // Return the updated doc and run schema validators
        );

        if (!question) {
            return res.status(404).json({ message: 'Question not found or access denied.' });
        }

        res.status(200).json({ 
            message: 'Question updated successfully.', 
            data: question 
        });

    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};