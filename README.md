# Quizzar - AI-Powered Examination Platform

![Quizzar Banner](https://via.placeholder.com/1200x400/3B82F6/FFFFFF?text=Quizzar+AI+Powered+Exams)

## 🎯 Overview

Quizzar is a comprehensive, AI-powered digital examination platform designed to revolutionize how educational institutions administer exams. Built with modern web technologies, Quizzar provides a secure, scalable, and intelligent solution for creating, managing, and taking exams while maintaining academic integrity.

## 🚀 Live Demos

- **Frontend**: [https://quizzar-black.vercel.app](https://quizzar-black.vercel.app) (Vercel)
- **Backend API**: [https://quizzar-llj0.onrender.com](https://quizzar-llj0.onrender.com) (Render)

## ✨ Key Features

### 🧠 AI-Powered Question Generation
- **Smart Content Creation**: Generate high-quality questions from study materials using Gemini AI
- **Multiple Question Types**: Support for MCQs, True/False, and Short Answer questions
- **Difficulty Customization**: Set question difficulty levels (Easy, Medium, Hard)
- **Batch Generation**: Create multiple questions simultaneously with configurable counts

### 🎯 Role-Based Access Control
- **School Administrators**: Manage teachers, oversee school operations, and monitor performance
- **Teachers**: Create units, generate questions, schedule exams, and analyze student performance
- **Students**: Take exams, view results, track progress, and receive personalized feedback

### 🔒 Secure Examination Environment
- **Violation Monitoring**: Real-time proctoring during exams
- **Time Management**: Configurable exam durations and scheduling
- **Randomization**: Option to randomize question order for integrity
- **Multiple Attempt Control**: Flexible attempt policies per exam

### 📊 Advanced Analytics
- **Student Analytics**: Personalized performance insights and progress tracking
- **Teacher Analytics**: Comprehensive class performance metrics and exam statistics
- **Real-time Monitoring**: Live exam progress tracking
- **Detailed Reporting**: Exportable performance reports and analytics

### 🏫 School Management
- **Multi-School Support**: Platform supports multiple educational institutions
- **Teacher Approval Workflow**: School admins manage teacher registrations
- **Student Enrollment**: Streamlined student management and unit enrollment
- **Result Management**: Controlled result release with bulk operations

## 🛠 Tech Stack

### Backend
[![Node.js](https://img.shields.io/badge/Node.js-18.0%2B-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express.js](https://img.shields.io/badge/Express.js-4.18%2B-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-8.0%2B-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![JWT](https://img.shields.io/badge/JWT-Authentication-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io)

### Frontend
[![React](https://img.shields.io/badge/React-18.2%2B-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org)
[![Vite](https://img.shields.io/badge/Vite-7.1%2B-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4%2B-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)

### AI & External Services
[![Google Gemini AI](https://img.shields.io/badge/Google_Gemini_AI-Generative_AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://deepmind.google/technologies/gemini/)
[![PDF.js](https://img.shields.io/badge/PDF.js-Document_Parsing-FC0D0D?style=for-the-badge&logo=adobeacrobatreader&logoColor=white)](https://mozilla.github.io/pdf.js/)

### Deployment
[![Render](https://img.shields.io/badge/Render-Backend_Hosting-46E3B7?style=for-the-badge&logo=render&logoColor=white)](https://render.com)
[![Vercel](https://img.shields.io/badge/Vercel-Frontend_Hosting-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com)

### Development Tools
[![PNPM](https://img.shields.io/badge/PNPM-10.0%2B-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io)
[![ESLint](https://img.shields.io/badge/ESLint-Code_Quality-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)](https://eslint.org)

## 📁 Project Architecture

```text
quizzar/
├── backend/                 # Express.js API Server
│   ├── src/
│   │   ├── controllers/    # Business logic handlers
│   │   ├── models/         # MongoDB schemas
│   │   ├── routes/         # API route definitions
│   │   ├── middleware/     # Authentication & validation
│   │   ├── services/       # External service integrations
│   │   └── utils/          # Helper functions
│   └── scripts/            # Database utilities
└── frontend/
     │                        
     └── src/               # React Vite Application
        ├── components/     # Reusable UI components
        ├── pages/          # Route components
        ├── context/        # State management
        └── utils/          # API clients & helpers
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0.0 or higher
- MongoDB Atlas or local instance
- PNPM package manager

### Installation
**1. Clone the repository**
```bash
git clone https://github.com/your-username/quizzar.git
cd quizzar
```
**2. Install dependencies** 
```bash
# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies  
cd ../frontend && npm install
```

**3. Environment Configuration** 

Create `backend/.env`:
```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_ai_api_key
PORT=5000
NODE_ENV=development
```

Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:3000
```

**4. Start Development Servers**
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm run dev
```
**5. Access the Application**
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🔧 API Documentation

### Authentication Endpoints
```http
POST /api/auth/register     # User registration
POST /api/auth/login        # User login
```

### Exam Management
```http
GET    /api/exams           # List teacher's exams
POST   /api/exams           # Create new exam
PUT    /api/exams/:id       # Update exam
DELETE /api/exams/:id       # Delete exam
POST   /api/exams/:id/publish  # Publish exam
```

### AI Integration
```http
POST /api/ai/generate-questions  # Generate questions from content
GET  /api/ai/config             # Get AI service status
```

### Student Operations
```http
GET /api/student/exams          # Available exams
POST /api/student/exams/:id/attempt  # Submit exam attempt
GET /api/student/analytics      # Performance analytics
```

## 🗄 Database Models

### Core Entities
- **User**: Authentication and role management
- **School**: Institution management
- **Unit**: Course/subject organization
- **Question**: Assessment items with AI generation tracking
- **Exam**: Assessment definitions and scheduling
- **StudentExamAttempt**: Exam submissions and results
- **Result**: Performance tracking and analytics

## 🎨 Key Components

### Teacher Features
- **Exam Creation Wizard**: Intuitive exam builder with AI assistance
- **Question Bank**: Reusable question repository
- **Result Management**: Controlled release and bulk operations
- **Analytics Dashboard**: Comprehensive performance insights
- **Unit Management**: Course organization and student enrollment

### Student Features
- **Exam Interface**: Clean, focused testing environment
- **Progress Tracking**: Detailed performance analytics
- **Violation Monitoring**: Real-time integrity checks
- **Result Portal**: Secure access to grades and feedback

### Admin Features
- **School Management**: Multi-tenant institution setup
- **Teacher Approval**: Registration workflow management
- **System Oversight**: Platform monitoring and analytics

## 🔒 Security Features

- JWT-based authentication with secure token management
- Role-based access control (RBAC) for all operations
- CORS configuration for cross-origin security
- Input validation and sanitization
- Secure password hashing with bcrypt
- Exam violation detection and monitoring

## 🤖 AI Integration

Quizzar leverages Google's Gemini AI for intelligent question generation:

- **Content Analysis**: Parse study materials and extract key concepts
- **Question Variety**: Generate multiple question types with configurable difficulty
- **Quality Control**: Validation and structuring of AI-generated content
- **Modification Tracking**: Monitor human edits to AI-generated questions

## 📈 Performance & Analytics

### Real-time Monitoring
- Live exam progress tracking
- Violation detection and alerts
- Performance metrics collection

### Advanced Reporting
- Student progress analytics
- Class performance trends
- Question effectiveness analysis
- Exportable reports in multiple formats

## 🚀 Deployment

### Production Build
```bash
# Backend
cd backend
pnpm run build

# Frontend
cd frontend  
pnpm run build:production
```

### Environment Variables
Configure production environment variables for:
- MongoDB connection strings
- JWT secrets
- AI API keys
- CORS origins
- Server ports

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Workflow
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- 📧 Email: paulo.odera@gmail.com

## 🙏 Acknowledgments

- Google Gemini AI for question generation capabilities
- MongoDB Atlas for database hosting
- Render & Vercel for deployment platforms
- The open-source community for invaluable tools and libraries

---

<div align="center">

**Built with ❤️ for the education community**


</div>