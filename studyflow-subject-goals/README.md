# StudyFlow AI – Subject and Study Goals Management System

A production-grade, full-stack MERN (MongoDB, Express.js, React.js, Node.js) web application engineered for college students and self-directed learners to organize academic subjects into fine-grained chapters and topics, set multi-tier study goals, track verified learning hours, and visualize real-time syllabus completion analytics.

---

## 🌟 Key Features

### 1. Secure Authentication & Private User Isolation
- **JWT & HTTP-Only Cookies**: Secure browser sessions with fallback Authorization Bearer header support.
- **Bcrypt Password Hashing**: Salted one-way hashing for user passwords.
- **Strict Data Isolation**: Zero cross-tenant data leakage. Every subject, chapter, topic, goal, and study entry is strictly bound to the authenticated user's ID.
- **Session Expiration Handling**: Centralized auth interceptor handles token expiry gracefully.

### 2. Deep Hierarchical Subject Management
- **Subject Lifecycle**: Manage subjects through statuses: `Not Started`, `In Progress`, `Completed`, `On Hold`.
- **Course Metadata**: Subject name, course code (e.g. `CS301`), category, custom color theme, target completion date, estimated study hours.
- **Dynamic Metrics**: Each subject card automatically computes total chapters, completed topics, pending topics, total logged hours, and percentage syllabus completed.
- **Search & Filter**: Real-time search by name or code, filter by category or status, and sort by date, name, or progress.

### 3. Chapters & Topics Syllabus Breakdown
- **Chapter Organization**: Add, edit, reorder, and schedule deadlines for chapters.
- **Topic Fine-Grained Tracking**:
  - Estimated study minutes vs. actual minutes logged.
  - Difficulty badges (`Easy`, `Medium`, `Hard`).
  - Study notes & textbook references.
  - Interactive status toggling: `Not Started` ➔ `In Progress` ➔ `Completed`.
- **Automatic Progress Recalculation**:
  $$\text{Topic Progress} = \frac{\text{Completed Topics}}{\text{Total Topics}} \times 100$$
  $$\text{Chapter Progress} = \frac{\text{Completed Topics in Chapter}}{\text{Total Topics in Chapter}} \times 100$$
  $$\text{Subject Progress} = \frac{\text{Completed Topics in Subject}}{\text{Total Topics in Subject}} \times 100$$
  *(Safe division-by-zero protection ensures 0% when no topics exist)*

### 4. Multi-Tier Study Goals Management
- **Goal Types Supported**:
  1. Daily goal
  2. Weekly goal
  3. Monthly goal
  4. Subject completion goal
  5. Chapter completion goal
  6. Exam preparation goal
  7. Custom goal
- **Target Hours & Deadlines**: Set target study hours, priority (`Low`, `Medium`, `High`, `Urgent`), and track remaining days.
- **Overdue Detection**: Real-time calculated virtual property identifies overdue tasks immediately.
- **Filtering & Sorting**: Filter by subject, goal type, priority, completion status, or overdue status.

### 5. Verified Study Progress & History Log
- **Zero Hallucination Tracking**: Goals and subjects do not rely on static dummy numbers. Actual study hours are computed by summing verified study entry durations from MongoDB:
  $$\text{Actual Hours} = \sum \frac{\text{durationMinutes}}{60}$$
- **Validation**: Strict server-side prevention of negative or zero study durations.
- **Full History**: Chronological study session log with date filters, subject filters, and ability to edit or delete sessions with automatic metrics adjustment.

### 6. Interactive Analytics & Dashboard
- **8 KPI Summary Cards**: Total subjects, active subjects, completed subjects, total goals, completed goals, pending goals, overdue goals, estimated vs. actual study hours.
- **Interactive Recharts**:
  - Daily Study Hours bar chart (last 7 days).
  - Subject Syllabus Completion horizontal progress breakdown.
  - Goal Status donut distribution.
  - Study hours distribution by subject.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Tailwind CSS, React Router DOM v6, Axios, Recharts, Lucide React, Framer Motion, React Hook Form, Zod |
| **Backend** | Node.js, Express.js, MongoDB, Mongoose, JWT (`jsonwebtoken`), `bcryptjs`, `cookie-parser`, `cors`, `helmet`, `express-rate-limit`, `zod` |
| **Testing** | Vitest, Supertest (17 automated integration tests covering auth, isolation, progress formulas, and security) |

---

## 📁 Project Architecture

```
studyflow-subject-goals/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection handler
│   ├── controllers/
│   │   ├── authController.js     # Signup, login, logout, profile, password
│   │   ├── subjectController.js  # Subject CRUD with calculated metrics
│   │   ├── chapterController.js  # Chapter CRUD and reordering
│   │   ├── topicController.js    # Topic CRUD and status toggles
│   │   ├── goalController.js     # StudyGoal CRUD and status toggles
│   │   ├── studyEntryController.js # Study session logging and auto-recalc
│   │   └── analyticsController.js# MongoDB aggregations for dashboard
│   ├── middleware/
│   │   ├── authMiddleware.js     # JWT verification from cookies / headers
│   │   ├── validateMiddleware.js # Zod request validation
│   │   └── errorHandler.js       # Centralized error handling
│   ├── models/
│   │   ├── User.js               # User model with bcrypt pre-save
│   │   ├── Subject.js            # Subject course model
│   │   ├── Chapter.js            # Syllabus chapter model
│   │   ├── Topic.js              # Syllabus topic model
│   │   ├── StudyGoal.js          # Study goal model with virtuals
│   │   └── StudyEntry.js         # Study session log model
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── subjectRoutes.js
│   │   ├── chapterRoutes.js
│   │   ├── topicRoutes.js
│   │   ├── goalRoutes.js
│   │   ├── studyEntryRoutes.js
│   │   └── analyticsRoutes.js
│   ├── seed/
│   │   └── seed.js               # Comprehensive realistic database seed
│   ├── services/
│   │   └── progressService.js    # Automatic progress calculation formulas
│   ├── tests/
│   │   └── api.test.js           # 17 automated integration tests
│   ├── validators/               # Zod validation schemas
│   ├── .env
│   ├── package.json
│   └── server.js                 # Express app entry point
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── axiosClient.js    # Axios instance with auth interceptor
│   │   ├── components/
│   │   │   ├── cards/            # SubjectCard, GoalCard, MetricCard
│   │   │   └── common/           # Navbar, Sidebar, Modal, ConfirmDialog, LogStudyTimeModal, etc.
│   │   ├── context/
│   │   │   ├── AuthContext.jsx   # Authentication context & state
│   │   │   └── ToastContext.jsx  # Floating toast notifications
│   │   ├── layouts/
│   │   │   ├── AppLayout.jsx     # Main workspace layout (Navbar + Sidebar)
│   │   │   └── AuthLayout.jsx    # Authentication layout
│   │   ├── pages/                # All 15 required pages
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SignupPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── SubjectsPage.jsx
│   │   │   ├── SubjectDetailsPage.jsx
│   │   │   ├── ChapterDetailsPage.jsx
│   │   │   ├── GoalsPage.jsx
│   │   │   ├── CreateGoalPage.jsx
│   │   │   ├── EditGoalPage.jsx
│   │   │   ├── GoalDetailsPage.jsx
│   │   │   ├── StudyHistoryPage.jsx
│   │   │   ├── AnalyticsPage.jsx
│   │   │   ├── ProfilePage.jsx
│   │   │   └── SettingsPage.jsx
│   │   ├── utils/
│   │   │   └── formatters.js     # Date, time, and badge formatters
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── .env.example
├── .gitignore
└── README.md
```

---

## ⚡ Quick Start & Running Locally

### Prerequisites
- Node.js (v18 or higher)
- MongoDB running locally on port 27017 or a MongoDB Atlas connection string

### 1. Clone & Setup
```bash
git clone <your-repo-url>
cd studyflow-subject-goals
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Configure `backend/.env`:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/studyflow
JWT_SECRET=studyflow_super_secret_jwt_key_2026_change_in_production
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Seed realistic demo data:
```bash
npm run seed
```
> **Pre-configured Demo Credentials**:
> - Email: `alex@studyflow.ai`
> - Password: `Password123!`
> *(Or use the 1-Click "Fill Demo Credentials" button directly on the login page)*

Run backend automated tests:
```bash
npm test
```

Start backend development server:
```bash
npm run dev
# Server runs on http://localhost:5000
```

### 3. Frontend Setup
In a new terminal:
```bash
cd frontend
npm install
```

Configure `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

Start frontend dev server:
```bash
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 📡 REST API Reference

### Authentication
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Register new student account | Public |
| `POST` | `/api/auth/login` | Login with email and password | Public |
| `POST` | `/api/auth/logout` | Clear auth cookie | Private |
| `GET` | `/api/auth/me` | Fetch authenticated user profile | Private |
| `PUT` | `/api/auth/profile` | Update user name, timezone, avatar | Private |
| `PUT` | `/api/auth/password` | Update account password | Private |

### Subjects
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/subjects` | Get subjects with search, filter, sort, pagination |
| `POST` | `/api/subjects` | Create new subject course |
| `GET` | `/api/subjects/:id` | Get single subject with chapters & metrics |
| `PUT` | `/api/subjects/:id` | Update subject details |
| `DELETE` | `/api/subjects/:id` | Delete subject (cascades chapters, topics, entries) |

### Chapters & Topics
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/subjects/:subjectId/chapters` | Get all chapters under a subject |
| `POST` | `/api/subjects/:subjectId/chapters` | Add new chapter to subject |
| `GET` | `/api/chapters/:id` | Get single chapter details with topics |
| `PUT` | `/api/chapters/:id` | Edit chapter details |
| `DELETE` | `/api/chapters/:id` | Delete chapter & cascade topics |
| `PUT` | `/api/chapters/reorder` | Reorder chapters sequence |
| `GET` | `/api/chapters/:chapterId/topics` | Get topics under a chapter |
| `POST` | `/api/chapters/:chapterId/topics` | Create new topic under chapter |
| `PUT` | `/api/topics/:id` | Update topic |
| `PATCH` | `/api/topics/:id/status` | Quick toggle topic status & auto-recalc progress |
| `DELETE` | `/api/topics/:id` | Delete topic & auto-recalc progress |

### Study Goals
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/goals` | List study goals with filters and overdue checks |
| `POST` | `/api/goals` | Create study goal |
| `GET` | `/api/goals/:id` | Get goal details and linked study sessions |
| `PUT` | `/api/goals/:id` | Edit study goal |
| `PATCH` | `/api/goals/:id/status` | Update goal status (`Completed`, `Paused`, etc.) |
| `DELETE` | `/api/goals/:id` | Delete study goal |

### Study Entries (Progress Tracking)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/study-entries` | List logged sessions with date range filters |
| `POST` | `/api/study-entries` | Record study session & auto-increment actual hours |
| `PUT` | `/api/study-entries/:id` | Update session & adjust goal actual hours |
| `DELETE` | `/api/study-entries/:id` | Delete session & decrement goal actual hours |

### Analytics
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/analytics/dashboard` | 8 summary metrics, today's goals, weekly hours |
| `GET` | `/api/analytics/subjects` | Subject completion rates & hours |
| `GET` | `/api/analytics/goals` | Goal completion rates & priority distributions |
| `GET` | `/api/analytics/study-hours` | Time breakdown grouped by subject |

---

## 🚢 Deployment Guide

### Frontend Deployment (Vercel)
1. Push project to your GitHub repository.
2. In Vercel, click **Add New Project** and select the repository.
3. Configure the Root Directory as `frontend`.
4. Build Command: `npm run build`
5. Output Directory: `dist`
6. Environment Variables:
   - `VITE_API_URL`: `https://your-backend-domain.onrender.com/api`
7. Click **Deploy**.

### Backend Deployment (Render)
1. In Render, select **New Web Service** and link your repository.
2. Root Directory: `backend`
3. Build Command: `npm install`
4. Start Command: `node server.js`
5. Set Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `5000`
   - `MONGODB_URI`: `mongodb+srv://<user>:<password>@cluster0.mongodb.net/studyflow?retryWrites=true&w=majority`
   - `JWT_SECRET`: `<generate-a-strong-random-secret-key>`
   - `CLIENT_URL`: `https://your-frontend-domain.vercel.app`
6. Deploy service.

### Database Setup (MongoDB Atlas)
1. Create a free M0 cluster on [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Create a database user under **Database Access**.
3. Under **Network Access**, add `0.0.0.0/0` (or your Render service IP).
4. Copy the connection string and paste it into `MONGODB_URI`.

---

## 🔒 Production Security Checklist
- [x] Passwords hashed with bcrypt (salt rounds = 10).
- [x] JWT sessions with HTTP-only cookies and Bearer token fallback.
- [x] Strict data isolation: queries filter on `userId: req.user.id`.
- [x] Rate limiting configured with `express-rate-limit`.
- [x] Security headers enforced with `helmet`.
- [x] Strict CORS origin validation.
- [x] No stack traces exposed in production error responses.
- [x] Input sanitization and validation with `zod`.
- [x] Non-negative study session validation enforced on server.

---

## 📄 License
This project is open-source and available under the MIT License.
