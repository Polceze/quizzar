import mongoose from 'mongoose';

const ExamSchema = new mongoose.Schema({
  // Teacher who created the exam
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // The Unit this exam is assigned to
  unit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: true,
  },
  name: {
    type: String,
    required: [true, 'Exam title is required.'],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  // Array of specific Question IDs selected for the exam
  questions: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
  }],
  durationMinutes: {
    type: Number,
    required: [true, 'Exam duration is required in minutes.'],
    min: 1,
  },
  totalMarks: {
    type: Number,
    required: [false, 'Total marks are required.'],
    min: 1,
  },
  // Scheduling/Availability settings
  scheduledStart: {
    type: Date,
    default: Date.now,
  },
  scheduledEnd: {
    type: Date,
    default: null, // Open until manually closed
  },
  // Status to control visibility to students
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'draft',
  },
  // Settings for randomization/security
  isRandomized: {
    type: Boolean,
    default: false,
  },
  allowMultipleAttempts: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

const Exam = mongoose.model('Exam', ExamSchema);
export default Exam;