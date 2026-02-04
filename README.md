# 🧠 CorteXia

> **Your life, unified. Understood. Optimized.**

## 📋 Project Status: In Planning

**CorteXia** is a comprehensive AI-powered life management system designed to bring together tasks, habits, time tracking, finances, study sessions, and screen time into **one intelligent dashboard**. Powered by **Gemini 3**, it won't just store your data—it will **understand it**, find hidden patterns across domains, and deliver actionable insights you'd never see on your own.

This document outlines the complete vision, architecture, and implementation plan for CorteXia.

---

## 🎯 The Problem

Modern life is fragmented across dozens of apps:

- Tasks in Todoist
- Habits in Streaks
- Time in Toggl
- Money in Mint
- Study notes in Notion
- Screen time in... your phone settings?

**Result:** You're drowning in data but starving for insight.

You can't see that your Instagram binge _caused_ your gym streak to break, which _triggered_ task procrastination, which _led_ to stress eating and overspending.

**CorteXia will see the connections you can't.**

---

## ✨ What Makes CorteXia Different

### 🤖 Cross-Domain AI Reasoning (Powered by Gemini 3)

This won't be just another dashboard. It will be an AI that **understands your behavioral patterns**.

**Example Insights CorteXia Will Provide:**

```
🔍 PATTERN DETECTED:
Your Instagram usage spiked 600% when your gym streak broke.
This triggered a cascade:
  → Task completion dropped to 40%
  → Stress-ordered food delivery 3x ($85 overspent)

ROOT CAUSE: Late-night screen time → broken sleep → low energy
            → failed habits → stress → overspending

RECOMMENDATION: Block YouTube after 10pm.
Schedule gym at 7am before work energy dips.
```

**Gemini 3 connects the dots across:**

- Tasks & productivity
- Habits & consistency
- Time allocation
- Financial decisions
- Study effectiveness
- Screen time patterns
- Journal sentiment

---

## 🎨 Planned Features

### 📊 Unified Dashboard

**Vision:** One screen. Your entire life.

- **Today's Overview**: Tasks, habits, time, finance, study—all at a glance
- **AI Insights Panel**: Real-time pattern detection and recommendations
- **Beautiful Visualizations**: Charts, graphs, streak calendars, heatmaps
- **Quick Actions**: Add anything in seconds

### 🧠 Three Agentic Modes

The UI transforms based on your intent:

#### 🎯 FOCUS Mode

**For execution time.**

- Minimalist interface
- Only critical tasks visible
- Built-in Pomodoro timer
- Zero distractions

#### 🧘 WISE Mode

**For reflection time.**

- Expanded analytics
- Weekly/monthly trends
- AI asks probing questions
- Journal integration
- Strategic insights

#### ⚡ AUTO Mode

**"Just tell me what to do."**

- AI plans your entire week
- Optimized schedule based on your energy patterns
- Pre-prioritized tasks
- Budget allocation suggestions
- One-tap approval

### 🤖 Gemini 3 AI Features

#### 📈 Weekly Synthesis

Every Sunday, Gemini 3 will analyze your week and generate:

- **Wins**: What worked
- **Losses**: What didn't
- **Root Cause Analysis**: _Why_ things happened
- **Cross-Domain Patterns**: Hidden connections
- **Next Week Strategy**: Specific, actionable plan
- **Prediction**: Expected outcomes if you follow the plan

#### ☀️ Morning Briefing

Every morning, you'll receive:

- Energy forecast (based on sleep, habits)
- Top 3 critical tasks (AI-prioritized)
- Habit checklist
- Budget status
- Deadline alerts
- Daily motivation

#### 🔍 Pattern Detection

Gemini 3 will continuously scan for:

- **Cascade Effects**: How one behavior triggers others
- **Resource Leaks**: Where time/money/attention bleeds
- **Inverse Correlations**: When X↑, Y↓
- **Positive Loops**: Virtuous cycles to reinforce
- **Hidden Blockers**: What's preventing your goals

#### 🎯 Smart Prioritization

The AI will rank tasks using:

- Importance to long-term goals
- Deadline urgency
- Energy requirements
- Dependencies (blocking others?)
- Historical completion patterns

### 📊 Comprehensive Tracking

- **✅ Tasks**: AI-prioritized to-do lists with goal alignment
- **🏃 Habits**: Streak tracking with correlation analysis
- **⏰ Time**: Deep work vs. shallow work analysis
- **💰 Finance**: Budget tracking with overspending alerts
- **📚 Study**: Session logging with effectiveness metrics
- **📱 Screen Time**: App usage tracking with distraction scoring
- **📝 Journal**: Mood tracking with sentiment analysis

### 🎯 Goal Architecture

Connect daily actions to long-term vision:

- Life goals (1-5 years)
- Yearly goals
- Quarterly milestones
- Monthly targets
- Weekly objectives

**The AI will show you:** "Today's 2-hour study session moves you 1.3% closer to becoming an ML engineer."

---

## 🛠️ Planned Tech Stack

### Frontend

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** + **shadcn/ui** (beautiful, accessible components)
- **Zustand** (state management)
- **TanStack Query** (server state & caching)
- **Recharts** (data visualization)
- **Framer Motion** (smooth animations)
- **React Router** (routing)
- **date-fns** (date handling)
- **Zod** (validation)

### Backend

- **Node.js 20** + **TypeScript**
- **Hono** (ultra-fast web framework)
- **PostgreSQL 15** (via Supabase)
- **Drizzle ORM** (type-safe database)
- **Gemini 3 API** (AI reasoning engine)

### Deployment

- **Vercel** (frontend + serverless functions)
- **Supabase** (database hosting)
- **Vercel Edge Network** (global CDN)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│         PRESENTATION LAYER                  │
│  • Unified Dashboard                        │
│  • Agentic Mode Switcher                    │
│  • Data Visualization                       │
│  • AI Insights Panel                        │
└─────────────────────────────────────────────┘
                    ⬇️
┌─────────────────────────────────────────────┐
│         INTELLIGENCE LAYER                  │
│  • Gemini 3 Pattern Detection               │
│  • Behavioral Analysis Engine               │
│  • Priority Calculator                      │
│  • Weekly Synthesis Generator               │
│  • Morning Briefing Creator                 │
└─────────────────────────────────────────────┘
                    ⬇️
┌─────────────────────────────────────────────┐
│         DATA LAYER                          │
│  • PostgreSQL Database                      │
│  • Tasks, Habits, Time, Finance             │
│  • Study, Screen Time, Journal              │
│  • AI Insights Cache                        │
└─────────────────────────────────────────────┘
```

---

## �️ Development Roadmap

### Phase 1: Foundation (Days 1-2)

- [ ] Project setup (React + Vite + TypeScript)
- [ ] Install and configure tech stack
- [ ] Setup Supabase database
- [ ] Create database schema with Drizzle ORM
- [ ] Setup backend API with Hono
- [ ] Configure Vercel deployment

### Phase 2: Core Data Layer (Days 2-3)

- [ ] Implement Tasks API (CRUD operations)
- [ ] Implement Habits API with check-in system
- [ ] Implement Finance API with budget tracking
- [ ] Implement Time Tracking API
- [ ] Create frontend API client with TanStack Query
- [ ] Build data fetching hooks

### Phase 3: Gemini 3 Integration (Day 3)

- [ ] Setup Gemini API client
- [ ] Create AI prompt templates
- [ ] Implement AI Service layer
- [ ] Build Weekly Synthesis generator
- [ ] Build Morning Briefing generator
- [ ] Build Pattern Detection engine
- [ ] Build Priority Calculator

### Phase 4: Dashboard UI (Day 4)

- [ ] Create unified dashboard layout
- [ ] Build TodayOverview component
- [ ] Build TasksWidget with AI prioritization
- [ ] Build HabitsWidget with streak tracking
- [ ] Build TimeWidget with visualization
- [ ] Build FinanceWidget with budget status
- [ ] Build AI Insights Panel (★ Star Feature)

### Phase 5: Detail Pages & Analytics (Day 5)

- [ ] Build Tasks Page with filters
- [ ] Build Habits Page with StreakCalendar
- [ ] Build Time Analytics Page with charts
- [ ] Build Finance Page with spending charts
- [ ] Build AI Insights Page (detailed view)
- [ ] Build Goals Page with hierarchy visualization

### Phase 6: Agentic Modes & Polish (Day 6)

- [ ] Implement Focus Mode (minimalist view)
- [ ] Implement Wise Mode (analytics emphasis)
- [ ] Implement Auto Mode (AI-generated plans)
- [ ] Add dark mode support
- [ ] Add loading states and animations
- [ ] Add error handling and toast notifications
- [ ] Mobile responsiveness

### Phase 7: Demo & Submission (Day 7)

- [ ] Create realistic demo data
- [ ] Test complete user flows
- [ ] Record 3-minute demo video
- [ ] Write comprehensive documentation
- [ ] Final deployment to Vercel
- [ ] Submit to hackathon

### Technical Requirements

**Prerequisites for Development:**

- Node.js 20+
- npm or pnpm
- Supabase account (free tier)
- Gemini API key (from Google AI Studio)

**Environment Variables Needed:**

```env
DATABASE_URL=postgresql://...
GEMINI_API_KEY=your_key_here
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173
```

---

## 📖 Feature Specifications

### Core User Interactions

#### 1️⃣ Task Management

- Universal quick-add bar with natural language parsing
- AI-powered automatic prioritization
- Visual priority indicators (critical, high, medium, low)
- Deadline tracking with urgency alerts
- Time estimation and actual time logging
- Goal alignment visualization
- Drag-and-drop reordering

#### 2️⃣ Habit Tracking

- Daily check-in system with one-tap confirmation
- GitHub-style streak calendar visualization
- Current streak and longest streak tracking
- AI-powered "at risk" warnings before streak breaks
- Habit correlation analysis
- Customizable frequency (daily, weekly, custom)

#### 3️⃣ Time Tracking

- Manual time logging with category selection
- Focus quality rating (1-5 scale)
- Deep work vs shallow work classification
- Planned vs actual time comparison
- Weekly time distribution charts
- Resource leak detection (unplanned time sinks)

#### 4️⃣ Financial Tracking

- Quick expense/income logging
- Automatic categorization
- Budget vs actual spending tracking
- Weekly/monthly budget alerts
- Overspending warnings
- Spending by category visualization

#### 5️⃣ AI Insights

- On-demand weekly synthesis generation
- Automatic morning briefings
- Real-time pattern detection
- Cross-domain correlation analysis
- Actionable recommendations with evidence
- Dismiss or act on insights

#### 6️⃣ Mode Switching

- **Focus Mode**: Minimalist view for execution
- **Wise Mode**: Expanded analytics for reflection
- **Auto Mode**: AI-generated weekly plans

---

## 🎯 Gemini 3 Integration Details

### Why Gemini 3?

CorteXia leverages Gemini 3's unique capabilities:

1. **Long Context Window**: Analyzes 30+ days of multi-domain data simultaneously
2. **Cross-Domain Reasoning**: Connects patterns across tasks, habits, time, finance
3. **Structured Output**: Returns JSON for seamless integration
4. **Behavioral Understanding**: Goes beyond correlation to causation

### Key AI Endpoints

```typescript
// Weekly Synthesis
POST /api/insights/generate/weekly
→ Gemini 3 analyzes: tasks, habits, time, finance, study, screen time
→ Returns: wins, losses, root causes, patterns, strategy

// Morning Briefing
POST /api/insights/generate/briefing
→ Gemini 3 forecasts energy, prioritizes tasks
→ Returns: critical path, habit checklist, budget status

// Pattern Detection
POST /api/insights/detect-patterns
→ Gemini 3 scans for cross-domain correlations
→ Returns: cascade effects, resource leaks, hidden blockers

// Smart Prioritization
POST /api/tasks/prioritize
→ Gemini 3 ranks tasks by importance + urgency + goal alignment
→ Returns: ordered task list with reasoning
```

### Sample Prompt (Weekly Synthesis)

```typescript
const prompt = `
You are an AI life coach analyzing behavioral data.

WEEKLY DATA:
${JSON.stringify(
  {
    tasks: { completed: 12, failed: 5, avgFocusQuality: 3.8 },
    habits: { gym: { streak: 6, broken: 1 }, meditation: { streak: 7 } },
    time: { deepWork: 18, shallowWork: 22, wasted: 8 },
    finance: { spent: 480, budget: 500, overspending: false },
    screenTime: { instagram: 12, youtube: 8, productive: 5 },
  },
  null,
  2,
)}

Generate a comprehensive analysis with:
1. WINS (3-5 achievements)
2. LOSSES (3-5 failures)
3. ROOT CAUSE ANALYSIS (why losses happened)
4. CROSS-DOMAIN PATTERNS (connections across life areas)
5. NEXT WEEK STRATEGY (specific, actionable recommendations)
6. PREDICTION (expected outcomes)

Return JSON format.
`;

const synthesis = await geminiModel.generateContent(prompt);
```

---

## 📊 Planned API Architecture

### Base URL (When Deployed)

```
https://cortexia.vercel.app/api
```

### API Endpoints Specification

#### Tasks

- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `POST /api/tasks/prioritize` - Get AI-prioritized list

#### Habits

- `GET /api/habits` - Get all habits
- `POST /api/habits/:id/check-in` - Check in habit
- `GET /api/habits/:id/logs` - Get habit logs

#### Time Tracking

- `GET /api/time/logs` - Get time logs
- `POST /api/time/logs` - Log time entry
- `GET /api/time/analytics` - Get analytics

#### Finance

- `GET /api/finance/transactions` - Get transactions
- `POST /api/finance/transactions` - Add transaction
- `GET /api/finance/budget` - Get budget status

#### AI Insights

- `POST /api/insights/generate/weekly` - Generate weekly synthesis
- `POST /api/insights/generate/briefing` - Generate morning briefing
- `POST /api/insights/detect-patterns` - Detect patterns
- `GET /api/insights` - Get all insights

[Full API docs →](./docs/API.md)

---

## 🗂️ Project Structure

```
cortexia/
├── frontend/              # React app
│   ├── src/
│   │   ├── components/   # UI components
│   │   ├── pages/        # Route pages
│   │   ├── hooks/        # Custom hooks
│   │   ├── stores/       # Zustand stores
│   │   ├── lib/          # Utilities
│   │   └── types/        # TypeScript types
│   └── public/
│
├── api/                   # Backend (Vercel Functions)
│   ├── routes/           # API endpoints
│   ├── services/         # Business logic
│   ├── db/               # Database (Drizzle ORM)
│   └── lib/
│       ├── gemini.ts     # Gemini 3 client
│       └── prompts/      # AI prompt templates
│
├── .env.example
├── package.json
├── vercel.json
└── README.md
```

---

## 🧪 Testing Strategy

**Planned Testing Approach:**

### Unit Testing

- Component testing with React Testing Library
- Service layer testing for AI prompt generation
- Utility function testing
- Database query testing

### Integration Testing

- API endpoint testing
- Database integration tests
- Gemini 3 API integration tests

### End-to-End Testing

- User flow testing with Playwright
- Critical path testing (add task → get AI insights)
- Cross-domain pattern detection validation

### Quality Assurance

- TypeScript strict mode for type safety
- ESLint for code quality
- Prettier for code formatting
- Pre-commit hooks with Husky

---

## 🚀 Planned Deployment Strategy

### Platform: Vercel

**Why Vercel:**

- Zero-config deployment for Next.js/Vite apps
- Serverless functions for backend API
- Automatic CI/CD on git push
- Edge network for global performance
- Free tier perfect for demos
- Preview deployments for testing

### Deployment Steps (When Ready)

1. **Setup Repository**
   - Push code to GitHub
   - Connect repository to Vercel

2. **Configure Environment**
   - Add DATABASE_URL (Supabase)
   - Add GEMINI_API_KEY
   - Set NODE_ENV=production

3. **Deploy**
   - Automatic deployment on main branch push
   - Preview deployments for PRs
   - Production URL: cortexia.vercel.app

### Infrastructure

- **Frontend**: Vercel Edge Network
- **Backend**: Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini 3 API

---

## 🎥 Demo Video Plan

### Planned Video Structure (3 minutes)

**Timeline:**

**0:00-0:30** - Problem Introduction

- Show fragmented app landscape
- Demonstrate data disconnect
- Voice: "I'm drowning in productivity tools"

**0:30-1:00** - Solution Introduction

- Open CorteXia dashboard
- Pan across unified view
- Voice: "One system. Everything integrated."

**1:00-2:00** - AI Reasoning Showcase (★ Money Shot)

- Click "Generate AI Analysis"
- Show Gemini 3 API call
- Display pattern detection visual
- Highlight cross-domain connections
- Voice: "Gemini 3 connects the dots I couldn't see"

**2:00-2:30** - Mode Switching Demo

- Switch to Focus Mode → minimal UI
- Switch to Wise Mode → analytics expand
- Switch to Auto Mode → AI-generated plan
- Voice: "Adapts to how I want to work"

**2:30-3:00** - Vision & Close

- Show goal connection map
- Display future roadmap
- Voice: "This isn't just an app. This is my life, understood."
- Final frame: "Powered by Gemini 3. Built for everyone."

---

## 🤝 Contributing

**Project Status:** This project is currently in the planning phase. Once development begins, we'll welcome contributions!

### Planned Development Workflow

1. Fork the repository (when available)
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Follow TypeScript and ESLint standards
4. Write tests for new features
5. Commit with descriptive messages
6. Open a Pull Request with detailed description

### Areas We'll Need Help With

- Frontend component development
- AI prompt engineering and optimization
- Data visualization improvements
- Mobile responsiveness
- Testing and QA
- Documentation

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Google Gemini Team** for the incredible Gemini 3 API
- **shadcn/ui** for beautiful, accessible components
- **Supabase** for seamless PostgreSQL hosting
- **Vercel** for effortless deployment

---

## 📞 Project Information

**Repository:** [https://github.com/yourusername/cortexia](https://github.com/yourusername/cortexia) _(Coming Soon)_

**Project Status:** Planning & Design Phase

**Planned Launch:** Post-Hackathon Development

**Creator:** Your Name

- Twitter: [@yourhandle](https://twitter.com/yourhandle)
- Email: your.email@example.com
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)

---

## 🌟 Why CorteXia Will Win

### For Judges:

1. **Gemini 3 Showcases True Intelligence**
   - Not just another CRUD app with AI slapped on
   - Deep cross-domain reasoning demonstrating Gemini 3's capabilities
   - Real behavioral insights that actually matter to users
   - Novel use of long context windows for multi-domain analysis

2. **Solves a Universal Problem**
   - Everyone struggles with fragmented productivity tools
   - Immediate "I need this" reaction from judges
   - $50B+ productivity software market validation

3. **Technical Excellence**
   - Clean, scalable architecture
   - Type-safe end-to-end (TypeScript everywhere)
   - Production-ready code quality from day one
   - Modern tech stack (React 18, Vercel, Supabase)

4. **Exceptional UX Design**
   - Modern, professional interface
   - Thoughtful interactions and animations
   - Adaptive UI with 3 agentic modes
   - Accessibility built-in (ARIA, keyboard navigation)

5. **Complete Vision with Roadmap**
   - Clear 7-day implementation timeline
   - Post-hackathon growth strategy
   - Multi-user/team mode potential
   - API integration opportunities (Calendar, Banking, Fitness trackers)
   - Monetization path (freemium model)

### Competitive Advantages

- **vs Notion**: AI that actually understands behavioral patterns
- **vs Todoist**: Cross-domain insights, not just task management
- **vs Mint**: Connects financial decisions to life patterns
- **vs Forest**: Gamification with real intelligence behind it

### Market Opportunity

- **TAM**: 500M+ knowledge workers globally
- **Problem Validation**: Average person uses 8-12 productivity apps
- **Willingness to Pay**: $10-20/month for unified solution
- **Network Effect**: Habit data improves AI recommendations

---

<div align="center">

**To Be Built with ❤️ and Gemini 3**

⭐ **Interested in this project? Star the repo when it launches!** ⭐

---

### 📅 Project Timeline

**Planning Phase:** February 2026  
**Development:** 7-Day Hackathon Sprint  
**Launch:** Post-Hackathon Refinement

---

_This README represents the complete technical specification and vision for CorteXia.  
The project will be built using the architecture and features detailed above._

**Tech Stack:** React • TypeScript • Gemini 3 • PostgreSQL • Vercel  
**Status:** 📋 Planning → 🚧 Development Soon → 🚀 Launch

</div>
