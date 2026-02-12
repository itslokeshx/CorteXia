# 🧠 CorteXia Desktop — Your Second Brain

<div align="center">

<img src="frontend/public/Cortexia-icon.jpeg" alt="CorteXia Icon" width="200" height="200" />

**The Ultimate AI-Powered Life Operating System — Now as a Native Desktop App**

[![Tauri](https://img.shields.io/badge/Tauri-v2-24C8DB?style=for-the-badge&logo=tauri)](https://tauri.app/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/cloud/atlas)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Rust](https://img.shields.io/badge/Rust-Backend-DEA584?style=for-the-badge&logo=rust)](https://www.rust-lang.org/)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

</div>

---

> **📌 Branch:** `desktop` — This branch packages CorteXia as a native desktop application using [Tauri v2](https://tauri.app/). The web version lives on the `main` branch.

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Architecture](#-architecture)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Development](#development)
  - [Building Installers](#building-installers)
- [Installing the Desktop App](#-installing-the-desktop-app)
- [Project Structure](#-project-structure)
- [Configuration](#-configuration)
  - [Frontend Environment](#frontend-environment)
  - [Backend CORS](#backend-cors)
  - [Google OAuth](#google-oauth)
  - [Tauri Config](#tauri-config)
- [Features Deep Dive](#-features-deep-dive)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Cross-Platform Builds](#-cross-platform-builds)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**CorteXia** is a world-class, AI-powered productivity platform that serves as your cognitive operating system. Unlike traditional task managers, CorteXia deeply understands your life through advanced AI, providing proactive insights, intelligent automation, and seamless integration across all aspects of your personal and professional life.

This **desktop branch** packages the full CorteXia experience as a lightweight native application using **Tauri v2**. The app connects to the hosted backend on Render — no local server required.

### Why Desktop?

| Feature | Web | Desktop |
|---------|-----|---------|
| **Startup** | Opens in browser tab | Dedicated window, taskbar icon |
| **Performance** | Browser overhead | Native webview, lower memory |
| **Offline Shell** | Requires internet | App shell loads instantly |
| **System Integration** | Limited | Notifications, clipboard, shortcuts |
| **Distribution** | URL | `.deb`, `.rpm`, `.AppImage`, `.exe`, `.dmg` |

### Why CorteXia?

- 🧠 **Omnipotent AI** — Create tasks, set reminders, change settings via natural conversation
- 🔗 **Deep Integration** — Tasks, habits, goals, time blocks all connected and synchronized
- 📊 **Intelligent Insights** — Pattern detection, burnout prevention, productivity optimization
- 🎯 **Goal-Oriented** — Everything ties back to your long-term objectives
- 💎 **Beautiful UX** — Minimal design with maximum functionality
- 🔐 **Privacy-First** — Your data is encrypted and secure

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Tauri v2 Shell                     │
│  ┌───────────────────────────────────────────────┐  │
│  │          WebView (webkit2gtk / WebView2)       │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │      Next.js Static Export (out/)        │  │  │
│  │  │                                          │  │  │
│  │  │  React 19 + TypeScript + Tailwind v4    │  │  │
│  │  │  Framer Motion + Radix UI + shadcn/ui   │  │  │
│  │  └──────────────┬──────────────────────────┘  │  │
│  │                 │ HTTPS (fetch)                │  │
│  └─────────────────┼─────────────────────────────┘  │
│    Rust Backend     │  Plugins: shell, clipboard,    │
│    (src-tauri/)     │  notifications                 │
└─────────────────────┼───────────────────────────────┘
                      │
                      ▼
        ┌─────────────────────────┐
        │  Express.js API Server  │
        │  (Render.com)           │
        │                         │
        │  JWT Auth + MongoDB     │
        │  AI Chat + All CRUD     │
        └────────────┬────────────┘
                     │
                     ▼
           ┌──────────────────┐
           │  MongoDB Atlas   │
           │  (Cloud DB)      │
           └──────────────────┘
```

**Key design decisions:**
- Frontend is **fully client-rendered** (`"use client"`) — no SSR, no server components
- Static export via `next build` generates plain HTML/CSS/JS in `out/`
- Tauri loads `out/` directly via the `custom-protocol` — no dev server needed in production
- All API calls go through `lib/api-client.ts` using `NEXT_PUBLIC_API_URL`
- Authentication uses **JWT + localStorage** (not NextAuth.js)

---

## ✨ Key Features

### 🤖 Omnipotent AI Assistant
- **Natural Language Control** — "Create a task to finish the report by Friday 2pm"
- **Memory System** — Remembers your name, preferences, and important dates
- **Proactive Interventions** — Warns about burnout, streak breaks, at-risk goals
- **Multi-Action Execution** — Performs multiple actions from a single command
- **Theme Control** — "Switch to dark mode" changes theme instantly

### ✅ Smart Task Management
- AI-powered creation with priority, time, and goal linking
- Subtasks, drag & drop, time blocking integration
- Priority system: Low → Medium → High → Critical

### 🎯 GitHub-Style Habit Tracker
- 365-day heatmap with intensity levels
- Streak analytics, frequency control, pattern detection

### 🚩 Hierarchical Goal System
- Year → Quarter → Month → Week breakdown
- AI roadmap generation, cross-feature linking

### 📅 Visual Time Blocking
- Day/week/month views with drag-and-drop scheduling
- Category colors, task integration, copy schedule

### ⏱️ Pomodoro Timer with Analytics
- Focus sessions with full-screen mode
- Accurate logging, detailed analytics, productivity trends

### 💰 Expense Tracking
- Quick entry, budget monitoring, goal-linked impact analysis

### ✍️ Journal with AI Reflection
- Daily entries with mood/energy/stress/focus tracking
- AI reflection and 30-day trend analysis

### 🎨 Premium Design
- Minimal aesthetic with smooth Framer Motion animations
- Dark mode, responsive layout, micro-interactions

---

## 🛠️ Tech Stack

### Desktop Shell
| Technology | Purpose |
|-----------|---------|
| [Tauri v2](https://tauri.app/) | Native app shell (Rust backend + system webview) |
| [Rust](https://www.rust-lang.org/) | Tauri backend process |
| [webkit2gtk-4.1](https://webkitgtk.org/) | Linux webview engine |

### Frontend
| Technology | Purpose |
|-----------|---------|
| [Next.js 16](https://nextjs.org/) | React framework (static export mode) |
| [React 19](https://react.dev/) | UI library |
| [TypeScript 5](https://www.typescriptlang.org/) | Type safety |
| [Tailwind CSS v4](https://tailwindcss.com/) | Styling |
| [Framer Motion](https://www.framer.com/motion/) | Animations |
| [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/) | Component library |
| [Lucide React](https://lucide.dev/) | Icons |

### Backend (Hosted on Render)
| Technology | Purpose |
|-----------|---------|
| [Express.js](https://expressjs.com/) | REST API server |
| [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) | Cloud database |
| [Mongoose](https://mongoosejs.com/) | ODM |
| [JWT](https://jwt.io/) | Authentication |
| [bcryptjs](https://www.npmjs.com/package/bcryptjs) | Password hashing |

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| **Node.js** | ≥ 18.x | Frontend build |
| **Rust** | ≥ 1.70 | Tauri compilation |
| **npm** | ≥ 9.x | Package management |

**Linux system dependencies:**
```bash
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  libgtk-3-dev \
  libsoup2.4-dev \
  libjavascriptcoregtk-4.1-dev \
  librsvg2-dev \
  libappindicator3-dev
```

**Install Rust (if not installed):**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source "$HOME/.cargo/env"
```

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/cortexia.git
cd cortexia

# Switch to the desktop branch
git checkout desktop

# Install frontend dependencies
cd frontend
npm install
```

### Development

```bash
# Start Tauri dev mode (hot-reload frontend + native window)
npm run tauri:dev
```

This will:
1. Start the Next.js dev server on `http://localhost:3000`
2. Launch the Tauri native window pointing to it
3. Hot-reload on file changes

### Building Installers

```bash
# Build production installers for your current platform
npm run tauri:build
```

**Output location:** `frontend/src-tauri/target/release/bundle/`

| Platform | Format | Path |
|----------|--------|------|
| Linux | `.deb` | `bundle/deb/CorteXia_1.0.0_amd64.deb` |
| Linux | `.rpm` | `bundle/rpm/CorteXia-1.0.0-1.x86_64.rpm` |
| Linux | `.AppImage` | `bundle/appimage/CorteXia_1.0.0_amd64.AppImage` |
| Windows | `.msi` / `.exe` | `bundle/msi/` or `bundle/nsis/` |
| macOS | `.dmg` / `.app` | `bundle/dmg/` or `bundle/macos/` |

---

## 📦 Installing the Desktop App

### Linux (.deb — Ubuntu/Debian/Mint)
```bash
sudo dpkg -i CorteXia_1.0.0_amd64.deb
```
Then search for "CorteXia" in your application menu.

### Linux (.rpm — Fedora/RHEL)
```bash
sudo rpm -i CorteXia-1.0.0-1.x86_64.rpm
```

### Linux (.AppImage — Universal)
```bash
chmod +x CorteXia_1.0.0_amd64.AppImage
./CorteXia_1.0.0_amd64.AppImage
```
No installation needed — runs directly.

### Windows (.msi)
Double-click the `.msi` installer and follow the wizard.

### macOS (.dmg)
Open the `.dmg` and drag CorteXia to your Applications folder.

---

## 📁 Project Structure

```
cortexia/
├── frontend/                         # Next.js frontend + Tauri shell
│   ├── app/                          # Next.js App Router (pages)
│   │   ├── layout.tsx                # Root layout (client component)
│   │   ├── page.tsx                  # Dashboard
│   │   ├── login/page.tsx            # Auth page
│   │   ├── tasks/page.tsx            # Task management
│   │   ├── habits/page.tsx           # Habit tracking
│   │   ├── goals/page.tsx            # Goal system
│   │   ├── day-planner/page.tsx      # Time blocking
│   │   ├── time-tracker/page.tsx     # Pomodoro timer
│   │   ├── finance/page.tsx          # Expense tracking
│   │   ├── journal/page.tsx          # Daily journal
│   │   ├── ai-coach/page.tsx         # AI assistant
│   │   ├── settings/page.tsx         # User settings
│   │   └── timeline/page.tsx         # Activity timeline
│   ├── components/                   # React components
│   │   ├── ui/                       # shadcn/ui primitives
│   │   ├── auth-guard.tsx            # Route protection
│   │   ├── loading-screen.tsx        # Splash screen
│   │   ├── sidebar.tsx               # Navigation
│   │   └── ...
│   ├── lib/                          # Utilities & context
│   │   ├── api-client.ts             # API abstraction layer
│   │   ├── context/
│   │   │   ├── auth-context.tsx      # JWT auth (localStorage)
│   │   │   ├── app-context.tsx       # Global state
│   │   │   └── celebration-context.tsx
│   │   └── utils.ts
│   ├── src-tauri/                    # ── Tauri native shell ──
│   │   ├── tauri.conf.json           # App config, CSP, window settings
│   │   ├── Cargo.toml                # Rust dependencies
│   │   ├── build.rs                  # Tauri build script
│   │   ├── capabilities/
│   │   │   └── default.json          # Permission grants
│   │   ├── icons/                    # App icons (all sizes)
│   │   └── src/
│   │       └── main.rs               # Rust entry point
│   ├── out/                          # Static export output (gitignored)
│   ├── .env.local                    # Environment variables
│   ├── next.config.mjs               # Next.js config (static export)
│   ├── package.json                  # Dependencies + scripts
│   └── tsconfig.json
│
├── backend/                          # Express.js API server
│   ├── src/
│   │   ├── index.ts                  # Server entry + CORS config
│   │   ├── routes/                   # API route handlers
│   │   │   ├── auth.ts               # Signup, login, Google OAuth
│   │   │   ├── tasks.ts              # Task CRUD
│   │   │   ├── habits.ts             # Habit CRUD
│   │   │   ├── goals.ts              # Goal CRUD
│   │   │   ├── time-blocks.ts        # Time block CRUD
│   │   │   ├── expenses.ts           # Expense CRUD
│   │   │   ├── journal.ts            # Journal CRUD
│   │   │   └── ai.ts                 # AI chat endpoint
│   │   ├── models/                   # Mongoose schemas
│   │   ├── middleware/               # Auth middleware
│   │   └── utils/                    # Helpers
│   ├── package.json
│   └── tsconfig.json
│
├── .gitignore
└── README.md
```

---

## ⚙️ Configuration

### Frontend Environment

Create `frontend/.env.local`:

```bash
# ─── Backend API URL ─────────────────────────────────────────
NEXT_PUBLIC_API_URL=https://cortexia-backend.onrender.com
NEXT_PUBLIC_APP_ENV=desktop

# ─── Google OAuth ────────────────────────────────────────────
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### Backend CORS

The backend at `backend/src/index.ts` must include `tauri://localhost` in the allowed origins:

```typescript
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "https://corte-xia.vercel.app",
  "tauri://localhost",          // ← Desktop app origin
].filter(Boolean) as string[];
```

### Google OAuth

For Google sign-in to work inside the Tauri webview:

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
2. Edit your OAuth 2.0 Client ID
3. Add `tauri://localhost` to **Authorized JavaScript origins**
4. Add `tauri://localhost` to **Authorized redirect URIs**

### Tauri Config

The Tauri configuration lives at `frontend/src-tauri/tauri.conf.json`. Key settings:

| Setting | Value | Purpose |
|---------|-------|---------|
| `build.frontendDist` | `"../out"` | Points to Next.js static export |
| `build.devUrl` | `"http://localhost:3000"` | Dev server URL |
| `app.windows[0].width` | `1400` | Default window width |
| `app.windows[0].height` | `900` | Default window height |
| `app.security.csp` | *(see file)* | Content Security Policy |
| `bundle.identifier` | `"com.cortexia.app"` | App bundle ID |

The **CSP** allows connections to:
- `https://cortexia-backend.onrender.com` — Backend API
- `https://accounts.google.com` — Google OAuth
- `https://fonts.googleapis.com` / `https://fonts.gstatic.com` — Google Fonts

---

## 🔌 API Documentation

All API endpoints are served by the Express.js backend at `https://cortexia-backend.onrender.com`.

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | Register with email/password |
| `POST` | `/api/auth/login` | Login, returns JWT token |
| `POST` | `/api/auth/google` | Google OAuth token exchange |
| `GET` | `/api/auth/me` | Get current user (requires JWT) |

### Resources

| Resource | GET | POST | PATCH | DELETE |
|----------|-----|------|-------|--------|
| `/api/tasks` | List all | Create | Update | Soft delete |
| `/api/habits` | List all | Create | Update | Delete |
| `/api/habits/:id/complete` | — | Toggle | — | — |
| `/api/goals` | List all | Create | Update | Delete |
| `/api/time-blocks` | List all | Create | Update | Delete |
| `/api/expenses` | List all | Create | Update | Delete |
| `/api/journal` | List all | Create/Update | — | Delete |
| `/api/ai/chat` | — | Send message | — | — |
| `/api/user/settings` | Get | — | Update | — |

All authenticated endpoints require the header:
```
Authorization: Bearer <jwt-token>
```

---

## 💾 Database Schema

**12 MongoDB Collections** hosted on MongoDB Atlas:

| Collection | Key Fields |
|-----------|------------|
| `users` | email, name, password (hashed), provider, theme, timezone |
| `tasks` | title, priority, status, dueDate, goalId, subtasks, deletedAt |
| `habits` | name, frequency, currentStreak, longestStreak, color |
| `habitcompletions` | habitId, date, completed |
| `goals` | title, type (year/quarter/month/week), parentGoalId, progress |
| `timeblocks` | title, date, startTime, endTime, category, taskId |
| `expenses` | title, amount, category, date, goalId |
| `journalentries` | date, content, mood, energy, stress, focus |
| `aiconversations` | messages[], userId |
| `usermemories` | key, value, userId |
| `timelogs` | duration, category, date, completed |

---

## 🌍 Cross-Platform Builds

### Building on Each Platform

Tauri builds native installers for the **current OS** only. To build for all platforms:

| Platform | Build Environment | Output |
|----------|------------------|--------|
| **Linux** | Ubuntu/Debian/Fedora | `.deb`, `.rpm`, `.AppImage` |
| **Windows** | Windows 10/11 | `.msi`, `.exe` (NSIS) |
| **macOS** | macOS 11+ | `.dmg`, `.app` |

### GitHub Actions CI (Recommended)

For automated cross-platform builds, create `.github/workflows/build.yml`:

```yaml
name: Build Desktop App
on:
  push:
    tags: ['v*']

jobs:
  build:
    strategy:
      matrix:
        platform: [ubuntu-latest, windows-latest, macos-latest]
    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - uses: dtolnay/rust-toolchain@stable
      - name: Install Linux deps
        if: matrix.platform == 'ubuntu-latest'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libgtk-3-dev \
            libsoup2.4-dev libjavascriptcoregtk-4.1-dev librsvg2-dev
      - name: Install and build
        working-directory: frontend
        run: |
          npm ci
          npm run tauri:build
      - uses: actions/upload-artifact@v4
        with:
          name: bundles-${{ matrix.platform }}
          path: frontend/src-tauri/target/release/bundle/**/*
```

---

## 🔧 Troubleshooting

### App Shows Blank Screen After Loading
- **Cause**: Backend may be cold-starting (Render free tier takes ~30s to spin up)
- **Fix**: Wait 30-60 seconds and restart the app. The first request wakes the backend.

### Google OAuth Not Working
- **Cause**: `tauri://localhost` not added to Google Cloud Console
- **Fix**: Add `tauri://localhost` to both Authorized JavaScript Origins and Redirect URIs

### Build Fails with Missing System Libraries
- **Cause**: Missing development headers for webkit2gtk, GTK, or libsoup
- **Fix**: Run the `apt-get install` command from [Prerequisites](#prerequisites)

### CORS Errors in Console
- **Cause**: Backend doesn't allow `tauri://localhost` origin
- **Fix**: Ensure `"tauri://localhost"` is in the `allowedOrigins` array in `backend/src/index.ts`

### `libwebkit2gtk-4.0` Not Found (Ubuntu 24.04+)
- **Cause**: Ubuntu 24.04 dropped webkit2gtk-4.0
- **Fix**: This branch uses Tauri v2 which requires webkit2gtk-**4.1** (the default on 24.04)

---

## 🤝 Contributing

We welcome contributions!

1. **Fork** the repository
2. **Create** a feature branch: `git checkout -b feature/amazing-feature`
3. **Commit** your changes: `git commit -m "Add amazing feature"`
4. **Push** to branch: `git push origin feature/amazing-feature`
5. **Open** a Pull Request

### Development Guidelines
- Follow existing code patterns and TypeScript strict mode
- Keep components small and focused
- Test on the desktop app (not just browser) before submitting
- Update README when adding new features

---

## 📄 License

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

```
MIT License — Copyright (c) 2026 CorteXia
```

---

## 🙏 Acknowledgments

- [Tauri](https://tauri.app/) — Lightweight native app framework
- [Next.js](https://nextjs.org/) — React framework
- [MongoDB Atlas](https://www.mongodb.com/) — Cloud database
- [Tailwind CSS](https://tailwindcss.com/) — Utility-first CSS
- [Framer Motion](https://www.framer.com/motion/) — Animations
- [shadcn/ui](https://ui.shadcn.com/) — Component library

---

<div align="center">

### Built with 💜 for productivity enthusiasts

**[⬆ Back to Top](#-cortexia-desktop--your-second-brain)**

---

**Star ⭐ this repo if you find it helpful!**

</div>