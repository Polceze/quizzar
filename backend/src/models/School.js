import mongoose from 'mongoose';

const SchoolSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'School name is required.'],
    trim: true,
    maxlength: [100, 'School name cannot exceed 100 characters.']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters.']
  },
  subscriptionTier: {
    type: String,
    enum: ['free', 'premium'],
    default: 'free'
  },
  // The user who created the school (becomes School Admin)
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Teachers associated with this school
  teachers: [{
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Students associated with this school
  students: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Index for better query performance
SchoolSchema.index({ admin: 1 });
SchoolSchema.index({ 'teachers.teacher': 1 });
SchoolSchema.index({ students: 1 });

const School = mongoose.models.School || mongoose.model('School', SchoolSchema);
export default School;