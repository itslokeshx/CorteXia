"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp } from "@/lib/context/app-context";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Send, Plus, Sparkles, Wind } from "lucide-react";
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
  const { tasks, habits, goals, journalEntries, transactions, timeEntries } =
    useApp();

  const [sessions, setSessions] = useState<CoachSession[]>([]);
  const [currentSession, setCurrentSession] = useState<CoachSession | null>(
    null,
  );
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [isBreathingExercise, setIsBreathingExercise] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.messages]);

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
            : "Good evening";

      const messages: Record<string, string> = {
        stress: `${greeting}! I can see you're feeling stressed. Let's work through this together. What's weighing on your mind?`,
        venting: `${greeting}! I'm here to listen without judgment. Take your time and share whatever is on your mind.`,
        celebration: `${greeting}! 🎉 I love hearing about wins! What amazing thing happened?`,
        planning: `${greeting}! Let's plan your day. You have ${userState.tasks.pending} pending tasks${userState.tasks.overdue > 0 ? ` (${userState.tasks.overdue} overdue)` : ""}. What would you like to prioritize?`,
        "check-in": `${greeting}! ${aiAssessment} How are you feeling right now?`,
        general: `${greeting}! ${aiAssessment} What's on your mind?`,
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
    [userState, aiAssessment],
  );

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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

      const conversationHistory = updatedSession.messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const apiRes = await fetch(`${apiUrl}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userInput,
          conversationHistory: conversationHistory.slice(-10),
          userData: {
            tasks,
            habits,
            transactions,
            timeEntries,
            goals,
            journalEntries,
            studySessions: [],
            lifeState: null,
            settings: {},
          },
        }),
      });

      let responseContent: string;

      if (apiRes.ok) {
        const data = await apiRes.json();
        responseContent =
          data.message || "I couldn't generate a response. Please try again.";
      } else {
        // Fallback to a basic local response if the API fails
        responseContent = generateLocalCoachResponse(userInput, userState);
      }

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
                AI Coach
              </h1>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Your personal companion
              </p>
            </div>
          </div>
          <Button
            onClick={() => startNewSession("general")}
            size="sm"
            className="gap-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900"
          >
            <Plus className="h-3.5 w-3.5" /> New Chat
          </Button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] overflow-hidden min-h-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {!currentSession ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                  How are you today?
                </h3>
                <p className="text-sm text-[var(--color-text-tertiary)] mb-8 max-w-sm">
                  I&apos;m here to listen, support, and help you navigate your
                  day.
                </p>

                {/* Quick actions */}
                <div className="flex flex-wrap justify-center gap-2 max-w-md">
                  {QUICK_ACTIONS.map((action) => (
                    <button
                      key={action.label}
                      onClick={() => {
                        if (action.type === "exercise") {
                          setIsBreathingExercise(true);
                        } else {
                          startNewSession(action.type);
                        }
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-sm"
                    >
                      <span className="text-base">{action.emoji}</span>
                      <span className="text-[var(--color-text-primary)] font-medium text-xs">
                        {action.label}
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => startNewSession("check-in")}
                  className="mt-6 px-6 py-2.5 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
                >
                  Start Check-in
                </button>
              </div>
            ) : (
              <>
                {currentSession.messages.map((message) => (
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
              </>
            )}
          </div>

          {/* Input */}
          {currentSession && (
            <div className="border-t border-[var(--color-border)] p-3 sm:p-4 flex-shrink-0 bg-[var(--color-bg-primary)]">
              <div className="flex gap-2">
                <Input
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
  return `Thanks for sharing. Here's where you stand:\n\n• Mood: ${getMoodEmoji(userState.mood.value)} ${userState.mood.value}/10\n• Tasks: ${userState.tasks.pending} pending\n• Streaks: ${userState.habits.streaksActive} active\n\nHow can I help? We could:\n1. Talk through what's on your mind\n2. Create an action plan\n3. Do a mindfulness exercise`;
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
