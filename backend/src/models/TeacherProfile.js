import mongoose from 'mongoose';

const TeacherProfileSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User', // Links this profile to the User model
        },
        fullName: {
            type: String,
            required: [true, 'Please add the teacher\'s full name'],
            trim: true,
        },
        staffNumber: {
            type: String,
            required: [true, 'Please add the staff number'],
            unique: true,
            trim: true,
            uppercase: true,
        },
        phoneNumber: {
            type: String,
            required: [true, 'Please add a phone number'],
            trim: true,
        },
        residence: {
            type: String,
            trim: true,
            default: '',
        },
        // We track the time of creation to confirm when the lock should apply
        createdAt: {
            type: Date,
            default: Date.now,
        }
    },
    {
        timestamps: true,
    }
);

const TeacherProfile = mongoose.models.TeacherProfile || mongoose.model('TeacherProfile', TeacherProfileSchema);

export default TeacherProfile;
