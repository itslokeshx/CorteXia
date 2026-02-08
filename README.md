# 🧠 CorteXia - Your Second Brain

<div align="center">

![CorteXia Banner](https://via.placeholder.com/1200x400/8B5CF6/FFFFFF?text=CorteXia+-+Organize+Your+Life.+Achieve+Your+Goals.)

**The Ultimate AI-Powered Life Operating System**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/cloud/atlas)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[Live Demo](#) • [Documentation](#) • [Report Bug](#) • [Request Feature](#)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Setup](#environment-setup)
  - [MongoDB Setup](#mongodb-setup)
  - [Google OAuth Setup](#google-oauth-setup)
- [Project Structure](#-project-structure)
- [Features Deep Dive](#-features-deep-dive)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**CorteXia** is a world-class, AI-powered productivity platform that serves as your cognitive operating system. Unlike traditional task managers, CorteXia deeply understands your life through advanced AI, providing proactive insights, intelligent automation, and seamless integration across all aspects of your personal and professional life.

### Why CorteXia?

- 🧠 **Omnipotent AI** - Create tasks, set reminders, change settings, all via natural conversation
- 🔗 **Deep Integration** - Tasks, habits, goals, time blocks all connected and synchronized
- 📊 **Intelligent Insights** - Pattern detection, burnout prevention, productivity optimization
- 🎯 **Goal-Oriented** - Everything ties back to your long-term objectives
- 💎 **Beautiful UX** - Minimal design with maximum functionality
- ☁️ **100% Cloud-Based** - Access your data anywhere, anytime
- 🔐 **Privacy-First** - Your data is encrypted and secure

---

## ✨ Key Features

### 🤖 Omnipotent AI Assistant
- **Natural Language Control** - "Create a task to finish the report by Friday 2pm"
- **Memory System** - Remembers your name, preferences, and important dates
- **Proactive Interventions** - Warns about burnout, streak breaks, at-risk goals
- **Multi-Action Execution** - Performs multiple actions from a single command
- **Theme Control** - "Switch to dark mode" changes theme instantly
- **Intelligent API Rotation** - Never runs out of AI capacity with automatic fallback

### ✅ Smart Task Management
- **AI-Powered Creation** - Analyzes input and suggests priority, time, and goal linking
- **Time Blocking** - Tasks automatically create time blocks in calendar
- **Goal Integration** - Link tasks to long-term goals for context
- **Priority System** - Low, Medium, High, Critical with color coding
- **Subtasks** - Break down complex tasks into manageable steps
- **Drag & Drop** - Intuitive task organization

### 🎯 GitHub-Style Habit Tracker
- **365-Day Heatmap** - Visual streak tracking with intensity levels
- **Streak Analytics** - Current streak, longest streak, completion rate
- **Frequency Control** - Daily, weekly, or custom schedules
- **Quick Toggle** - Mark habits complete with satisfying animations
- **Pattern Detection** - AI identifies your best times for habit completion
- **Streak Protection** - Warnings before you break important streaks

### 🚩 Hierarchical Goal System
- **Multi-Level Structure** - Year → Quarter → Month → Week breakdown
- **Progress Tracking** - Visual progress bars at every level
- **AI Roadmap Generation** - Automatically create milestones and action items
- **Status Monitoring** - On Track, At Risk, Behind, Completed
- **Cross-Feature Linking** - Goals connect to tasks, habits, time blocks, expenses
- **Deadline Alerts** - AI warns when goals need attention

### 📅 Visual Time Blocking
- **Day/Week/Month Views** - Flexible calendar visualization
- **Drag-and-Drop Scheduling** - Move time blocks effortlessly
- **Category Colors** - Work, Focus, Meeting, Break, Personal, Habit
- **Task Integration** - Time blocks linked to tasks and habits
- **Copy Schedule** - Duplicate yesterday's blocks to today/tomorrow
- **Current Time Indicator** - Real-time tracking of your position in the day

### ⏱️ Pomodoro Timer with Analytics
- **Focus Sessions** - 25-minute deep work intervals
- **Full-Screen Mode** - Distraction-free timer with ambient animations
- **Accurate Logging** - Only logs actual time spent (not planned duration)
- **Detailed Analytics** - Daily/weekly/monthly stats, time by category
- **Productivity Trends** - Visual charts showing your focus patterns
- **Incomplete Session Tracking** - Separate tracking for stopped sessions

### 💰 Expense Tracking with Goal Impact
- **Quick Entry** - Log expenses with title, amount, category, date
- **Budget Monitoring** - Monthly budget with visual progress
- **Goal Linking** - Track expenses related to savings goals
- **Impact Analysis** - See how purchases affect goal timelines
- **Category Breakdown** - Charts and reports by spending category
- **Receipt Storage** - Upload and link receipt images

### ✍️ Journal with AI Reflection
- **Daily Entries** - One journal entry per day
- **Mood Tracking** - 5-point scale with emoji selector
- **Energy/Stress/Focus** - Track multiple dimensions of wellbeing
- **AI Reflection** - Get personalized insights from your entries
- **Trend Analysis** - 30-day mood charts and pattern detection
- **Cross-Linking** - Connect entries to goals, habits, and tasks

### 🎨 World-Class Design
- **Minimal Aesthetic** - 90% white space, surgical precision
- **Smooth Animations** - Framer Motion for delightful interactions
- **Responsive Design** - Perfect on desktop, tablet, and mobile
- **Dark Mode** - Eye-friendly theme with full coverage
- **Loading Experience** - Meaningful loading screen with particle animations
- **Micro-interactions** - Confetti celebrations, hover effects, smooth transitions

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
- **State Management**: [React Query](https://tanstack.com/query) + [Zustand](https://zustand-demo.pmnd.rs/)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Notifications**: [React Hot Toast](https://react-hot-toast.com/)

### Backend
- **Database**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Cloud)
- **ODM**: [Mongoose](https://mongoosejs.com/)
- **Authentication**: [NextAuth.js](https://next-auth.js.org/)
- **API Routes**: Next.js API Routes (Server-side)
- **Password Hashing**: [bcryptjs](https://www.npmjs.com/package/bcryptjs)

### AI & Intelligence
- **AI Integration**: Advanced Large Language Model
- **Fallback System**: Multi-key automatic rotation
- **Caching**: 5-minute TTL response cache
- **Rate Limiting**: Smart distribution and load balancing
- **Context Building**: Real-time user data aggregation

### DevOps & Tools
- **Hosting**: [Vercel](https://vercel.com/)
- **Version Control**: Git + GitHub
- **Package Manager**: npm / yarn
- **Code Quality**: ESLint + Prettier
- **Type Checking**: TypeScript strict mode

---

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** or **yarn** package manager
- **MongoDB Atlas** account ([Sign up free](https://www.mongodb.com/cloud/atlas))
- **Google Cloud Console** account (for OAuth)
- **AI API** access (your preferred LLM provider)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/cortexia.git
cd cortexia
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
```

3. **Copy environment template**

```bash
cp .env.example .env.local
```

4. **Configure environment variables** (see [Environment Setup](#environment-setup))

5. **Run development server**

```bash
npm run dev
# or
yarn dev
```

6. **Open your browser**

Navigate to `http://localhost:3000`

---

### Environment Setup

Create a `.env.local` file in the root directory:

```bash
# MongoDB Atlas
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/cortexia?retryWrites=true&w=majority

# NextAuth.js (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AI API Keys (multiple for fallback)
AI_API_KEY_1=your_first_key
AI_API_KEY_2=your_second_key
AI_API_KEY_3=your_third_key
AI_API_KEY_4=your_fourth_key
```

---

### MongoDB Setup

1. **Create MongoDB Atlas Account**
   - Visit [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free account

2. **Create a Cluster**
   - Choose **FREE M0 tier**
   - Select cloud provider (AWS recommended)
   - Choose region closest to your users
   - Name: `cortexia-cluster`

3. **Create Database User**
   - Navigate to **Database Access**
   - Add new database user
   - Authentication: **Password**
   - Set username and strong password
   - Privileges: **Atlas Admin**

4. **Configure Network Access**
   - Go to **Network Access**
   - Add IP Address
   - Allow access from anywhere: `0.0.0.0/0`
   - ⚠️ For production, restrict to specific IPs

5. **Get Connection String**
   - Click **Connect** on your cluster
   - Choose "Connect your application"
   - Driver: **Node.js** version 5.5+
   - Copy connection string
   - Replace `<password>` with your password
   - Add database name: `/cortexia`

---

### Google OAuth Setup

1. **Access Google Cloud Console**
   - Go to [console.cloud.google.com](https://console.cloud.google.com/)

2. **Create New Project**
   - Click "Select a project" → "New Project"
   - Name: "CorteXia"
   - Click "Create"

3. **Enable Google+ API**
   - Navigate to "APIs & Services" → "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. **Create OAuth Credentials**
   - Go to "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: **Web application**
   - Name: "CorteXia Web Client"
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google`
     - `https://yourdomain.com/api/auth/callback/google`
   - Click "Create"

5. **Save Credentials**
   - Copy **Client ID** and **Client Secret**
   - Add to your `.env.local` file

---

## 📁 Project Structure

```
cortexia/
├── app/                          # Next.js 14 App Router
│   ├── api/                      # API Routes
│   │   ├── auth/                 # Authentication
│   │   │   ├── [...nextauth]/   # NextAuth handler
│   │   │   └── signup/          # Email signup
│   │   ├── tasks/               # Task CRUD
│   │   ├── habits/              # Habit CRUD
│   │   ├── goals/               # Goal CRUD
│   │   ├── time-blocks/         # Time block CRUD
│   │   ├── expenses/            # Expense CRUD
│   │   ├── journal/             # Journal CRUD
│   │   └── ai/                  # AI endpoints
│   │       └── chat/            # AI chat handler
│   ├── auth/                    # Auth pages
│   ├── dashboard/               # Protected pages
│   │   ├── tasks/               # Task management
│   │   ├── habits/              # Habit tracking
│   │   ├── goals/               # Goal setting
│   │   ├── planner/             # Day planner
│   │   ├── pomodoro/            # Time tracker
│   │   ├── expenses/            # Expense tracking
│   │   ├── journal/             # Journaling
│   │   └── settings/            # User settings
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Landing page
├── components/                   # React components
│   ├── ui/                      # shadcn/ui components
│   ├── LoadingScreen.tsx        # Loading experience
│   ├── AIFloatingChat.tsx       # AI chatbot
│   ├── Sidebar.tsx              # Navigation
│   └── ...
├── lib/                         # Utilities
│   ├── mongodb.ts               # Database connection
│   ├── ai/                      # AI system
│   │   ├── client.ts            # API client
│   │   ├── context.ts           # Context builder
│   │   ├── prompts.ts           # System prompts
│   │   └── executor.ts          # Action executor
│   └── utils.ts                 # Helpers
├── models/                      # Mongoose schemas
│   ├── User.ts
│   ├── Task.ts
│   ├── Habit.ts
│   ├── HabitCompletion.ts
│   ├── Goal.ts
│   ├── TimeBlock.ts
│   ├── Expense.ts
│   ├── JournalEntry.ts
│   ├── AIConversation.ts
│   ├── UserMemory.ts
│   └── TimeLog.ts
├── hooks/                       # Custom hooks
│   ├── useAuth.ts
│   ├── useTasks.ts
│   └── ...
├── public/                      # Static files
├── .env.local                   # Environment variables
├── .gitignore
├── next.config.js
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

---

## 🎯 Features Deep Dive

### Omnipotent AI System

The AI is the core intelligence that powers CorteXia:

**Natural Language Understanding**
```
User: "Create a high-priority task to finish ML assignment by Friday 2pm"
AI: ✅ Task created
    📅 Time block scheduled (Friday 2-4pm)
    ⏰ Reminder set (Friday 1:30pm)
```

**Memory & Context**
```
User: "My name is Sarah"
AI: [Saves to database] "Got it, Sarah! I'll remember that."

Later conversation:
AI: "Hey Sarah, you have 3 tasks due today..."
```

**Multi-Action Execution**
```json
{
  "message": "I've organized your week!",
  "actions": [
    { "type": "create_task", "data": {...} },
    { "type": "schedule_time_block", "data": {...} },
    { "type": "set_reminder", "data": {...} },
    { "type": "update_goal", "data": {...} }
  ]
}
```

**System Control**
```
User: "Switch to dark mode"
AI: [Updates user preferences] Theme changed ✨

User: "Delete all my completed tasks"
AI: [Soft deletes from database] Done! Removed 47 completed tasks.
```

### Cross-Page Synchronization

**Task → Time Block Integration**
- Create task with time → Auto-generates time block
- Update task time → Time block moves
- Complete task → Time block marked done
- Delete task → Time block removed

**Habit → Streak System**
- Mark habit complete → Streak +1
- Miss habit → Streak resets
- AI detects patterns → Suggests optimal times
- Break streak → Warning notification

**Goal → Task → Habit Chain**
- Create year goal → AI generates quarterly milestones
- Each milestone → Converted to monthly tasks
- Tasks → Link to supporting habits
- Progress → Aggregated across all levels

---

## 🔌 API Documentation

### Authentication Endpoints

**POST** `/api/auth/signup`
```json
Request:
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}

Response (201):
{
  "message": "User created successfully",
  "userId": "507f1f77bcf86cd799439011"
}
```

**POST** `/api/auth/signin` (via NextAuth)
```json
Credentials:
{
  "email": "user@example.com",
  "password": "securePassword123"
}

Google OAuth:
{
  "provider": "google"
}
```

### Task Management

**GET** `/api/tasks`
- Returns all user tasks (non-deleted)
- Sorted by creation date (newest first)
- Includes goal and parent task references

**POST** `/api/tasks`
```json
Request:
{
  "title": "Finish project report",
  "description": "Complete Q4 report",
  "priority": "high",
  "dueDate": "2026-02-15",
  "dueTime": "14:00",
  "goalId": "507f1f77bcf86cd799439011"
}

Response (201):
{
  "task": {
    "_id": "...",
    "title": "Finish project report",
    ...
  }
}
```

**PATCH** `/api/tasks`
```json
Request:
{
  "id": "507f1f77bcf86cd799439011",
  "completed": true,
  "completedAt": "2026-02-08T14:30:00Z"
}
```

**DELETE** `/api/tasks?id={taskId}`
- Soft delete (sets deletedAt timestamp)
- Preserves data for potential recovery

### AI Chat

**POST** `/api/ai/chat`
```json
Request:
{
  "message": "Create a task to review PR tomorrow at 10am",
  "userId": "507f1f77bcf86cd799439011",
  "conversationId": "uuid-v4-here"
}

Response:
{
  "message": "I've created the task and scheduled it!",
  "actions": [
    {
      "success": true,
      "message": "Created task: 'Review PR'"
    },
    {
      "success": true,
      "message": "Scheduled: Tomorrow 10-11am"
    }
  ]
}
```

---

## 💾 Database Schema

### Collections Overview

**12 MongoDB Collections:**
1. `users` - User accounts and preferences
2. `tasks` - Task management
3. `habits` - Habit definitions
4. `habitcompletions` - Daily habit tracking
5. `goals` - Goal hierarchy
6. `timeblocks` - Calendar events
7. `expenses` - Financial tracking
8. `journalentries` - Daily journals
9. `aiconversations` - Chat history
10. `usermemories` - AI memory storage
11. `timelogs` - Pomodoro sessions

### Key Schemas

**User Collection**
```typescript
{
  _id: ObjectId,
  email: string (unique, indexed),
  name: string,
  password: string (bcrypt hashed),
  provider: 'credentials' | 'google',
  theme: 'light' | 'dark' | 'auto',
  timezone: string,
  notificationPreferences: {
    email: boolean,
    push: boolean,
    dailySummary: boolean,
    goalReminders: boolean,
    habitStreaks: boolean
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Task Collection**
```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User', indexed),
  title: string (required),
  description: string,
  priority: 'low' | 'medium' | 'high' | 'critical',
  status: 'pending' | 'in_progress' | 'completed',
  dueDate: Date,
  dueTime: string (HH:mm format),
  estimatedMinutes: number,
  goalId: ObjectId (ref: 'Goal'),
  parentTaskId: ObjectId (ref: 'Task'),
  completed: boolean,
  completedAt: Date,
  tags: string[],
  deletedAt: Date (soft delete),
  createdAt: Date,
  updatedAt: Date
}

Indexes:
- userId + dueDate (compound)
- userId + status (compound)
- goalId
```

**Habit Collection**
```typescript
{
  _id: ObjectId,
  userId: ObjectId (ref: 'User'),
  name: string (required),
  frequency: 'daily' | 'weekly' | 'custom',
  frequencyConfig: {
    monday: boolean,
    tuesday: boolean,
    ...
  },
  currentStreak: number (default: 0),
  longestStreak: number (default: 0),
  totalCompletions: number (default: 0),
  color: string (hex),
  icon: string,
  createdAt: Date,
  updatedAt: Date
}
```

*Complete schemas available in `/models` directory*

---

## 🚢 Deployment

### Deploying to Vercel

1. **Prepare Repository**
```bash
git add .
git commit -m "Production ready"
git push origin main
```

2. **Import to Vercel**
   - Visit [vercel.com/new](https://vercel.com/new)
   - Click "Import Git Repository"
   - Select your GitHub repository
   - Configure project settings

3. **Environment Variables**
   - Add all variables from `.env.local`
   - Update `NEXTAUTH_URL` to your production domain
   - Ensure MongoDB URI allows Vercel IPs

4. **Deploy**
   - Click "Deploy"
   - Wait for build completion (~2-3 minutes)
   - Visit your live URL

### Production Checklist

**Security**
- [ ] Environment variables configured
- [ ] MongoDB network access restricted
- [ ] Google OAuth production URLs added
- [ ] CORS policies configured
- [ ] Rate limiting enabled
- [ ] HTTPS enforced

**Performance**
- [ ] Image optimization enabled
- [ ] API route caching configured
- [ ] Database indexes created
- [ ] CDN configured
- [ ] Compression enabled

**Monitoring**
- [ ] Error tracking (Sentry/LogRocket)
- [ ] Analytics (Vercel Analytics)
- [ ] Uptime monitoring
- [ ] Performance monitoring
- [ ] Database monitoring

---

## 🤝 Contributing

We welcome contributions from the community!

### How to Contribute

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. **Make your changes**
   - Follow code style guidelines
   - Add tests if applicable
   - Update documentation
4. **Commit your changes**
   ```bash
   git commit -m "Add amazing feature"
   ```
5. **Push to your branch**
   ```bash
   git push origin feature/amazing-feature
   ```
6. **Open a Pull Request**
   - Describe your changes
   - Reference any related issues
   - Request review

### Development Guidelines

- **Code Style**: Follow existing patterns
- **TypeScript**: Use strict mode, avoid `any`
- **Components**: Keep them small and focused
- **Commits**: Write clear, descriptive messages
- **Tests**: Add tests for new features
- **Documentation**: Update README when needed

---

## 📄 License

This project is licensed under the **MIT License**.

```
MIT License

Copyright (c) 2026 CorteXia

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
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
```

See [LICENSE](LICENSE) file for full details.

---

## 🙏 Acknowledgments

**Technologies & Libraries**
- [Next.js](https://nextjs.org/) - The React framework for production
- [MongoDB Atlas](https://www.mongodb.com/) - Cloud database platform
- [NextAuth.js](https://next-auth.js.org/) - Authentication for Next.js
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Framer Motion](https://www.framer.com/motion/) - Animation library
- [shadcn/ui](https://ui.shadcn.com/) - Beautifully designed components
- [Vercel](https://vercel.com/) - Deployment and hosting platform

**Inspiration**
- Linear - For design inspiration and keyboard shortcuts
- Notion - For flexible data structures
- GitHub - For contribution graph visualization
- Arc Browser - For spatial intelligence

---

## 📧 Support & Contact

**Need Help?**
- 📖 [Documentation](#)
- 💬 [Discord Community](#)
- 🐛 [Report Issues](https://github.com/yourusername/cortexia/issues)
- ✨ [Request Features](https://github.com/yourusername/cortexia/issues/new)

**Connect With Us**
- 🌐 Website: [cortexia.app](#)
- 🐦 Twitter: [@cortexia](#)
- 📧 Email: hello@cortexia.app

---

<div align="center">

### Built with 💜 by developers, for productivity enthusiasts

**[⬆ Back to Top](#-cortexia---your-second-brain)**

---

**Star ⭐ this repo if you find it helpful!**

</div>