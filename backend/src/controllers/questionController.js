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

        // First, get the original question to check if it was AI-generated
        const originalQuestion = await Question.findOne({ 
            _id: questionId, 
            teacher: teacherId 
        });

        if (!originalQuestion) {
            return res.status(404).json({ message: 'Question not found or access denied.' });
        }

        // Remove internal fields that shouldn't be updated directly
        const { convertToManual, ...updateData } = updates;

        // If the question was originally AI-generated and is being modified,
        // mark it as modified and potentially convert to teacher-composed
        if (originalQuestion.isAIGenerated) {
            // Check if significant changes were made
            const isSignificantChange = checkForSignificantChanges(originalQuestion, updateData);
            
            if (isSignificantChange) {
                updateData.isAIContentModified = true;
                
                // Add to modification history
                const modificationEntry = {
                    modifiedAt: new Date(),
                    modifiedBy: teacherId,
                    changes: describeChanges(originalQuestion, updateData)
                };
                
                // Use $push to add to modificationHistory array
                updateData.$push = { modificationHistory: modificationEntry };
                
                // If the teacher wants to fully take ownership, convert to teacher-composed
                if (convertToManual === true) {
                    updateData.isAIGenerated = false;
                    updateData.aiModelUsed = null;
                    updateData.aiGenerationNotes = `Originally AI-generated, converted to teacher-composed by teacher on ${new Date().toISOString()}`;
                }
            }
        }

        // Update the question
        const question = await Question.findOneAndUpdate(
            { _id: questionId, teacher: teacherId },
            updateData,
            { new: true, runValidators: true }
        );

        if (!question) {
            return res.status(404).json({ message: 'Question not found or access denied.' });
        }

        res.status(200).json({ 
            message: 'Question updated successfully.', 
            data: question 
        });

    } catch (error) {
        console.error('Update question error:', error);
        res.status(400).json({ message: error.message });
    }
};

// Helper function to check if significant changes were made
const checkForSignificantChanges = (original, updates) => {
    // Significant changes include:
    // - Changing the question text
    // - Changing the correct answer
    // - Changing options (for MCQ)
    if (updates.text && updates.text !== original.text) {
        return true;
    }
    
    if (updates.correctAnswerIndex !== undefined && 
        updates.correctAnswerIndex !== original.correctAnswerIndex) {
        return true;
    }
    
    if (updates.options && JSON.stringify(updates.options) !== JSON.stringify(original.options)) {
        return true;
    }
    
    return false;
};

// Helper function to describe what changed
const describeChanges = (original, updates) => {
    const changes = [];
    
    if (updates.text && updates.text !== original.text) {
        changes.push('question text modified');
    }
    
    if (updates.correctAnswerIndex !== undefined && 
        updates.correctAnswerIndex !== original.correctAnswerIndex) {
        changes.push('correct answer changed');
    }
    
    if (updates.options && JSON.stringify(updates.options) !== JSON.stringify(original.options)) {
        changes.push('options modified');
    }
    
    if (updates.points && updates.points !== original.points) {
        changes.push('points changed');
    }
    
    return changes.length > 0 ? changes.join(', ') : 'minor updates';
};