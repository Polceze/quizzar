import TeacherProfile from '../models/TeacherProfile.js';
import StudentProfile from '../models/StudentProfile.js';
import Unit from '../models/Unit.js';
import Exam from '../models/Exam.js';
import StudentExamAttempt from '../models/StudentExamAttempt.js';
import Result from '../models/Result.js';
import Question from '../models/Question.js';
import RegistrationRequest from '../models/RegistrationRequest.js';
import School from '../models/School.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';

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

// @desc    Create school with admin account in one transaction
// @route   POST /api/schools/create-with-admin
// @access  Public
export const createSchoolWithAdmin = async (req, res) => {
  const { school, admin } = req.body;

  // Start a session for transaction
  const session = await mongoose.startSession();
  
  try {
    await session.startTransaction();

    // 1. Validate input
    if (!school?.name || !admin?.email || !admin?.password) {
      await session.abortTransaction();
      await session.endSession();
      return res.status(400).json({ 
        message: 'School name, admin email, and password are required.' 
      });
    }

    // 2. Check if school name already exists
    const schoolExists = await School.findOne({ 
      name: { $regex: new RegExp(`^${school.name}$`, 'i') } 
    }).session(session);
    
    if (schoolExists) {
      await session.abortTransaction();
      await session.endSession();
      return res.status(400).json({ 
        message: 'A school with this name already exists.' 
      });
    }

    // 3. Check if admin email already exists
    const adminExists = await User.findOne({ 
      email: admin.email 
    }).session(session);
    
    if (adminExists) {
      await session.abortTransaction();
      await session.endSession();
      return res.status(400).json({ 
        message: 'A user with this email already exists.' 
      });
    }

    // 4. Create the admin user
    const adminUser = await User.create([{
      email: admin.email,
      password: admin.password,
      role: 'admin', // School creator becomes admin
      isVerified: true
    }], { session });

    // 5. Create the school
    const newSchool = await School.create([{
      name: school.name,
      description: school.description || '',
      admin: adminUser[0]._id,
      subscriptionTier: 'free',
      teachers: [{
        teacher: adminUser[0]._id,
        status: 'approved',
        joinedAt: new Date()
      }]
    }], { session });

    // 6. Update admin user with school reference
    await User.findByIdAndUpdate(
      adminUser[0]._id,
      { school: newSchool[0]._id },
      { session }
    );

    // 7. Commit transaction
    await session.commitTransaction();

    // 8. Generate JWT token for auto-login
    const token = jwt.sign({ id: adminUser[0]._id }, process.env.JWT_SECRET, {
      expiresIn: '30d',
    });

    // 9. Return success response
    res.status(201).json({
      message: 'School created successfully! You are now the School Admin.',
      token,
      user: {
        _id: adminUser[0]._id,
        email: adminUser[0].email,
        role: adminUser[0].role,
        isVerified: adminUser[0].isVerified,
        school: newSchool[0]._id
      },
      school: newSchool[0]
    });

  } catch (error) {
    console.error('School creation error:', error);
    
    // Only abort transaction if it hasn't been committed
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    
    await session.endSession();
    
    // More specific error messages
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation failed: ' + Object.values(error.errors).map(e => e.message).join(', ')
      });
    }
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'A school or user with these details already exists.' 
      });
    }
    
    res.status(500).json({ 
      message: 'Failed to create school and admin account: ' + error.message 
    });
  } finally {
    // Ensure session is always ended
    if (session && session.id) {
      await session.endSession().catch(console.error);
    }
  }
};

// @desc    Delete a school and all related data
// @route   DELETE /api/schools/:schoolId
// @access  Private/Admin
export const deleteSchool = async (req, res) => {
  try {
    const schoolId = req.params.schoolId;
    
    // Find the school and verify the admin is the owner
    const school = await School.findById(schoolId);
    
    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    // Verify the requesting user is the admin of this school
    if (school.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this school' });
    }

    // Start a transaction to ensure data consistency
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Delete all related data
      // 1. Remove school from all teacher profiles
      await TeacherProfile.updateMany(
        { school: schoolId },
        { $unset: { school: 1 } },
        { session }
      );

      // 2. Remove school from all student profiles
      await StudentProfile.updateMany(
        { school: schoolId },
        { $unset: { school: 1 } },
        { session }
      );

      // 3. Delete all units belonging to this school
      await Unit.deleteMany({ school: schoolId }, { session });

      // 4. Find all exams for this school and delete related data
      const schoolExams = await Exam.find({ school: schoolId }, { _id: 1 }, { session });
      const examIds = schoolExams.map(exam => exam._id);

      // 5. Delete exam attempts, results, and questions
      await StudentExamAttempt.deleteMany({ exam: { $in: examIds } }, { session });
      await Result.deleteMany({ exam: { $in: examIds } }, { session });
      await Question.deleteMany({ exam: { $in: examIds } }, { session });

      // 6. Delete the exams themselves
      await Exam.deleteMany({ school: schoolId }, { session });

      // 7. Delete registration requests for this school
      await RegistrationRequest.deleteMany({ school: schoolId }, { session });

      // Delete all users associated with the school
      console.log('Deleting users associated with the school...');
      await User.deleteMany({ 
        _id: { 
          $in: [
            ...school.teachers.map(t => t.teacher),
            ...school.students.map(s => s.student),
            school.admin
          ]
        }
      });

      // 8. Finally delete the school
      await School.findByIdAndDelete(schoolId, { session });

      await session.commitTransaction();
      
      res.status(200).json({ 
        message: 'School and all related data deleted successfully' 
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Error deleting school:', error);
    res.status(500).json({ 
      message: 'Error deleting school', 
      error: error.message 
    });
  }
};