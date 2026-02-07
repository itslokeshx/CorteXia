"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from "react";
import { useAuth } from "@/lib/context/auth-context";
import {
  fetchAllUserData,
  syncTask,
  syncHabit,
  syncHabitCompletion,
  syncTransaction,
  syncTimeEntry,
  syncGoal,
  syncStudySession,
  syncJournalEntry,
  syncSettings,
  deleteTaskSync,
  deleteHabitSync,
  deleteTransactionSync,
  deleteTimeEntrySync,
  deleteGoalSync,
  deleteStudySessionSync,
  deleteJournalEntrySync,
} from "@/lib/supabase-data";
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

// ═══════════════════════════════════════════════════════════════
// CONTEXT TYPE
// ═══════════════════════════════════════════════════════════════

interface AppContextType {
  // Tasks
  tasks: Task[];
  addTask: (task: Omit<Task, "id" | "createdAt">) => Task;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  uncompleteTask: (id: string) => void;

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
  dataReady: boolean;
  error: string | null;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ═══════════════════════════════════════════════════════════════
// DEFAULTS
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// PROVIDER — 100% SUPABASE, ZERO localStorage
// ═══════════════════════════════════════════════════════════════

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();

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
  const [dataReady, setDataReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hydratedRef = useRef(false);
  const userId = user?.id ?? null;

  // Helper to deduplicate arrays by id
  const deduplicateById = <T extends { id: string }>(arr: T[]): T[] => {
    const seen = new Set<string>();
    return arr.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  };

  // Unique ID generator
  const generateId = () =>
    `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

  // ═══════════════════════════════════════════════════════════
  // HYDRATE FROM SUPABASE ON LOGIN
  // ═══════════════════════════════════════════════════════════

  useEffect(() => {
    if (!isAuthenticated || !userId || hydratedRef.current) return;

    const hydrate = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchAllUserData(userId);
        if (data) {
          setTasks(deduplicateById(data.tasks));
          setHabits(deduplicateById(data.habits));
          setTransactions(deduplicateById(data.transactions));
          setTimeEntries(deduplicateById(data.timeEntries));
          setGoals(deduplicateById(data.goals));
          setStudySessions(deduplicateById(data.studySessions));
          setJournalEntries(deduplicateById(data.journalEntries));
          if (data.settings) {
            setSettings((prev) => ({ ...prev, ...data.settings }));
          }
        }
        hydratedRef.current = true;
        setDataReady(true);
      } catch (err) {
        console.error("Failed to load data from Supabase:", err);
        setError("Failed to load your data. Please refresh.");
      } finally {
        setIsLoading(false);
      }
    };

    hydrate();
  }, [isAuthenticated, userId]);

  // Reset on logout
  useEffect(() => {
    if (!isAuthenticated) {
      hydratedRef.current = false;
      setDataReady(false);
      setTasks([]);
      setHabits([]);
      setTransactions([]);
      setTimeEntries([]);
      setGoals([]);
      setStudySessions([]);
      setJournalEntries([]);
      setLifeState(DEFAULT_LIFE_STATE);
      setInsights([]);
      setSettings(DEFAULT_SETTINGS);
    }
  }, [isAuthenticated]);

  // ═══════════════════════════════════════════════════════════
  // TASK OPERATIONS
  // ═══════════════════════════════════════════════════════════

  const addTask = (task: Omit<Task, "id" | "createdAt">) => {
    const newTask: Task = {
      ...task,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
    if (userId) syncTask(newTask, userId);
    return newTask;
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
      const task = updated.find((t) => t.id === id);
      if (task && userId) syncTask(task, userId);
      return updated;
    });
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    if (userId) deleteTaskSync(id, userId);
  };

  const completeTask = (id: string) => {
    setTasks((prev) => {
      const updated = prev.map((t) =>
        t.id === id
          ? {
              ...t,
              status: "completed" as const,
              completedAt: new Date().toISOString(),
            }
          : t,
      );
      const task = updated.find((t) => t.id === id);
      if (task && userId) syncTask(task, userId);
      return updated;
    });
  };

  const uncompleteTask = (id: string) => {
    setTasks((prev) => {
      const updated = prev.map((t) =>
        t.id === id
          ? { ...t, status: "todo" as const, completedAt: undefined }
          : t,
      );
      const task = updated.find((t) => t.id === id);
      if (task && userId) syncTask(task, userId);
      return updated;
    });
  };

  // ═══════════════════════════════════════════════════════════
  // HABIT OPERATIONS
  // ═══════════════════════════════════════════════════════════

  const addHabit = (habit: Omit<Habit, "id" | "createdAt" | "completions">) => {
    const newHabit: Habit = {
      ...habit,
      id: generateId(),
      createdAt: new Date().toISOString(),
      completions: [],
    };
    setHabits((prev) => [newHabit, ...prev]);
    if (userId) syncHabit(newHabit, userId);
    return newHabit;
  };

  const updateHabit = (id: string, updates: Partial<Habit>) => {
    setHabits((prev) => {
      const updated = prev.map((h) => (h.id === id ? { ...h, ...updates } : h));
      const habit = updated.find((h) => h.id === id);
      if (habit && userId) syncHabit(habit, userId);
      return updated;
    });
  };

  const deleteHabit = (id: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== id));
    if (userId) deleteHabitSync(id, userId);
  };

  const completeHabit = (id: string, date: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;

        const existing = h.completions.find((c) => c.date === date);
        const newCompleted = existing ? !existing.completed : true;

        const updatedCompletions = existing
          ? h.completions.map((c) =>
              c.date === date ? { ...c, completed: newCompleted } : c,
            )
          : [...h.completions, { date, completed: true }];

        if (userId) {
          syncHabitCompletion(h.id, userId, date, newCompleted);
        }

        return { ...h, completions: updatedCompletions };
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

  // ═══════════════════════════════════════════════════════════
  // TRANSACTION OPERATIONS
  // ═══════════════════════════════════════════════════════════

  const addTransaction = (
    transaction: Omit<Transaction, "id" | "createdAt">,
  ) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => [newTransaction, ...prev]);
    if (userId) syncTransaction(newTransaction, userId);
    return newTransaction;
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    setTransactions((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
      const tx = updated.find((t) => t.id === id);
      if (tx && userId) syncTransaction(tx, userId);
      return updated;
    });
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    if (userId) deleteTransactionSync(id, userId);
  };

  const getBudgetStatus = (category: string) => {
    const spent = transactions
      .filter((t) => t.category === category && t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const limit = 500;
    return { spent, limit, percentage: (spent / limit) * 100 };
  };

  // ═══════════════════════════════════════════════════════════
  // TIME ENTRY OPERATIONS
  // ═══════════════════════════════════════════════════════════

  const addTimeEntry = (entry: Omit<TimeEntry, "id" | "createdAt">) => {
    const newEntry: TimeEntry = {
      ...entry,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setTimeEntries((prev) => [newEntry, ...prev]);
    if (userId) syncTimeEntry(newEntry, userId);
    return newEntry;
  };

  const updateTimeEntry = (id: string, updates: Partial<TimeEntry>) => {
    setTimeEntries((prev) => {
      const updated = prev.map((t) => (t.id === id ? { ...t, ...updates } : t));
      const entry = updated.find((t) => t.id === id);
      if (entry && userId) syncTimeEntry(entry, userId);
      return updated;
    });
  };

  const deleteTimeEntry = (id: string) => {
    setTimeEntries((prev) => prev.filter((t) => t.id !== id));
    if (userId) deleteTimeEntrySync(id, userId);
  };

  // ═══════════════════════════════════════════════════════════
  // GOAL OPERATIONS
  // ═══════════════════════════════════════════════════════════

  const addGoal = (goal: Omit<Goal, "id" | "createdAt" | "completedAt">) => {
    const newGoal: Goal = {
      ...goal,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setGoals((prev) => [newGoal, ...prev]);
    if (userId) syncGoal(newGoal, userId);
    return newGoal;
  };

  const updateGoal = (id: string, updates: Partial<Goal>) => {
    setGoals((prev) => {
      const updated = prev.map((g) => (g.id === id ? { ...g, ...updates } : g));
      const goal = updated.find((g) => g.id === id);
      if (goal && userId) syncGoal(goal, userId);
      return updated;
    });
  };

  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
    if (userId) deleteGoalSync(id, userId);
  };

  const completeMilestone = (goalId: string, milestoneId: string) => {
    setGoals((prev) => {
      const updated = prev.map((g) => {
        if (g.id !== goalId) return g;
        return {
          ...g,
          milestones: g.milestones.map((m) =>
            m.id === milestoneId
              ? { ...m, completed: true, completedAt: new Date().toISOString() }
              : m,
          ),
        };
      });
      const goal = updated.find((g) => g.id === goalId);
      if (goal && userId) syncGoal(goal, userId);
      return updated;
    });
  };

  // ═══════════════════════════════════════════════════════════
  // STUDY SESSION OPERATIONS
  // ═══════════════════════════════════════════════════════════

  const addStudySession = (session: Omit<StudySession, "id" | "createdAt">) => {
    const newSession: StudySession = {
      ...session,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setStudySessions((prev) => [newSession, ...prev]);
    if (userId) syncStudySession(newSession, userId);
    return newSession;
  };

  const updateStudySession = (id: string, updates: Partial<StudySession>) => {
    setStudySessions((prev) => {
      const updated = prev.map((s) => (s.id === id ? { ...s, ...updates } : s));
      const session = updated.find((s) => s.id === id);
      if (session && userId) syncStudySession(session, userId);
      return updated;
    });
  };

  const deleteStudySession = (id: string) => {
    setStudySessions((prev) => prev.filter((s) => s.id !== id));
    if (userId) deleteStudySessionSync(id, userId);
  };

  // ═══════════════════════════════════════════════════════════
  // JOURNAL OPERATIONS
  // ═══════════════════════════════════════════════════════════

  const addJournalEntry = (entry: Omit<JournalEntry, "id" | "createdAt">) => {
    const newEntry: JournalEntry = {
      ...entry,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setJournalEntries((prev) => [newEntry, ...prev]);
    if (userId) syncJournalEntry(newEntry, userId);
    return newEntry;
  };

  const updateJournalEntry = (id: string, updates: Partial<JournalEntry>) => {
    setJournalEntries((prev) => {
      const updated = prev.map((j) => (j.id === id ? { ...j, ...updates } : j));
      const entry = updated.find((j) => j.id === id);
      if (entry && userId) syncJournalEntry(entry, userId);
      return updated;
    });
  };

  const deleteJournalEntry = (id: string) => {
    setJournalEntries((prev) => prev.filter((j) => j.id !== id));
    if (userId) deleteJournalEntrySync(id, userId);
  };

  // ═══════════════════════════════════════════════════════════
  // LIFE STATE
  // ═══════════════════════════════════════════════════════════

  const updateLifeState = (updates: Partial<LifeState>) => {
    setLifeState((prev) => ({
      ...prev,
      ...updates,
      lastUpdated: new Date().toISOString(),
    }));
  };

  const calculateLifeState = () => {
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

  // ═══════════════════════════════════════════════════════════
  // INSIGHTS
  // ═══════════════════════════════════════════════════════════

  const addInsight = (insight: Omit<AIInsight, "id" | "createdAt">) => {
    const newInsight: AIInsight = {
      ...insight,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    setInsights((prev) => [newInsight, ...prev]);
    return newInsight;
  };

  const clearInsights = () => setInsights([]);

  const generateInsights = async () => {
    setIsLoading(true);
    try {
      try {
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
        const aiRes = await fetch(`${apiUrl}/api/ai/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message:
              "Based on my current tasks, habits, and goals, what should I focus on today? Give 2-3 specific recommendations.",
            userData: {
              tasks,
              habits,
              transactions,
              timeEntries,
              goals,
              studySessions,
              journalEntries,
              lifeState,
              settings,
            },
          }),
        });

        if (aiRes.ok) {
          const { message } = await aiRes.json();
          if (message) {
            addInsight({
              type: "recommendation",
              title: "AI Recommendations",
              content: message,
              severity: "info",
              actionable: true,
            });
          }
        }
      } catch {
        // AI not available
      }

      // Local pattern-based insights
      const newInsights: Omit<AIInsight, "id" | "createdAt">[] = [];

      const goodHabits = habits.filter((h) => getHabitStreak(h.id) > 5);
      if (goodHabits.length > 0) {
        newInsights.push({
          type: "achievement",
          title: "Consistent Habits Detected",
          content: `You've maintained ${goodHabits.length} habit(s) for over 5 days straight!`,
          severity: "success",
          actionable: false,
        });
      }

      const completedToday = tasks.filter(
        (t) =>
          t.completedAt &&
          new Date(t.completedAt).toDateString() === new Date().toDateString(),
      ).length;
      if (completedToday >= 5) {
        newInsights.push({
          type: "achievement",
          title: "Productive Day",
          content: `You've completed ${completedToday} tasks today!`,
          severity: "success",
          actionable: false,
        });
      }

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
          content: `You've spent $${weekSpent.toFixed(2)} this week.`,
          severity: "warning",
          actionable: true,
        });
      }

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

      newInsights.forEach((insight) => addInsight(insight));
    } catch (err) {
      setError("Failed to generate insights");
    } finally {
      setIsLoading(false);
    }
  };

  // ═══════════════════════════════════════════════════════════
  // SETTINGS
  // ═══════════════════════════════════════════════════════════

  const updateSettings = (updates: Partial<UserSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...updates };
      if (userId) syncSettings(updated as Record<string, any>, userId);
      return updated;
    });
  };

  // ═══════════════════════════════════════════════════════════
  // UTILITY FUNCTIONS
  // ═══════════════════════════════════════════════════════════

  const getFinanceStats = () => {
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expenses, balance: income - expenses };
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
      const rawQuality = entry.focusQuality || "moderate";
      const quality = breakdown[rawQuality] ? rawQuality : "moderate";
      breakdown[quality].hours += entry.duration / 60;
      total += entry.duration / 60;
    });
    Object.keys(breakdown).forEach((key) => {
      breakdown[key].percentage =
        total > 0 ? (breakdown[key].hours / total) * 100 : 0;
    });
    return breakdown;
  };

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

  // ═══════════════════════════════════════════════════════════
  // VALUE
  // ═══════════════════════════════════════════════════════════

  const value: AppContextType = {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    uncompleteTask,
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
    dataReady,
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
