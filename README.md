# 🚀 DNATE Question Bot - AI-Powered MSL Practice Platform

> **Empowering Medical Science Liaisons with intelligent, conversational practice sessions**

An advanced backend API system that leverages artificial intelligence to create realistic physician personas and generate dynamic, context-aware practice scenarios for Medical Science Liaisons (MSLs).

---

## 🏆 Built For

**DNATE MSL Practice Gym Hackathon 2025**

Addressing the critical need for MSLs to practice high-stakes physician conversations in a safe, AI-powered environment before facing real-world scenarios.

---

## ✨ Key Features

### 🤖 AI-Powered Intelligence
- **Conversational AI Chatbot** - Real-time back-and-forth dialogue with AI physician personas
- **Dynamic Question Generation** - Llama 3 generates contextually relevant, challenging questions
- **Intelligent Follow-ups** - Bot evaluates answers and asks probing follow-up questions
- **Persona-Specific Responses** - AI adapts communication style based on physician personality

### 👨‍⚕️ Realistic Physician Personas
- **3 Detailed Physician Profiles** with comprehensive backgrounds:
  - **Dr. Sarah Chen** - Medical Oncologist (Academic, data-driven, skeptical)
  - **Dr. Michael Torres** - Cardiologist (Private practice, risk-averse, practical)
  - **Dr. Jennifer Williams** - Neurologist (Community hospital, empathetic, resource-conscious)
- Each persona includes practice patterns, communication styles, priorities, and emotional drivers

### 📚 Comprehensive Question Bank
- **20 Pre-Defined Practice Questions** across 7 categories
- **Multiple Difficulty Levels** - Low, medium, and high complexity
- **Filterable by Category, Persona, and Difficulty**
- Categories: Cost & Value, Clinical Data, Patient Burden, Study Design, and more

### 🔐 Enterprise-Grade Security
- **JWT Authentication** with bcrypt password hashing (10 rounds)
- **User Data Isolation** - All queries filtered by authenticated user ID
- **Secure Token Management** - 7-day expiration with automatic refresh
- **Environment-based Configuration** - Sensitive credentials stored securely

### ☁️ Cloud-Native Architecture
- **AWS DynamoDB** - Serverless NoSQL database with automatic scaling
- **AWS S3** - Secure cloud storage with pre-signed URLs (ready for recordings)
- **Multi-Region Support** - Deployed in US-East-2 (Ohio)
- **RESTful API Design** - Industry-standard REST architecture

---

## 🏗️ Technical Architecture

### Technology Stack

**Backend Framework:**
- Node.js 18+
- Express.js (RESTful API)

**Databases & Storage:**
- AWS DynamoDB (4 tables with GSI indexing)
- AWS S3 (Infrastructure ready for recordings)

**AI & Machine Learning:**
- Hugging Face Inference API
- Meta Llama 3 (8B Instruct) - Question generation & conversational AI
- OpenAI Whisper (Ready for speech-to-text)

**Authentication & Security:**
- JSON Web Tokens (JWT)
- bcrypt (Password hashing)
- CORS-enabled for frontend integration

---

## 🗄️ Database Schema

### DynamoDB Tables

**1. dnate-users**
- Partition Key: `userId`
- GSI: `EmailIndex` on `email`
- Stores: User accounts, authentication, session counts

**2. dnate-personas**
- Partition Key: `personaId`
- Stores: 3 detailed physician profiles with 15+ attributes each

**3. dnate-sessions**
- Partition Key: `sessionId`
- GSI: `UserSessionsIndex` on `userId` + `createdAt`
- Stores: Practice sessions, conversation history, AI interactions

**4. dnate-questions**
- Partition Key: `questionId`
- GSI: `SessionQuestionsIndex` on `sessionId`
- Stores: AI-generated and pre-defined questions

---

## 📡 API Endpoints (26 Total)

### Base URL
```
Local: http://localhost:3001/api
Production: https://your-app.railway.app/api
```

### 🔓 Public Endpoints (3)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | System health check |
| POST | `/auth/register` | Create user account |
| POST | `/auth/login` | Authenticate user |

### 🔒 Protected Endpoints (23)

All require: `Authorization: Bearer <jwt_token>`

**Authentication (1)**
- GET `/auth/me` - Get current user

**Personas (2)**
- GET `/personas` - List all personas
- GET `/personas/:id` - Get persona details

**Questions (7)**
- GET `/questions` - Get all questions
- GET `/questions/:id` - Get single question
- GET `/questions/categories` - List categories
- GET `/questions/category/:category` - Filter by category
- GET `/questions/persona/:personaId` - Filter by persona
- GET `/questions/difficulty/:difficulty` - Filter by difficulty
- GET `/questions/filter` - Multi-criteria filter

**Conversational Chat (4)** ⭐
- POST `/chat/start` - Start AI conversation
- POST `/chat/:sessionId/message` - Send message, get response
- GET `/chat/:sessionId/history` - View conversation
- POST `/chat/:sessionId/end` - End conversation

**Sessions (5)**
- POST `/sessions/start` - Start practice session
- POST `/sessions/:sessionId/answer` - Submit answer
- POST `/sessions/:sessionId/complete` - Complete session
- GET `/sessions` - Get all user sessions
- GET `/sessions/:sessionId` - Get session details

**Recordings (4)** - Infrastructure Ready
- POST `/sessions/:sessionId/recording/upload-url` - Get S3 upload URL
- POST `/sessions/:sessionId/recording/process` - Transcribe & analyze
- GET `/sessions/:sessionId/recording/:index` - Get recording
- GET `/sessions/:sessionId/recordings` - List recordings

---

## 🚀 Quick Start

**Prerequisites:**
- Node.js 18+
- AWS Account (DynamoDB + S3)
- Hugging Face API Key (free)

**Installation:**
```bash
git clone https://github.com/Varsh1009/dnate-question-bot-backend.git
cd dnate-question-bot-backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run seed
npm run dev
```

---

## 🧪 Usage Examples

### Start Conversational Practice
```bash
# 1. Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"pass123","name":"John Doe"}'

# 2. Start chat with oncologist
curl -X POST http://localhost:3001/api/chat/start \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"personaId":"oncologist"}'

# 3. Send answer
curl -X POST http://localhost:3001/api/chat/<sessionId>/message \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"message":"Your answer here"}'
```

---

## 🎯 Core Workflows

**Workflow 1: Conversational Practice** (Primary)
1. User logs in → Receives JWT token
2. Select physician persona
3. AI asks first question
4. User answers
5. AI evaluates + asks follow-up
6. Conversation continues
7. End session and review

**Workflow 2: Question Bank Practice**
1. Browse 20 pre-defined questions
2. Filter by category/difficulty/persona
3. Start structured practice session
4. Submit answers
5. Review performance

---

## 🔒 Security Features

- Password hashing with bcrypt (10 rounds)
- JWT token authentication (7-day expiration)
- User data isolation (all queries filtered by userId)
- CORS protection
- S3 pre-signed URLs (time-limited access)
- No sensitive data in error messages

---

## 📊 Key Accomplishments

**What's Implemented:**
- ✅ 26 RESTful API endpoints
- ✅ Conversational AI chatbot with Llama 3
- ✅ 3 detailed physician personas
- ✅ 20-question practice bank
- ✅ User authentication & session management
- ✅ AWS DynamoDB + S3 integration
- ✅ Production deployment on Railway

**Technical Stats:**
- 2,500+ lines of code
- 4 DynamoDB tables with indexing
- Sub-second response times
- Horizontally scalable architecture

---

## 🔮 Future Enhancements

### Ready to Implement (Code Complete):
- Audio/Video recording with browser MediaRecorder
- Speech-to-text transcription with Whisper
- AI-powered answer analysis and scoring
- Performance metrics (clarity, confidence, accuracy)

### Planned Features:
- Progress dashboard with analytics
- Streak tracking and gamification
- Multi-persona practice sessions
- Team collaboration features
- Mobile applications

---

## 📂 Project Structure
```
dnate-backend/
├── src/
│   ├── config/          # AWS & AI configuration
│   ├── controllers/     # Business logic (6 controllers)
│   ├── middleware/      # Authentication middleware
│   ├── routes/          # API route definitions
│   ├── services/        # AI services (transcription, analysis)
│   ├── utils/           # Database seeding utilities
│   ├── data/            # Personas & questions JSON
│   └── server.js        # Express app entry point
├── .env                 # Environment variables
├── package.json         # Dependencies
└── README.md            # This file
```

---

## 🤝 Frontend Integration

**For Frontend Developers:**

All endpoints return JSON in consistent format:

Success:
```json
{"success": true, "data": {...}}
```

Error:
```json
{"success": false, "error": "Message"}
```

Authentication required for all endpoints except register/login/health.

Include token in headers:
```
Authorization: Bearer <jwt_token>
```

---

## 📞 Support

- GitHub: [github.com/Varsh1009/dnate-question-bot-backend](https://github.com/Varsh1009/dnate-question-bot-backend)
- Issues: Open a GitHub issue
- Hackathon: DNATE MSL Practice Gym 2025

---

## 📜 License

MIT License

---

## 🙏 Acknowledgments

- **DNATE** - Hackathon organizers
- **Hugging Face** - Free AI model access
- **AWS** - Cloud infrastructure
- **Meta** - Llama 3 language model

---

**⭐ Star this repo if you find it useful!**

*Built with ❤️ for the DNATE Hackathon 2025*
