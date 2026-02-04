"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type {
  Task,
  Habit,
  Transaction,
  TimeEntry,
  Goal,
  StudySession,
  JournalEntry,
  LifeState,
  AIInsight,
  UserSettings,
} from "../types";

interface AppContextType {
  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, "id" | "createdAt">) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;

  // Habits
  habits: Habit[];
  addHabit: (habit: Omit<Habit, "id" | "createdAt" | "completions">) => Habit;
  updateHabit: (id: string, updates: Partial<Habit>) => void;
  deleteHabit: (id: string) => void;
  completeHabit: (id: string, date: string) => void;
  getHabitStreak: (id: string) => number;

  // Finance
  transactions: Transaction[];
  addTransaction: (
    transaction: Omit<Transaction, "id" | "createdAt">,
  ) => Transaction;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  getBudgetStatus: (category: string) => {
    spent: number;
    limit: number;
    percentage: number;
  };

  // Time Tracking
  timeEntries: TimeEntry[];
  addTimeEntry: (entry: Omit<TimeEntry, "id" | "createdAt">) => TimeEntry;
  updateTimeEntry: (id: string, updates: Partial<TimeEntry>) => void;
  deleteTimeEntry: (id: string) => void;

  // Goals
  goals: Goal[];
  addGoal: (goal: Omit<Goal, "id" | "createdAt" | "completedAt">) => Goal;
  updateGoal: (id: string, updates: Partial<Goal>) => void;
  deleteGoal: (id: string) => void;
  completeMilestone: (goalId: string, milestoneId: string) => void;

  // Study
  studySessions: StudySession[];
  addStudySession: (
    session: Omit<StudySession, "id" | "createdAt">,
  ) => StudySession;
  updateStudySession: (id: string, updates: Partial<StudySession>) => void;
  deleteStudySession: (id: string) => void;

  // Journal
  journalEntries: JournalEntry[];
  addJournalEntry: (
    entry: Omit<JournalEntry, "id" | "createdAt">,
  ) => JournalEntry;
  updateJournalEntry: (id: string, updates: Partial<JournalEntry>) => void;
  deleteJournalEntry: (id: string) => void;

  // Life State
  lifeState: LifeState;
  updateLifeState: (updates: Partial<LifeState>) => void;
  calculateLifeState: () => void;

  // AI Insights
  insights: AIInsight[];
  addInsight: (insight: Omit<AIInsight, "id" | "createdAt">) => AIInsight;
  clearInsights: () => void;
  generateInsights: () => Promise<void>;

  // Settings
  settings: UserSettings;
  updateSettings: (updates: Partial<UserSettings>) => void;

  // Finance Utils
  getFinanceStats: () => { income: number; expenses: number; balance: number };
  getExpensesByCategory: () => Record<string, number>;

  // Time Utils
  getWeeklyStats: () => { byCategory: Record<string, number>; total: number };
  getTodayStats: () => {
    totalMinutes: number;
    deepFocus: number;
    totalInterruptions: number;
    entries: TimeEntry[];
  };
  getFocusQualityBreakdown: () => Record<
    string,
    { hours: number; percentage: number }
  >;

  // Goals Utils
  getGoalStats: () => {
    total: number;
    completed: number;
    inProgress: number;
    avgProgress: number;
  };

  // Utils
  isLoading: boolean;
  error: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_SETTINGS: UserSettings = {
  theme: "dark",
  notifications: {
    enabled: true,
    tasks: true,
    habits: true,
    insights: true,
  },
  privacy: {
    dataCollection: true,
    aiAnalysis: true,
  },
  preferences: {
    startOfWeek: "monday",
    timeFormat: "24h",
    language: "en",
  },
};

const DEFAULT_LIFE_STATE: LifeState = {
  status: "on-track",
  momentum: 65,
  stress: 35,
  productivity: 70,
  wellbeing: 65,
  focus: 70,
  lastUpdated: new Date().toISOString(),
};

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [lifeState, setLifeState] = useState<LifeState>(DEFAULT_LIFE_STATE);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("cortexia-data");
      if (saved) {
        const data = JSON.parse(saved);
        setTasks(data.tasks || []);
        setHabits(data.habits || []);
        setTransactions(data.transactions || []);
        setTimeEntries(data.timeEntries || []);
        setGoals(data.goals || []);
        setStudySessions(data.studySessions || []);
        setJournalEntries(data.journalEntries || []);
        setLifeState(data.lifeState || DEFAULT_LIFE_STATE);
        setSettings(data.settings || DEFAULT_SETTINGS);
      }
    } catch (err) {
      console.error("[v0] Failed to load data from localStorage:", err);
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    try {
      const data = {
        tasks,
        habits,
        transactions,
        timeEntries,
        goals,
        studySessions,
        journalEntries,
        lifeState,
        settings,
      };
      localStorage.setItem("cortexia-data", JSON.stringify(data));
    } catch (err) {
      console.error("[v0] Failed to save data to localStorage:", err);
    }
  }, [
    tasks,
    habits,
    transactions,
    timeEntries,
    goals,
    studySessions,
    journalEntries,
    lifeState,
    settings,
  ]);

  // Task operations
  const addTask = (task: Omit<Task, "id" | "createdAt">) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
    return newTask;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    );
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const completeTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status: "completed", completedAt: new Date().toISOString() }
          : t,
      ),
    );
  };

  // Habit operations
  const addHabit = (habit: Omit<Habit, "id" | "createdAt" | "completions">) => {
    const newHabit: Habit = {
      ...habit,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      completions: [],
    };
    setHabits((prev) => [newHabit, ...prev]);
    return newHabit;
  };

  const updateHabit = (id: string, updates: Partial<Habit>) => {
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, ...updates } : h)),
    );
  };

  const deleteHabit = (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
  };

  const completeHabit = (id: string, date: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          const existing = h.completions.find((c) => c.date === date);
          if (existing) {
            return {
              ...h,
              completions: h.completions.map((c) =>
                c.date === date ? { ...c, completed: !c.completed } : c,
              ),
            };
          }
          return {
            ...h,
            completions: [...h.completions, { date, completed: true }],
          };
        }
        return h;
      }),
    );
  };

  const getHabitStreak = (id: string) => {
    const habit = habits.find((h) => h.id === id);
    if (!habit) return 0;

    let streak = 0;
    const today = new Date();
    const completedDates = habit.completions
      .filter((c) => c.completed)
      .map((c) => new Date(c.date).getTime())
      .sort((a, b) => b - a);

    for (let i = 0; i < completedDates.length; i++) {
      const expected = new Date(today);
      expected.setDate(expected.getDate() - i);
      expected.setHours(0, 0, 0, 0);

      const actual = new Date(completedDates[i]);
      actual.setHours(0, 0, 0, 0);

      if (expected.getTime() === actual.getTime()) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  // Transaction operations
  const addTransaction = (
    transaction: Omit<Transaction, "id" | "createdAt">,
  ) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => [newTransaction, ...prev]);
    return newTransaction;
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    );
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const getBudgetStatus = (category: string) => {
    const spent = transactions
      .filter((t) => t.category === category && t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const limit = 500; // Default limit
    return {
      spent,
      limit,
      percentage: (spent / limit) * 100,
    };
  };

  // Time entry operations
  const addTimeEntry = (entry: Omit<TimeEntry, "id" | "createdAt">) => {
    const newEntry: TimeEntry = {
      ...entry,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setTimeEntries((prev) => [newEntry, ...prev]);
    return newEntry;
  };

  const updateTimeEntry = (id: string, updates: Partial<TimeEntry>) => {
    setTimeEntries((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    );
  };

  const deleteTimeEntry = (id: string) => {
    setTimeEntries((prev) => prev.filter((t) => t.id !== id));
  };

  // Goal operations
  const addGoal = (goal: Omit<Goal, "id" | "createdAt" | "completedAt">) => {
    const newGoal: Goal = {
      ...goal,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setGoals((prev) => [newGoal, ...prev]);
    return newGoal;
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    );
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  const completeMilestone = (goalId: string, milestoneId: string) => {
    setGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          return {
            ...g,
            milestones: g.milestones.map((m) =>
              m.id === milestoneId
                ? {
                    ...m,
                    completed: true,
                    completedAt: new Date().toISOString(),
                  }
                : m,
            ),
          };
        }
        return g;
      }),
    );
  };

  // Study session operations
  const addStudySession = (session: Omit<StudySession, "id" | "createdAt">) => {
    const newSession: StudySession = {
      ...session,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setStudySessions((prev) => [newSession, ...prev]);
    return newSession;
  };

  const updateStudySession = (id: string, updates: Partial<StudySession>) => {
    setStudySessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    );
  };

  const deleteStudySession = (id: string) => {
    setStudySessions((prev) => prev.filter((s) => s.id !== id));
  };

  // Journal operations
  const addJournalEntry = (entry: Omit<JournalEntry, "id" | "createdAt">) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setJournalEntries((prev) => [newEntry, ...prev]);
    return newEntry;
  };

  const updateJournalEntry = (id: string, updates: Partial<JournalEntry>) => {
    setJournalEntries((prev) =>
      prev.map((j) => (j.id === id ? { ...j, ...updates } : j)),
    );
  };

  const deleteJournalEntry = (id: string) => {
    setJournalEntries((prev) => prev.filter((j) => j.id !== id));
  };

  // Life state operations
  const updateLifeState = (updates: Partial<LifeState>) => {
    setLifeState((prev) => ({
      ...prev,
      ...updates,
      lastUpdated: new Date().toISOString(),
    }));
  };

  const calculateLifeState = () => {
    // Calculate based on metrics
    const completionRate =
      tasks.length > 0
        ? tasks.filter((t) => t.status === "completed").length / tasks.length
        : 0;

    const habitCompletionRate =
      habits.length > 0
        ? habits.reduce((sum, h) => {
            const today = new Date().toISOString().split("T")[0];
            const completed = h.completions.find((c) => c.date === today)
              ?.completed
              ? 1
              : 0;
            return sum + completed;
          }, 0) / habits.length
        : 0;

    const avgMood =
      journalEntries.length > 0
        ? journalEntries.reduce((sum, j) => sum + j.mood, 0) /
          journalEntries.length
        : 5;

    const avgEnergy =
      journalEntries.length > 0
        ? journalEntries.reduce((sum, j) => sum + j.energy, 0) /
          journalEntries.length
        : 5;

    const newState: LifeState = {
      status: "on-track",
      momentum: Math.round(completionRate * 100),
      stress: Math.round((10 - avgMood) * 10),
      productivity: Math.round(completionRate * 100),
      wellbeing: Math.round((avgMood / 10) * 100),
      focus: Math.round(habitCompletionRate * 100),
      lastUpdated: new Date().toISOString(),
    };

    if (newState.stress > 70) newState.status = "overloaded";
    else if (newState.momentum < 30) newState.status = "drifting";
    else if (newState.momentum > 80 && newState.stress < 40)
      newState.status = "momentum";

    setLifeState(newState);
  };

  // Insights operations
  const addInsight = (insight: Omit<AIInsight, "id" | "createdAt">) => {
    const newInsight: AIInsight = {
      ...insight,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setInsights((prev) => [newInsight, ...prev]);
    return newInsight;
  };

  const clearInsights = () => {
    setInsights([]);
  };

  const generateInsights = async () => {
    setIsLoading(true);
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

      // Try to get AI-powered insights from the backend
      try {
        // Get life score with AI explanation
        const lifeScoreRes = await fetch(`${API_URL}/api/insights/life-score`);
        if (lifeScoreRes.ok) {
          const lifeScore = await lifeScoreRes.json();
          if (lifeScore.explanation) {
            addInsight({
              type: "pattern",
              title: `Life Score: ${lifeScore.score}/100`,
              content: lifeScore.explanation,
              severity:
                lifeScore.score >= 70
                  ? "success"
                  : lifeScore.score >= 50
                    ? "info"
                    : "warning",
              actionable: false,
            });
          }
        }

        // Get morning briefing
        const briefingRes = await fetch(
          `${API_URL}/api/insights/morning-briefing`,
        );
        if (briefingRes.ok) {
          const { briefing } = await briefingRes.json();
          if (briefing) {
            addInsight({
              type: "recommendation",
              title: "Morning Briefing",
              content: briefing,
              severity: "info",
              actionable: true,
            });
          }
        }

        // Ask AI for personalized recommendations
        const context = {
          tasks: tasks.slice(0, 10),
          habits: habits.slice(0, 5),
          goals: goals.slice(0, 5),
          avgMood:
            journalEntries.length > 0
              ? journalEntries.slice(0, 7).reduce((sum, e) => sum + e.mood, 0) /
                Math.min(journalEntries.length, 7)
              : null,
        };

        const aiRes = await fetch(`${API_URL}/api/ai/ask`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question:
              "Based on my current tasks, habits, and goals, what should I focus on today? Give 2-3 specific recommendations.",
            context,
          }),
        });

        if (aiRes.ok) {
          const { response } = await aiRes.json();
          if (response) {
            addInsight({
              type: "recommendation",
              title: "AI Recommendations",
              content: response,
              severity: "info",
              actionable: true,
            });
          }
        }
      } catch (apiError) {
        console.log("API not available, using local insights:", apiError);
      }

      // Also add local pattern-based insights
      const newInsights: Omit<AIInsight, "id" | "createdAt">[] = [];

      // Pattern: Habit consistency
      const goodHabits = habits.filter((h) => getHabitStreak(h.id) > 5);
      if (goodHabits.length > 0) {
        newInsights.push({
          type: "achievement",
          title: "Consistent Habits Detected",
          content: `You've maintained ${goodHabits.length} habit(s) for over 5 days straight. Great momentum!`,
          severity: "success",
          actionable: false,
        });
      }

      // Pattern: Task completion trend
      const completedToday = tasks.filter(
        (t) =>
          t.completedAt &&
          new Date(t.completedAt).toDateString() === new Date().toDateString(),
      ).length;
      if (completedToday >= 5) {
        newInsights.push({
          type: "achievement",
          title: "Productive Day",
          content: `You've completed ${completedToday} tasks today. You're crushing it!`,
          severity: "success",
          actionable: false,
        });
      }

      // Warning: High spending
      const weekSpent = transactions
        .filter((t) => {
          const tDate = new Date(t.date);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return t.type === "expense" && tDate > weekAgo;
        })
        .reduce((sum, t) => sum + t.amount, 0);

      if (weekSpent > 500) {
        newInsights.push({
          type: "warning",
          title: "Spending Alert",
          content: `You've spent $${weekSpent.toFixed(2)} this week. Consider reviewing your budget.`,
          severity: "warning",
          actionable: true,
        });
      }

      // Pattern: Overdue tasks
      const overdueTasks = tasks.filter(
        (t) =>
          t.status !== "completed" &&
          t.dueDate &&
          new Date(t.dueDate) < new Date(),
      );
      if (overdueTasks.length > 0) {
        newInsights.push({
          type: "warning",
          title: "Overdue Tasks",
          content: `You have ${overdueTasks.length} overdue task(s). Consider prioritizing "${overdueTasks[0]?.title}".`,
          severity: "warning",
          actionable: true,
        });
      }

      // Add local insights
      newInsights.forEach((insight) => addInsight(insight));
    } catch (err) {
      setError("Failed to generate insights");
      console.error("[v0] Error generating insights:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Settings operations
  const updateSettings = (updates: Partial<UserSettings>) => {
    setSettings((prev) => ({ ...prev, ...updates }));
  };

  // Finance utility functions
  const getFinanceStats = () => {
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expenses,
      balance: income - expenses,
    };
  };

  const getExpensesByCategory = () => {
    const byCategory: Record<string, number> = {};
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
      });
    return byCategory;
  };

  // Time utility functions
  const getWeeklyStats = () => {
    const byCategory: Record<string, number> = {};
    let total = 0;

    timeEntries.forEach((entry) => {
      byCategory[entry.category] =
        (byCategory[entry.category] || 0) + entry.duration;
      total += entry.duration;
    });

    return { byCategory, total };
  };

  const getTodayStats = () => {
    const today = new Date().toISOString().split("T")[0];
    const todayEntries = timeEntries.filter((e) => e.date === today);

    const totalMinutes = todayEntries.reduce((sum, e) => sum + e.duration, 0);
    const deepFocus = todayEntries
      .filter((e) => e.focusQuality === "deep")
      .reduce((sum, e) => sum + e.duration, 0);
    const totalInterruptions = todayEntries.reduce(
      (sum, e) => sum + e.interruptions,
      0,
    );

    return {
      totalMinutes,
      deepFocus,
      totalInterruptions,
      entries: todayEntries,
    };
  };

  const getFocusQualityBreakdown = () => {
    const breakdown: Record<string, { hours: number; percentage: number }> = {
      deep: { hours: 0, percentage: 0 },
      moderate: { hours: 0, percentage: 0 },
      shallow: { hours: 0, percentage: 0 },
    };

    let total = 0;
    timeEntries.forEach((entry) => {
      const quality = entry.focusQuality || "moderate";
      breakdown[quality].hours += entry.duration / 60;
      total += entry.duration / 60;
    });

    Object.keys(breakdown).forEach((key) => {
      breakdown[key].percentage =
        total > 0 ? (breakdown[key].hours / total) * 100 : 0;
    });

    return breakdown;
  };

  // Goals utility functions
  const getGoalStats = () => {
    const total = goals.length;
    const completed = goals.filter((g) => g.status === "completed").length;
    const inProgress = goals.filter((g) => g.status === "active").length;
    const avgProgress =
      total > 0 ? goals.reduce((sum, g) => sum + g.progress, 0) / total : 0;

    return {
      total,
      completed,
      inProgress,
      avgProgress: Math.round(avgProgress),
    };
  };

  const value: AppContextType = {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    habits,
    addHabit,
    updateHabit,
    deleteHabit,
    completeHabit,
    getHabitStreak,
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    getBudgetStatus,
    timeEntries,
    addTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    completeMilestone,
    studySessions,
    addStudySession,
    updateStudySession,
    deleteStudySession,
    journalEntries,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    lifeState,
    updateLifeState,
    calculateLifeState,
    insights,
    addInsight,
    clearInsights,
    generateInsights,
    settings,
    updateSettings,
    getFinanceStats,
    getExpensesByCategory,
    getWeeklyStats,
    getTodayStats,
    getFocusQualityBreakdown,
    getGoalStats,
    isLoading,
    error,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
}
