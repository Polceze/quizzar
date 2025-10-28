import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Email is required.'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/.+@.+\..+/, 'Please use a valid email address.'],
  },
  password: {
    type: String,
    required: [true, 'Password is required.'],
    minlength: [6, 'Password must be at least 6 characters.'],
    select: false, // Don't return the password hash by default
  },
  role: {
    type: String,
    enum: ['admin', 'teacher', 'student', 'pending_teacher'],
    default: 'student',
    required: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  // NEW: School reference
  school: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// Mongoose Pre-Save Hook (Middleware) for Hashing
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance Method to Compare Passwords
UserSchema.methods.matchPassword = async function (enteredPassword) {
  // Use bcrypt to compare the plain text password with the stored hash
  return await bcrypt.compare(enteredPassword, this.password);
};

// Virtual for StudentProfile (links the User to their StudentProfile document)
UserSchema.virtual('studentProfile', {
    ref: 'StudentProfile',        
    localField: '_id',            // The User's ID
    foreignField: 'user',         // The 'user' field in the StudentProfile model
    justOne: true                 
});

// Virtual for TeacherProfile (links the User to their TeacherProfile document)
UserSchema.virtual('teacherProfile', {
    ref: 'TeacherProfile',        
    localField: '_id',            // The User's ID
    foreignField: 'user',         // The 'user' field in the TeacherProfile model
    justOne: true                 
});

// NEW: Virtual for School (links the User to their School document)
UserSchema.virtual('userSchool', {
  ref: 'School',
  localField: 'school',
  foreignField: '_id',
  justOne: true
});

// Ensure virtuals are included when converting to JSON/Object
UserSchema.set('toObject', { virtuals: true });
UserSchema.set('toJSON', { virtuals: true });

const User = mongoose.model('User', UserSchema);
export default User;