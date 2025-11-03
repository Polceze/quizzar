import mongoose from 'mongoose';

const QuestionSchema = new mongoose.Schema({
  unit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: true,
  },
  teacher: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Teacher is required.'],
  },
  text: { 
    type: String,
    required: [true, 'Question text is required.'],
    trim: true,
  },
  questionType: {
    type: String,
    enum: ['MCQ', 'T/F', 'Short Answer'],
    default: 'MCQ',
  },
  options: [
    {
      text: String,
    },
  ],
  correctAnswerIndex: { 
    type: Number,
    required: [true, 'The correct answer index is required.'],
    min: 0,
    max: 3, // 0-3 for 4 MCQ options
  },
  points: {
    type: Number,
    required: [true, 'Points are required.'],
    min: 1,
  },
  isAIGenerated: {
    type: Boolean,
    default: false
  },
  aiModelUsed: {
    type: String,
    default: null
  },
  aiGenerationNotes: {
    type: String,
    default: null
  },
  isAIContentModified: {
    type: Boolean,
    default: false
  },
  // Track modification history
  modificationHistory: [{
    modifiedAt: {
      type: Date,
      default: Date.now
    },
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changes: String // Description of what was changed
  }]
}, { timestamps: true });

const Question = mongoose.model('Question', QuestionSchema);
export default Question;