# CorteXia - Your Life, Understood. Powered by AI.

A unified, AI-powered personal life operating system designed with surgical precision, calm authority, and invisible elegance. CorteXia integrates every dimension of personal life management into one intelligent system.

> **This is NOT mock data. This is NOT a read-only UI. This is a COMPLETE, FUNCTIONAL APPLICATION.**

## Vision

CorteXia is the world's first unified personal life operating system that competes with and surpasses fragmented productivity tools like Notion and Obsidian. It treats your life as a cohesive system, not isolated domains.

### Core Concept

CorteXia integrates ALL aspects of personal life management into ONE intelligent system:

- **Tasks & To-Dos** - Full CRUD with priority, categories, time estimates, and completion tracking
- **Time Tracking** - Deep analytics on how you spend your hours with focus quality metrics
- **Habit Tracking** - Streak-based habit management with GitHub-style calendar visualization
- **Finance Tracking** - Budget management, spending analytics, and financial insights
- **Study Sessions** - Learning goal tracking with subject breakdown and focus level monitoring
- **Journal Entries** - Reflective journaling with AI-powered summaries and pattern detection
- **Goal Architecture** - Hierarchical goal system with milestones and progress tracking
- **AI-Powered Insights** - Cross-domain pattern detection via Gemini AI integration

## Design Philosophy

- **Surgical Precision** - Every pixel justified, no wasted space
- **Calm Authority** - Like Claude.ai, sophisticated but approachable
- **Invisible Until Needed** - No clutter, information reveals on interaction
- **Truth Over Decoration** - Color only when meaningful; data-driven design
- **Addictive Through Clarity** - Engaging through understanding, not gamification

## Tech Stack

### Frontend

- **Framework**: Next.js 16.0.10 with App Router
- **UI Library**: React 19.2.0
- **Styling**: Tailwind CSS v4
- **Components**: shadcn/ui with custom CorteXia theming
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **State**: React Context with localStorage persistence

### Backend API

- **Framework**: Hono 4.5.1 (lightweight, edge-ready)
- **Server**: @hono/node-server
- **Database**: PostgreSQL via Supabase
- **ORM**: Drizzle ORM 0.29.5
- **Validation**: Zod schemas
- **AI**: Google Gemini 1.5 Pro (@google/generative-ai)

## Project Structure

```
CorteXia/
├── app/                        # Next.js App Router pages
│   ├── layout.tsx              # Root layout with providers
│   ├── page.tsx                # Dashboard home
│   ├── tasks/                  # Task management
│   ├── habits/                 # Habit tracking
│   ├── time/                   # Time analytics
│   ├── finance/                # Finance tracking
│   ├── study/                  # Study sessions
│   ├── goals/                  # Goal architecture
│   ├── journal/                # Journaling
│   ├── insights/               # AI insights
│   └── settings/               # Settings & preferences
├── components/
│   ├── layout/                 # Header, Sidebar, AppLayout
│   ├── dashboard/              # Life State Core, Signals, AI Strip
│   ├── tasks/                  # Task-specific components
│   └── ui/                     # shadcn/ui components
├── hooks/                      # Custom React hooks
│   ├── use-tasks.ts            # Task management hook
│   ├── use-goals.ts            # Goals management hook
│   ├── use-habits.ts           # Habits management hook
│   ├── use-finance.ts          # Finance management hook
│   └── use-time-tracking.ts    # Time tracking hook
├── lib/
│   ├── utils.ts                # Utility functions
│   ├── types.ts                # TypeScript types
│   └── context/
│       └── app-context.tsx     # Global app state
├── api/                        # Backend API (Hono)
│   ├── index.ts                # API entry point
│   ├── routes/
│   │   ├── tasks.ts            # Tasks CRUD API
│   │   ├── habits.ts           # Habits CRUD API
│   │   ├── goals.ts            # Goals CRUD API
│   │   ├── journal.ts          # Journal entries API
│   │   ├── finance.ts          # Finance API
│   │   ├── time-tracking.ts    # Time tracking API
│   │   ├── insights.ts         # AI insights API
│   │   └── auth.ts             # Authentication API
│   ├── db/
│   │   ├── index.ts            # Database connection
│   │   └── schema.ts           # Drizzle ORM schema
│   ├── services/
│   │   └── ai.ts               # Gemini AI service
│   └── middleware/
│       └── auth.ts             # Auth middleware
└── types/
    └── goal.ts                 # Goal type definitions
```

## API Endpoints

### Tasks (`/api/tasks`)

| Method | Endpoint        | Description                   |
| ------ | --------------- | ----------------------------- |
| GET    | `/`             | List all tasks with filtering |
| POST   | `/`             | Create a new task             |
| GET    | `/:id`          | Get task by ID                |
| PATCH  | `/:id`          | Update task                   |
| DELETE | `/:id`          | Delete task                   |
| POST   | `/:id/complete` | Mark task complete            |
| GET    | `/stats`        | Get task statistics           |

### Goals (`/api/goals`)

| Method | Endpoint               | Description       |
| ------ | ---------------------- | ----------------- |
| GET    | `/`                    | List all goals    |
| POST   | `/`                    | Create a new goal |
| GET    | `/:id`                 | Get goal by ID    |
| PATCH  | `/:id`                 | Update goal       |
| DELETE | `/:id`                 | Delete goal       |
| POST   | `/:id/milestones`      | Add milestone     |
| PATCH  | `/:id/milestones/:mid` | Update milestone  |

### Habits (`/api/habits`)

| Method | Endpoint     | Description          |
| ------ | ------------ | -------------------- |
| GET    | `/`          | List all habits      |
| POST   | `/`          | Create a new habit   |
| GET    | `/:id`       | Get habit by ID      |
| PATCH  | `/:id`       | Update habit         |
| DELETE | `/:id`       | Delete habit         |
| POST   | `/:id/check` | Log habit completion |
| GET    | `/streaks`   | Get streak data      |

### Journal (`/api/journal`)

| Method | Endpoint         | Description          |
| ------ | ---------------- | -------------------- |
| GET    | `/`              | List journal entries |
| POST   | `/`              | Create entry         |
| GET    | `/:id`           | Get entry by ID      |
| PATCH  | `/:id`           | Update entry         |
| DELETE | `/:id`           | Delete entry         |
| POST   | `/:id/summarize` | AI summarize entry   |
| GET    | `/stats`         | Get journaling stats |

### Finance (`/api/finance`)

| Method | Endpoint        | Description        |
| ------ | --------------- | ------------------ |
| GET    | `/transactions` | List transactions  |
| POST   | `/transactions` | Add transaction    |
| GET    | `/budgets`      | Get budgets        |
| POST   | `/budgets`      | Create budget      |
| GET    | `/summary`      | Financial summary  |
| GET    | `/analytics`    | Spending analytics |

### AI Insights (`/api/insights`)

| Method | Endpoint           | Description           |
| ------ | ------------------ | --------------------- |
| GET    | `/daily`           | Daily briefing        |
| GET    | `/weekly`          | Weekly synthesis      |
| GET    | `/patterns`        | Cross-domain patterns |
| GET    | `/recommendations` | AI recommendations    |
| POST   | `/analyze`         | Custom analysis       |

## Key Features

### Dashboard (Home)

The central hub of CorteXia featuring:

- **Life State Core** - Dynamic AI-calculated life state (Momentum, On Track, Drifting, Overloaded)
- **Signal Constellation** - 8 signals in orbital layout showing real-time domain health
- **AI Reasoning Strip** - Fixed bottom panel with Gemini-powered insights

### Tasks Page

- Full CRUD operations with real database persistence
- Priority levels (low, medium, high, urgent)
- Categories and domain filtering
- Time estimation and completion tracking
- Quick stats on high-priority and due-today tasks

### Habits Page

- Daily/weekly habit tracking with checkboxes
- Streak visualization with GitHub-style calendar
- Individual streak counters and momentum tracking
- Habit performance analytics

### Time Analytics

- Weekly time distribution charts
- Focus quality analysis (focused/distracted/neutral)
- Category breakdown of time allocation
- Daily productivity metrics

### Finance

- Income vs. expense tracking
- Weekly spending patterns with budget comparison
- Category-based spending breakdown
- Budget progress bars with warning indicators

### Study

- Session-based learning tracking
- Subject breakdown with time allocation
- Learning goal progress tracking
- Focus level metrics per session

### Goals

- Hierarchical goal system with milestones
- Progress bars with deadline tracking
- Sub-goal completion tracking
- Priority-based goal organization

### Journal

- Rich text journaling with mood tracking
- AI-powered entry summaries via Gemini
- Tag-based organization
- Mood analytics and sentiment tracking

### AI Insights

- Cross-domain pattern detection via Gemini 1.5 Pro
- Behavioral analysis and recommendations
- Weekly synthesis of life trends
- Morning briefing generation
- Actionable recommendations with impact estimates

### Settings

- Account and profile management
- Notification preferences
- Privacy and security controls
- Appearance customization
- Data export and management

## Design System

### Color Palette

**Semantic State Colors** (consistent across light/dark):

- Momentum: `#10B981` (Green)
- On Track: `#3B82F6` (Blue)
- Strategic: `#8B5CF6` (Purple)
- Drifting: `#F59E0B` (Amber)
- Overloaded: `#EF4444` (Red)
- Burnout: `#DC2626` (Dark Red)

**Light Mode Neutrals**:

- Background: `#FFFFFF`
- Secondary: `#F8F9FA`
- Tertiary: `#F0F1F3`
- Text Primary: `#0A0B0D`
- Text Secondary: `#4B5563`
- Text Tertiary: `#9CA3AF`

**Dark Mode Neutrals**:

- Background: `#0A0B0D`
- Secondary: `#151618`
- Tertiary: `#1F2023`
- Text Primary: `#F9FAFB`
- Text Secondary: `#D1D5DB`
- Text Tertiary: `#6B7280`

### Typography

- **Primary Font**: Inter Variable
- **Mono Font**: Geist Mono
- **Spacing System**: 8px baseline (8, 16, 24, 32, 48, 64, 80, 120)

### Layout Dimensions

- Header: 64px fixed
- Sidebar: 240px (collapsible to 64px)
- Content Max Width: 1440px
- Content Padding: 32px
- Card Border Radius: 12px
- Minimum Breathing Room: 40% empty space

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- PostgreSQL database (Supabase recommended)
- Google AI API key (for Gemini integration)

### Environment Variables

Create `.env` files:

**Frontend (`.env.local`)**:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Backend (`api/.env`)**:

```env
DATABASE_URL=postgresql://user:password@host:5432/cortexia
GEMINI_API_KEY=your-gemini-api-key
JWT_SECRET=your-jwt-secret
```

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/cortexia.git
cd cortexia

# Install frontend dependencies
pnpm install

# Install backend dependencies
cd api
npm install

# Set up database
npm run db:generate
npm run db:push

# Return to root
cd ..
```

### Running the Application

```bash
# Terminal 1: Start the backend API
cd api
npm run dev
# API runs on http://localhost:3001

# Terminal 2: Start the frontend
pnpm dev
# Frontend runs on http://localhost:3000
```

### Database Commands

```bash
cd api

# Generate migrations from schema changes
npm run db:generate

# Push schema to database
npm run db:push

# Open Drizzle Studio (database GUI)
npm run db:studio
```

## Future Roadmap

- [ ] Real-time sync across devices
- [ ] Mobile app (React Native)
- [ ] Calendar & email integrations
- [ ] Advanced analytics dashboards
- [ ] Voice input for journal entries
- [ ] Collaborative goals/tasks

## Browser Support

- Modern browsers with ES6+ support
- Dark/light mode detection and toggle
- Responsive design (desktop-first, mobile-compatible)

## Performance & Best Practices

- Modular component architecture for code reuse
- Optimized rendering with React best practices
- CSS variables for consistent theming
- Accessible UI with semantic HTML and ARIA labels
- Mobile-responsive with Tailwind CSS utility classes
- Edge-ready API with Hono framework
- Type-safe database queries with Drizzle ORM

## License

MIT License. Built with ❤️ for personal productivity.

---

**CorteXia**: Your life, understood. Powered by AI.
