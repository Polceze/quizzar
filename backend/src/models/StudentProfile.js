import mongoose from 'mongoose';

const StudentProfileSchema = new mongoose.Schema({
  // Link to the main User document
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // A User can only have one Student Profile
  },
  fullName: {
    type: String,
    required: [true, 'Full name is required.'],
    trim: true,
  },
  // Array of Unit IDs the student is registered for
  unitsEnrolled: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
  }],
}, { timestamps: true });

const StudentProfile = mongoose.model('StudentProfile', StudentProfileSchema);
export default StudentProfile;