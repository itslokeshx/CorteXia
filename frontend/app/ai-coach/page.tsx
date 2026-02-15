"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/components/layout/app-layout";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp } from "@/lib/context/app-context";
import { useAuth } from "@/lib/context/auth-context";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Send, Plus, Sparkles, Wind, Mic, MicOff, Loader2 } from "lucide-react";
import { format, subDays } from "date-fns";
import type { UserState, CoachSession, CoachMessage } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// ── Quick actions ─────────────────────────────────────────────────────
const QUICK_ACTIONS = [
  { emoji: "😤", label: "I'm stressed", type: "stress" as const },
  { emoji: "😔", label: "Feeling down", type: "venting" as const },
  { emoji: "🎉", label: "Celebrate", type: "celebration" as const },
  { emoji: "💭", label: "Need to vent", type: "venting" as const },
  { emoji: "🧘", label: "Breathe", type: "exercise" as const },
  { emoji: "📋", label: "Plan my day", type: "planning" as const },
];

const getMoodEmoji = (value: number) => {
  if (value >= 8) return "😄";
  if (value >= 6) return "😊";
  if (value >= 4) return "😐";
  if (value >= 2) return "😟";
  return "😢";
};

// ═══════════════════════════════════════════════════════════════════════
export default function AICoachPage() {
  const { user, profile } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const {
    tasks,
    habits,
    goals,
    journalEntries,
    transactions,
    timeEntries,
    addTask,
    deleteTask,
    completeTask,
    addHabit,
    deleteHabit,
    completeHabit,
    addGoal,
    settings,
    updateSettings,
    dataReady,
  } = useApp();

  // Get user's preferred name - prioritize AI memory, then profile, then email
  const userName =
    (settings?.aiMemory as any)?.userName ||
    profile?.full_name?.split(" ")[0] ||
    user?.email?.split("@")[0] ||
    "Friend";

  const [sessions, setSessions] = useState<CoachSession[]>([]);
  const [currentSession, setCurrentSession] = useState<CoachSession | null>(
    null,
  );
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isBreathingExercise, setIsBreathingExercise] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Action Dispatcher ────────────────────────────────────────────────
  const executeAiActions = useCallback(
    (actions: any[]) => {
      if (!actions || !Array.isArray(actions)) return;

      actions.forEach((action) => {
        try {
          switch (action.type) {
            case "set_theme":
              if (action.data?.theme) {
                setTheme(action.data.theme);
                toast.success(`Theme set to ${action.data.theme}`);
              }
              break;

            case "create_task":
              if (action.data?.title) {
                addTask({
                  title: action.data.title,
                  priority: action.data.priority || "medium",
                  status: "todo",
                  dueDate: action.data.dueDate,
                  tags: action.data.domain ? [action.data.domain] : [],
                  domain: action.data.domain || "personal", // Default domain
                  description: action.data.description || "",
                });
                toast.success(`Task created: ${action.data.title}`);
              }
              break;

            case "create_habit":
              if (action.data?.name) {
                addHabit({
                  name: action.data.name,
                  frequency: action.data.frequency || "daily",
                  active: true,
                  streak: 0,
                  longestStreak: 0,
                  description: action.data.description || "",
                  category: action.data.category || "health",
                });
                toast.success(`Habit added: ${action.data.name}`);
              }
              break;

            case "create_goal":
              if (action.data?.title) {
                addGoal({
                  title: action.data.title,
                  category: action.data.category || "personal",
                  targetDate: action.data.targetDate,
                  status: "active",
                  progress: 0,
                  milestones: [],
                  description: action.data.description || "",
                  priority: "medium",
                  level: "quarterly", // Default level must be a valid string literal
                });
                toast.success(`Goal set: ${action.data.title}`);
              }
              break;

            case "delete_task":
              if (action.data?.taskId) {
                deleteTask(action.data.taskId);
                toast.success(`Task deleted`);
              }
              break;

            case "delete_habit":
              if (action.data?.habitId) {
                deleteHabit(action.data.habitId);
                toast.success(`Habit deleted`);
              }
              break;

            case "complete_task":
              if (action.data?.taskId) {
                completeTask(action.data.taskId);
                toast.success(`Task completed!`);
              }
              break;

            case "complete_habit":
              if (action.data?.habitId) {
                const today = new Date().toISOString().split('T')[0];
                completeHabit(action.data.habitId, today);
                toast.success(`Habit completed!`);
              }
              break;

            case "navigate":
              if (action.data?.path) {
                router.push(action.data.path);
                toast.success(`Navigating to ${action.data.path}`);
              }
              break;

            default:
              console.warn("Unknown AI action:", action.type);
          }
        } catch (err) {
          console.error("Failed to execute AI action:", action, err);
          toast.error(`Failed to perform action: ${action.type}`);
        }
      });
    },
    [addTask, addHabit, addGoal, deleteTask, deleteHabit, completeTask, completeHabit, setTheme, router],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.messages]);

  // Fetch chat history on mount
  useEffect(() => {
    const fetchHistory = async () => {
      // Wait for data to be ready to ensure settings (and userName) are loaded
      if (!dataReady) return;

      try {
        const token = localStorage.getItem("cortexia_token");
        if (!token) return;

        const API_URL =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const res = await fetch(`${API_URL}/api/ai/chat/history`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          const sessionData = await res.json();
          if (sessionData && sessionData.messages) {
            // ... existing logic ...
            // Transform to CoachSession format
            const mappedMessages: CoachMessage[] = sessionData.messages.map(
              (msg: any) => ({
                id: msg.id || msg._id,
                role: msg.role,
                content: msg.content,
                timestamp: msg.timestamp || new Date().toISOString(),
              }),
            );

            const historySession: CoachSession = {
              id: sessionData._id || "history",
              startedAt: sessionData.createdAt || new Date().toISOString(),
              messages: mappedMessages,
              sessionType: "general",
            };
            setCurrentSession(historySession);
            setSessions([historySession]);
          } else {
            // Only start new session if NO history exists
            startNewSession("general");
          }
        } else {
          // Only start new session if history fetch fails
          startNewSession("general");
        }
      } catch (error) {
        console.error("Failed to fetch chat history:", error);
        startNewSession("general");
      }
    };

    fetchHistory();
  }, [dataReady]);

  // ── User state ──────────────────────────────────────────────────────
  const userState: UserState = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    const last7Days = subDays(today, 7);

    const recentJournals = journalEntries
      .filter((j) => new Date(j.date) >= last7Days)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const avgMood =
      recentJournals.length > 0
        ? recentJournals.reduce((sum, j) => sum + j.mood, 0) /
        recentJournals.length
        : 5;
    const avgEnergy =
      recentJournals.length > 0
        ? recentJournals.reduce((sum, j) => sum + j.energy, 0) /
        recentJournals.length
        : 5;
    const avgStress =
      recentJournals.length > 0
        ? recentJournals.reduce((sum, j) => sum + (j.stress || 5), 0) /
        recentJournals.length
        : 5;

    const firstHalf = recentJournals.slice(
      Math.floor(recentJournals.length / 2),
    );
    const secondHalf = recentJournals.slice(
      0,
      Math.floor(recentJournals.length / 2),
    );
    const firstAvg =
      firstHalf.length > 0
        ? firstHalf.reduce((s, j) => s + j.mood, 0) / firstHalf.length
        : avgMood;
    const secondAvg =
      secondHalf.length > 0
        ? secondHalf.reduce((s, j) => s + j.mood, 0) / secondHalf.length
        : avgMood;
    const moodTrend =
      secondAvg > firstAvg + 0.5
        ? "up"
        : secondAvg < firstAvg - 0.5
          ? "down"
          : "stable";

    const pendingTasks = tasks.filter((t) => t.status !== "completed");
    const overdueTasks = pendingTasks.filter(
      (t) => t.dueDate && t.dueDate < todayStr,
    );
    const completedToday = tasks.filter(
      (t) => t.status === "completed" && t.completedAt?.startsWith(todayStr),
    );

    const habitsAtRisk = habits.filter((h) => {
      if (!h.active || h.streak <= 3) return false;
      return !h.completions?.some((c) => c.date === todayStr && c.completed);
    });
    const activeStreaks = habits.filter((h) => h.active && h.streak > 0);

    const activeGoals = goals.filter((g) => g.status === "active");
    const strugglingGoals = activeGoals.filter((g) => g.progress < 30);
    const onTrackGoals = activeGoals.filter((g) => g.progress >= 50);

    const thisMonth = new Date();
    const monthlyExpenses = transactions
      .filter(
        (t) =>
          t.type === "expense" &&
          new Date(t.date).getMonth() === thisMonth.getMonth() &&
          new Date(t.date).getFullYear() === thisMonth.getFullYear(),
      )
      .reduce((sum, t) => sum + t.amount, 0);
    const daysInMonth = new Date(
      thisMonth.getFullYear(),
      thisMonth.getMonth() + 1,
      0,
    ).getDate();

    return {
      mood: {
        value: Math.round(avgMood),
        trend: moodTrend as "up" | "down" | "stable",
      },
      energy: { value: Math.round(avgEnergy), trend: "stable" as const },
      stress: { value: Math.round(avgStress), trend: "stable" as const },
      sleep: { avgHours: 7, debt: 0 },
      tasks: {
        pending: pendingTasks.length,
        overdue: overdueTasks.length,
        completedToday: completedToday.length,
      },
      habits: {
        atRisk: habitsAtRisk.length,
        streaksActive: activeStreaks.length,
      },
      goals: {
        onTrack: onTrackGoals.length,
        struggling: strugglingGoals.length,
      },
      budget: {
        percentUsed: Math.round((monthlyExpenses / 2500) * 100),
        daysRemaining: daysInMonth - thisMonth.getDate(),
      },
    };
  }, [tasks, habits, goals, journalEntries, transactions, timeEntries]);

  // ── AI assessment ───────────────────────────────────────────────────
  const aiAssessment = useMemo(() => {
    const issues: string[] = [];
    const positives: string[] = [];

    if (userState.mood.value >= 7) positives.push("your mood has been good");
    else if (userState.mood.value <= 4) issues.push("your mood seems low");
    if (userState.tasks.overdue > 2)
      issues.push(`${userState.tasks.overdue} overdue tasks`);
    if (userState.tasks.completedToday > 0)
      positives.push(`completed ${userState.tasks.completedToday} tasks today`);
    if (userState.habits.atRisk > 0)
      issues.push(`${userState.habits.atRisk} habit streaks at risk`);
    if (userState.habits.streaksActive > 2)
      positives.push(`${userState.habits.streaksActive} active streaks`);
    if (userState.goals.struggling > 0)
      issues.push(`${userState.goals.struggling} goals need attention`);
    if (userState.budget.percentUsed > 90)
      issues.push("budget almost depleted");

    if (issues.length === 0 && positives.length > 0)
      return `Great job! ${positives.join(", ")}. Keep it up!`;
    if (issues.length > 0)
      return `You're doing well overall, but ${issues.join(", ")} need attention.${positives.length > 0 ? ` On the bright side, ${positives.join(", ")}.` : ""}`;
    return "Everything looks balanced. How can I help you today?";
  }, [userState]);

  // ── Start session ───────────────────────────────────────────────────
  const startNewSession = useCallback(
    (type: CoachSession["sessionType"] = "general") => {
      const session: CoachSession = {
        id: `cs-${Date.now()}`,
        startedAt: new Date().toISOString(),
        messages: [],
        sessionType: type,
      };

      const hour = new Date().getHours();
      const greeting =
        hour < 12
          ? "Good morning"
          : hour < 18
            ? "Good afternoon"
            : hour < 18
              ? "Good afternoon"
              : "Good evening";

      const personalizedGreeting = `${greeting}, ${userName}`;

      const messages: Record<string, string> = {
        stress: `${personalizedGreeting}! I can see you're feeling stressed. Let's work through this together. What's weighing on your mind?`,
        venting: `${personalizedGreeting}! I'm here to listen without judgment. Take your time and share whatever is on your mind.`,
        celebration: `${personalizedGreeting}! 🎉 I love hearing about wins! What amazing thing happened?`,
        planning: `${personalizedGreeting}! Let's plan your day. You have ${userState.tasks.pending} pending tasks${userState.tasks.overdue > 0 ? ` (${userState.tasks.overdue} overdue)` : ""}. What would you like to prioritize?`,
        "check-in": `${personalizedGreeting}! ${aiAssessment} How are you feeling right now?`,
        general: `${personalizedGreeting}! ${aiAssessment} What's on your mind?`,
      };

      const aiMessage: CoachMessage = {
        id: `cm-${Date.now()}`,
        role: "assistant",
        content: messages[type] || messages.general,
        timestamp: new Date().toISOString(),
      };

      session.messages.push(aiMessage);
      setCurrentSession(session);
      setSessions((prev) => [...prev, session]);
    },
    [userState, aiAssessment, userName],
  );

  // ─── Voice Input (Web Speech API) ───────────────────────────────────


  const startListening = () => {
    if (!("webkitSpeechRecognition" in window)) {
      toast.error("Voice input is not supported in this browser.");
      return;
    }
    const SpeechRecognition = (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput((prev) => (prev ? prev + " " + transcript : transcript));
    };
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      if (event.error === "network") {
        toast.error("Network error: Voice input requires an internet connection.");
      } else if (event.error === "not-allowed") {
        toast.error("Microphone access denied.");
      } else {
        toast.error("Voice input failed. Please try again.");
      }
    };
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const stopListening = () => {
    setIsListening(false);
    // The recognition object is not stored in ref here for simplicity,
    // relying on onend or natural stop. For 'stop' button we'd need a ref.
    // Given continuous=false, it stops automatically after speech.
    // If we want manual stop, we'd need to track the instance.
    // For now, let's assume one-shot command or just toggle UI.
  };

  // ── Send message ────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    if (!input.trim() || !currentSession || isThinking) return;

    const userMessage: CoachMessage = {
      id: `cm-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    const updatedSession = {
      ...currentSession,
      messages: [...currentSession.messages, userMessage],
    };
    setCurrentSession(updatedSession);
    const userInput = input.trim();
    setInput("");
    setIsThinking(true);

    try {
      // Send compact summaries to save tokens on free tier
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const conversationHistory = updatedSession.messages
        .slice(-12) // Increased from 4 to 12 for better context
        .map((m) => ({
          role: m.role,
          content:
            m.role === "assistant" && m.content.length > 300
              ? m.content.substring(0, 300)
              : m.content,
        }));

      const compactUserData = {
        tasks: tasks.map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          dueDate: t.dueDate,
        })),
        habits: habits
          .filter((h) => h.active)
          .map((h) => ({
            id: h.id,
            name: h.name,
            streak: h.streak,
            completedToday: h.completions?.some(
              (c) => c.date === todayStr && c.completed,
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
        journalEntries: journalEntries.slice(0, 10).map((j) => ({
          date: j.date,
          title: j.title,
          content: j.content,
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
          message: userInput,
          conversationHistory,
          userData: compactUserData,
          memory: {
            userName: userName,
            conversationCount: sessions.length,
          },
        }),
      });

      let responseContent: string;
      let responseActions: any[] = [];
      let responseId: string = `cm-${Date.now()}`;

      if (apiRes.ok) {
        const data = await apiRes.json();
        responseContent = data.message || "I couldn't generate a response. Please try again.";
        responseActions = data.actions || [];
        // Ideally backend should return the new message ID, but if not we generate one.
        // Use a consistent ID format if backend provides it in ACTIONS or a specific field, 
        // but currently backend returns { message, actions }. 
        // We will stick to local ID but ensures it doesn't conflict.

        // Execute any actions returned by the AI
        if (responseActions.length > 0) {
          executeAiActions(responseActions);
        }

        // Update memory if AI learned something new
        if (data.updatedMemory) {
          console.log("[Jarvis Page] Updating memory:", data.updatedMemory);
          updateSettings({
            ...settings,
            aiMemory: data.updatedMemory,
          });
        }
      } else {
        // Fallback to a basic local response if the API fails
        responseContent = generateLocalCoachResponse(userInput, userState);
      }

      const aiMessage: CoachMessage = {
        id: responseId,
        role: "assistant",
        content: responseContent,
        timestamp: new Date().toISOString(),
      };

      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, aiMessage],
      };

      setCurrentSession(finalSession);
      setSessions((prev) =>
        prev.map((s) => (s.id === finalSession.id ? finalSession : s)),
      );
    } catch (error) {
      console.error("AI Coach chat error:", error);
      // Offline / network-error fallback
      const responseContent = generateLocalCoachResponse(userInput, userState);

      const aiMessage: CoachMessage = {
        id: `cm-${Date.now()}`,
        role: "assistant",
        content: responseContent,
        timestamp: new Date().toISOString(),
      };

      const finalSession = {
        ...updatedSession,
        messages: [...updatedSession.messages, aiMessage],
      };
      setCurrentSession(finalSession);
      setSessions((prev) =>
        prev.map((s) => (s.id === finalSession.id ? finalSession : s)),
      );
    } finally {
      setIsThinking(false);
    }
  }, [
    input,
    currentSession,
    isThinking,
    userState,
    tasks,
    habits,
    goals,
    transactions,
    timeEntries,
    journalEntries,
    executeAiActions,
  ]);

  // ── Render ──────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="flex flex-col h-[calc(100vh-6rem)] max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <Brain className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Jarvis
              </h1>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Your intelligent life architect
              </p>
            </div>
          </div>
          <Button
            onClick={async () => {
              try {
                const token = localStorage.getItem("cortexia_token");
                const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
                await fetch(`${API_URL}/api/ai/chat/history`, {
                  method: "DELETE",
                  headers: token ? { Authorization: `Bearer ${token}` } : {},
                });
              } catch (e) {
                console.error("Failed to clear chat history:", e);
              }
              setCurrentSession(null);
              setInput("");
              startNewSession("general");
            }}
            size="sm"
            className="gap-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900"
          >
            <Plus className="h-3.5 w-3.5" /> New Chat
          </Button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] overflow-hidden min-h-0 shadow-sm relative">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {currentSession?.messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] sm:max-w-[75%] px-4 py-3 rounded-2xl",
                    message.role === "user"
                      ? "rounded-br-md bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                      : "rounded-bl-md bg-gray-100 dark:bg-gray-800 text-[var(--color-text-primary)]",
                  )}
                >
                  <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                    {message.content}
                  </p>
                  <p
                    className={cn(
                      "text-[10px] mt-1.5",
                      message.role === "user"
                        ? "text-gray-400 dark:text-gray-600"
                        : "text-[var(--color-text-tertiary)]",
                    )}
                  >
                    {format(new Date(message.timestamp), "h:mm a")}
                  </p>
                </div>
              </motion.div>
            ))}

            {isThinking && (
              <div className="flex items-center gap-2 text-[var(--color-text-tertiary)]">
                <motion.div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full"
                      animate={{ y: [0, -6, 0] }}
                      transition={{
                        repeat: Infinity,
                        duration: 0.6,
                        delay: i * 0.2,
                      }}
                    />
                  ))}
                </motion.div>
                <span className="text-xs">Thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          {currentSession && (
            <div className="border-t border-[var(--color-border)] p-3 sm:p-4 flex-shrink-0 bg-[var(--color-bg-primary)]">
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-10 w-10 flex-shrink-0 rounded-full",
                    isListening
                      ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 animate-pulse"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800 text-[var(--color-text-tertiary)]",
                  )}
                  onClick={isListening ? stopListening : startListening}
                  disabled={isThinking}
                >
                  {isListening ? (
                    <MicOff className="h-5 w-5" />
                  ) : (
                    <Mic className="h-5 w-5" />
                  )}
                </Button>
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !e.shiftKey && sendMessage()
                  }
                  placeholder="Share what's on your mind..."
                  className="flex-1 h-10"
                  disabled={isThinking}
                />
                <Button
                  onClick={sendMessage}
                  disabled={!input.trim() || isThinking}
                  className="h-10 px-4 bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Breathing Exercise Modal */}
      <BreathingExerciseModal
        open={isBreathingExercise}
        onClose={() => setIsBreathingExercise(false)}
      />
    </AppLayout>
  );
}

// ── Local fallback when API is unreachable ─────────────────────────────
function generateLocalCoachResponse(
  userInput: string,
  userState: UserState,
): string {
  const lower = userInput.toLowerCase();

  if (
    lower.includes("stressed") ||
    lower.includes("anxious") ||
    lower.includes("overwhelmed")
  ) {
    return `I hear you. Let's break this down:\n\n• You have ${userState.tasks.pending} pending tasks\n• ${userState.habits.atRisk} habits at risk\n\nHere's what I suggest:\n1. Take 3 deep breaths right now\n2. Identify the ONE most important task\n3. Block 30 minutes to focus just on that\n\nWould you like a breathing exercise or help prioritizing?`;
  }
  if (lower.includes("tired") || lower.includes("exhausted")) {
    return `Rest is productive too. Your body is telling you something important.\n\nConsider:\n• A 15-minute power nap\n• A short walk\n• Something enjoyable without guilt\n\nRecovery is part of peak performance. What sounds good right now?`;
  }
  if (
    lower.includes("happy") ||
    lower.includes("great") ||
    lower.includes("good")
  ) {
    return `That's wonderful! 🌟 Positive moments are worth savoring. What made today special?`;
  }
  return `Thanks for sharing. Here's where you stand:\n\n• Mood: ${getMoodEmoji(userState.mood.value)} ${userState.mood.value}/10\n• Tasks: ${userState.tasks.pending} pending\n• Streaks: ${userState.habits.streaksActive} active\n\nHow can I help given everything on your plate? We could:\n1. Talk through what's on your mind\n2. Create an action plan\n3. Do a mindfulness exercise`;
}

// ═══════════════════════════════════════════════════════════════════════
function BreathingExerciseModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [phase, setPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const [count, setCount] = useState(4);
  const [cycles, setCycles] = useState(0);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!open) {
      setPhase("inhale");
      setCount(4);
      setCycles(0);
      setIsActive(false);
      return;
    }
    if (!isActive) return;

    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          setPhase((p) => {
            if (p === "inhale") return "hold";
            if (p === "hold") return "exhale";
            setCycles((c) => c + 1);
            return "inhale";
          });
          return phase === "hold" ? 7 : 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, isActive, phase]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md text-center">
        <DialogHeader>
          <DialogTitle>Breathing Exercise</DialogTitle>
        </DialogHeader>
        <div className="py-8">
          {!isActive ? (
            <div className="space-y-4">
              <div className="w-28 h-28 mx-auto rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                <Wind className="w-10 h-10 text-white" />
              </div>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                4-7-8 technique to reduce anxiety and promote relaxation.
              </p>
              <Button onClick={() => setIsActive(true)} className="mt-4">
                Start
              </Button>
            </div>
          ) : (
            <>
              <motion.div
                className="w-28 h-28 mx-auto rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center"
                animate={{
                  scale:
                    phase === "inhale" ? 1.3 : phase === "exhale" ? 0.8 : 1.1,
                }}
                transition={{
                  duration:
                    phase === "inhale" ? 4 : phase === "exhale" ? 8 : 0.5,
                }}
              >
                <span className="text-3xl font-bold text-white">{count}</span>
              </motion.div>
              <h2 className="text-xl font-bold mt-6 capitalize text-[var(--color-text-primary)]">
                {phase}
              </h2>
              <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                {phase === "inhale" && "Breathe in slowly through your nose"}
                {phase === "hold" && "Hold your breath gently"}
                {phase === "exhale" && "Release slowly through your mouth"}
              </p>
              <p className="mt-4 text-xs text-[var(--color-text-tertiary)]">
                Cycles: {cycles}
              </p>
            </>
          )}
        </div>
        <DialogFooter>
          <Button onClick={onClose} variant="outline" className="w-full">
            {isActive ? "End" : "Close"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
