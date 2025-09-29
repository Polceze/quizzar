import mongoose from 'mongoose';
import bcrypt from 'bcryptjs'; // <-- Import bcrypt

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
    enum: ['admin', 'teacher', 'student'],
    default: 'student',
    required: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
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

const User = mongoose.model('User', UserSchema);

export default User; 