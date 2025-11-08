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

// @desc    Approve, reject, or remove teacher from school
// @route   PUT /api/schools/teachers/:teacherId
// @access  Private/Admin
export const manageTeacher = async (req, res) => {
  const { teacherId } = req.params;
  const { action } = req.body; // 'approve', 'reject', 'remove'
  const adminId = req.user._id;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find the school where the current user is admin
    const school = await School.findOne({ admin: adminId }).session(session);
    if (!school) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'School not found or you are not the admin.' });
    }

    // Find the teacher in the school's teachers array
    const teacherIndex = school.teachers.findIndex(
      t => t.teacher.toString() === teacherId
    );

    if (teacherIndex === -1) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Teacher not found in your school.' });
    }

    const teacher = school.teachers[teacherIndex];

    if (action === 'approve') {
      if (teacher.status === 'approved') {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: 'Teacher is already approved.' });
      }

      // Update teacher status to approved
      school.teachers[teacherIndex].status = 'approved';
      await school.save({ session });

      // Update teacher's role and school reference
      await User.findByIdAndUpdate(
        teacherId,
        { 
          role: 'teacher',
          school: school._id 
        },
        { session }
      );

      await session.commitTransaction();
      session.endSession();

      res.status(200).json({ 
        message: 'Teacher approved successfully.' 
      });

    } else if (action === 'reject' || action === 'remove') {
      // Remove teacher from school
      school.teachers.splice(teacherIndex, 1);
      await school.save({ session });

      // If removing an approved teacher, reset their role and school
      if (action === 'remove') {
        await User.findByIdAndUpdate(
          teacherId,
          { 
            role: 'pending_teacher',
            school: null 
          },
          { session }
        );
      }

      await session.commitTransaction();
      session.endSession();

      res.status(200).json({ 
        message: action === 'reject' 
          ? 'Teacher request rejected.' 
          : 'Teacher removed from school.' 
      });

    } else {
      await session.abortTransaction();
      session.endSession();
      res.status(400).json({ message: 'Invalid action specified.' });
    }

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove student from school
// @route   DELETE /api/schools/students/:studentId
// @access  Private/Admin
export const removeStudent = async (req, res) => {
  const { studentId } = req.params;
  const adminId = req.user._id;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find the school where the current user is admin
    const school = await School.findOne({ admin: adminId }).session(session);
    if (!school) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'School not found or you are not the admin.' });
    }

    // Remove student from school's students array
    const studentIndex = school.students.findIndex(
      student => student.toString() === studentId
    );

    if (studentIndex === -1) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Student not found in your school.' });
    }

    school.students.splice(studentIndex, 1);
    await school.save({ session });

    // Remove school reference from student's user record
    await User.findByIdAndUpdate(
      studentId,
      { school: null },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ 
      message: 'Student removed from school successfully.' 
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get school statistics
// @route   GET /api/schools/admin/stats
// @access  Private/Admin
export const getSchoolStats = async (req, res) => {
  const adminId = req.user._id;

  try {
    const school = await School.findOne({ admin: adminId })
      .populate('teachers.teacher', 'email')
      .populate('students', 'email');

    if (!school) {
      return res.status(404).json({ message: 'School not found.' });
    }

    const stats = {
      totalStudents: school.students.length,
      pendingTeachers: school.teachers.filter(t => t.status === 'pending').length,
      approvedTeachers: school.teachers.filter(t => t.status === 'approved').length,
      totalTeachers: school.teachers.length,
      subscriptionTier: school.subscriptionTier,
      createdAt: school.createdAt
    };

    res.status(200).json(stats);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};