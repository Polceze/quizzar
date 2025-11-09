import User from '../models/user.js';
import School from '../models/School.js';
import jwt from 'jsonwebtoken';

// Helper function to generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', 
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  const { email, password, role, school } = req.body;

  try {
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    // NEW: Validate school exists if provided
    if (school) {
      const schoolExists = await School.findById(school);
      if (!schoolExists) {
        return res.status(400).json({ message: 'Selected school does not exist.' });
      }
    }

    const finalRole = (role === 'teacher') ? 'pending_teacher' : 'student';

    const user = await User.create({
      email,
      password,
      role: finalRole,
      school: school || null,
    });

    // NEW: If school provided, update school's arrays
    if (school) {
      if (finalRole === 'student') {
        await School.findByIdAndUpdate(school, {
          $addToSet: { students: user._id }
        });
      } else if (finalRole === 'pending_teacher') {
        await School.findByIdAndUpdate(school, {
          $addToSet: { 
            'teachers': {
              teacher: user._id,
              status: 'pending',
              joinedAt: new Date()
            }
          }
        });
      }
    }

    if (user) {
      res.status(201).json({
        _id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        school: user.school,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Invalid user data.' });
    }
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select('+password');

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        token: generateToken(user._id), 
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password.' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};