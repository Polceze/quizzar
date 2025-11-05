import mongoose from 'mongoose';

const ResultSchema = new mongoose.Schema({
  // The student who took the exam
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // The exam taken
  exam: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
  },
  // The unit the exam belongs to
  unit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
    required: true,
  },
  score: {
    type: Number,
    required: true,
    min: 0,
  },
  totalMarks: { // Copied from Exam at time of completion
    type: Number,
    required: true,
  },
  // Array to store the student's specific responses
  responses: [{
    question: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
    },
    answer: {
      type: mongoose.Schema.Types.Mixed, // The student's answer
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
    marksAwarded: {
      type: Number,
      default: 0,
    },
  }],
  // Timestamps for attempt
  startTime: {
    type: Date,
    required: true,
  },
  finishTime: {
    type: Date,
    default: null,
  },
  attemptNumber: {
    type: Number,
    default: 1,
  },
  resultsReleased: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

const Result = mongoose.models.Result || mongoose.model('Result', ResultSchema);
export default Result;