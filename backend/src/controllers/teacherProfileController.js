import asyncHandler from 'express-async-handler';
import TeacherProfile from '../models/TeacherProfile.js';
import User from '../models/User.js';

// @desc    Get teacher profile
// @route   GET /api/teacher/profile
// @access  Private/Teacher
export const getTeacherProfile = asyncHandler(async (req, res) => {
    const teacherId = req.user._id;

    const profile = await TeacherProfile.findOne({ user: teacherId });

    if (profile) {
        res.status(200).json({ exists: true, profile });
    } else {
        res.status(200).json({ exists: false, profile: null });
    }
});

// @desc    Create or Update a Teacher Profile (and set User.isVerified to true)
// @route   POST /api/teacher/profile
// @access  Private/Teacher
export const createOrUpdateTeacherProfile = asyncHandler(async (req, res) => {
    const teacherId = req.user._id;
    const { fullName, staffNumber, phoneNumber, residence } = req.body;

    // Basic required field validation
    if (!fullName || !staffNumber || !phoneNumber) {
        res.status(400);
        throw new Error('Please include full name, staff number, and phone number.');
    }

    try {
        let profile = await TeacherProfile.findOne({ user: teacherId });
        
        // Check for profile lock based on user verification status
        if (profile && req.user.isVerified) {
            // Profile exists AND user is verified (core data is locked)
            
            // Allow update ONLY if the change is JUST the residence field
            if (fullName !== profile.fullName || staffNumber !== profile.staffNumber || phoneNumber !== profile.phoneNumber) {
                 res.status(403);
                 throw new Error('Core profile data (Name, Staff Number, Phone Number) is locked and cannot be updated after initial submission.');
            }
            
            // If only residence is being updated, allow it
            if (residence !== profile.residence) {
                profile.residence = residence || '';
                await profile.save();

                return res.status(200).json({
                    message: 'Residence updated successfully (core profile data is locked).',
                    user: req.user,
                    profile: profile,
                });
            }

            // If nothing changed, just return success
            return res.status(200).json({ message: 'Profile data is unchanged/locked.' });
        }
        
        // If profile is being created or updated for the first time
        const profileFields = {
            user: teacherId,
            fullName,
            staffNumber,
            phoneNumber,
            residence: residence || '',
        };

        // Find and update/create the profile
        profile = await TeacherProfile.findOneAndUpdate(
            { user: teacherId },
            { $set: profileFields },
            { new: true, upsert: true, runValidators: true }
        );

        // Set the User's isVerified flag to true if it's the first time
        let user = req.user;
        if (!user.isVerified) {
            user = await User.findByIdAndUpdate(
                teacherId, 
                { isVerified: true }, 
                { new: true, select: 'email isVerified role' } 
            );
        }

        res.status(200).json({
            message: 'Teacher profile successfully created and account verified.',
            user: user,
            profile: profile,
        });

    } catch (error) {
        console.error("Teacher Profile Submission Error:", error.message);
        res.status(500);
        throw new Error(error.message || 'Error processing profile submission.');
    }
});
