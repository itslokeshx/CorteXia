"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/context/app-context";
import {
  conversationalAI,
  type Message,
  type ConversationResponse,
} from "@/lib/ai/conversational";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  X,
  Minus,
  Send,
  Mic,
  MicOff,
  Loader2,
  CheckCircle2,
  Calendar,
  BarChart3,
  Lightbulb,
  MessageCircle,
  Bot,
  User,
  Trash2,
  Palette,
  Brain,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  actions?: Array<{ type: string; data: Record<string, unknown> }>;
  suggestions?: Array<{ text: string; action: string; reason?: string }>;
}

// Format action for display in chat
const formatActionSummary = (action: {
  type: string;
  data: Record<string, unknown>;
}): string => {
  if (!action || !action.type) {
    return "Action completed";
  }
  const { type, data = {} } = action;
  switch (type) {
    case "create_task":
      return `Created task: "${data.title || "Untitled"}"`;
    case "update_task":
      return `Updated task`;
    case "delete_task":
      return `Deleted task`;
    case "complete_task":
      return `Completed task`;
    case "create_habit":
      return `Created habit: "${data.name || "Untitled"}"`;
    case "update_habit":
      return `Updated habit`;
    case "delete_habit":
      return `Deleted habit`;
    case "complete_habit":
      return `Marked habit as done`;
    case "create_goal":
      return `Created goal: "${data.title || "Untitled"}"`;
    case "update_goal":
      return `Updated goal`;
    case "delete_goal":
      return `Deleted goal`;
    case "complete_milestone":
      return `Completed milestone`;
    case "add_tasks_to_goal":
      return `Added ${(data.tasks as any[])?.length || 0} tasks to goal`;
    case "add_expense":
      return `Logged expense: $${data.amount || 0}`;
    case "add_income":
      return `Logged income: $${data.amount || 0}`;
    case "delete_transaction":
      return `Deleted transaction`;
    case "log_time":
      return `Logged ${data.duration || 0}min for "${data.task || "Work"}"`;
    case "delete_time_entry":
      return `Deleted time entry`;
    case "log_study":
      return `Logged ${data.duration || 0}min studying ${data.subject || "General"}`;
    case "delete_study_session":
      return `Deleted study session`;
    case "create_journal":
      return `Created journal entry`;
    case "update_journal":
      return `Updated journal`;
    case "delete_journal":
      return `Deleted journal entry`;
    case "navigate":
      return `Navigating to ${data.path || "/"}`;
    case "set_theme":
      return `Switched theme to ${data.theme || "system"}`;
    case "clear_tasks":
      return "Cleared all tasks";
    case "clear_habits":
      return "Cleared all habits";
    case "clear_goals":
      return "Cleared all goals";
    case "clear_all_data":
      return "Cleared all app data";
    default:
      return type ? type.replace(/_/g, " ") : "Action completed";
  }
};

// ═══ AI MEMORY — persisted via app settings (MongoDB) ═══

interface AIMemory {
  userName?: string;
  preferences: Record<string, string>;
  facts: string[];
  conversationCount: number;
  lastTopic?: string;
  lastInteraction?: string;
}

const DEFAULT_MEMORY: AIMemory = {
  preferences: {},
  facts: [],
  conversationCount: 0,
};

function extractMemoryFacts(userMsg: string): Partial<AIMemory> {
  const update: Partial<AIMemory> = {};
  const nameMatch = userMsg.match(
    /(?:my name is|i'?m|call me|i am)\s+([A-Z][a-z]+)/i,
  );
  if (nameMatch) update.userName = nameMatch[1];
  const themeMatch = userMsg.match(
    /(?:prefer|like|switch to|use)\s+(dark|light)\s*(?:mode|theme)?/i,
  );
  if (themeMatch) {
    update.preferences = { theme: themeMatch[1].toLowerCase() };
  }
  const topics = [
    "work",
    "study",
    "health",
    "fitness",
    "finance",
    "goals",
    "habits",
    "journal",
    "meditation",
    "coding",
    "reading",
  ];
  for (const topic of topics) {
    if (userMsg.toLowerCase().includes(topic)) {
      update.lastTopic = topic;
      break;
    }
  }
  return update;
}

const QUICK_ACTIONS = [
  { icon: Calendar, label: "Show Today", action: "show_today" },
  { icon: BarChart3, label: "Analyze Patterns", action: "analyze_patterns" },
  { icon: Lightbulb, label: "Give Suggestions", action: "suggestions" },
  { icon: Brain, label: "Life Score", action: "life_score" },
];

export function ConversationalAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { setTheme, theme: currentTheme } = useTheme();

  // Get ALL app context for full capabilities
  const {
    // Data
    tasks,
    habits,
    transactions,
    timeEntries,
    journalEntries,
    goals,
    studySessions,
    settings,
    updateSettings,
    // Task actions
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    // Habit actions
    addHabit,
    updateHabit,
    deleteHabit,
    completeHabit,
    // Transaction actions
    addTransaction,
    updateTransaction,
    deleteTransaction,
    // Time entry actions
    addTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    // Goal actions
    addGoal,
    updateGoal,
    deleteGoal,
    completeMilestone,
    // Study actions
    addStudySession,
    updateStudySession,
    deleteStudySession,
    // Journal actions
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    // Stats
    getFinanceStats,
    getExpensesByCategory,
    getWeeklyStats,
    getTodayStats,
    getGoalStats,
  } = useApp();

  // AI Memory - loaded from settings (MongoDB), not localStorage
  const [memory, setMemoryState] = useState<AIMemory>(
    () => (settings?.aiMemory as AIMemory) || DEFAULT_MEMORY,
  );

  // Sync memory to settings (→ MongoDB) when it changes
  useEffect(() => {
    updateSettings({ aiMemory: memory });
  }, [memory, updateSettings]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  // Build COMPREHENSIVE context for AI with full data access
  const buildContext = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    const { expenses, income, balance } = getFinanceStats();
    const expensesByCategory = getExpensesByCategory();
    const weeklyStats = getWeeklyStats();
    const todayStats = getTodayStats();
    const goalStats = getGoalStats();

    return {
      history: messages.slice(-10), // Last 10 messages for context
      currentPage: pathname,
      currentTime: new Date().toISOString(),

      // FULL DATA ACCESS - All items with details
      fullData: {
        tasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          domain: t.domain,
          priority: t.priority,
          status: t.status,
          dueDate: t.dueDate,
          tags: t.tags,
        })),
        habits: habits.map((h) => ({
          id: h.id,
          name: h.name,
          category: h.category,
          frequency: h.frequency,
          streak: h.streak,
          completedToday: h.completions?.some(
            (c) => c.date === today && c.completed,
          ),
        })),
        goals: goals.map((g) => ({
          id: g.id,
          title: g.title,
          description: g.description,
          category: g.category,
          priority: g.priority,
          progress: g.progress,
          status: g.status,
          targetDate: g.targetDate,
          milestones: g.milestones?.map((m) => ({
            id: m.id,
            title: m.title,
            completed: m.completed,
            targetDate: m.targetDate,
          })),
        })),
        transactions: transactions.slice(0, 20).map((t) => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          category: t.category,
          description: t.description,
          date: t.date,
        })),
        timeEntries: timeEntries.slice(0, 20).map((t) => ({
          id: t.id,
          task: t.task,
          category: t.category,
          duration: t.duration,
          date: t.date,
          focusQuality: t.focusQuality,
        })),
        studySessions: studySessions.slice(0, 20).map((s) => ({
          id: s.id,
          subject: s.subject,
          duration: s.duration,
          topic: s.topic,
          difficulty: s.difficulty,
        })),
        journalEntries: journalEntries.slice(0, 10).map((j) => ({
          id: j.id,
          title: j.title,
          date: j.date,
          mood: j.mood,
          energy: j.energy,
          tags: j.tags,
          contentPreview: j.content?.substring(0, 100),
        })),
      },

      // Summary stats for quick reference
      stats: {
        tasks: {
          total: tasks.length,
          pending: tasks.filter((t) => t.status !== "completed").length,
          completed: tasks.filter((t) => t.status === "completed").length,
          overdue: tasks.filter(
            (t) =>
              t.status !== "completed" &&
              t.dueDate &&
              new Date(t.dueDate) < new Date(),
          ).length,
          todayDue: tasks.filter((t) => t.dueDate?.split("T")[0] === today)
            .length,
          highPriority: tasks.filter(
            (t) => t.priority === "high" && t.status !== "completed",
          ).length,
        },
        habits: {
          total: habits.length,
          completedToday: habits.filter((h) =>
            h.completions?.some((c) => c.date === today && c.completed),
          ).length,
          streaksAtRisk: habits
            .filter(
              (h) =>
                h.streak >= 7 &&
                !h.completions?.some((c) => c.date === today && c.completed),
            )
            .map((h) => ({ name: h.name, streak: h.streak })),
        },
        goals: goalStats,
        finance: {
          income,
          expenses,
          balance,
          byCategory: expensesByCategory,
        },
        time: {
          todayMinutes: todayStats.totalMinutes,
          weeklyByCategory: weeklyStats.byCategory,
          weeklyTotal: weeklyStats.total,
        },
        study: {
          totalSessions: studySessions.length,
          totalHours:
            studySessions.reduce((sum, s) => sum + s.duration, 0) / 60,
          subjects: [...new Set(studySessions.map((s) => s.subject))],
        },
        journal: {
          totalEntries: journalEntries.length,
          avgMood:
            journalEntries.length > 0
              ? Math.round(
                  (journalEntries.reduce((sum, j) => sum + j.mood, 0) /
                    journalEntries.length) *
                    10,
                ) / 10
              : null,
          avgEnergy:
            journalEntries.length > 0
              ? Math.round(
                  (journalEntries.reduce((sum, j) => sum + j.energy, 0) /
                    journalEntries.length) *
                    10,
                ) / 10
              : null,
        },
      },

      // Available actions the AI can take
      availableActions: [
        "create_task",
        "update_task",
        "delete_task",
        "complete_task",
        "create_habit",
        "update_habit",
        "delete_habit",
        "complete_habit",
        "create_goal",
        "update_goal",
        "delete_goal",
        "complete_milestone",
        "add_tasks_to_goal",
        "add_expense",
        "add_income",
        "delete_transaction",
        "log_time",
        "delete_time_entry",
        "log_study",
        "delete_study_session",
        "create_journal",
        "update_journal",
        "delete_journal",
        "navigate",
        "set_theme",
        "clear_tasks",
        "clear_habits",
        "clear_goals",
        "clear_all_data",
      ],
    };
  }, [
    messages,
    pathname,
    tasks,
    habits,
    transactions,
    timeEntries,
    journalEntries,
    goals,
    studySessions,
    getFinanceStats,
    getExpensesByCategory,
    getWeeklyStats,
    getTodayStats,
    getGoalStats,
  ]);

  // Send message to AI
  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Try the /api/ai/chat route (Groq with deep context)
      let response: ConversationResponse;
      try {
        // Send compact summaries — not full arrays — to save tokens
        const today = new Date().toISOString().split("T")[0];
        const compactUserData = {
          tasks: tasks.map((t) => ({
            id: t.id,
            title: t.title,
            status: t.status,
            priority: t.priority,
            dueDate: t.dueDate,
            domain: t.domain,
          })),
          habits: habits
            .filter((h) => h.active)
            .map((h) => ({
              id: h.id,
              name: h.name,
              streak: h.streak,
              completedToday: h.completions?.some(
                (c) => c.date === today && c.completed,
              ),
            })),
          goals: goals
            .filter((g) => g.status === "active")
            .map((g) => ({
              id: g.id,
              title: g.title,
              progress: g.progress,
            })),
          transactions: transactions.slice(0, 10).map((t) => ({
            type: t.type,
            amount: t.amount,
            category: t.category,
            date: t.date,
          })),
          timeEntries: [],
          studySessions: [],
          journalEntries: journalEntries.slice(0, 3).map((j) => ({
            date: j.date,
            mood: j.mood,
            energy: j.energy,
          })),
          lifeState: null,
          settings: {},
        };
        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const token =
          typeof window !== "undefined"
            ? localStorage.getItem("cortexia_token")
            : null;
        const apiRes = await fetch(`${API_URL}/api/ai/chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            message: text,
            conversationHistory: messages.slice(-4).map((m) => ({
              role: m.role,
              content:
                m.role === "assistant" && m.content.length > 200
                  ? m.content.substring(0, 200)
                  : m.content,
            })),
            userData: compactUserData,
            memory: {
              userName: memory.userName,
              facts: memory.facts.slice(-5),
              lastTopic: memory.lastTopic,
              conversationCount: memory.conversationCount,
              preferredTheme: memory.preferences.theme,
            },
          }),
        });
        if (apiRes.ok) {
          response = await apiRes.json();
        } else {
          throw new Error("API route failed");
        }
      } catch {
        // Fallback to original conversational AI
        const context = buildContext();
        response = await conversationalAI.chat(text, context);
      }

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.message,
        timestamp: new Date().toLocaleTimeString(),
        actions: response.actions,
        suggestions: response.suggestions,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Extract and save memory from this conversation turn
      const memUpdate = extractMemoryFacts(text);
      setMemoryState((prev) => {
        const updated: AIMemory = {
          ...prev,
          ...memUpdate,
          preferences: {
            ...prev.preferences,
            ...(memUpdate.preferences || {}),
          },
          facts: [...prev.facts, ...(memUpdate.facts || [])].slice(-20),
          conversationCount: prev.conversationCount + 1,
          lastInteraction: new Date().toISOString(),
        };
        if (memUpdate.userName) updated.userName = memUpdate.userName;
        if (memUpdate.lastTopic) updated.lastTopic = memUpdate.lastTopic;
        return updated;
      });

      // Execute any actions
      if (response.actions && response.actions.length > 0) {
        for (const action of response.actions) {
          await executeAction(action);
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm having trouble connecting right now. Please try again.",
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Execute AI actions - FULL CAPABILITIES
  const executeAction = async (action: {
    type: string;
    data: Record<string, unknown>;
  }) => {
    const today = new Date().toISOString().split("T")[0];

    switch (action.type) {
      // === TASK ACTIONS ===
      case "create_task":
        const newTask = addTask({
          title: action.data.title as string,
          description: (action.data.description as string) || "",
          domain:
            (action.data.domain as
              | "work"
              | "study"
              | "personal"
              | "health"
              | "finance") || "work",
          priority:
            (action.data.priority as "low" | "medium" | "high") || "medium",
          dueDate: (action.data.dueDate as string) || "",
          status: "todo",
          tags: (action.data.tags as string[]) || [],
        });
        toast.success(`✅ Task created: ${action.data.title}`);
        return newTask;

      case "update_task":
        updateTask(
          action.data.taskId as string,
          action.data.updates as Partial<any>,
        );
        toast.success(`📝 Task updated`);
        break;

      case "delete_task":
        deleteTask(action.data.taskId as string);
        toast.success(`🗑️ Task deleted`);
        break;

      case "complete_task":
        completeTask(action.data.taskId as string);
        toast.success(`✅ Task completed!`);
        break;

      // === HABIT ACTIONS ===
      case "create_habit":
        const newHabit = addHabit({
          name: action.data.name as string,
          category:
            (action.data.category as
              | "health"
              | "productivity"
              | "learning"
              | "fitness"
              | "mindfulness"
              | "social") || "productivity",
          frequency:
            (action.data.frequency as "daily" | "weekly" | "monthly") ||
            "daily",
          description: (action.data.description as string) || "",
          streak: 0,
          longestStreak: 0,
          active: true,
        });
        toast.success(`🎯 Habit created: ${action.data.name}`);
        return newHabit;

      case "update_habit":
        updateHabit(
          action.data.habitId as string,
          action.data.updates as Partial<any>,
        );
        toast.success(`📝 Habit updated`);
        break;

      case "delete_habit":
        deleteHabit(action.data.habitId as string);
        toast.success(`🗑️ Habit deleted`);
        break;

      case "complete_habit":
        completeHabit(action.data.habitId as string, today);
        toast.success(`✅ Habit marked as complete!`);
        break;

      // === GOAL ACTIONS ===
      case "create_goal":
        const newGoal = addGoal({
          title: action.data.title as string,
          description: (action.data.description as string) || "",
          category:
            (action.data.category as
              | "personal"
              | "health"
              | "career"
              | "financial"
              | "education"
              | "family") || "personal",
          priority:
            (action.data.priority as "low" | "medium" | "high") || "medium",
          targetDate:
            (action.data.targetDate as string) ||
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
          progress: 0,
          status: "active",
          milestones: (action.data.milestones as any[]) || [],
        });
        toast.success(`🎯 Goal created: ${action.data.title}`);
        return newGoal;

      case "update_goal":
        updateGoal(
          action.data.goalId as string,
          action.data.updates as Partial<any>,
        );
        toast.success(`📝 Goal updated`);
        break;

      case "delete_goal":
        deleteGoal(action.data.goalId as string);
        toast.success(`🗑️ Goal deleted`);
        break;

      case "complete_milestone":
        completeMilestone(
          action.data.goalId as string,
          action.data.milestoneId as string,
        );
        toast.success(`✅ Milestone completed!`);
        break;

      case "add_tasks_to_goal":
        // Create tasks linked to a goal
        const goalTasks = action.data.tasks as Array<{
          title: string;
          description?: string;
          priority?: string;
        }>;
        const goalId = action.data.goalId as string;
        const goal = goals.find((g) => g.id === goalId);

        if (goal && goalTasks) {
          for (const taskData of goalTasks) {
            addTask({
              title: taskData.title,
              description:
                taskData.description || `Part of goal: ${goal.title}`,
              domain: "work",
              priority:
                (taskData.priority as "low" | "medium" | "high") || "medium",
              status: "todo",
              tags: [`goal:${goalId}`],
            });
          }
          toast.success(
            `✅ Added ${goalTasks.length} tasks to goal: ${goal.title}`,
          );
        }
        break;

      // === FINANCE ACTIONS ===
      case "add_expense":
        addTransaction({
          type: "expense",
          amount: action.data.amount as number,
          category:
            (action.data.category as
              | "food"
              | "transport"
              | "entertainment"
              | "health"
              | "learning"
              | "utilities"
              | "other") || "other",
          description: (action.data.description as string) || "",
          date: (action.data.date as string) || new Date().toISOString(),
        });
        toast.success(`💸 Expense recorded: $${action.data.amount}`);
        break;

      case "add_income":
        addTransaction({
          type: "income",
          amount: action.data.amount as number,
          category: "salary",
          description: (action.data.description as string) || "",
          date: (action.data.date as string) || new Date().toISOString(),
        });
        toast.success(`💰 Income recorded: $${action.data.amount}`);
        break;

      case "delete_transaction":
        deleteTransaction(action.data.transactionId as string);
        toast.success(`🗑️ Transaction deleted`);
        break;

      // === TIME TRACKING ACTIONS ===
      case "log_time":
        addTimeEntry({
          task: action.data.task as string,
          category:
            (action.data.category as
              | "work"
              | "study"
              | "health"
              | "personal") || "work",
          duration: action.data.duration as number,
          date: (action.data.date as string) || new Date().toISOString(),
          focusQuality:
            (action.data.focusQuality as "deep" | "moderate" | "shallow") ||
            "moderate",
          interruptions: (action.data.interruptions as number) || 0,
          notes: (action.data.notes as string) || "",
        });
        toast.success(`⏱️ Time logged: ${action.data.duration} minutes`);
        break;

      case "delete_time_entry":
        deleteTimeEntry(action.data.entryId as string);
        toast.success(`🗑️ Time entry deleted`);
        break;

      // === STUDY ACTIONS ===
      case "log_study":
        addStudySession({
          subject: action.data.subject as string,
          duration: action.data.duration as number,
          pomodoros:
            (action.data.pomodoros as number) ||
            Math.ceil((action.data.duration as number) / 25),
          difficulty:
            (action.data.difficulty as "easy" | "medium" | "hard") || "medium",
          topic: (action.data.topic as string) || "",
          startTime: new Date().toISOString(),
          endTime: new Date(
            Date.now() + (action.data.duration as number) * 60000,
          ).toISOString(),
        });
        toast.success(`📚 Study session logged: ${action.data.subject}`);
        break;

      case "delete_study_session":
        deleteStudySession(action.data.sessionId as string);
        toast.success(`🗑️ Study session deleted`);
        break;

      // === JOURNAL ACTIONS ===
      case "create_journal":
        addJournalEntry({
          title:
            (action.data.title as string) ||
            `Journal - ${new Date().toLocaleDateString()}`,
          content: action.data.content as string,
          date: (action.data.date as string) || new Date().toISOString(),
          mood: (action.data.mood as number) || 5,
          energy: (action.data.energy as number) || 5,
          focus: (action.data.focus as number) || 5,
          tags: (action.data.tags as string[]) || [],
        });
        toast.success(`📝 Journal entry created`);
        break;

      case "update_journal":
        updateJournalEntry(
          action.data.entryId as string,
          action.data.updates as Partial<any>,
        );
        toast.success(`📝 Journal updated`);
        break;

      case "delete_journal":
        deleteJournalEntry(action.data.entryId as string);
        toast.success(`🗑️ Journal entry deleted`);
        break;

      // === NAVIGATION ===
      case "navigate":
        const path = action.data.path as string;
        if (path) {
          window.location.href = path;
        }
        break;

      // === THEME CONTROL ===
      case "set_theme":
        const newTheme = (action.data.theme as string) || "dark";
        setTheme(newTheme);
        toast.success(`🎨 Theme switched to ${newTheme}`);
        break;

      // === DATA CLEARING ===
      case "clear_tasks":
        for (const t of tasks) deleteTask(t.id);
        toast.success("🗑️ All tasks cleared");
        break;

      case "clear_habits":
        for (const h of habits) deleteHabit(h.id);
        toast.success("🗑️ All habits cleared");
        break;

      case "clear_goals":
        for (const g of goals) deleteGoal(g.id);
        toast.success("🗑️ All goals cleared");
        break;

      case "clear_all_data":
        for (const t of tasks) deleteTask(t.id);
        for (const h of habits) deleteHabit(h.id);
        for (const g of goals) deleteGoal(g.id);
        for (const tx of transactions) deleteTransaction(tx.id);
        for (const te of timeEntries) deleteTimeEntry(te.id);
        for (const s of studySessions) deleteStudySession(s.id);
        for (const j of journalEntries) deleteJournalEntry(j.id);
        toast.success("🗑️ All data cleared");
        break;

      default:
        console.log("Unknown action type:", action.type);
    }
  };

  // Handle quick action
  const handleQuickAction = (action: string) => {
    switch (action) {
      case "show_today":
        sendMessage("Show me my schedule and priorities for today");
        break;
      case "analyze_patterns":
        sendMessage(
          "Analyze my patterns and tell me what's affecting my productivity",
        );
        break;
      case "suggestions":
        sendMessage(
          "What should I focus on right now to improve my life score?",
        );
        break;
      case "life_score":
        sendMessage(
          "Give me a comprehensive life score analysis across all my domains — tasks, habits, goals, finances, wellbeing",
        );
        break;
    }
  };

  // Handle suggestion click
  const handleSuggestion = (suggestion: { text: string; action: string }) => {
    sendMessage(suggestion.text);
  };

  // Voice input (if supported)
  const toggleVoiceInput = () => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      toast.error("Voice input not supported in this browser");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setInput(text);
      sendMessage(text);
    };
    recognition.onerror = () => {
      setIsListening(false);
      toast.error("Voice recognition failed");
    };

    recognition.start();
  };

  // Minimized floating button
  if (!isOpen || isMinimized) {
    return (
      <div className="fixed z-50 bottom-4 right-4 sm:bottom-6 sm:right-6">
        {/* Subtle pulse */}
        <motion.div
          className="absolute inset-0 rounded-full opacity-20"
          style={{ background: "var(--color-accent-primary)" }}
          animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.button
          className={cn(
            "relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center",
            "text-white shadow-lg transition-all",
          )}
          style={{
            background: "var(--color-accent-primary)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          exit={{ scale: 0 }}
        >
          <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
        </motion.button>
      </div>
    );
  }

  return (
    <motion.div
      className={cn(
        "fixed z-50 flex flex-col overflow-hidden",
        "bg-background border shadow-2xl",
        // Mobile: full screen with safe areas
        "inset-0 rounded-none sm:rounded-2xl",
        // Desktop: fixed size and position
        "sm:inset-auto sm:bottom-4 sm:right-4 md:bottom-6 md:right-6",
        "sm:w-[360px] sm:h-[500px] md:w-[400px] md:h-[560px]",
        "sm:max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-3rem)]",
      )}
      initial={{ scale: 0.95, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.95, opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b flex-shrink-0"
        style={{ borderColor: "var(--color-border-primary)" }}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div
            className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center"
            style={{ background: "var(--color-bg-tertiary)" }}
          >
            <Sparkles
              className="w-4 h-4 sm:w-5 sm:h-5"
              style={{ color: "var(--color-accent-primary)" }}
            />
          </div>
          <div>
            <h3
              className="font-semibold text-sm sm:text-base"
              style={{ color: "var(--color-text-primary)" }}
            >
              Cortexia AI
            </h3>
            <p
              className="text-[10px] sm:text-xs"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              {memory.userName
                ? `Hey ${memory.userName}`
                : "Your life assistant"}
              {memory.conversationCount > 0
                ? ` · ${memory.conversationCount} chats`
                : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9"
            onClick={() => setIsMinimized(true)}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-hidden min-h-0">
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto p-3 sm:p-4 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-6 sm:py-8">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 sm:mb-4">
                <Bot className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
              </div>
              <h4 className="font-semibold mb-2 text-sm sm:text-base">
                {memory.userName
                  ? `Hey ${memory.userName}! 👋`
                  : "Hi! I'm Cortexia"}
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 max-w-[260px] sm:max-w-[280px] px-2">
                {memory.conversationCount > 0
                  ? `Welcome back! We've had ${memory.conversationCount} conversations.${memory.lastTopic ? ` Last time we talked about ${memory.lastTopic}.` : ""} How can I help?`
                  : "Your AI life assistant. I can manage tasks, analyze patterns, control themes, and optimize your productivity."}
              </p>
              <div className="flex flex-col gap-2 w-full max-w-[260px] sm:max-w-[280px]">
                {QUICK_ACTIONS.map((action) => (
                  <Button
                    key={action.action}
                    variant="outline"
                    className="justify-start gap-2 text-sm"
                    onClick={() => handleQuickAction(action.action)}
                  >
                    <action.icon className="w-4 h-4" />
                    {action.label}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  className={cn(
                    "flex gap-2 sm:gap-3",
                    message.role === "user" ? "justify-end" : "justify-start",
                  )}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {message.role === "assistant" && (
                    <div
                      className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                      style={{ background: "var(--color-bg-tertiary)" }}
                    >
                      <Sparkles
                        className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                        style={{ color: "var(--color-accent-primary)" }}
                      />
                    </div>
                  )}
                  <div
                    className={cn(
                      "max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5 overflow-hidden",
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted",
                    )}
                  >
                    <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed break-words">
                      {message.content}
                    </p>
                    <span className="text-[9px] sm:text-[10px] opacity-70 mt-1 block">
                      {message.timestamp}
                    </span>

                    {/* Suggestions */}
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border/50 space-y-1.5 sm:space-y-2">
                        {message.suggestions.map((suggestion, i) => (
                          <Button
                            key={i}
                            variant="secondary"
                            size="sm"
                            className="w-full justify-start text-[10px] sm:text-xs h-7 sm:h-8"
                            onClick={() => handleSuggestion(suggestion)}
                          >
                            <Lightbulb className="w-3 h-3 mr-1.5 sm:mr-2 flex-shrink-0" />
                            <span className="truncate">{suggestion.text}</span>
                          </Button>
                        ))}
                      </div>
                    )}

                    {/* Actions executed - show clear details */}
                    {message.actions && message.actions.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-emerald-500/20 space-y-1">
                        <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Done:
                        </div>
                        {message.actions.map((action, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-1.5 text-[10px] sm:text-xs text-emerald-600/80 dark:text-emerald-400/80 pl-5"
                          >
                            <span className="w-1 h-1 rounded-full bg-emerald-500" />
                            {formatActionSummary(action)}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {message.role === "user" && (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-secondary flex-shrink-0 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <motion.div
                  className="flex gap-2 sm:gap-3"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                    style={{ background: "var(--color-bg-tertiary)" }}
                  >
                    <Sparkles
                      className="w-3.5 h-3.5 sm:w-4 sm:h-4"
                      style={{ color: "var(--color-accent-primary)" }}
                    />
                  </div>
                  <div className="bg-muted rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3">
                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full"
                          style={{ background: "var(--color-accent-primary)" }}
                          animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            delay: i * 0.15,
                            ease: "easeInOut",
                          }}
                        />
                      ))}
                      <span className="text-xs sm:text-sm text-muted-foreground ml-1.5">
                        Thinking
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions (when there are messages) */}
      {messages.length > 0 && (
        <div className="px-3 sm:px-4 py-2 border-t flex gap-1.5 sm:gap-2 overflow-x-auto flex-shrink-0 scrollbar-none">
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action.action}
              variant="outline"
              size="sm"
              className="flex-shrink-0 gap-1 sm:gap-1.5 text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3"
              onClick={() => handleQuickAction(action.action)}
            >
              <action.icon className="w-3 h-3" />
              <span className="hidden xs:inline">{action.label}</span>
            </Button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 sm:p-4 border-t flex-shrink-0 bg-background">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex gap-1.5 sm:gap-2"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1 h-9 sm:h-10 text-sm"
            disabled={isLoading}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn(
              "h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0",
              isListening && "text-red-500 border-red-500",
            )}
            onClick={toggleVoiceInput}
          >
            {isListening ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </Button>
          <Button
            type="submit"
            size="icon"
            className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
            disabled={!input.trim() || isLoading}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
