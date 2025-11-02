import Unit from '../models/Unit.js';
import TeacherProfile from '../models/TeacherProfile.js';
import RegistrationRequest from '../models/RegistrationRequest.js';
import StudentProfile from '../models/StudentProfile.js'; 
import mongoose from 'mongoose';

// @desc    Create a new Unit/Class
// @route   POST /api/units
// @access  Private/Teacher
export const createUnit = async (req, res) => {
  const { name, code } = req.body;
  const teacherId = req.user._id;

  try {
    // 1. Check for duplicate unit code
    const unitExists = await Unit.findOne({ code });
    if (unitExists) {
      return res.status(400).json({ message: 'A unit with this code already exists.' });
    }

    // 2. Create the new Unit
    const newUnit = await Unit.create({
      name,
      code,
      teacher: teacherId,
    });

    // 3. Update the Teacher's profile to include the new unit
    // We use $addToSet to prevent duplicate entries
    await TeacherProfile.findOneAndUpdate(
      { user: teacherId },
      { $addToSet: { unitsTaught: newUnit._id } }
    );

    res.status(201).json({ 
      message: 'Unit created and linked to your profile.',
      unit: newUnit,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Student requests to join a Unit using its code
// @route   POST /api/units/request-enroll
// @access  Private/Student
export const requestEnrollment = async (req, res) => {
  const { unitCode } = req.body;
  const studentId = req.user._id;

  try {
    // 1. Find the Unit by code
    const unit = await Unit.findOne({ code: unitCode });

    if (!unit) {
      return res.status(404).json({ message: 'Unit not found with that code.' });
    }
    
    // Optional: Check if student is already enrolled in Unit.students array

    // 2. Check if a request already exists
    const existingRequest = await RegistrationRequest.findOne({ 
      student: studentId, 
      unit: unit._id 
    });

    if (existingRequest) {
      return res.status(400).json({ 
        message: `Enrollment request already exists with status: ${existingRequest.status}.` 
      });
    }

    // 3. Create the new registration request
    const request = await RegistrationRequest.create({
      unit: unit._id,
      student: studentId,
    });

    res.status(201).json({ 
      message: `Request to enroll in ${unit.name} sent successfully.`, 
      request
    });

  } catch (error) {
    // Handle the unique index violation error gracefully
    if (error.code === 11000) {
      return res.status(400).json({ message: 'You have already requested enrollment for this unit.' });
    }
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all pending enrollment requests for a teacher's units
// @route   GET /api/units/requests/pending
// @access  Private/Teacher
export const getPendingRequests = async (req, res) => {
  const teacherId = req.user._id;

  try {
    // 1. Find all units taught by the current teacher
    const teachersUnits = await Unit.find({ teacher: teacherId }).select('_id');
    const unitIds = teachersUnits.map(unit => unit._id);

    // 2. Find all pending requests for those units
    const pendingRequests = await RegistrationRequest.find({
      unit: { $in: unitIds }, // Find requests for any of the teacher's units
      status: 'pending',
    })
    .populate({
            path: 'student', 
            select: 'email', // Select email as a fallback
            populate: {
                path: 'studentProfile', 
                model: 'StudentProfile', 
                select: 'fullName admissionNumber' // Fields we want
            }
        })
    .populate('unit', 'name code'); // Get unit name and code

    res.status(200).json(pendingRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Approve or Reject a student enrollment request
// @route   PUT /api/units/requests/:requestId
// @access  Private/Teacher
export const handleEnrollmentApproval = async (req, res) => {
  const { requestId } = req.params;
  const { action } = req.body; // 'approve' or 'reject'
  const teacherId = req.user._id;
  
  // Start a Mongoose session for transactional operations
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Find the request and lock it within the transaction
    const request = await RegistrationRequest.findById(requestId).session(session);

    if (!request) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Enrollment request not found.' });
    }

    // 2. Authorization check: Ensure the request unit belongs to this teacher
    const unit = await Unit.findById(request.unit).session(session);
    if (!unit || unit.teacher.toString() !== teacherId.toString()) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: 'Unauthorized to manage this request.' });
    }

    if (action === 'reject') {
      // Simple rejection: Update status and delete the request
      await request.deleteOne({ session });
      await session.commitTransaction();
      session.endSession();
      return res.status(200).json({ message: 'Enrollment request rejected and removed.' });
    } 
    
    if (action === 'approve') {
      // 3. Approval: Perform two-way linking (Unit -> Student, StudentProfile -> Unit)
      const studentId = request.student;
      
      // a) Update the Unit: Add student to the Unit's students array
      await Unit.findByIdAndUpdate(
        request.unit,
        { $addToSet: { students: studentId } },
        { session }
      );

      // b) Update the Student Profile: Add unit to the StudentProfile's unitsEnrolled array
      await StudentProfile.findOneAndUpdate(
        { user: studentId },
        { $addToSet: { unitsEnrolled: request.unit } },
        { session }
      );
      
      // c) Final Step: Remove the request document
      await request.deleteOne({ session });

      // 4. Commit all changes if everything above succeeded
      await session.commitTransaction();
      session.endSession();

      res.status(200).json({ message: 'Enrollment successfully approved and linked.', student: studentId, unit: unit.name });
    } else {
      await session.abortTransaction();
      session.endSession();
      res.status(400).json({ message: 'Invalid action specified. Must be "approve" or "reject".' });
    }

  } catch (error) {
    // If any step failed, abort the transaction to revert all changes
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: `Transaction failed: ${error.message}` });
  }
};

// @desc    Get all units created by the logged-in teacher
// @route   GET /api/units
// @access  Private/Teacher
export const getTeacherUnits = async (req, res) => {
    try {
        const units = await Unit.find({ teacher: req.user._id })
                                .populate('teacher', 'email')
                                .select('+questions');

        // For only the count, we calculate it before sending the response:
        const unitsWithCount = units.map(unit => ({
            ...unit.toObject(), 
            questionCount: unit.questions.length 
        }));
        
        // Send the updated array which includes 'questionCount'
        res.status(200).json(unitsWithCount); 

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a specific unit created by the logged-in teacher
// @route   DELETE /api/units/:id
// @access  Private/Teacher
export const deleteUnit = async (req, res) => {
    try {
        const unitId = req.params.id;

        // Ensure the unit exists and belongs to the logged-in teacher
        const unit = await Unit.findOneAndDelete({ 
            _id: unitId, 
            teacher: req.user._id 
        });

        if (!unit) {
            return res.status(404).json({ message: 'Unit not found or you do not have permission to delete it.' });
        }
        
        res.status(200).json({ message: 'Unit successfully deleted.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get a single unit's details
// @route   GET /api/units/:id
// @access  Private/Teacher
export const getUnitDetails = async (req, res) => {
    try {
        const unitId = req.params.id;

        // Find the unit, ensure it belongs to the teacher, and populate questions count (optional)
        const unit = await Unit.findOne({ 
            _id: unitId, 
            teacher: req.user._id 
        })
        .select('+questions'); // Assuming you selectively exclude questions array from default reads

        if (!unit) {
            return res.status(404).json({ message: 'Unit not found or access denied.' });
        }
        
        // Return the unit, including its name for the frontend
        res.status(200).json(unit);

    } catch (error) {
        // Handle invalid ID format error
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid Unit ID format.' });
        }
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get students enrolled in a specific unit
// @route   GET /api/units/:unitId/students
// @access  Private/Teacher
export const getUnitStudents = async (req, res) => {
  const { unitId } = req.params;
  const teacherId = req.user._id;

  try {
    // Verify the unit belongs to the teacher
    const unit = await Unit.findOne({ _id: unitId, teacher: teacherId });
    if (!unit) {
      return res.status(404).json({ message: 'Unit not found or access denied.' });
    }

    // Get students with their profiles
    const students = await User.find({ _id: { $in: unit.students } })
      .populate('studentProfile', 'fullName admissionNumber yearOfStudy age residence')
      .select('email');

    // Transform the data to include profile information
    const studentsWithProfiles = students.map(student => ({
      _id: student._id,
      email: student.email,
      fullName: student.studentProfile?.fullName,
      admissionNumber: student.studentProfile?.admissionNumber,
      yearOfStudy: student.studentProfile?.yearOfStudy,
      age: student.studentProfile?.age,
      residence: student.studentProfile?.residence
    }));

    res.status(200).json(studentsWithProfiles);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove student from unit
// @route   DELETE /api/units/:unitId/students/:studentId
// @access  Private/Teacher
export const removeStudentFromUnit = async (req, res) => {
  const { unitId, studentId } = req.params;
  const teacherId = req.user._id;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Verify the unit belongs to the teacher
    const unit = await Unit.findOne({ _id: unitId, teacher: teacherId }).session(session);
    if (!unit) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Unit not found or access denied.' });
    }

    // Remove student from unit
    unit.students.pull(studentId);
    await unit.save({ session });

    // Remove unit from student's enrolled units
    await StudentProfile.findOneAndUpdate(
      { user: studentId },
      { $pull: { unitsEnrolled: unitId } },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: 'Student removed from unit successfully.' });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ message: error.message });
  }
};