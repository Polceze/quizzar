// Load environment variables from .env file
import dotenv from 'dotenv';
dotenv.config();

// ---Imports ---
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';

// --- Import Routes ---
import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';

// --- Server Setup ---
const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// --- 1. MIDDLEWARE SETUP ---
app.use(cors());
app.use(morgan('dev'));
app.use(express.json()); 

// --- 2. DATABASE CONNECTION ---
mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connection successful!'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1); 
  });

// --- 3. BASIC ROUTES ---
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'Quizzar API is running.', 
    environment: process.env.NODE_ENV || 'development' 
  });
});

// Use the imported authRoutes for all requests starting with /api/auth
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// --- 4. START SERVER ---
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port: ${PORT}`);
  console.log(`Access the API via: http://localhost:${PORT}`);
});