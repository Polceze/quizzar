import School from '../models/School.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// @desc    Create a new school
// @route   POST /api/schools
// @access  Private (Any authenticated user can create a school)
export const createSchool = async (req, res) => {
  const { name, description } = req.body;
  const userId = req.user._id;

  try {
    // Check if user already has a school (prevent multiple schools per user)
    const existingSchool = await School.findOne({ admin: userId });
    if (existingSchool) {
      return res.status(400).json({ 
        message: 'You already have a school. Each user can only create one school.' 
      });
    }

    // Check if school name already exists
    const schoolExists = await School.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') } 
    });
    if (schoolExists) {
      return res.status(400).json({ 
        message: 'A school with this name already exists.' 
      });
    }

    // Create the school
    const school = await School.create({
      name,
      description: description || '',
      admin: userId,
      teachers: [{
        teacher: userId,
        status: 'approved', // Admin is automatically approved
        joinedAt: new Date()
      }]
    });

    // Update user's school reference and role if needed
    await User.findByIdAndUpdate(userId, { 
      school: school._id,
      role: 'admin' // User becomes admin when creating a school
    });

    // Populate the created school with admin details
    const populatedSchool = await School.findById(school._id)
      .populate('admin', 'email')
      .populate('teachers.teacher', 'email');

    res.status(201).json({
      message: 'School created successfully! You are now the School Admin.',
      school: populatedSchool
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all schools (for landing page and join functionality)
// @route   GET /api/schools
// @access  Public
export const getSchools = async (req, res) => {
  try {
    const schools = await School.find({ isActive: true })
      .select('name description subscriptionTier createdAt')
      .populate('admin', 'email')
      .limit(50); // Limit for performance

    res.status(200).json(schools);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Join a school as teacher or student
// @route   POST /api/schools/:schoolId/join
// @access  Private
export const joinSchool = async (req, res) => {
  const { schoolId } = req.params;
  const userId = req.user._id;
  const userRole = req.user.role;

  try {
    // Check if school exists and is active
    const school = await School.findOne({ _id: schoolId, isActive: true });
    if (!school) {
      return res.status(404).json({ message: 'School not found or inactive.' });
    }

    // Check if user already has a school
    if (req.user.school) {
      return res.status(400).json({ 
        message: 'You are already associated with a school.' 
      });
    }

    // Check if user already has a pending/approved request for this school
    const existingRequest = school.teachers.find(
      teacher => teacher.teacher.toString() === userId.toString()
    );

    if (existingRequest) {
      return res.status(400).json({ 
        message: `You already have a ${existingRequest.status} request for this school.` 
      });
    }

    // For students: direct enrollment
    if (userRole === 'student') {
      school.students.push(userId);
      await school.save();
      
      // Update user's school reference
      await User.findByIdAndUpdate(userId, { school: schoolId });

      return res.status(200).json({ 
        message: 'Successfully joined school as student.' 
      });
    }

    // For teachers: pending approval
    if (userRole === 'teacher' || userRole === 'pending_teacher') {
      school.teachers.push({
        teacher: userId,
        status: 'pending'
      });
      await school.save();

      return res.status(200).json({ 
        message: 'Join request sent to school admin for approval.' 
      });
    }

    res.status(400).json({ 
      message: 'Invalid role for school joining.' 
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get school details for admin
// @route   GET /api/schools/admin
// @access  Private/Admin
export const getAdminSchool = async (req, res) => {
  const userId = req.user._id;

  try {
    const school = await School.findOne({ admin: userId })
      .populate('admin', 'email')
      .populate('teachers.teacher', 'email')
      .populate('students', 'email');

    if (!school) {
      return res.status(404).json({ 
        message: 'You are not an admin of any school.' 
      });
    }

    res.status(200).json(school);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};