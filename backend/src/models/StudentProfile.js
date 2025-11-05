import mongoose from 'mongoose';

// Define the StudentProfile schema
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
  admissionNumber: {
    type: String,
    trim: true,
    required: [true, 'Admission number is required for profile completion.'],
    unique: true, // Assuming this should be unique across all students
  },
  yearOfStudy: {
    type: String,
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', 'Graduate'],
    required: [true, 'Year of study is required.'],
  },
  age: {
    type: Number,
    required: [true, 'Age is required.'],
    min: 16, // Assuming minimum age for a student is 16
  },
  residence: {
    type: String,
    trim: true,
  },
  // Array of Unit IDs the student is registered for
  unitsEnrolled: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Unit',
  }],
}, { timestamps: true });

// Create and export the StudentProfile model
const StudentProfile = mongoose.models.StudentProfile || mongoose.model('StudentProfile', StudentProfileSchema);
export default StudentProfile;