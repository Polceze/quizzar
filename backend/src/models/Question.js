import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  // Teacher who created the question
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // The Unit this question belongs to (for organization/filtering)
  unit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: true,
  },
  questionText: {
    type: String,
    required: [true, 'Question text is required.'],
    trim: true,
  },
  questionType: {
    type: String,
    enum: ['MCQ', 'TrueFalse', 'FillBlank'],
    required: true,
  },
  // Options for MCQ type questions
  options: [{
    text: { type: String, trim: true },
    isCorrect: { type: Boolean, default: false },
  }],
  // For True/False, the correct answer is a boolean, for FillBlank, it's a string/array
  correctAnswer: { 
    type: mongoose.Schema.Types.Mixed, // Allows flexible data types
    required: true,
  },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
}, { timestamps: true });

const Question = mongoose.model('Question', QuestionSchema);
export default Question;