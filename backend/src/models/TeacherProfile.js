import mongoose from 'mongoose';

const TeacherProfileSchema = new mongoose.Schema({
  // Link to the main User document
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // A User can only have one Teacher Profile
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required.'],
    trim: true,
  },
  institution: {
    type: String,
    required: [true, 'Institution name is required.'],
    trim: true,
  },
  // Document field for manual verification (e.g., photo of teacher ID)
  verificationDocument: {
    type: String, // Will store a URL or file path
    default: null,
  },
  // Status to track admin review
  verificationStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'approved',
  },
  // Array of Unit IDs the teacher is linked to (manually or via verification)
  unitsTaught: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
  }],
  // Payment/Subscription data
  subscriptionTier: {
    type: String,
    default: 'free',
  },
}, { timestamps: true });

const TeacherProfile = mongoose.model('TeacherProfile', TeacherProfileSchema);
export default TeacherProfile; // Use ES Module export