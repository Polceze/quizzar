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
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, or server-to-server)
    if (!origin) return callback(null, true);
    
    // Allowed origins - no wildcards
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5173', // Vite default
      'https://quizzar.netlify.app', // exact Netlify domain
    ];
    
    console.log('🔍 Checking CORS for origin:', origin);
    
    // Check for exact match
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS Allowed for:', origin);
      callback(null, true);
    } else {
      console.log('🚫 CORS Blocked for:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  maxAge: 86400
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Handle preflight requests globally
app.options('*', cors(corsOptions));

// Manual CORS headers as backup
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001', 
    'http://localhost:5173',
    'https://quizzar.netlify.app',
    'https://quizzar-app.netlify.app',
    'https://main--quizzar.netlify.app'
  ];
  
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    console.log('✅ Manual CORS headers applied for:', origin);
  }
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

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
      'https://quizzar.netlify.app'
    ]
  });
});

// Public CORS test endpoint
app.get('/api/cors-test', (req, res) => {
  res.status(200).json({
    message: 'CORS is working correctly!',
    origin: req.headers.origin || 'No origin header',
    timestamp: new Date().toISOString(),
    allowed: true,
    headers: {
      'access-control-allow-origin': req.headers.origin || 'Not set'
    }
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
      allowedOrigins: [
        'http://localhost:3000',
        'http://localhost:3001', 
        'http://localhost:5173',
        'https://quizzar.netlify.app'
      ]
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
  console.log(`✅ CORS enabled for:`);
  console.log(`   - http://localhost:3000`);
  console.log(`   - http://localhost:3001`);
  console.log(`   - http://localhost:5173`);
  console.log(`   - https://quizzar.netlify.app`);
  console.log(`   - https://quizzar-app.netlify.app`);
  console.log(`   - https://main--quizzar.netlify.app`);
});