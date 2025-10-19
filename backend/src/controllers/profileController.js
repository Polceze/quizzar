import User from '../models/User.js';
import TeacherProfile from '../models/TeacherProfile.js';
import StudentProfile from '../models/StudentProfile.js';



// @desc    Complete a Student's profile
// @route   POST /api/users/student-profile
// @access  Private/Student
export const completeStudentProfile = async (req, res) => {
  const { fullName, admissionNumber, yearOfStudy, age, residence } = req.body;
  const userId = req.user._id;

  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Only students can create this profile.' });
  }

  if (!fullName || !admissionNumber || !yearOfStudy || !age) {
    return res.status(400).json({ message: 'Missing required student profile fields.' });
  }

  try {
    let profile = await StudentProfile.findOne({ user: userId });

    if (profile) {
      return res.status(400).json({ message: 'Student profile already exists. Use PUT to update.' });
    }

    profile = await StudentProfile.create({
      user: userId,
      fullName,
      admissionNumber,
      yearOfStudy,
      age,
      residence,
      verificationStatus: 'verified', // Auto-verify
    });
    
    // Auto-verify students and update main user object
    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      { isVerified: true },
      { new: true, select: '-password' } // Return the updated user object
    );

    res.status(201).json({ 
      message: 'Student profile created successfully.', 
      profile,
      user: updatedUser // Send the updated user object back to the frontend
    });
  } catch (error) {
    // Handle unique constraint error for admissionNumber
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Admission Number already in use.' });
    }
    res.status(500).json({ message: error.message });
  }
};


// @desc    Get the current user's profile information
// @route   GET /api/users/profile
// @access  Private/All roles
export const getProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const role = req.user.role;
        let profile = null;

        // Allow 'pending_teacher' to fetch their profile, but it won't exist until verified/completed
        if (role === 'student' || role === 'pending_teacher' || role === 'teacher') {
            const ProfileModel = role === 'student' ? StudentProfile : TeacherProfile;
            profile = await ProfileModel.findOne({ user: userId });
        }
        
        if (!profile) {
            return res.status(404).json({ message: 'Profile not found. Please complete profile registration.' });
        }

        res.status(200).json(profile);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};