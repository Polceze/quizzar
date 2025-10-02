import User from '../models/User.js';
import TeacherProfile from '../models/TeacherProfile.js';
import StudentProfile from '../models/StudentProfile.js';

// @desc    Complete a Teacher's profile
// @route   POST /api/users/teacher-profile
// @access  Private/Teacher
export const completeTeacherProfile = async (req, res) => {
  const { fullName, institution, verificationDocument } = req.body;
  const userId = req.user._id;

  if (req.user.role !== 'teacher') {
    return res.status(403).json({ message: 'Only teachers can create this profile.' });
  }

  try {
    // 1. Check if profile already exists
    let profile = await TeacherProfile.findOne({ user: userId });

    if (profile) {
      return res.status(400).json({ message: 'Teacher profile already exists. Use PUT to update.' });
    }

    // 2. Create the profile
    profile = await TeacherProfile.create({
      user: userId,
      fullName,
      institution,
      verificationDocument: verificationDocument || null,
      verificationStatus: verificationDocument ? 'pending' : 'approved', // If no doc, auto-approve for now
    });

    // 3. Update the main User model's verification status
    await User.findByIdAndUpdate(userId, { isVerified: true });

    res.status(201).json({ message: 'Teacher profile created successfully.', profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Complete a Student's profile
// @route   POST /api/users/student-profile
// @access  Private/Student
export const completeStudentProfile = async (req, res) => {
  const { fullName } = req.body;
  const userId = req.user._id;

  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Only students can create this profile.' });
  }

  try {
    let profile = await StudentProfile.findOne({ user: userId });

    if (profile) {
      return res.status(400).json({ message: 'Student profile already exists. Use PUT to update.' });
    }

    profile = await StudentProfile.create({
      user: userId,
      fullName,
    });
    
    // Auto-verify students since they don't need doc checks
    await User.findByIdAndUpdate(userId, { isVerified: true });

    res.status(201).json({ message: 'Student profile created successfully.', profile });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};