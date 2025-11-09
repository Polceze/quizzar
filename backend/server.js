// ---Imports ---
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

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
import schoolAdminRoutes from './src/routes/schoolAdminRoutes.js';

// --- Server Setup ---
const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// --- 1. MIDDLEWARE SETUP ---

// CORS Configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    'https://quizzar.netlify.app',
    'https://quizzar-app.netlify.app',
    'https://main--quizzar.netlify.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  maxAge: 86400
};

// Apply CORS middleware
app.use(cors(corsOptions));

// DEBUG: Log all incoming requests and CORS headers
app.use((req, res, next) => {
  console.log('🌐 Incoming Request:', {
    method: req.method,
    url: req.url,
    origin: req.headers.origin,
    'user-agent': req.headers['user-agent']
  });
  
  // Add CORS headers manually as backup
  const origin = req.headers.origin;
  if (origin && corsOptions.origin.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', corsOptions.methods.join(','));
    res.header('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(','));
    res.header('Access-Control-Allow-Credentials', 'true');
    console.log('✅ Manual CORS headers applied for:', origin);
  }
  
  next();
});

// Handle preflight requests globally
app.options('*', cors(corsOptions));

// Other middleware
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
    timestamp: new Date().toISOString(),
    cors: 'Enabled with secure configuration',
    allowedOrigins: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173',
      'https://quizzar.netlify.app',
      'https://quizzar-app.netlify.app',
      'https://main--quizzar.netlify.app'
    ]
  });
});

// Public CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.status(200).json({
    message: 'CORS is working correctly!',
    origin: req.headers.origin || 'No origin header',
    timestamp: new Date().toISOString(),
    allowed: true
  });
});

// Simple public test endpoint
app.get('/test-cors', (req, res) => {
  res.json({
    message: 'CORS test successful!',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// Public schools test endpoint
app.get('/api/schools-test', async (req, res) => {
  try {
    const School = await import('./src/models/School.js');
    const schools = await School.default.find({ isActive: true })
      .select('name description createdAt')
      .limit(2);
    
    res.status(200).json({
      message: 'Public schools test endpoint',
      schools: schools,
      origin: req.headers.origin,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
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
app.use('/api/school-admin', schoolAdminRoutes);

// --- 4. ERROR HANDLING MIDDLEWARE ---

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    message: `Route ${req.originalUrl} not found`,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err);
  
  // CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      message: 'CORS policy: Access denied',
      origin: req.headers.origin,
      allowedOrigins: corsOptions.origin
    });
  }
  
  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({
      message: 'Validation Error',
      errors: errors
    });
  }
  
  // Mongoose duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      message: `Duplicate ${field} found`,
      value: err.keyValue[field]
    });
  }
  
  // Default error
  res.status(err.status || 500).json({
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// --- 5. START SERVER ---
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port: ${PORT}`);
  console.log(`Access the API via: http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ CORS enabled for:`, corsOptions.origin);
});