import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// ES module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import Routes
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

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  process.env.CLIENT_URL,
  'https://quizzar.netlify.app',
  'https://quizzar-app.netlify.app',
  'https://main--quizzar.netlify.app'
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      process.env.CLIENT_URL,
      'https://quizzar.netlify.app',
      'https://quizzar-app.netlify.app',
      'https://main--quizzar.netlify.app'
    ].filter(Boolean);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log('🚫 CORS blocked for origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

// Apply CORS middleware
app.use(cors(corsOptions));

// *** Global Pre-flight Handler ***
// This is essential for non-simple requests (like those with Authorization headers)
app.options('*', cors(corsOptions));

app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database Connection
mongoose.connect(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(() => console.log('✅ MongoDB connection successful!'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });

// API Routes
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

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    service: 'Quizzar Backend API'
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    message: 'API endpoint not found',
    path: req.originalUrl
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('🚨 Global Error Handler:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

// Catch-all handler for non-API routes
app.use((req, res) => {
  if (!req.path.startsWith('/api')) {
    res.status(404).json({ 
      message: 'Route not found',
      path: req.originalUrl
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on port: ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🌐 Client URL: ${process.env.CLIENT_URL}`);
  console.log(`🔗 Health check: http://0.0.0.0:${PORT}/health`);
});