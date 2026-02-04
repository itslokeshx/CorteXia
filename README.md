<div align="center">

# ✨ CorteXia

### Your Life, Understood. Powered by AI.

A unified personal life operating system with deep integration across tasks, habits, goals, finances, time tracking, and journaling — all powered by intelligent AI insights.

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org/)
[![Tailwind](https://img.shields.io/badge/Tailwind-4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)

</div>

---

## 🎯 Overview

CorteXia is a **complete, functional productivity system** that treats your life as a cohesive whole rather than isolated domains. Every feature is deeply integrated — tasks connect to goals, habits build towards milestones, finances track against objectives, and AI weaves insights across everything.

<div align="center">

| 📋 Tasks | 🎯 Goals | 💪 Habits | 💰 Finance | ⏱️ Time | 📓 Journal |
|:---:|:---:|:---:|:---:|:---:|:---:|
| Smart task management with recurrence, priorities & goal linking | Hierarchical horizons from life vision to weekly targets | GitHub-style streak calendar with target days | Budget tracking, spending trends & AI insights | Pomodoro timer with focus modes & analytics | Mood/energy tracking with AI prompts |

</div>

---

## ✨ Key Features

### 🤖 Omnipotent AI Assistant
Press **⌘K** anywhere to summon the AI chatbot. Create tasks, log expenses, check progress, or ask anything — all through natural language.

\`\`\`
"Add task: Review quarterly report by Friday"
"I spent $45 on groceries"  
"How am I doing on my fitness goal?"
"Show my tasks for today"
\`\`\`

### 📊 Dashboard
- **Productivity Score** — Real-time ring visualization of daily progress
- **AI Insights Strip** — Intelligent observations across all your data
- **Quick Actions** — One-click access to common operations
- **Today's Timeline** — Visual schedule of your day

### 📋 Tasks
- Grid/List view toggle
- Priority-based urgency colors (critical → low)
- Recurrence patterns (daily, weekly, monthly)
- Goal linking for meaningful task context
- Time estimates and tracking

### 🎯 Goals
- **5 Horizons** — Life Vision → Yearly → Quarterly → Monthly → Weekly
- Connected items display (linked tasks & habits)
- Tree, Board, and Timeline views
- Milestone tracking with completion states
- AI-generated roadmaps

### 💪 Habits
- **GitHub-style year streak calendar** — 365 days at a glance
- Target days selector (M-T-W-T-F-S-S)
- Custom colors per habit
- Category filtering
- Goal linking for habit-goal synergy

### 💰 Finance
- AI-powered spending insights
- Category breakdown with pie charts
- Monthly spending trends (area chart)
- Budget tracking with progress bars
- Transaction history with filtering

### 📓 Journal
- **Calendar view** — Browse entries by date with mood indicators
- **Emoji selectors** — Intuitive mood, energy, and focus tracking
- **AI prompts** — Rotating thought-provoking writing prompts
- Streak tracking for consistent journaling
- Tag system for organization

### ⏱️ Time Tracker
- Beautiful Pomodoro timer with focus mode
- Full-screen immersive focus sessions
- Task linking for accurate time attribution
- Session history and analytics
- Customizable work/break durations

### 📅 Day Planner
- Visual time block scheduling
- Drag-and-drop interface
- Task and goal linking per block
- AI schedule suggestions
- Daily overview at a glance

---

## 🛠️ Tech Stack

<table>
<tr>
<td width="50%" valign="top">

### Frontend
- **Next.js 16** — App Router
- **React 19** — Latest features
- **Tailwind CSS 4** — Utility-first styling
- **Framer Motion** — Smooth animations
- **Radix UI** — Accessible components
- **Recharts** — Data visualization
- **date-fns** — Date manipulation

</td>
<td width="50%" valign="top">

### Backend
- **Hono** — Lightweight API framework
- **PostgreSQL** — Via Supabase
- **Drizzle ORM** — Type-safe queries
- **Zod** — Schema validation
- **Groq AI** — Llama 3.3-70b chat
- **Google Gemini** — Insights analysis

</td>
</tr>
</table>

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm

### Installation

\`\`\`bash
# Clone the repository
git clone https://github.com/yourusername/cortexia.git
cd cortexia

# Install dependencies
pnpm install

# Start development server
pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see the app.

### Environment Variables

Create a \`.env.local\` file:

\`\`\`env
# Database (Supabase)
DATABASE_URL=your_supabase_connection_string

# AI Services
GROQ_API_KEY=your_groq_api_key
GOOGLE_AI_API_KEY=your_gemini_api_key
\`\`\`

---

## 📁 Project Structure

\`\`\`
CorteXia/
├── app/                    # Next.js pages
│   ├── page.tsx           # Dashboard
│   ├── tasks/             # Task management
│   ├── habits/            # Habit tracking
│   ├── goals/             # Goal architecture
│   ├── finance/           # Finance tracking
│   ├── journal/           # Journaling
│   ├── time-tracker/      # Pomodoro timer
│   ├── day-planner/       # Schedule planning
│   └── ai-coach/          # AI coaching
├── components/
│   ├── ai/                # AI chatbot
│   ├── dashboard/         # Dashboard widgets
│   ├── layout/            # App shell
│   └── ui/                # shadcn components
├── lib/
│   ├── context/           # React context
│   ├── types.ts           # TypeScript types
│   └── utils.ts           # Utilities
└── api/                   # Hono backend
    ├── routes/            # API endpoints
    ├── db/                # Database schema
    └── services/          # AI services
\`\`\`

---

## 🎨 Design Philosophy

| | Principle | Description |
|:---:|:---|:---|
| 🎯 | **Surgical Precision** | Every pixel justified, no wasted space |
| 🧘 | **Calm Authority** | Sophisticated yet approachable |
| 👻 | **Invisible Until Needed** | Information reveals on interaction |
| 📊 | **Truth Over Decoration** | Color only when meaningful |
| ✨ | **Addictive Through Clarity** | Engaging through understanding |

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License.

---

<div align="center">

**Built with ❤️ for people who want to understand and optimize their lives.**

[Report Bug](https://github.com/yourusername/cortexia/issues) · [Request Feature](https://github.com/yourusername/cortexia/issues)

</div>
