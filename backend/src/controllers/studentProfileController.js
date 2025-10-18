import StudentProfile from '../models/StudentProfile.js';
import User from '../models/User.js';

// @desc    Get the logged-in student's profile details
// @route   GET /api/student/profile
// @access  Private/Student
export const getStudentProfile = async (req, res) => {
    const studentId = req.user._id;

    try {
        const profile = await StudentProfile.findOne({ user: studentId })
            .populate('unitsEnrolled', 'name code'); // Populate enrolled units for display

        if (!profile) {
            // It's possible for a new student not to have a profile yet. 
            // Return an empty state instead of a 404 error here.
            return res.status(200).json({ exists: false, message: 'Profile not created yet.' });
        }

        res.status(200).json({ exists: true, profile: profile });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Create or Update a Student Profile (and set User.isVerified to true)
// @route   POST /api/student/profile
// @access  Private/Student
export const createOrUpdateStudentProfile = async (req, res) => {
    const studentId = req.user._id;
    const { fullName, admissionNumber, yearOfStudy, age, residence } = req.body;

    // Basic validation based on required fields in the schema
    if (!fullName || !admissionNumber || !yearOfStudy || !age) {
        return res.status(400).json({ message: 'Missing required profile fields.' });
    }

    try {
        // Find the existing profile
        const existingProfile = await StudentProfile.findOne({ user: studentId });
        
        // CASE 1: Profile exists and user is verified - LOCKED except residence
        if (existingProfile && req.user.isVerified) {
            return handleLockedProfileUpdate(existingProfile, residence, res);
        }
        
        // CASE 2: Profile exists but user is not verified - Allow full update
        if (existingProfile && !req.user.isVerified) {
            return handleInitialProfileUpdate(existingProfile, {
                fullName, admissionNumber, yearOfStudy, age, residence
            }, studentId, res);
        }
        
        // CASE 3: No profile exists - Create new profile
        return handleNewProfileCreation({
            fullName, admissionNumber, yearOfStudy, age, residence
        }, studentId, res);

    } catch (error) {
        // Handle unique constraint errors (e.g., if admissionNumber is duplicated)
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Admission number is already registered to another account.' });
        }
        res.status(500).json({ message: error.message });
    }
};

// Helper function for locked profile (only residence can be updated)
const handleLockedProfileUpdate = async (profile, newResidence, res) => {
    // Check if residence is actually being changed
    if (newResidence === undefined || newResidence === profile.residence) {
        return res.status(200).json({ 
            message: 'Profile data is locked. No changes made.',
            profile 
        });
    }
    
    // Only update residence field
    profile.residence = newResidence;
    await profile.save();
    
    return res.status(200).json({
        message: 'Residence updated successfully. Core profile data is locked.',
        profile
    });
};

// Helper function for initial profile creation/update (before verification)
const handleInitialProfileUpdate = async (existingProfile, profileData, studentId, res) => {
    try {
        // Update all fields (this is the initial setup)
        const updatedProfile = await StudentProfile.findOneAndUpdate(
            { user: studentId },
            { 
                $set: {
                    fullName: profileData.fullName,
                    admissionNumber: profileData.admissionNumber,
                    yearOfStudy: profileData.yearOfStudy,
                    age: profileData.age,
                    residence: profileData.residence || ''
                }
            },
            { new: true, runValidators: true }
        );

        // Verify the user account
        const user = await User.findByIdAndUpdate(
            studentId, 
            { isVerified: true }, 
            { new: true, select: 'email isVerified' }
        );

        return res.status(200).json({
            message: 'Student profile successfully updated and account verified.',
            user: user,
            profile: updatedProfile,
        });
    } catch (error) {
        throw error; // Re-throw to be caught in the main catch block
    }
};

// Helper function for creating a brand new profile
const handleNewProfileCreation = async (profileData, studentId, res) => {
    try {
        const newProfile = await StudentProfile.create({
            user: studentId,
            fullName: profileData.fullName,
            admissionNumber: profileData.admissionNumber,
            yearOfStudy: profileData.yearOfStudy,
            age: profileData.age,
            residence: profileData.residence || '',
        });

        // Verify the user account
        const user = await User.findByIdAndUpdate(
            studentId, 
            { isVerified: true }, 
            { new: true, select: 'email isVerified' }
        );

        return res.status(201).json({
            message: 'Student profile successfully created and account verified.',
            user: user,
            profile: newProfile,
        });
    } catch (error) {
        throw error; // Re-throw to be caught in the main catch block
    }
};