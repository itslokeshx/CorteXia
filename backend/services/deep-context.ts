/**
 * ═══════════════════════════════════════════════════════════════
 * CORTEXIA — DEEP CONTEXT AI SYSTEM (BACKEND)
 *
 * Builds a comprehensive, deeply aware context from all user
 * data — tasks, habits, journal, goals, finances, time —
 * and detects behavioral patterns, streaks at risk, mood
 * trends, financial anomalies, and more.
 *
 * This context is injected into every AI conversation to make
 * the assistant truly understand the user's life.
 * ═══════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════
// TYPES (inline to avoid depending on frontend)
// ═══════════════════════════════════════════════════════════════

interface Task {
  id: string;
  title: string;
  description?: string;
  domain: string;
  priority: string;
  status: string;
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  tags?: string[];
  [key: string]: any;
}

interface Habit {
  id: string;
  name: string;
  category: string;
  frequency: string;
  streak: number;
  longestStreak: number;
  active: boolean;
  completions: { date: string; completed: boolean; note?: string }[];
  [key: string]: any;
}

interface Transaction {
  id: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  type: "income" | "expense";
  [key: string]: any;
}

interface TimeEntry {
  id: string;
  task: string;
  category: string;
  duration: number;
  date: string;
  focusQuality: string;
  [key: string]: any;
}

interface Goal {
  id: string;
  title: string;
  description: string;
  category: string;
  priority: string;
  targetDate: string;
  progress: number;
  status: string;
  completedAt?: string;
  [key: string]: any;
}

interface StudySession {
  id: string;
  subject: string;
  duration: number;
  createdAt: string;
  [key: string]: any;
}

interface JournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  mood: number;
  energy: number;
  focus: number;
  tags?: string[];
  aiThemes?: string[];
  [key: string]: any;
}

interface LifeState {
  status: string;
  momentum: number;
  stress: number;
  productivity: number;
  wellbeing: number;
  focus: number;
  lastUpdated: string;
}

interface UserSettings {
  userName?: string;
  [key: string]: any;
}

interface TimeBlock {
  id: string;
  [key: string]: any;
}

// ═══════════════════════════════════════════════════════════════
// CONTEXT TYPES
// ═══════════════════════════════════════════════════════════════

export interface UserContext {
  profile: {
    name: string;
    dayOfWeek: string;
    timeOfDay: string;
    currentTime: string;
    currentDate: string;
  };
  taskSnapshot: {
    total: number;
    pending: number;
    completed: number;
    overdue: number;
    dueToday: number;
    highPriority: number;
    blocked: number;
    recentlyCompleted: string[];
    overdueList: string[];
    todayList: string[];
  };
  habitSnapshot: {
    total: number;
    completedToday: number;
    streaksAtRisk: { name: string; streak: number; lastDone: string }[];
    topStreaks: { name: string; streak: number }[];
    completionRateThisWeek: number;
  };
  goalSnapshot: {
    active: number;
    atRisk: number;
    recentlyCompleted: string[];
    topGoals: { title: string; progress: number; status: string }[];
  };
  financeSnapshot: {
    monthIncome: number;
    monthExpenses: number;
    balance: number;
    topCategories: { category: string; amount: number }[];
    unusualSpending: string[];
    savingsRate: number;
  };
  timeSnapshot: {
    todayMinutes: number;
    weekMinutes: number;
    avgDailyMinutes: number;
    topCategories: { category: string; minutes: number }[];
    focusDistribution: Record<string, number>;
  };
  journalSnapshot: {
    recentMood: number | null;
    moodTrend: "improving" | "declining" | "stable" | "unknown";
    avgMoodThisWeek: number | null;
    avgEnergyThisWeek: number | null;
    recentThemes: string[];
    lastEntryDate: string | null;
    daysSinceLastEntry: number;
  };
  studySnapshot: {
    weekHours: number;
    totalSessions: number;
    subjects: string[];
    avgSessionLength: number;
  };
  patterns: DetectedPattern[];
  lifeState: LifeState | null;
}

export interface DetectedPattern {
  type: "warning" | "positive" | "insight" | "opportunity";
  domain: string;
  message: string;
  urgency: "low" | "medium" | "high";
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

const today = () => new Date().toISOString().split("T")[0];
const dayMs = 86400000;

function daysAgo(n: number): string {
  return new Date(Date.now() - n * dayMs).toISOString().split("T")[0];
}

function isToday(dateStr: string): boolean {
  return dateStr?.startsWith(today());
}

function isThisWeek(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  return d >= weekStart;
}

function isThisMonth(dateStr: string): boolean {
  const d = new Date(dateStr);
  const now = new Date();
  return (
    d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  );
}

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 6) return "late night";
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  if (h < 21) return "evening";
  return "night";
}

function getDayOfWeek(): string {
  return new Date().toLocaleDateString("en-US", { weekday: "long" });
}

// ═══════════════════════════════════════════════════════════════
// BUILD USER CONTEXT
// ═══════════════════════════════════════════════════════════════

export function buildUserContext(data: {
  tasks: Task[];
  habits: Habit[];
  transactions: Transaction[];
  timeEntries: TimeEntry[];
  goals: Goal[];
  studySessions: StudySession[];
  journalEntries: JournalEntry[];
  lifeState: LifeState | null;
  settings: UserSettings;
  timeBlocks?: TimeBlock[];
}): UserContext {
  const {
    tasks,
    habits,
    transactions,
    timeEntries,
    goals,
    studySessions,
    journalEntries,
    lifeState,
    settings,
  } = data;

  const todayStr = today();

  // ─── TASK ANALYSIS ───
  const pending = tasks.filter((t) => t.status !== "completed");
  const completed = tasks.filter((t) => t.status === "completed");
  const overdue = pending.filter(
    (t) => t.dueDate && t.dueDate < todayStr && t.status !== "blocked",
  );
  const dueToday = pending.filter((t) => t.dueDate === todayStr);
  const highPriority = pending.filter(
    (t) => t.priority === "high" || t.priority === "critical",
  );
  const blocked = tasks.filter((t) => t.status === "blocked");
  const recentlyCompletedTasks = completed
    .filter((t) => t.completedAt && isThisWeek(t.completedAt))
    .slice(0, 5)
    .map((t) => t.title);

  // ─── HABIT ANALYSIS ───
  const activeHabits = habits.filter((h) => h.active);
  const completedToday = activeHabits.filter((h) =>
    h.completions?.some((c) => c.date === todayStr && c.completed),
  ).length;

  const streaksAtRisk = activeHabits
    .filter((h) => {
      if (h.streak < 3) return false;
      const lastCompletion = h.completions
        ?.filter((c) => c.completed)
        ?.sort((a, b) => b.date.localeCompare(a.date))?.[0];
      if (!lastCompletion) return true;
      const daysSince = Math.floor(
        (Date.now() - new Date(lastCompletion.date).getTime()) / dayMs,
      );
      return daysSince >= 1;
    })
    .map((h) => {
      const lastDone =
        h.completions
          ?.filter((c) => c.completed)
          ?.sort((a, b) => b.date.localeCompare(a.date))?.[0]?.date || "never";
      return { name: h.name, streak: h.streak, lastDone };
    });

  const topStreaks = activeHabits
    .filter((h) => h.streak > 0)
    .sort((a, b) => b.streak - a.streak)
    .slice(0, 5)
    .map((h) => ({ name: h.name, streak: h.streak }));

  // Weekly habit completion rate
  const weekDates = Array.from({ length: 7 }, (_, i) => daysAgo(i));
  let weekHabitPossible = 0;
  let weekHabitDone = 0;
  for (const h of activeHabits) {
    for (const d of weekDates) {
      weekHabitPossible++;
      if (h.completions?.some((c) => c.date === d && c.completed)) {
        weekHabitDone++;
      }
    }
  }
  const habitCompletionRate =
    weekHabitPossible > 0
      ? Math.round((weekHabitDone / weekHabitPossible) * 100)
      : 0;

  // ─── GOAL ANALYSIS ───
  const activeGoals = goals.filter(
    (g) => g.status === "active" || g.status === "at_risk",
  );
  const atRiskGoals = goals.filter(
    (g) => g.status === "at_risk" || g.status === "failing",
  );
  const recentlyCompletedGoals = goals
    .filter(
      (g) =>
        g.status === "completed" && g.completedAt && isThisWeek(g.completedAt),
    )
    .map((g) => g.title);

  // ─── FINANCE ANALYSIS ───
  const monthTx = transactions.filter((t) => isThisMonth(t.date));
  const monthIncome = monthTx
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const monthExpenses = monthTx
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  const byCategory = new Map<string, number>();
  for (const t of monthTx.filter((t) => t.type === "expense")) {
    byCategory.set(t.category, (byCategory.get(t.category) || 0) + t.amount);
  }
  const topCategories = Array.from(byCategory.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([category, amount]) => ({ category, amount }));

  // Detect unusual spending (category 2x above average)
  const unusualSpending: string[] = [];
  if (monthTx.length > 5) {
    for (const [cat, amount] of byCategory) {
      const prevMonthTx = transactions.filter(
        (t) =>
          t.type === "expense" &&
          t.category === cat &&
          !isThisMonth(t.date) &&
          new Date(t.date) > new Date(Date.now() - 60 * dayMs),
      );
      const prevAvg =
        prevMonthTx.reduce((s, t) => s + t.amount, 0) /
        Math.max(prevMonthTx.length, 1);
      if (prevAvg > 0 && amount > prevAvg * 2) {
        unusualSpending.push(
          `${cat}: $${amount.toFixed(0)} (2x above usual $${prevAvg.toFixed(0)})`,
        );
      }
    }
  }

  // ─── TIME ANALYSIS ───
  const todayEntries = timeEntries.filter((e) => e.date === todayStr);
  const weekEntries = timeEntries.filter((e) => isThisWeek(e.date));
  const todayMinutes = todayEntries.reduce((s, e) => s + e.duration, 0);
  const weekMinutes = weekEntries.reduce((s, e) => s + e.duration, 0);

  const timeByCategory = new Map<string, number>();
  for (const e of weekEntries) {
    timeByCategory.set(
      e.category,
      (timeByCategory.get(e.category) || 0) + e.duration,
    );
  }

  const focusDist: Record<string, number> = {
    deep: 0,
    moderate: 0,
    shallow: 0,
  };
  for (const e of weekEntries) {
    focusDist[e.focusQuality] = (focusDist[e.focusQuality] || 0) + e.duration;
  }

  // ─── JOURNAL ANALYSIS ───
  const sortedJournal = [...journalEntries].sort((a, b) =>
    b.date.localeCompare(a.date),
  );
  const recentEntries = sortedJournal.slice(0, 7);
  const recentMood = recentEntries[0]?.mood ?? null;

  const weekMoods = recentEntries.filter((e) => isThisWeek(e.date));
  const avgMoodWeek =
    weekMoods.length > 0
      ? Math.round(
          (weekMoods.reduce((s, e) => s + e.mood, 0) / weekMoods.length) * 10,
        ) / 10
      : null;
  const avgEnergyWeek =
    weekMoods.length > 0
      ? Math.round(
          (weekMoods.reduce((s, e) => s + e.energy, 0) / weekMoods.length) * 10,
        ) / 10
      : null;

  // Mood trend (compare last 3 days to previous 3 days)
  let moodTrend: "improving" | "declining" | "stable" | "unknown" = "unknown";
  if (recentEntries.length >= 4) {
    const recent3 =
      recentEntries.slice(0, 3).reduce((s, e) => s + e.mood, 0) / 3;
    const prev3 =
      recentEntries.slice(3, 6).reduce((s, e) => s + e.mood, 0) /
      Math.min(recentEntries.slice(3, 6).length, 3);
    if (prev3 > 0) {
      const diff = recent3 - prev3;
      moodTrend =
        diff > 0.5 ? "improving" : diff < -0.5 ? "declining" : "stable";
    }
  }

  const recentThemes = [
    ...new Set(recentEntries.flatMap((e) => e.aiThemes || e.tags || [])),
  ].slice(0, 10);

  const lastEntryDate = sortedJournal[0]?.date || null;
  const daysSinceLastEntry = lastEntryDate
    ? Math.floor((Date.now() - new Date(lastEntryDate).getTime()) / dayMs)
    : 999;

  // ─── STUDY ANALYSIS ───
  const weekStudy = studySessions.filter((s) => isThisWeek(s.createdAt));
  const weekStudyHours =
    Math.round((weekStudy.reduce((s, e) => s + e.duration, 0) / 60) * 10) / 10;
  const studySubjects = [...new Set(weekStudy.map((s) => s.subject))];

  // ─── PATTERN DETECTION ───
  const patterns = detectPatterns({
    tasks,
    habits: activeHabits,
    transactions,
    timeEntries,
    goals,
    journalEntries,
    overdue,
    streaksAtRisk,
    daysSinceLastEntry,
    moodTrend,
    monthExpenses,
    monthIncome,
    unusualSpending,
    todayMinutes,
    weekMinutes,
    dueToday,
    highPriority,
    blocked,
    atRiskGoals,
    habitCompletionRate,
  });

  return {
    profile: {
      name: settings.userName || "User",
      dayOfWeek: getDayOfWeek(),
      timeOfDay: getTimeOfDay(),
      currentTime: new Date().toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
      }),
      currentDate: new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    },
    taskSnapshot: {
      total: tasks.length,
      pending: pending.length,
      completed: completed.length,
      overdue: overdue.length,
      dueToday: dueToday.length,
      highPriority: highPriority.length,
      blocked: blocked.length,
      recentlyCompleted: recentlyCompletedTasks,
      overdueList: overdue
        .slice(0, 5)
        .map((t) => `${t.title} (due: ${t.dueDate})`),
      todayList: dueToday.map((t) => `${t.title} [${t.priority}]`),
    },
    habitSnapshot: {
      total: activeHabits.length,
      completedToday,
      streaksAtRisk,
      topStreaks,
      completionRateThisWeek: habitCompletionRate,
    },
    goalSnapshot: {
      active: activeGoals.length,
      atRisk: atRiskGoals.length,
      recentlyCompleted: recentlyCompletedGoals,
      topGoals: activeGoals.slice(0, 5).map((g) => ({
        title: g.title,
        progress: g.progress,
        status: g.status,
      })),
    },
    financeSnapshot: {
      monthIncome,
      monthExpenses,
      balance: monthIncome - monthExpenses,
      topCategories,
      unusualSpending,
      savingsRate:
        monthIncome > 0
          ? Math.round(((monthIncome - monthExpenses) / monthIncome) * 100)
          : 0,
    },
    timeSnapshot: {
      todayMinutes,
      weekMinutes,
      avgDailyMinutes: Math.round(weekMinutes / 7),
      topCategories: Array.from(timeByCategory.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([category, minutes]) => ({ category, minutes })),
      focusDistribution: focusDist,
    },
    journalSnapshot: {
      recentMood,
      moodTrend,
      avgMoodThisWeek: avgMoodWeek,
      avgEnergyThisWeek: avgEnergyWeek,
      recentThemes,
      lastEntryDate,
      daysSinceLastEntry,
    },
    studySnapshot: {
      weekHours: weekStudyHours,
      totalSessions: weekStudy.length,
      subjects: studySubjects,
      avgSessionLength:
        weekStudy.length > 0
          ? Math.round(
              weekStudy.reduce((s, e) => s + e.duration, 0) / weekStudy.length,
            )
          : 0,
    },
    patterns,
    lifeState,
  };
}

// ═══════════════════════════════════════════════════════════════
// PATTERN DETECTION
// ═══════════════════════════════════════════════════════════════

function detectPatterns(data: {
  tasks: Task[];
  habits: Habit[];
  transactions: Transaction[];
  timeEntries: TimeEntry[];
  goals: Goal[];
  journalEntries: JournalEntry[];
  overdue: Task[];
  streaksAtRisk: { name: string; streak: number; lastDone: string }[];
  daysSinceLastEntry: number;
  moodTrend: string;
  monthExpenses: number;
  monthIncome: number;
  unusualSpending: string[];
  todayMinutes: number;
  weekMinutes: number;
  dueToday: Task[];
  highPriority: Task[];
  blocked: Task[];
  atRiskGoals: Goal[];
  habitCompletionRate: number;
}): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  // ─── TASK PATTERNS ───
  if (data.overdue.length >= 5) {
    patterns.push({
      type: "warning",
      domain: "tasks",
      message: `${data.overdue.length} overdue tasks piling up — consider reprioritizing or breaking them down`,
      urgency: "high",
    });
  } else if (data.overdue.length > 0) {
    patterns.push({
      type: "warning",
      domain: "tasks",
      message: `${data.overdue.length} overdue task${data.overdue.length > 1 ? "s" : ""}: ${data.overdue
        .slice(0, 3)
        .map((t) => t.title)
        .join(", ")}`,
      urgency: "medium",
    });
  }

  if (data.blocked.length > 0) {
    patterns.push({
      type: "insight",
      domain: "tasks",
      message: `${data.blocked.length} blocked task${data.blocked.length > 1 ? "s" : ""} — may need external input or replanning`,
      urgency: "medium",
    });
  }

  if (data.dueToday.length > 5) {
    patterns.push({
      type: "warning",
      domain: "tasks",
      message: `Heavy day ahead: ${data.dueToday.length} tasks due today. Consider deferring non-critical ones.`,
      urgency: "medium",
    });
  }

  // ─── HABIT PATTERNS ───
  for (const risk of data.streaksAtRisk) {
    patterns.push({
      type: "warning",
      domain: "habits",
      message: `"${risk.name}" streak (${risk.streak} days) at risk — last done ${risk.lastDone}`,
      urgency: risk.streak >= 7 ? "high" : "medium",
    });
  }

  if (data.habitCompletionRate < 30 && data.habits.length > 0) {
    patterns.push({
      type: "warning",
      domain: "habits",
      message: `Habit completion rate is only ${data.habitCompletionRate}% this week — momentum dropping`,
      urgency: "high",
    });
  } else if (data.habitCompletionRate >= 80) {
    patterns.push({
      type: "positive",
      domain: "habits",
      message: `Excellent habit consistency at ${data.habitCompletionRate}% this week!`,
      urgency: "low",
    });
  }

  // ─── GOAL PATTERNS ───
  if (data.atRiskGoals.length > 0) {
    patterns.push({
      type: "warning",
      domain: "goals",
      message: `${data.atRiskGoals.length} goal${data.atRiskGoals.length > 1 ? "s" : ""} at risk: ${data.atRiskGoals.map((g) => g.title).join(", ")}`,
      urgency: "high",
    });
  }

  // ─── FINANCE PATTERNS ───
  if (data.monthExpenses > data.monthIncome && data.monthIncome > 0) {
    patterns.push({
      type: "warning",
      domain: "finance",
      message: `Spending exceeds income this month by $${(data.monthExpenses - data.monthIncome).toFixed(0)}`,
      urgency: "high",
    });
  }

  for (const unusual of data.unusualSpending) {
    patterns.push({
      type: "insight",
      domain: "finance",
      message: `Unusual spending detected: ${unusual}`,
      urgency: "medium",
    });
  }

  if (data.monthIncome > 0 && data.monthExpenses < data.monthIncome * 0.5) {
    patterns.push({
      type: "positive",
      domain: "finance",
      message: `Strong savings month — spending only ${Math.round((data.monthExpenses / data.monthIncome) * 100)}% of income`,
      urgency: "low",
    });
  }

  // ─── JOURNAL / WELLBEING PATTERNS ───
  if (data.daysSinceLastEntry >= 3 && data.daysSinceLastEntry < 999) {
    patterns.push({
      type: "opportunity",
      domain: "journal",
      message: `Haven't journaled in ${data.daysSinceLastEntry} days — reflection helps maintain clarity`,
      urgency: "low",
    });
  }

  if (data.moodTrend === "declining") {
    patterns.push({
      type: "warning",
      domain: "wellbeing",
      message:
        "Mood has been declining over the past few days — consider lighter workload or self-care",
      urgency: "high",
    });
  } else if (data.moodTrend === "improving") {
    patterns.push({
      type: "positive",
      domain: "wellbeing",
      message: "Mood has been improving recently — keep up what you're doing!",
      urgency: "low",
    });
  }

  // ─── TIME PATTERNS ───
  if (data.todayMinutes > 480) {
    patterns.push({
      type: "warning",
      domain: "time",
      message: `Over 8 hours tracked today — make sure to take breaks`,
      urgency: "medium",
    });
  }

  if (data.weekMinutes < 60 && data.tasks.length > 5) {
    patterns.push({
      type: "insight",
      domain: "time",
      message:
        "Very little time tracked this week despite many tasks — consider using the time tracker",
      urgency: "low",
    });
  }

  // ─── CROSS-DOMAIN INSIGHTS ───
  const recentJournal = data.journalEntries.filter((e) => isThisWeek(e.date));
  const avgRecentMood =
    recentJournal.length > 0
      ? recentJournal.reduce((s, e) => s + e.mood, 0) / recentJournal.length
      : null;

  if (avgRecentMood !== null && avgRecentMood < 4 && data.overdue.length > 3) {
    patterns.push({
      type: "warning",
      domain: "cross-domain",
      message:
        "Low mood combined with mounting overdue tasks — potential burnout risk. Consider clearing small wins first.",
      urgency: "high",
    });
  }

  if (
    data.habitCompletionRate > 70 &&
    avgRecentMood !== null &&
    avgRecentMood >= 7
  ) {
    patterns.push({
      type: "positive",
      domain: "cross-domain",
      message:
        "Strong habit consistency correlating with good mood — your routines are paying off!",
      urgency: "low",
    });
  }

  return patterns;
}

// ═══════════════════════════════════════════════════════════════
// BUILD AI SYSTEM PROMPT
// ═══════════════════════════════════════════════════════════════

export function buildAISystemPrompt(ctx: UserContext): string {
  const urgent = ctx.patterns.filter((p) => p.urgency === "high");
  const positive = ctx.patterns.filter((p) => p.type === "positive");

  return `You are Cortexia, a deeply aware AI life assistant. You know everything about this user's life through their data. You answer ANY question (general knowledge, trivia, advice) AND help manage their life.

═══ WHO YOU'RE TALKING TO ═══
Name: ${ctx.profile.name}
Right now: ${ctx.profile.dayOfWeek}, ${ctx.profile.currentDate}, ${ctx.profile.currentTime} (${ctx.profile.timeOfDay})

═══ TODAY'S TASK LOAD ═══
• ${ctx.taskSnapshot.dueToday} tasks due today${ctx.taskSnapshot.todayList.length > 0 ? ": " + ctx.taskSnapshot.todayList.join(", ") : ""}
• ${ctx.taskSnapshot.overdue} overdue${ctx.taskSnapshot.overdueList.length > 0 ? ": " + ctx.taskSnapshot.overdueList.join(", ") : ""}
• ${ctx.taskSnapshot.highPriority} high priority, ${ctx.taskSnapshot.blocked} blocked
• Recently completed: ${ctx.taskSnapshot.recentlyCompleted.join(", ") || "none this week"}

═══ HABIT STREAKS ═══
• ${ctx.habitSnapshot.completedToday}/${ctx.habitSnapshot.total} habits done today
• Week completion rate: ${ctx.habitSnapshot.completionRateThisWeek}%
${ctx.habitSnapshot.topStreaks.length > 0 ? "• Top streaks: " + ctx.habitSnapshot.topStreaks.map((s) => `${s.name} (${s.streak}d)`).join(", ") : ""}
${ctx.habitSnapshot.streaksAtRisk.length > 0 ? "• ⚠️ AT RISK: " + ctx.habitSnapshot.streaksAtRisk.map((s) => `${s.name} (${s.streak}d streak)`).join(", ") : ""}

═══ GOALS ═══
• ${ctx.goalSnapshot.active} active goals, ${ctx.goalSnapshot.atRisk} at risk
${ctx.goalSnapshot.topGoals.map((g) => `• "${g.title}" — ${g.progress}% (${g.status})`).join("\n")}

═══ FINANCES THIS MONTH ═══
• Income: $${ctx.financeSnapshot.monthIncome.toFixed(0)} | Expenses: $${ctx.financeSnapshot.monthExpenses.toFixed(0)} | Balance: $${ctx.financeSnapshot.balance.toFixed(0)}
• Savings rate: ${ctx.financeSnapshot.savingsRate}%
${ctx.financeSnapshot.topCategories.length > 0 ? "• Top spending: " + ctx.financeSnapshot.topCategories.map((c) => `${c.category}: $${c.amount.toFixed(0)}`).join(", ") : ""}
${ctx.financeSnapshot.unusualSpending.length > 0 ? "• ⚠️ Unusual: " + ctx.financeSnapshot.unusualSpending.join("; ") : ""}

═══ TIME & FOCUS ═══
• Today: ${ctx.timeSnapshot.todayMinutes}min | This week: ${Math.round(ctx.timeSnapshot.weekMinutes / 60)}h
• Focus quality: Deep ${ctx.timeSnapshot.focusDistribution.deep || 0}min, Moderate ${ctx.timeSnapshot.focusDistribution.moderate || 0}min, Shallow ${ctx.timeSnapshot.focusDistribution.shallow || 0}min

═══ WELLBEING ═══
• Recent mood: ${ctx.journalSnapshot.recentMood ?? "no data"}/10 (trend: ${ctx.journalSnapshot.moodTrend})
• Avg this week — mood: ${ctx.journalSnapshot.avgMoodThisWeek ?? "?"}/10, energy: ${ctx.journalSnapshot.avgEnergyThisWeek ?? "?"}/10
${ctx.journalSnapshot.recentThemes.length > 0 ? "• Themes: " + ctx.journalSnapshot.recentThemes.join(", ") : ""}
${ctx.journalSnapshot.daysSinceLastEntry < 999 ? "• Last journal: " + ctx.journalSnapshot.daysSinceLastEntry + " day(s) ago" : "• No journal entries yet"}

═══ STUDY ═══
• This week: ${ctx.studySnapshot.weekHours}h across ${ctx.studySnapshot.totalSessions} sessions
${ctx.studySnapshot.subjects.length > 0 ? "• Subjects: " + ctx.studySnapshot.subjects.join(", ") : ""}

${ctx.lifeState ? `═══ LIFE STATE ═══\n• Status: ${ctx.lifeState.status} | Momentum: ${ctx.lifeState.momentum}% | Stress: ${ctx.lifeState.stress}%\n• Productivity: ${ctx.lifeState.productivity}% | Wellbeing: ${ctx.lifeState.wellbeing}%` : ""}

${urgent.length > 0 ? "═══ ⚠️ URGENT PATTERNS ═══\n" + urgent.map((p) => `• [${p.domain}] ${p.message}`).join("\n") : ""}

${positive.length > 0 ? "═══ ✨ POSITIVE SIGNALS ═══\n" + positive.map((p) => `• [${p.domain}] ${p.message}`).join("\n") : ""}

═══ RESPONSE GUIDELINES ═══
• Answer ANY question directly (general knowledge, trivia, coding, advice, etc.)
• Reference the user's data naturally when relevant — don't just dump stats
• Be warm but concise. No walls of text.
• If they seem stressed, acknowledge it before jumping to solutions
• Proactively mention urgent patterns if the conversation allows
• When creating items, use their actual data context (e.g., link to existing goals)

═══ APP CAPABILITIES ═══
Return actions as JSON when user asks to create/modify things:
- create_task: { title, description?, domain?, priority?, dueDate?, tags? }
- create_habit: { name, category?, frequency?, description? }
- create_goal: { title, description?, category?, priority?, targetDate? }
- add_expense: { amount, category?, description?, date? }
- add_income: { amount, description?, date? }
- log_time: { task, category?, duration, focusQuality?, notes? }
- log_study: { subject, duration, topic?, difficulty? }
- create_journal: { title?, content, mood?, energy?, tags? }
- complete_task: { taskId }
- complete_habit: { habitId }
- navigate: { path }

RESPONSE FORMAT: Return valid JSON:
{
  "message": "Your natural language response",
  "actions": [],
  "suggestions": [{ "text": "suggestion", "action": "action_type", "reason": "why" }]
}`;
}

/**
 * ═══════════════════════════════════════════════════════════════
 * COMPACT SYSTEM PROMPT — optimised for free-tier token budgets
 *
 * ~350-500 tokens instead of ~1500-2000.
 * - Strips decorative separators
 * - Only includes non-zero / non-empty data lines
 * - Drops the full action schema unless the user's message
 *   looks like it needs one (caller controls via `includeActions`)
 * - Asks for plain text by default; structured JSON only for actions
 * ═══════════════════════════════════════════════════════════════
 */
export function buildCompactSystemPrompt(
  ctx: UserContext,
  opts: { includeActions?: boolean } = {},
): string {
  const lines: string[] = [];

  // Identity — one line
  lines.push(
    `You are Cortexia, an AI life assistant. Be warm, concise. Answer any question directly.`,
  );
  lines.push(
    `User: ${ctx.profile.name} | ${ctx.profile.dayOfWeek} ${ctx.profile.currentTime}`,
  );

  // ── Snapshot lines (only non-zero / interesting data) ──────────
  const t = ctx.taskSnapshot;
  const taskBits: string[] = [];
  if (t.dueToday > 0) taskBits.push(`${t.dueToday} due today`);
  if (t.overdue > 0) taskBits.push(`${t.overdue} overdue`);
  if (t.highPriority > 0) taskBits.push(`${t.highPriority} high-pri`);
  if (t.pending > 0) taskBits.push(`${t.pending} pending`);
  if (taskBits.length > 0) lines.push(`Tasks: ${taskBits.join(", ")}`);

  const h = ctx.habitSnapshot;
  if (h.total > 0) {
    let habitLine = `Habits: ${h.completedToday}/${h.total} done today, ${h.completionRateThisWeek}% this week`;
    if (h.streaksAtRisk.length > 0)
      habitLine += ` | AT RISK: ${h.streaksAtRisk.map((s) => `${s.name}(${s.streak}d)`).join(", ")}`;
    lines.push(habitLine);
  }

  const g = ctx.goalSnapshot;
  if (g.active > 0) {
    lines.push(
      `Goals: ${g.active} active${g.atRisk > 0 ? `, ${g.atRisk} at risk` : ""}`,
    );
  }

  const f = ctx.financeSnapshot;
  if (f.monthIncome > 0 || f.monthExpenses > 0) {
    lines.push(
      `Finance: $${f.monthIncome.toFixed(0)} in / $${f.monthExpenses.toFixed(0)} out / balance $${f.balance.toFixed(0)}`,
    );
  }

  const j = ctx.journalSnapshot;
  if (j.recentMood !== null) {
    lines.push(`Mood: ${j.recentMood}/10 (${j.moodTrend})`);
  }

  // ── Urgent patterns only ───────────────────────────────────────
  const urgent = ctx.patterns.filter((p) => p.urgency === "high");
  if (urgent.length > 0) {
    lines.push(`⚠ ${urgent.map((p) => p.message).join("; ")}`);
  }

  // ── Response rules ─────────────────────────────────────────────
  lines.push(
    `Reply in plain text. Be brief (2-4 sentences for simple questions). Reference user data naturally when relevant.`,
  );

  // ── Actions schema — only when needed ──────────────────────────
  if (opts.includeActions) {
    lines.push(
      `When user asks to create/modify items, append a JSON block:
{"actions":[{"type":"<action>","data":{...}}],"suggestions":[{"text":"...","action":"..."}]}
Actions: create_task(title,description?,domain?,priority?,dueDate?), create_habit(name,category?,frequency?), create_goal(title,category?,targetDate?), add_expense(amount,category?,description?), add_income(amount,description?), log_time(task,duration,category?), log_study(subject,duration), create_journal(content,mood?,energy?), complete_task(taskId), complete_habit(habitId), navigate(path)`,
    );
  }

  return lines.join("\n");
}
