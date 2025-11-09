import jwt from 'jsonwebtoken';
import User from '../models/user.js';

// --- 1. Middleware to protect routes (Authentication) ---
export const protect = async (req, res, next) => {
  let token;

  // 1. Check if token exists in the Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header (format: "Bearer TOKEN")
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find user by ID from the token payload and exclude the password
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found.' });
      }

      next(); // Move to the next middleware or controller
    } catch (error) {
      console.error(error);
      return res.status(401).json({ message: 'Not authorized, token failed.' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token.' });
  }
};

// --- 2. Middleware to restrict access based on role (Authorization) ---
export const restrictTo = (...roles) => {
  return (req, res, next) => {
    // req.user is populated by the `protect` middleware
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Role (${req.user.role}) is not allowed to access this resource.`
      });
    }
    next();
  };
};