"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/context/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/context/app-context";
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
      return `Logged expense: $${data.amount || 0} `;
    case "add_income":
      return `Logged income: $${data.amount || 0} `;
    case "delete_transaction":
      return `Deleted transaction`;
    case "log_time":
      return `Logged ${data.duration || 0}min for "${data.task || "Work"}"`;
    case "delete_time_entry":
      return `Deleted time entry`;
    case "log_study":
      return `Logged ${data.duration || 0}min studying ${data.subject || "General"} `;
    case "delete_study_session":
      return `Deleted study session`;
    case "create_journal":
      return `Created journal entry`;
    case "update_journal":
      return `Updated journal`;
    case "delete_journal":
      return `Deleted journal entry`;
    case "navigate":
      return `Navigating to ${data.path || "/"} `;
    case "set_theme":
      return `Switched theme to ${data.theme || "system"} `;
    case "clear_tasks":
      return "Cleared all tasks";
    case "clear_habits":
      return "Cleared all habits";
    case "clear_goals":
      return "Cleared all goals";
    case "clear_all_data":
      return "Cleared all app data";
    case "display_data":
      return "Displayed requested data";
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
  const facts: string[] = [];

  // Name detection
  const nameMatch = userMsg.match(
    /(?:my name is|i'?m|call me|i am|this is)\s+([A-Z][a-z]+)/i,
  );
  if (nameMatch) update.userName = nameMatch[1];

  // Theme preference
  const themeMatch = userMsg.match(
    /(?:prefer|like|switch to|use)\s+(dark|light)\s*(?:mode|theme)?/i,
  );
  if (themeMatch) {
    update.preferences = { theme: themeMatch[1].toLowerCase() };
  }

  // Extract personal facts
  const factPatterns = [
    /i (?:work|am working) (?:at|for|in)\s+(.+?)(?:\.|,|$)/i,
    /i(?:'m| am) a\s+(.+?)(?:\.|,|$)/i,
    /i (?:study|am studying)\s+(.+?)(?:\.|,|$)/i,
    /i (?:live|am living) (?:in|at)\s+(.+?)(?:\.|,|$)/i,
    /i (?:like|love|enjoy)\s+(.+?)(?:\.|,|$)/i,
    /my (?:goal|aim|target) is\s+(.+?)(?:\.|,|$)/i,
    /i(?:'m| am) (?:trying|learning|working on)\s+(.+?)(?:\.|,|$)/i,
  ];
  for (const pat of factPatterns) {
    const m = userMsg.match(pat);
    if (m && m[1].length < 80) facts.push(m[1].trim());
  }
  if (facts.length) update.facts = facts;

  // Topic detection
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
    "career",
    "sleep",
    "diet",
    "productivity",
    "relationships",
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

const DataDisplay = ({ data }: { data: any }) => {
  if (!data || !data.dataType) return null;

  switch (data.dataType) {
    case "tasks":
      return (
        <div className="mt-3 space-y-2">
          {data.items?.map((item: any, i: number) => (
            <div key={i} className="flex items-start gap-2 p-2 rounded bg-background/50 border text-xs">
              <div className={`mt - 0.5 w - 2 h - 2 rounded - full ${item.priority === 'high' ? 'bg-red-500' : item.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'} `} />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.title}</p>
                <p className="text-[10px] text-muted-foreground">
                  {item.dueDate ? `Due ${item.dueDate} ` : "No date"} · {item.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      );
    case "habits":
      return (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {data.items?.map((item: any, i: number) => (
            <div key={i} className="p-2 rounded bg-background/50 border text-xs">
              <p className="font-medium truncate">{item.name}</p>
              <div className="flex items-center gap-1 mt-1">
                <div className={`w - 1.5 h - 1.5 rounded - full ${item.completedToday ? 'bg-green-500' : 'bg-gray-300'} `} />
                <span className="text-[10px] text-muted-foreground">{item.streak} day streak</span>
              </div>
            </div>
          ))}
        </div>
      );
    case "goals":
      return (
        <div className="mt-3 space-y-2">
          {data.items?.map((item: any, i: number) => (
            <div key={i} className="p-2 rounded bg-background/50 border text-xs">
              <div className="flex justify-between mb-1">
                <span className="font-medium">{item.title}</span>
                <span className="text-[10px]">{item.progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${item.progress}% ` }} />
              </div>
            </div>
          ))}
        </div>
      );
    case "analysis":
      return (
        <div className="mt-3 p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs">
          <h4 className="font-semibold text-indigo-600 dark:text-indigo-400 mb-1 flex items-center gap-1.5">
            <Brain className="w-3 h-3" /> Analysis
          </h4>
          <p className="leading-relaxed opacity-90">{data.summary || data.items}</p>
        </div>
      );
    default:
      return (
        <pre className="mt-3 p-2 rounded bg-background/50 border text-[10px] overflow-auto max-h-32">
          {JSON.stringify(data, null, 2)}
        </pre>
      );
  }
};

export function ConversationalAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [barInput, setBarInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [pendingBulkActions, setPendingBulkActions] = useState<any[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const barInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { setTheme, theme: currentTheme } = useTheme();
  const { user, profile } = useAuth();

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
  } = useApp();

  // AI Memory - loaded from settings (MongoDB), not localStorage
  const [memory, setMemoryState] = useState<AIMemory>(DEFAULT_MEMORY);
  const memoryHydratedRef = useRef(false);

  // Hydrate memory from MongoDB settings once data arrives
  useEffect(() => {
    if (memoryHydratedRef.current) return;
    if (
      settings?.aiMemory &&
      (settings.aiMemory as AIMemory).conversationCount >= 0
    ) {
      const saved = settings.aiMemory as AIMemory;
      setMemoryState({
        userName: saved.userName || undefined,
        preferences: saved.preferences || {},
        facts: saved.facts || [],
        conversationCount: saved.conversationCount || 0,
        lastTopic: saved.lastTopic || undefined,
        lastInteraction: saved.lastInteraction || undefined,
      });
      memoryHydratedRef.current = true;
    }
  }, [settings?.aiMemory]);

  // Floating Jarvis = action-only, no history fetch.
  // Full conversation lives on the /ai-coach page.

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Send from the persistent bar
  const handleBarSubmit = () => {
    if (!barInput.trim()) return;
    setIsOpen(true);
    // Small delay so chat panel mounts first
    setTimeout(() => {
      sendMessage(barInput.trim());
      setBarInput("");
    }, 150);
  };

  // Build COMPREHENSIVE context for AI with full data access
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

      console.log(
        "[AI Chat] Sending message:",
        text.substring(0, 60),
        "| Memory name:",
        memory.userName || "(none)",
        "| Token:",
        token ? "present" : "MISSING",
      );

      const apiRes = await fetch(`${API_URL}/api/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          message: text,
          conversationHistory: messages.slice(-10).map((m) => ({
            role: m.role,
            content:
              m.role === "assistant" && m.content.length > 500
                ? m.content.substring(0, 500)
                : m.content,
          })),
          userData: compactUserData,
          memory: {
            userName: memory.userName,
            facts: memory.facts.slice(-10),
            lastTopic: memory.lastTopic,
            conversationCount: memory.conversationCount,
            preferredTheme: memory.preferences.theme,
            lastInteraction: memory.lastInteraction,
          },
        }),
      });

      if (!apiRes.ok) {
        const errorData = await apiRes.json().catch(() => ({}));
        console.error("[AI Chat] API error:", apiRes.status, errorData);
        throw new Error(
          (errorData as any).error || `API error ${apiRes.status} `,
        );
      }

      const response = await apiRes.json();

      console.log(
        "[AI Chat] Response received — actions:",
        response.actions?.length || 0,
        response.actions?.map((a: any) => a.type),
        "| has updatedMemory:",
        !!response.updatedMemory,
      );

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.message,
        timestamp: new Date().toLocaleTimeString(),
        actions: response.actions,
        suggestions: response.suggestions,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // === MEMORY UPDATE ===
      // Merge: frontend extraction + server-side extraction + AI name reference
      const memUpdate = extractMemoryFacts(text);

      // Merge server-side memory extraction (name/facts from backend)
      if (response.updatedMemory) {
        if (response.updatedMemory.userName && !memUpdate.userName) {
          memUpdate.userName = response.updatedMemory.userName;
        }
        if (response.updatedMemory.facts?.length) {
          memUpdate.facts = [
            ...(memUpdate.facts || []),
            ...response.updatedMemory.facts,
          ];
        }
      }

      // Also check if AI response references a name
      const aiNameRef = response.message?.match(
        /(?:Hi|Hey|Hello|Sure|Got it|Nice to meet you),?\s+([A-Z][a-z]{2,})/,
      );
      if (aiNameRef && !memUpdate.userName) {
        memUpdate.userName = aiNameRef[1];
      }

      setMemoryState((prev) => {
        const updated: AIMemory = {
          ...prev,
          ...memUpdate,
          preferences: {
            ...prev.preferences,
            ...(memUpdate.preferences || {}),
          },
          // Deduplicate facts
          facts: [
            ...new Set([...prev.facts, ...(memUpdate.facts || [])]),
          ].slice(-20),
          conversationCount: prev.conversationCount + 1,
          lastInteraction: new Date().toISOString(),
        };
        if (memUpdate.userName) updated.userName = memUpdate.userName;
        if (memUpdate.lastTopic) updated.lastTopic = memUpdate.lastTopic;

        console.log(
          "[AI Chat] Memory updated — name:",
          updated.userName || "(none)",
          "| facts:",
          updated.facts.length,
          "| conversations:",
          updated.conversationCount,
        );

        // Defer save to avoid calling parent setState during render
        queueMicrotask(() => updateSettings({ aiMemory: updated }));

        return updated;
      });

      // === EXECUTE ACTIONS ===
      if (response.actions && response.actions.length > 0) {
        const createTaskActions = response.actions.filter(
          (a: any) => a.type === "create_task",
        );
        const otherActions = response.actions.filter(
          (a: any) => a.type !== "create_task",
        );

        // Bulk creation: 2+ create_task → show confirmation instead of auto-executing
        if (createTaskActions.length >= 2) {
          setPendingBulkActions(createTaskActions);
          console.log(
            "[AI Chat] Queued",
            createTaskActions.length,
            "tasks for bulk confirmation",
          );
        } else {
          // Single create_task or other → execute immediately
          for (const action of createTaskActions) {
            try {
              await executeAction(action);
            } catch (err) {
              console.error("[AI Chat] Action failed:", action.type, err);
            }
          }
        }

        // Always execute non-create_task actions immediately
        for (const action of otherActions) {
          try {
            await executeAction(action);
          } catch (err) {
            console.error("[AI Chat] Action failed:", action.type, err);
          }
        }
      }
    } catch (error) {
      console.error("[AI Chat] Error:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content:
          "I'm having trouble connecting right now. Please try again in a moment.",
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
    data?: Record<string, unknown>;
    [key: string]: unknown;
  }) => {
    const today = new Date().toISOString().split("T")[0];

    // Normalize: if action.data is missing, treat all non-type keys as data
    const d: Record<string, unknown> =
      action.data && typeof action.data === "object"
        ? action.data
        : (() => {
          const { type: _, data: _d, ...rest } = action;
          return rest;
        })();

    try {
      switch (action.type) {
        // === TASK ACTIONS ===
        case "create_task":
          addTask({
            title: (d.title as string) || "Untitled Task",
            description: (d.description as string) || "",
            domain:
              (d.domain as
                | "work"
                | "study"
                | "personal"
                | "health"
                | "finance") || "personal",
            priority: (d.priority as "low" | "medium" | "high") || "medium",
            dueDate: (d.dueDate as string) || "",
            status: "todo",
            tags: (d.tags as string[]) || [],
          });
          toast.success(`✅ Task created: ${d.title} `);
          break;

        case "update_task":
          updateTask(d.taskId as string, (d.updates as Partial<any>) || d);
          toast.success(`📝 Task updated`);
          break;

        case "delete_task":
          deleteTask(d.taskId as string);
          toast.success(`🗑️ Task deleted`);
          break;

        case "complete_task":
          completeTask(d.taskId as string);
          toast.success(`✅ Task completed!`);
          break;

        // === HABIT ACTIONS ===
        case "create_habit":
          addHabit({
            name: (d.name as string) || "Untitled Habit",
            category:
              (d.category as
                | "health"
                | "productivity"
                | "learning"
                | "fitness"
                | "mindfulness"
                | "social") || "productivity",
            frequency:
              (d.frequency as "daily" | "weekly" | "custom") || "daily",
            description: (d.description as string) || "",
            streak: 0,
            longestStreak: 0,
            active: true,
          });
          toast.success(`🎯 Habit created: ${d.name} `);
          break;

        case "update_habit":
          updateHabit(d.habitId as string, (d.updates as Partial<any>) || d);
          toast.success(`📝 Habit updated`);
          break;

        case "delete_habit":
          deleteHabit(d.habitId as string);
          toast.success(`🗑️ Habit deleted`);
          break;

        case "complete_habit":
          completeHabit(d.habitId as string, today);
          toast.success(`✅ Habit marked as complete!`);
          break;

        // === GOAL ACTIONS ===
        case "create_goal":
          addGoal({
            title: (d.title as string) || "Untitled Goal",
            description: (d.description as string) || "",
            category:
              (d.category as
                | "personal"
                | "health"
                | "career"
                | "financial"
                | "education"
                | "family") || "personal",
            priority: (d.priority as "low" | "medium" | "high") || "medium",
            targetDate:
              (d.targetDate as string) ||
              new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0],
            progress: 0,
            status: "active",
            milestones: (d.milestones as any[]) || [],
            level: (d.level as "quarterly" | "yearly" | "life") || "quarterly",
          });
          toast.success(`🎯 Goal created: ${d.title} `);
          break;

        case "update_goal":
          updateGoal(d.goalId as string, (d.updates as Partial<any>) || d);
          toast.success(`📝 Goal updated`);
          break;

        case "delete_goal":
          deleteGoal(d.goalId as string);
          toast.success(`🗑️ Goal deleted`);
          break;

        case "complete_milestone":
          completeMilestone(d.goalId as string, d.milestoneId as string);
          toast.success(`✅ Milestone completed!`);
          break;

        case "add_tasks_to_goal": {
          const goalTasks = d.tasks as Array<{
            title: string;
            description?: string;
            priority?: string;
          }>;
          const gId = d.goalId as string;
          const g = goals.find((x) => x.id === gId);
          if (g && goalTasks) {
            for (const taskData of goalTasks) {
              addTask({
                title: taskData.title,
                description: taskData.description || `Part of goal: ${g.title} `,
                domain: "work",
                priority:
                  (taskData.priority as "low" | "medium" | "high") || "medium",
                status: "todo",
                tags: [`goal:${gId} `],
              });
            }
            toast.success(
              `✅ Added ${goalTasks.length} tasks to goal: ${g.title} `,
            );
          }
          break;
        }

        // === FINANCE ACTIONS ===
        case "add_expense":
          addTransaction({
            type: "expense",
            amount: Number(d.amount) || 0,
            category:
              (d.category as
                | "food"
                | "transport"
                | "entertainment"
                | "health"
                | "learning"
                | "utilities"
                | "other") || "other",
            description: (d.description as string) || "",
            date: (d.date as string) || new Date().toISOString(),
          });
          toast.success(`💸 Expense recorded: ${d.amount} `);
          break;

        case "add_income":
          addTransaction({
            type: "income",
            amount: Number(d.amount) || 0,
            category: "salary",
            description: (d.description as string) || "",
            date: (d.date as string) || new Date().toISOString(),
          });
          toast.success(`💰 Income recorded: ${d.amount} `);
          break;

        case "delete_transaction":
          deleteTransaction(d.transactionId as string);
          toast.success(`🗑️ Transaction deleted`);
          break;

        // === TIME TRACKING ACTIONS ===
        case "log_time":
          addTimeEntry({
            task: (d.task as string) || "Work",
            category:
              (d.category as "work" | "study" | "health" | "personal") ||
              "work",
            duration: Number(d.duration) || 30,
            date: (d.date as string) || new Date().toISOString(),
            focusQuality:
              (d.focusQuality as "deep" | "moderate" | "shallow") || "moderate",
            interruptions: (d.interruptions as number) || 0,
            notes: (d.notes as string) || "",
          });
          toast.success(`⏱️ Time logged: ${d.duration} minutes`);
          break;

        case "delete_time_entry":
          deleteTimeEntry(d.entryId as string);
          toast.success(`🗑️ Time entry deleted`);
          break;

        // === STUDY ACTIONS ===
        case "log_study":
          addStudySession({
            subject: (d.subject as string) || "General",
            duration: Number(d.duration) || 30,
            pomodoros:
              (d.pomodoros as number) ||
              Math.ceil(Number(d.duration || 30) / 25),
            difficulty:
              (d.difficulty as "easy" | "medium" | "hard") || "medium",
            topic: (d.topic as string) || "",
            startTime: new Date().toISOString(),
            endTime: new Date(
              Date.now() + Number(d.duration || 30) * 60000,
            ).toISOString(),
          });
          toast.success(`📚 Study session logged: ${d.subject} `);
          break;

        case "delete_study_session":
          deleteStudySession(d.sessionId as string);
          toast.success(`🗑️ Study session deleted`);
          break;

        // === JOURNAL ACTIONS ===
        case "create_journal":
          addJournalEntry({
            title:
              (d.title as string) ||
              `Journal - ${new Date().toLocaleDateString()} `,
            content: (d.content as string) || "",
            date: (d.date as string) || new Date().toISOString(),
            mood: (d.mood as number) || 5,
            energy: (d.energy as number) || 5,
            focus: (d.focus as number) || 5,
            tags: (d.tags as string[]) || [],
          });
          toast.success(`📝 Journal entry created`);
          break;

        case "update_journal":
          updateJournalEntry(
            d.entryId as string,
            (d.updates as Partial<any>) || d,
          );
          toast.success(`📝 Journal updated`);
          break;

        case "delete_journal":
          deleteJournalEntry(d.entryId as string);
          toast.success(`🗑️ Journal entry deleted`);
          break;

        // === BULK DELETE ACTIONS ===
        case "clear_completed_tasks": {
          const completedTasks = tasks.filter(t => t.status === "completed");
          for (const task of completedTasks) {
            deleteTask(task.id);
          }
          toast.success(`🗑️ Cleared ${completedTasks.length} completed tasks`);
          break;
        }

        case "clear_all_tasks": {
          const allTasks = [...tasks];
          for (const task of allTasks) {
            deleteTask(task.id);
          }
          toast.success(`🗑️ Cleared all ${allTasks.length} tasks`);
          break;
        }

        case "clear_all_habits": {
          const allHabits = [...habits];
          for (const habit of allHabits) {
            deleteHabit(habit.id);
          }
          toast.success(`🗑️ Cleared all ${allHabits.length} habits`);
          break;
        }

        // === NAVIGATION ===
        case "navigate": {
          const navPath = d.path as string;
          if (navPath) window.location.href = navPath;
          break;
        }

        // === THEME CONTROL ===
        case "set_theme": {
          const newTheme = (d.theme as string) || "dark";
          setTheme(newTheme);
          toast.success(`🎨 Theme switched to ${newTheme} `);
          break;
        }

        // === DATA DISPLAY ===
        case "display_data":
          // No-op: data is already displayed in the message
          toast.success("✨ Data refreshed");
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
          console.log("Unknown action type:", action.type, d);
      }
    } catch (err) {
      console.error("Failed to execute action:", action.type, err);
      toast.error(`Failed to execute: ${action.type} `);
    }
  };

  // Handle quick action
  const handleQuickAction = (action: string) => {
    switch (action) {
      case "show_today":
        sendMessage("Show me my schedule and priorities for today. Display the data here, do not navigate.");
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

  // ── CLOSED STATE ──
  if (!isOpen) {
    return (
      <>
        {/* Desktop — Minimal bottom bar */}
        <div className="hidden sm:block fixed z-50 bottom-0 left-0 right-0">
          <div className="border-t border-[var(--color-border)] bg-[var(--color-bg-primary)]">
            <div className="max-w-xl mx-auto px-4 py-2.5">
              <form
                onSubmit={(e) => { e.preventDefault(); handleBarSubmit(); }}
                className="relative"
              >
                <input
                  ref={barInputRef}
                  type="text"
                  value={barInput}
                  onChange={(e) => setBarInput(e.target.value)}
                  placeholder="Ask Jarvis anything..."
                  className="w-full h-10 pl-4 pr-20 rounded-xl text-sm bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-accent-primary)]/40 transition-colors"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                  {barInput.trim() ? (
                    <button
                      type="submit"
                      className="w-7 h-7 rounded-lg flex items-center justify-center bg-[var(--color-accent-primary)] text-[var(--color-bg-primary)] hover:opacity-90 transition-opacity"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <kbd className="hidden lg:inline-flex px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-tertiary)] bg-[var(--color-bg-tertiary)] rounded border border-[var(--color-border)]">
                      ⌘K
                    </kbd>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Mobile — Clean FAB */}
        <div className="sm:hidden fixed z-50 bottom-4 right-4">
          <motion.button
            className="w-12 h-12 rounded-full flex items-center justify-center shadow-lg"
            style={{
              background: "var(--color-accent-primary)",
              color: "var(--color-bg-primary)",
            }}
            onClick={() => setIsOpen(true)}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
          >
            <Sparkles className="w-5 h-5" />
          </motion.button>
        </div>
      </>
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
              Jarvis
            </h3>
            <p
              className="text-[10px] sm:text-xs"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              {memory.userName
                ? `Hey ${memory.userName} `
                : "Your intelligent life architect"}
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
                  ? `Hey ${memory.userName} ! 👋`
                  : "Hi! I'm Jarvis"}
              </h4>
              <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 max-w-[260px] sm:max-w-[280px] px-2">
                {memory.conversationCount > 0
                  ? `Welcome back! We've had ${memory.conversationCount} conversations.${memory.lastTopic ? ` Last time we talked about ${memory.lastTopic}.` : ""} How can I help?`
                  : "Your intelligent life architect. I can manage tasks, analyze patterns, control themes, and optimize your productivity."}
              </p >
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
            </div >
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

                    {/* Check for display_data in actions and render it */}
                    {message.actions?.map((action, idx) => {
                      if (action.type === 'display_data') {
                        return <DataDisplay key={idx} data={action.data} />;
                      }
                      return null;
                    })}
                  </div>
                  {message.role === "user" && (
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-secondary flex-shrink-0 flex items-center justify-center">
                      <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </div>
                  )}
                </motion.div>
              ))}

              {/* Bulk Creation Confirmation Card */}
              {pendingBulkActions && pendingBulkActions.length > 0 && (
                <motion.div
                  className="flex gap-2 sm:gap-3"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
                    style={{ background: "var(--color-bg-tertiary)" }}
                  >
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: "var(--color-accent-primary)" }} />
                  </div>
                  <div className="max-w-[85%] sm:max-w-[80%] rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                    <div className="px-3 sm:px-4 py-2.5 border-b border-[var(--color-border)]">
                      <p className="text-xs sm:text-sm font-medium text-[var(--color-text-primary)]">
                        ✨ {pendingBulkActions.length} tasks ready to create
                      </p>
                      <p className="text-[10px] sm:text-xs text-[var(--color-text-tertiary)] mt-0.5">
                        Review and confirm
                      </p>
                    </div>
                    <div className="divide-y divide-[var(--color-border)]">
                      {pendingBulkActions.map((action: any, i: number) => {
                        const d = action.data || {};
                        const priorityColors: Record<string, string> = {
                          critical: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                          high: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
                          medium: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                          low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
                        };
                        return (
                          <div key={i} className="px-3 sm:px-4 py-2.5 flex items-start gap-2.5">
                            <span className="text-[12px] font-mono text-[var(--color-text-tertiary)] mt-0.5 flex-shrink-0">
                              {i + 1}.
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs sm:text-sm font-medium text-[var(--color-text-primary)] leading-snug">
                                {d.title || "Untitled"}
                              </p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                {d.priority && (
                                  <span className={cn("px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-medium uppercase", priorityColors[d.priority] || priorityColors.medium)}>
                                    {d.priority}
                                  </span>
                                )}
                                {d.dueDate && (
                                  <span className="text-[10px] text-[var(--color-text-tertiary)]">
                                    📅 {d.dueDate}
                                  </span>
                                )}
                              </div>
                              {d.description && (
                                <p className="text-[10px] sm:text-xs text-[var(--color-text-tertiary)] mt-1 line-clamp-1">
                                  {d.description}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="px-3 sm:px-4 py-2.5 border-t border-[var(--color-border)] flex items-center gap-2">
                      <Button
                        size="sm"
                        className="flex-1 h-7 sm:h-8 text-[10px] sm:text-xs bg-[var(--color-accent-primary)] text-[var(--color-bg-primary)] hover:opacity-90"
                        onClick={async () => {
                          const actions = [...pendingBulkActions];
                          setPendingBulkActions(null);
                          for (const act of actions) {
                            try { await executeAction(act); } catch { /* ignore */ }
                          }
                          toast.success(`${actions.length} tasks created!`);
                        }}
                      >
                        ✅ Accept All
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 sm:h-8 text-[10px] sm:text-xs"
                        onClick={() => setPendingBulkActions(null)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}

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
        </div >
      </div >

      {/* Quick Actions (when there are messages) */}
      {
        messages.length > 0 && (
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
        )
      }

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
    </motion.div >
  );
}
