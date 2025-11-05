// backend/src/models/StudentExamAttempt.js
import mongoose from 'mongoose';

const StudentExamAttemptSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
  },
  unit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: true,
  },
  // Track attempt status and timing
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'submitted', 'graded', 'violation'],
    default: 'not_started',
  },
  startTime: {
    type: Date,
    default: null,
  },
  endTime: {
    type: Date,
    default: null,
  },
  timeRemaining: {
    type: Number, // in seconds
    default: null,
  },
  // Student answers storage
  answers: [{
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    selectedOptionIndex: {
      type: Number,
      default: null, // null means not answered
    },
    answeredAt: {
      type: Date,
      default: null,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    }
  }],
  // Anti-cheating tracking
  violationCount: {
    type: Number,
    default: 0,
  },
  violations: [{
    type: {
      type: String,
      enum: [
        'tab_switch', 
        'devtools_opened',
        'devtools_shortcut',
        'screenshot_attempt',
        'alt_tab',
        'window_blur',
        'copy_attempt',
        'drag_attempt',
        'context_menu'
      ],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    details: String,
  }],
  // Grading results
  score: {
    type: Number,
    default: 0,
  },
  totalPossibleScore: {
    type: Number,
    default: 0,
  },
  percentage: {
    type: Number,
    default: 0,
  },
  // Auto-grading details
  gradedAt: {
    type: Date,
    default: null,
  },
  questionResults: [{
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
    },
    selectedOptionIndex: Number,
    correctOptionIndex: Number,
    isCorrect: Boolean,
    pointsAwarded: Number,
    timeSpent: Number, // in seconds
  }],
}, { timestamps: true });

// Remove any existing indexes and create the correct partial index
StudentExamAttemptSchema.pre('save', async function(next) {
  next();
});

const StudentExamAttempt = mongoose.models.StudentExamAttempt || mongoose.model('StudentExamAttempt', StudentExamAttemptSchema);

// Ensure the index is created
StudentExamAttempt.collection.createIndex(
  { student: 1, exam: 1, status: 1 },
  { 
    unique: true,
    partialFilterExpression: { 
      status: { $in: ['not_started', 'in_progress'] } 
    },
    name: 'unique_active_attempt'
  }
).catch(err => {
  console.log('Index already exists or error creating index:', err.message);
});

export default StudentExamAttempt;