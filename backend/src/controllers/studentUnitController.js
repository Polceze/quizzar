import StudentProfile from '../models/StudentProfile.js'; 

// @desc    Get the student's list of currently enrolled units
// @route   GET /api/student/units/enrolled
// @access  Private/Student
export const getEnrolledUnits = async (req, res) => {
    const studentId = req.user._id;

    try {
        // Fetch the student profile and populate the unitsEnrolled array
        const profile = await StudentProfile.findOne({ user: studentId })
            .populate({
                path: 'unitsEnrolled', 
                select: 'name code teacher', 
                populate: {
                    path: 'teacher', 
                    select: 'email', 
                    populate: {
                        path: 'teacherProfile', 
                        model: 'TeacherProfile', 
                        select: 'fullName' 
                    }
                }
            });
        
        if (!profile) {
            return res.status(404).json({ message: 'Student profile not found.' });
        }

        // Return the populated list of enrolled units
        res.status(200).json(profile.unitsEnrolled);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};