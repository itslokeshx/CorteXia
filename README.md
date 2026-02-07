<div align="center">

# CorteXia

### AI-Powered Productivity Platform

*Your intelligent companion for mastering time, tasks, and personal growth*

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Express](https://img.shields.io/badge/Express-4.18-green?style=flat&logo=express)](https://expressjs.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=flat)](LICENSE)

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Development](#-development) • [Deployment](#-deployment)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Project Structure](#-project-structure)
- [Tech Stack](#️-tech-stack)
- [Quick Start](#-quick-start)
- [Development](#-development)
- [Commands](#-commands)
- [Configuration](#-configuration)
- [Architecture](#-architecture)
- [API Documentation](#-api-documentation)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

CorteXia is a comprehensive productivity platform that combines task management, goal tracking, habit building, and AI-powered insights into a single, elegant application. Built with modern web technologies, it provides a seamless experience across devices while maintaining data privacy and performance.

### Why CorteXia?

- **🎯 All-in-One**: Manage tasks, goals, habits, time, finances, and studies in one place
- **🤖 AI-Powered**: Get intelligent suggestions and personalized coaching
- **🎨 Beautiful UI**: Clean, minimal design with smooth animations
- **📊 Deep Insights**: Cross-domain analytics to understand your productivity patterns
- **⚡ Fast**: Built with Next.js 16 and optimized for performance
- **🔒 Private**: Your data stays yours, with local-first architecture options

---

## ✨ Features

### 📋 Task Management
- **Focus To-Do Style Interface**: 5 time-based views (Today, Tomorrow, Week, Month, Year)
- **Smart Organization**: Categories, priorities, sub-tasks, and goal linking
- **Quick Actions**: Inline editing, drag-and-drop, bulk operations
- **Time Integration**: Start Pomodoro timer directly from tasks

### 🎯 Goal Tracking
- **Hierarchical Structure**: Quarter → Month → Week breakdown
- **Progress Visualization**: Auto-calculating progress bars and health metrics
- **Milestones**: Track key achievements within goals
- **Goal Linking**: Connect tasks directly to goals for clarity

### 📈 Habit Tracking
- **Daily Check-ins**: Simple, frictionless habit logging
- **Streak System**: Visual streak tracking to build momentum
- **Heatmap Calendar**: See patterns at a glance
- **Habit Insights**: Completion rates and trend analysis

### 📓 Journal
- **Mood Tracking**: 5-level emoji-based mood system
- **Energy & Focus Metrics**: Track your mental state
- **Reflection Prompts**: AI-suggested prompts for deeper thinking
- **Rich Entries**: Tags, search, and full-text content

### ⏱️ Time Tracking
- **Pomodoro Timer**: Focus sessions with breaks
- **Task Integration**: Automatically log time to tasks
- **Session History**: Review past focus sessions
- **Analytics**: See where your time goes

### 🗓️ Day Planner
- **Visual Timeline**: Drag-and-drop daily schedule
- **Event Blocks**: Color-coded time blocks
- **Quick Add**: Fast event creation
- **Calendar View**: Month overview with events

### 💰 Finance Tracking
- **Income & Expenses**: Quick transaction logging
- **Categories**: Organize spending by type
- **Budget Tracking**: Set and monitor budgets
- **Insights**: Spending patterns and trends

### 📚 Study Planner
- **Study Sessions**: Track learning time by subject
- **Focus Metrics**: Monitor concentration levels
- **Session Notes**: Add context to study time
- **Subject Analytics**: Progress by topic

### 📊 Insights Dashboard
- **Cross-Domain Analysis**: See connections between life areas
- **Trend Charts**: Visualize progress over time
- **Correlation Matrix**: Discover what impacts what
- **Predictive Insights**: AI-powered suggestions

### 🤖 AI Life Coach
- **Personalized Advice**: Context-aware productivity tips
- **Natural Conversations**: Chat-based interface
- **Action Items**: Automatic task creation from conversations
- **Learning System**: Adapts to your patterns

---

## 📁 Project Structure

```
CorteXia/
│
├── frontend/                           # Next.js Frontend Application
│   ├── app/                           # Pages & Routes (App Router)
│   │   ├── layout.tsx                # Root layout with theme provider
│   │   ├── page.tsx                  # Dashboard/Home page
│   │   ├── tasks/                    # Task management page
│   │   ├── goals/                    # Goal tracking page
│   │   ├── habits/                   # Habit tracker page
│   │   ├── journal/                  # Journal page
│   │   ├── time-tracker/             # Time tracking page
│   │   ├── day-planner/              # Day planner page
│   │   ├── finance/                  # Finance tracking page
│   │   ├── study/                    # Study planner page
│   │   ├── insights/                 # Analytics dashboard
│   │   ├── ai-coach/                 # AI life coach page
│   │   ├── timeline/                 # Activity timeline
│   │   ├── time/                     # Time overview
│   │   └── settings/                 # User settings
│   │
│   ├── components/                    # React Components
│   │   ├── ui/                       # shadcn/ui primitives
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── [40+ components]
│   │   ├── layout/                   # Layout components
│   │   │   ├── app-layout.tsx       # Main app layout
│   │   │   ├── sidebar.tsx          # Navigation sidebar
│   │   │   ├── header.tsx           # Top header bar
│   │   │   └── collapsible-sidebar.tsx
│   │   ├── dashboard/                # Dashboard widgets
│   │   │   ├── life-state-core.tsx  # Central metrics display
│   │   │   ├── signal-constellation.tsx  # Visual insights
│   │   │   ├── proactive-alerts.tsx # Smart notifications
│   │   │   ├── quick-actions.tsx    # Fast access buttons
│   │   │   └── [8+ widgets]
│   │   ├── ai/                       # AI components
│   │   │   ├── conversational-ai.tsx
│   │   │   ├── life-coach.tsx
│   │   │   └── omnipotent-chatbot.tsx
│   │   ├── celebration/              # Success animations
│   │   ├── charts/                   # Data visualization
│   │   │   ├── correlation-matrix.tsx
│   │   │   ├── heatmap-calendar.tsx
│   │   │   └── radar-chart.tsx
│   │   ├── tasks/                    # Task components
│   │   ├── timeline/                 # Timeline components
│   │   └── quick-add/                # Quick add modals
│   │
│   ├── hooks/                         # Custom React Hooks
│   │   ├── use-tasks.ts              # Task state management
│   │   ├── use-goals.ts              # Goal operations
│   │   ├── use-habits.ts             # Habit tracking
│   │   ├── use-finance.ts            # Finance operations
│   │   ├── use-time-tracking.ts      # Time tracking state
│   │   ├── use-toast.ts              # Toast notifications
│   │   └── use-mobile.ts             # Mobile detection
│   │
│   ├── lib/                           # Utilities & Core Logic
│   │   ├── context/                  # React Context
│   │   │   └── app-context.tsx      # Global state management
│   │   ├── types/                    # TypeScript definitions
│   │   │   └── [shared types]
│   │   ├── ai/                       # AI utilities
│   │   ├── api-client.ts             # HTTP client for backend
│   │   ├── api.ts                    # API functions
│   │   ├── relationships.ts          # Data relationships
│   │   ├── types.ts                  # Core types
│   │   └── utils.ts                  # Helper functions
│   │
│   ├── styles/                        # Global Styles
│   │   └── globals.css               # Tailwind + custom CSS
│   │
│   ├── public/                        # Static Assets
│   │   └── [images, icons, fonts]
│   │
│   └── Configuration Files
│       ├── package.json              # Dependencies & scripts
│       ├── next.config.mjs           # Next.js configuration
│       ├── tsconfig.json             # TypeScript config
│       ├── postcss.config.mjs        # PostCSS setup
│       ├── components.json           # shadcn/ui config
│       └── .env.local                # Environment variables
│
├── backend/                           # Express Backend API
│   ├── routes/                        # API Route Handlers
│   │   ├── tasks.ts                  # Task CRUD operations
│   │   ├── goals.ts                  # Goal management
│   │   ├── habits.ts                 # Habit tracking endpoints
│   │   ├── journal.ts                # Journal entry operations
│   │   ├── time.ts                   # Time tracking API
│   │   ├── finance.ts                # Financial transactions
│   │   ├── study.ts                  # Study session tracking
│   │   ├── insights.ts               # Analytics endpoints
│   │   ├── ai.ts                     # AI service endpoints
│   │   └── users.ts                  # User management
│   │
│   ├── services/                      # Business Logic Layer
│   │   └── ai-service.ts             # AI processing & Groq integration
│   │
│   ├── db/                            # Database Layer
│   │   ├── schema.ts                 # Drizzle ORM schema definitions
│   │   ├── client.ts                 # Database connection
│   │   └── database.db               # SQLite database (dev)
│   │
│   └── Configuration Files
│       ├── index.ts                  # Express server entry point
│       ├── package.json              # Backend dependencies
│       ├── tsconfig.json             # Backend TS config
│       ├── drizzle.config.ts         # Database configuration
│       └── .env                      # Backend environment vars
│
├── Root Configuration
│   ├── package.json                   # Monorepo scripts
│   ├── cortexia.code-workspace        # VSCode workspace config
│   └── .gitignore                     # Git ignore rules
│
└── Documentation
    └── README.md                      # This file
```

---

## 🛠️ Tech Stack

### Frontend

| Technology | Purpose | Version |
|------------|---------|---------|
| **Next.js** | React framework with App Router | 16.0 |
| **TypeScript** | Type-safe development | 5.0 |
| **Tailwind CSS** | Utility-first styling | 4.1 |
| **shadcn/ui** | High-quality UI components | Latest |
| **Framer Motion** | Smooth animations | 12.0 |
| **React Hook Form** | Form management | 7.60 |
| **Zod** | Schema validation | 3.25 |
| **date-fns** | Date manipulation | 4.1 |
| **Recharts** | Data visualization | 2.15 |
| **Lucide React** | Icon library | Latest |

### Backend

| Technology | Purpose | Version |
|------------|---------|---------|
| **Express.js** | Web server framework | 4.18 |
| **TypeScript** | Type-safe backend | 5.3 |
| **Drizzle ORM** | Type-safe database toolkit | 0.29 |
| **SQLite** | Development database | Latest |
| **PostgreSQL** | Production database | 16+ |
| **Groq SDK** | AI inference API | 0.3 |
| **tsx** | TypeScript execution | 4.7 |

### Development Tools

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Concurrently** - Run multiple commands
- **VSCode** - Recommended IDE

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0 or higher
- **npm** 9.0 or higher (or **pnpm**/**yarn**)
- **Git** for version control

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/yourusername/cortexia.git
   cd cortexia
   ```

2. **Install all dependencies**

   ```bash
   npm run install:all
   ```

   This will install dependencies for:
   - Root monorepo
   - Frontend application
   - Backend API

3. **Set up environment variables**

   **Frontend** (`frontend/.env.local`):
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3001
   ```

   **Backend** (`backend/.env`):
   ```env
   PORT=3001
   NODE_ENV=development
   DATABASE_URL=file:./database.db
   CORS_ORIGIN=http://localhost:3000
   GROQ_API_KEY=your_groq_api_key_here
   ```

   > **Note**: Get your Groq API key from [https://console.groq.com](https://console.groq.com)

4. **Initialize the database**

   ```bash
   cd backend
   npm run db:push
   cd ..
   ```

5. **Start the development servers**

   ```bash
   npm run dev
   ```

   This starts both:
   - Frontend at [http://localhost:3000](http://localhost:3000)
   - Backend at [http://localhost:3001](http://localhost:3001)

6. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000) and start using CorteXia!

---

## 💻 Development

### Workspace Setup

For the best development experience, open the VSCode workspace file:

```bash
code cortexia.code-workspace
```

This provides:
- Proper TypeScript path resolution
- Separate terminals for frontend/backend
- Optimized settings for the monorepo

### Project Commands

#### Root (Monorepo)

```bash
# Development
npm run dev              # Start both frontend & backend
npm run dev:frontend     # Start frontend only
npm run dev:backend      # Start backend only

# Build
npm run build            # Build both applications
npm run build:frontend   # Build frontend only
npm run build:backend    # Build backend only

# Production
npm run start            # Start both in production mode
npm run start:frontend   # Start frontend production server
npm run start:backend    # Start backend production server

# Maintenance
npm run install:all      # Install all dependencies
npm run clean            # Remove all node_modules & build artifacts
```

#### Frontend Only

```bash
cd frontend

npm run dev              # Start development server
npm run build            # Create production build
npm run start            # Start production server
npm run lint             # Run ESLint
```

#### Backend Only

```bash
cd backend

npm run dev              # Start with hot reload (tsx watch)
npm run build            # Compile TypeScript
npm run start            # Start production server
npm run db:push          # Push schema changes to database
npm run db:studio        # Open Drizzle Studio (database GUI)
```

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Frontend changes in `frontend/`
   - Backend changes in `backend/`
   - Shared types in `frontend/lib/types/`

3. **Test your changes**
   ```bash
   npm run build  # Ensure everything compiles
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: your feature description"
   git push origin feature/your-feature-name
   ```

---

## 📦 Commands

### Complete Command Reference

#### Root Level Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both frontend and backend in development mode |
| `npm run dev:frontend` | Start only the frontend development server |
| `npm run dev:backend` | Start only the backend development server |
| `npm run build` | Build both frontend and backend for production |
| `npm run build:frontend` | Build only the frontend |
| `npm run build:backend` | Build only the backend |
| `npm run start` | Start both frontend and backend in production mode |
| `npm run start:frontend` | Start only the frontend production server |
| `npm run start:backend` | Start only the backend production server |
| `npm run install:all` | Install dependencies for root, frontend, and backend |
| `npm run clean` | Remove all node_modules and build artifacts |

#### Frontend Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js development server with hot reload |
| `npm run build` | Create optimized production build |
| `npm run start` | Start Next.js production server |
| `npm run lint` | Run ESLint on all files |

#### Backend Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start server with hot reload using tsx |
| `npm run build` | Compile TypeScript to JavaScript |
| `npm run start` | Start production server |
| `npm run db:push` | Push database schema changes |
| `npm run db:studio` | Open Drizzle Studio GUI |

---

## ⚙️ Configuration

### Frontend Environment Variables

Create `frontend/.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001

# Optional: Analytics
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id

# Optional: Feature Flags
NEXT_PUBLIC_ENABLE_AI=true
NEXT_PUBLIC_ENABLE_BETA_FEATURES=false
```

### Backend Environment Variables

Create `backend/.env`:

```env
# Server Configuration
PORT=3001
NODE_ENV=development

# Database
DATABASE_URL=file:./database.db
# For PostgreSQL:
# DATABASE_URL=postgresql://user:password@localhost:5432/cortexia

# CORS
CORS_ORIGIN=http://localhost:3000
# For production:
# CORS_ORIGIN=https://yourdomain.com

# AI Service
GROQ_API_KEY=your_groq_api_key_here

# Optional: JWT (if implementing auth)
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# Optional: Logging
LOG_LEVEL=info
```

### Database Configuration

The project uses **Drizzle ORM** which supports multiple databases:

**Development (SQLite)**:
```typescript
// backend/drizzle.config.ts
export default {
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: "./database.db"
  }
};
```

**Production (PostgreSQL)**:
```typescript
export default {
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!
  }
};
```

---

## 🏗️ Architecture

### System Design

CorteXia follows a **monorepo architecture** with clear separation between frontend and backend:

```
┌─────────────────────────────────────────────────────────────┐
│                         BROWSER                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              Next.js Frontend (Port 3000)              │ │
│  │  • Server-Side Rendering                               │ │
│  │  • Client-Side Routing                                 │ │
│  │  • React Components                                    │ │
│  │  • Global State (Context API)                          │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          │ HTTP/REST API
                          │
┌─────────────────────────▼───────────────────────────────────┐
│                  Express Backend (Port 3001)                 │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                  API Routes Layer                       │ │
│  │  • Request Validation                                  │ │
│  │  • Error Handling                                      │ │
│  │  • Response Formatting                                 │ │
│  └────────────────────────────────────────────────────────┘ │
│                          │                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │               Business Logic Layer                      │ │
│  │  • AI Service (Groq Integration)                       │ │
│  │  • Data Processing                                     │ │
│  │  • Complex Operations                                  │ │
│  └────────────────────────────────────────────────────────┘ │
│                          │                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                Database Layer (Drizzle ORM)            │ │
│  │  • Type-Safe Queries                                   │ │
│  │  • Migrations                                          │ │
│  │  • Schema Management                                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                          │                                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           Database (SQLite/PostgreSQL)                  │ │
│  │  • Tasks, Goals, Habits                                │ │
│  │  • Journal Entries, Time Tracking                      │ │
│  │  • Financial Records, Study Sessions                   │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Interaction** → React Component
2. **State Update** → Context API
3. **API Call** → API Client (`lib/api-client.ts`)
4. **HTTP Request** → Express Backend
5. **Route Handler** → Validates & processes request
6. **Service Layer** → Business logic (if needed)
7. **Database** → Drizzle ORM queries
8. **Response** → JSON back to frontend
9. **UI Update** → React re-renders with new data

### State Management

CorteXia uses **React Context API** for global state:

```typescript
// frontend/lib/context/app-context.tsx
export const AppContext = {
  // Tasks
  tasks: Task[]
  addTask: (task: Task) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  
  // Goals
  goals: Goal[]
  addGoal: (goal: Goal) => void
  updateGoal: (id: string, updates: Partial<Goal>) => void
  
  // Habits
  habits: Habit[]
  logHabitCompletion: (id: string, date: Date) => void
  
  // Journal
  journalEntries: JournalEntry[]
  addJournalEntry: (entry: JournalEntry) => void
  
  // Time Tracking
  activeTimer: Timer | null
  startTimer: (taskId: string) => void
  stopTimer: () => void
  
  // ... and more
}
```

---

## 📡 API Documentation

### Base URL

```
Development: http://localhost:3001
Production: https://api.yourdomain.com
```

### Endpoints

#### Tasks

```
POST   /api/tasks              Create new task
GET    /api/tasks              List all tasks
GET    /api/tasks/:id          Get task by ID
PATCH  /api/tasks/:id          Update task
DELETE /api/tasks/:id          Delete task
```

#### Goals

```
POST   /api/goals              Create new goal
GET    /api/goals              List all goals
GET    /api/goals/:id          Get goal by ID
PATCH  /api/goals/:id          Update goal
DELETE /api/goals/:id          Delete goal
```

#### Habits

```
POST   /api/habits             Create new habit
GET    /api/habits             List all habits
PATCH  /api/habits/:id         Update habit
POST   /api/habits/:id/log     Log habit completion
DELETE /api/habits/:id         Delete habit
```

#### Journal

```
POST   /api/journal            Create journal entry
GET    /api/journal            List entries
GET    /api/journal/:id        Get entry by ID
DELETE /api/journal/:id        Delete entry
```

#### Time Tracking

```
POST   /api/time               Start time tracking
GET    /api/time               List time entries
PATCH  /api/time/:id           Update entry
DELETE /api/time/:id           Delete entry
```

#### Finance

```
POST   /api/finance            Create transaction
GET    /api/finance            List transactions
DELETE /api/finance/:id        Delete transaction
GET    /api/finance/summary    Get financial summary
```

#### Study

```
POST   /api/study              Create study session
GET    /api/study              List sessions
DELETE /api/study/:id          Delete session
GET    /api/study/stats        Get study statistics
```

#### Insights

```
GET    /api/insights           Get analytics data
GET    /api/insights/trends    Get trend analysis
GET    /api/insights/correlation  Get correlation matrix
```

#### AI

```
POST   /api/ai/chat            Send chat message
POST   /api/ai/coach           Get life coaching advice
POST   /api/ai/suggest         Get task suggestions
```

### Request/Response Examples

**Create Task**:
```bash
POST /api/tasks
Content-Type: application/json

{
  "title": "Complete project documentation",
  "description": "Write detailed README",
  "priority": "high",
  "dueDate": "2026-02-10T00:00:00Z",
  "category": "work"
}
```

Response:
```json
{
  "id": "task_123",
  "title": "Complete project documentation",
  "description": "Write detailed README",
  "priority": "high",
  "status": "pending",
  "dueDate": "2026-02-10T00:00:00Z",
  "category": "work",
  "createdAt": "2026-02-07T10:00:00Z"
}
```

---

## 🚀 Deployment

### Option 1: Vercel (Recommended for Frontend)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy Frontend**
   ```bash
   cd frontend
   vercel --prod
   ```

3. **Set Environment Variables** in Vercel Dashboard:
   - `NEXT_PUBLIC_API_URL` → Your backend URL

### Option 2: Railway (Recommended for Backend)

1. **Install Railway CLI**
   ```bash
   npm i -g @railway/cli
   ```

2. **Deploy Backend**
   ```bash
   cd backend
   railway init
   railway up
   ```

3. **Set Environment Variables** in Railway:
   - `DATABASE_URL`
   - `GROQ_API_KEY`
   - `CORS_ORIGIN`

### Option 3: VPS/Cloud Server

1. **Clone repository on server**
   ```bash
   git clone https://github.com/yourusername/cortexia.git
   cd cortexia
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Build applications**
   ```bash
   npm run build
   ```

4. **Set up process manager** (PM2)
   ```bash
   npm i -g pm2
   
   # Start backend
   cd backend
   pm2 start index.js --name cortexia-api
   
   # Start frontend
   cd ../frontend
   pm2 start npm --name cortexia-web -- start
   ```

5. **Set up Nginx reverse proxy** (optional)
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       location / {
           proxy_pass http://localhost:3000;
       }
       
       location /api {
           proxy_pass http://localhost:3001;
       }
   }
   ```

### Database Migration (SQLite → PostgreSQL)

1. **Set up PostgreSQL database**

2. **Update backend config**:
   ```typescript
   // backend/drizzle.config.ts
   dialect: "postgresql",
   dbCredentials: {
     url: process.env.DATABASE_URL
   }
   ```

3. **Run migrations**:
   ```bash
   cd backend
   npm run db:push
   ```

---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Reporting Issues

- Use GitHub Issues
- Include steps to reproduce
- Provide screenshots if applicable
- Specify your environment (OS, Node version, etc.)

### Submitting Pull Requests

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test thoroughly: `npm run build`
5. Commit: `git commit -m 'feat: add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Coding Standards

- **TypeScript**: Use proper types, avoid `any`
- **React**: Functional components with hooks
- **Naming**: 
  - Components: `PascalCase`
  - Files: `kebab-case.tsx`
  - Functions: `camelCase`
- **Comments**: Document complex logic
- **Testing**: Add tests for new features

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2026 CorteXia Team

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Drizzle ORM](https://orm.drizzle.team/) - Type-safe database toolkit
- [Groq](https://groq.com/) - Lightning-fast AI inference
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [Lucide](https://lucide.dev/) - Beautiful icons

---

## 📞 Support & Contact

- **Issues**: [GitHub Issues](https://github.com/yourusername/cortexia/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/cortexia/discussions)
- **Email**: support@cortexia.com
- **Twitter**: [@cortexia](https://twitter.com/cortexia)

---

## 🗺️ Roadmap

### Current Version: 1.0.0

- [x] Core task management
- [x] Goal tracking system
- [x] Habit tracker
- [x] Journal with mood tracking
- [x] Time tracking & Pomodoro
- [x] Finance tracking
- [x] Study planner
- [x] AI life coach
- [x] Analytics dashboard

### Upcoming Features

- [ ] Mobile applications (iOS & Android)
- [ ] Real-time collaboration
- [ ] Cloud sync
- [ ] Advanced AI insights
- [ ] Integrations (Google Calendar, Notion, etc.)
- [ ] Custom themes & layouts
- [ ] API for third-party integrations
- [ ] Plugin system

---

<div align="center">

### ⭐ Star this repository if you find it helpful!

**Built with ❤️ by the CorteXia Team**

[Report Bug](https://github.com/yourusername/cortexia/issues) · [Request Feature](https://github.com/yourusername/cortexia/issues) · [View Demo](https://cortexia.vercel.app)

</div>
