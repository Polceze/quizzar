// ---Imports ---
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Debug: Check if environment variables are loading
console.log('🔑 Environment variables check:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('MONGODB_URI present:', !!process.env.MONGODB_URI);
console.log('DEEPSEEK_API_KEY present:', !!process.env.DEEPSEEK_API_KEY);
console.log('PORT:', process.env.PORT);

// --- Import Routes ---
import authRoutes from './src/routes/authRoutes.js';
import userRoutes from './src/routes/userRoutes.js';
import unitRoutes from './src/routes/unitRoutes.js';
import questionRoutes from './src/routes/questionRoutes.js';
import examRoutes from './src/routes/examRoutes.js';
import studentExamRoutes from './src/routes/studentExamRoutes.js';
import studentUnitRoutes from './src/routes/studentUnitRoutes.js';
import studentProfileRoutes from './src/routes/studentProfileRoutes.js';
import teacherRoutes from './src/routes/teacherRoutes.js';
import schoolRoutes from './src/routes/schoolRoutes.js';
import studyMaterialRoutes from './src/routes/studyMaterialRoutes.js';
import aiRoutes from './src/routes/aiRoutes.js';
import teacherAnalyticsRoutes from './src/routes/teacherAnalyticsRoutes.js';

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
    environment: process.env.NODE_ENV || 'development',
    aiService: process.env.DEEPSEEK_API_KEY ? 'Configured' : 'Not configured'
  });
});

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/units', unitRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/student', studentExamRoutes);
app.use('/api/student', studentUnitRoutes);
app.use('/api/student', studentProfileRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/schools', schoolRoutes);
app.use('/api', studyMaterialRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/teacher/analytics', teacherAnalyticsRoutes);

// --- 4. START SERVER ---
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port: ${PORT}`);
  console.log(`Access the API via: http://localhost:${PORT}`);
  console.log(`🔑 AI Service: ${process.env.DEEPSEEK_API_KEY ? '✅ Configured' : '❌ Not configured'}`);
});