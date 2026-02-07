"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useApp } from "@/lib/context/app-context";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  Heart,
  Send,
  Plus,
  Sparkles,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckSquare,
  Flame,
  Target,
  DollarSign,
  Moon,
  Wind,
  History,
  ArrowRight,
} from "lucide-react";
import { format, subDays, parseISO, differenceInDays, isToday } from "date-fns";
import type { UserState, CoachSession, CoachMessage } from "@/lib/types";

// ── Quick action buttons ──────────────────────────────────────────────
const QUICK_ACTIONS = [
  { emoji: "😤", label: "I'm stressed", type: "stress" as const },
  { emoji: "😔", label: "Feeling down", type: "venting" as const },
  { emoji: "🎉", label: "Celebrate a win", type: "celebration" as const },
  { emoji: "💭", label: "Need to vent", type: "venting" as const },
  { emoji: "🧘", label: "Breathing exercise", type: "exercise" as const },
  { emoji: "📋", label: "Plan my day", type: "planning" as const },
];

// ── Helper: mood emoji ────────────────────────────────────────────────
const getMoodEmoji = (value: number) => {
  if (value >= 8) return "😄";
  if (value >= 6) return "😊";
  if (value >= 4) return "😐";
  if (value >= 2) return "😟";
  return "😢";
};

// ── Helper: trend icon ────────────────────────────────────────────────
const getTrendIcon = (trend: "up" | "down" | "stable") => {
  switch (trend) {
    case "up":
      return <TrendingUp className="h-3 w-3 text-green-500" />;
    case "down":
      return <TrendingDown className="h-3 w-3 text-red-500" />;
    default:
      return <Minus className="h-3 w-3 text-neutral-400" />;
  }
};

// ═══════════════════════════════════════════════════════════════════════
// Page component
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

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [currentSession?.messages]);

  // ── Calculate comprehensive user state ──────────────────────────────
  const userState: UserState = useMemo(() => {
    const today = new Date();
    const todayStr = format(today, "yyyy-MM-dd");
    const last7Days = subDays(today, 7);

    // Recent journal entries for mood / energy / stress
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

    // Mood trend (first half vs second half of the week)
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

    // Tasks analysis
    const pendingTasks = tasks.filter((t) => t.status !== "completed");
    const overdueTasks = pendingTasks.filter(
      (t) => t.dueDate && t.dueDate < todayStr,
    );
    const completedToday = tasks.filter(
      (t) => t.status === "completed" && t.completedAt?.startsWith(todayStr),
    );

    // Habits at risk
    const habitsAtRisk = habits.filter((h) => {
      if (!h.active || h.streak <= 3) return false;
      const done = h.completions?.some(
        (c) => c.date === todayStr && c.completed,
      );
      return !done;
    });
    const activeStreaks = habits.filter((h) => h.active && h.streak > 0);

    // Goals analysis
    const activeGoals = goals.filter((g) => g.status === "active");
    const strugglingGoals = activeGoals.filter(
      (g) =>
        g.status === "at_risk" || g.status === "failing" || g.progress < 30,
    );
    const onTrackGoals = activeGoals.filter((g) => g.progress >= 50);

    // Budget analysis
    const thisMonth = new Date();
    const monthlyExpenses = transactions
      .filter(
        (t) =>
          t.type === "expense" &&
          new Date(t.date).getMonth() === thisMonth.getMonth() &&
          new Date(t.date).getFullYear() === thisMonth.getFullYear(),
      )
      .reduce((sum, t) => sum + t.amount, 0);
    const monthlyBudget = 2500;
    const daysInMonth = new Date(
      thisMonth.getFullYear(),
      thisMonth.getMonth() + 1,
      0,
    ).getDate();
    const daysRemaining = daysInMonth - thisMonth.getDate();

    // Sleep (default)
    const avgSleep = 7;
    const sleepDebt = 0;

    return {
      mood: {
        value: Math.round(avgMood),
        trend: moodTrend as "up" | "down" | "stable",
      },
      energy: { value: Math.round(avgEnergy), trend: "stable" as const },
      stress: { value: Math.round(avgStress), trend: "stable" as const },
      sleep: { avgHours: avgSleep, debt: sleepDebt },
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
        percentUsed: Math.round((monthlyExpenses / monthlyBudget) * 100),
        daysRemaining,
      },
    };
  }, [tasks, habits, goals, journalEntries, transactions, timeEntries]);

  // ── AI assessment ───────────────────────────────────────────────────
  const aiAssessment = useMemo(() => {
    const issues: string[] = [];
    const positives: string[] = [];

    if (userState.mood.value >= 7)
      positives.push("Your mood has been good lately");
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

    if (issues.length === 0 && positives.length > 0) {
      return `Great job! ${positives.join(", ")}. Keep up the momentum!`;
    } else if (issues.length > 0) {
      return `You're managing well overall, but ${issues.join(", ")} need attention. ${positives.length > 0 ? `On the bright side, ${positives.join(", ")}.` : ""}`;
    }
    return "Everything looks balanced. How can I help you today?";
  }, [userState]);

  // ── Start a new coaching session ────────────────────────────────────
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

      let openingMessage = "";

      switch (type) {
        case "stress":
          openingMessage = `${greeting}! I can see you're feeling stressed. That's completely valid. Let's work through this together. What's weighing on your mind right now?`;
          break;
        case "venting":
          openingMessage = `${greeting}! I'm here to listen without judgment. Take your time and share whatever is on your mind. This is a safe space.`;
          break;
        case "celebration":
          openingMessage = `${greeting}! 🎉 I love hearing about wins! What amazing thing happened that you want to celebrate?`;
          break;
        case "planning":
          openingMessage = `${greeting}! Let's plan your day for success. Looking at your schedule, you have ${userState.tasks.pending} pending tasks${userState.tasks.overdue > 0 ? ` (${userState.tasks.overdue} overdue)` : ""}. What would you like to prioritize?`;
          break;
        case "check-in":
          openingMessage = `${greeting}! I've been looking at your recent activity. ${aiAssessment} How are you feeling right now?`;
          break;
        default:
          openingMessage = `${greeting}! I'm your AI coach, here to help you navigate life's challenges and celebrate your wins. ${aiAssessment} What's on your mind?`;
      }

      const aiMessage: CoachMessage = {
        id: `cm-${Date.now()}`,
        role: "assistant",
        content: openingMessage,
        timestamp: new Date().toISOString(),
      };

      session.messages.push(aiMessage);
      setCurrentSession(session);
      setSessions((prev) => [...prev, session]);
    },
    [userState, aiAssessment],
  );

  // ── Send a message ──────────────────────────────────────────────────
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
    setInput("");
    setIsThinking(true);

    // Simulate AI thinking
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 1000),
    );

    // Generate contextual response based on keywords
    const userContent = input.toLowerCase();
    let responseContent = "";

    if (
      userContent.includes("stressed") ||
      userContent.includes("anxious") ||
      userContent.includes("overwhelmed")
    ) {
      responseContent = `I hear you, and it's completely normal to feel this way. Let's break this down together. Looking at your current load: you have ${userState.tasks.pending} pending tasks and ${userState.habits.atRisk} habits at risk. \n\nHere's what I suggest:\n1. Take 3 deep breaths right now\n2. Identify the ONE most important task\n3. Block 30 minutes to focus just on that\n\nWould you like me to help you prioritize or start a breathing exercise?`;
    } else if (
      userContent.includes("tired") ||
      userContent.includes("exhausted")
    ) {
      responseContent = `Rest is productive too. Your body is telling you something important. Based on your recent activity, you've been pushing hard. \n\nMaybe it's time to:\n• Take a 15-minute power nap\n• Go for a short walk\n• Do something enjoyable without guilt\n\nRemember: recovery is part of peak performance. What sounds most appealing right now?`;
    } else if (
      userContent.includes("happy") ||
      userContent.includes("great") ||
      userContent.includes("good")
    ) {
      responseContent = `That's wonderful to hear! 🌟 Positive moments are worth savoring. What made today special? I'd love to celebrate with you and maybe identify what contributed to this feeling so we can create more of it.`;
    } else if (
      userContent.includes("help") &&
      userContent.includes("priorit")
    ) {
      const overdueTasks = tasks.filter(
        (t) =>
          t.dueDate &&
          t.dueDate < format(new Date(), "yyyy-MM-dd") &&
          t.status !== "completed",
      );
      responseContent = `Let's get your priorities sorted! Based on your tasks, here's what I recommend:\n\n**Urgent (do today):**\n${
        overdueTasks
          .slice(0, 3)
          .map((t) => `• ${t.title}`)
          .join("\n") || "• No overdue tasks! 🎉"
      }\n\n**Important (schedule time):**\n${
        tasks
          .filter((t) => t.priority === "high" && t.status !== "completed")
          .slice(0, 3)
          .map((t) => `• ${t.title}`)
          .join("\n") || "• No high-priority tasks"
      }\n\nWould you like me to help you time-block these?`;
    } else {
      responseContent = `Thank you for sharing that with me. I'm here to support you in any way I can. Based on what you've told me and your current state:\n\n• Mood: ${getMoodEmoji(userState.mood.value)} ${userState.mood.value}/10\n• Tasks: ${userState.tasks.pending} pending\n• Habits: ${userState.habits.streaksActive} active streaks\n\nHow can I best help you right now? We could:\n1. Talk through what's on your mind\n2. Create an action plan\n3. Do a quick mindfulness exercise`;
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
    setIsThinking(false);
  }, [input, currentSession, isThinking, userState, tasks]);

  // ── Generate insights ───────────────────────────────────────────────
  const insights = useMemo(() => {
    const list: {
      icon: string;
      text: string;
      type: "suggestion" | "warning" | "pattern" | "insight";
    }[] = [];

    if (userState.mood.value < 6 && userState.habits.streaksActive > 0) {
      list.push({
        icon: "📈",
        text: "Your mood tends to improve on days you exercise. Consider moving today.",
        type: "suggestion",
      });
    }

    if (userState.tasks.overdue > 2) {
      list.push({
        icon: "⚠️",
        text: `${userState.tasks.overdue} overdue tasks may be adding to your stress. Want help prioritizing?`,
        type: "warning",
      });
    }

    if (userState.habits.atRisk > 0) {
      list.push({
        icon: "🔥",
        text: `${userState.habits.atRisk} habit streaks at risk of breaking today. Don't lose your progress!`,
        type: "warning",
      });
    }

    list.push({
      icon: "💡",
      text: "Based on your patterns, 9-11 AM tends to be your peak focus time.",
      type: "insight",
    });

    if (userState.budget.percentUsed > 80) {
      list.push({
        icon: "💰",
        text: `Budget ${userState.budget.percentUsed}% used with ${userState.budget.daysRemaining} days left in the month.`,
        type: "warning",
      });
    }

    return list;
  }, [userState]);

  // ────────────────────────────────────────────────────────────────────
  // RENDER
  // ────────────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <div className="space-y-6 pb-24">
        {/* ── 1. Header ──────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Brain className="h-6 w-6 text-gray-600 dark:text-gray-400" />
              AI Coach
            </h1>
            <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
              Your personal mental health &amp; productivity companion
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <History className="h-4 w-4" />
              History
            </Button>
            <Button
              onClick={() => startNewSession("general")}
              className="gap-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900"
            >
              <Plus className="h-4 w-4" />
              New Session
            </Button>
          </div>
        </div>

        {/* ── 2. Your Current State Dashboard ────────────────────── */}
        <Card className="rounded-xl border bg-[var(--color-bg-secondary)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Your Current State
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Metrics grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Mood */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
                <span className="text-2xl">
                  {getMoodEmoji(userState.mood.value)}
                </span>
                <div>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    Mood
                  </p>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold">
                      {userState.mood.value}/10
                    </span>
                    {getTrendIcon(userState.mood.trend)}
                  </div>
                </div>
              </div>

              {/* Energy */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
                <span className="text-2xl">⚡</span>
                <div>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    Energy
                  </p>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold">
                      {userState.energy.value}/10
                    </span>
                    {getTrendIcon(userState.energy.trend)}
                  </div>
                </div>
              </div>

              {/* Stress */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
                <span className="text-2xl">📊</span>
                <div>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    Stress
                  </p>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold">
                      {userState.stress.value}/10
                    </span>
                    {getTrendIcon(userState.stress.trend)}
                  </div>
                </div>
              </div>

              {/* Sleep */}
              <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-bg-tertiary)]">
                <span className="text-2xl">🛏️</span>
                <div>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    Sleep
                  </p>
                  <span className="text-sm font-semibold">
                    {userState.sleep.avgHours}h avg
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span
                  className={userState.tasks.overdue > 0 ? "text-red-600" : ""}
                >
                  {userState.tasks.overdue > 0
                    ? `${userState.tasks.overdue} tasks overdue`
                    : `${userState.tasks.pending} tasks pending`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Flame
                  className={cn(
                    "h-4 w-4",
                    userState.habits.atRisk > 0
                      ? "text-orange-500"
                      : "text-green-500",
                  )}
                />
                <span>
                  {userState.habits.atRisk > 0
                    ? `${userState.habits.atRisk} habits at risk`
                    : `${userState.habits.streaksActive} active streaks`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span>
                  {userState.goals.struggling > 0
                    ? `${userState.goals.struggling} goals struggling`
                    : `${userState.goals.onTrack} goals on track`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span
                  className={
                    userState.budget.percentUsed > 90 ? "text-red-600" : ""
                  }
                >
                  Budget {userState.budget.percentUsed}% used
                </span>
              </div>
            </div>

            {/* AI Assessment Banner */}
            <div className="mt-4 p-4 rounded-lg bg-gray-100 dark:bg-gray-800">
              <p className="text-sm">
                <span className="font-bold">AI Assessment:</span> {aiAssessment}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* ── 3. Chat Area ───────────────────────────────────────── */}
        <Card className="rounded-xl border min-h-[500px] flex flex-col">
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[500px]">
              {!currentSession ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <Brain className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Ready to chat?</h3>
                  <p className="text-sm text-neutral-500 mb-6 max-w-md">
                    I&apos;m here to listen, support, and help you navigate
                    whatever you&apos;re going through. Start a session or
                    choose a quick action below.
                  </p>
                  <Button onClick={() => startNewSession("check-in")}>
                    Start Check-in
                  </Button>
                </div>
              ) : (
                <>
                  {currentSession.messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex",
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start",
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[80%] p-4 rounded-2xl",
                          message.role === "user"
                            ? "rounded-br-sm bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                            : "rounded-bl-sm bg-gray-100 dark:bg-neutral-800",
                        )}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">
                          {message.content}
                        </p>
                        <p
                          className={cn(
                            "text-xs mt-1",
                            message.role === "user"
                              ? "text-gray-300 dark:text-gray-700"
                              : "text-neutral-400",
                          )}
                        >
                          {format(new Date(message.timestamp), "h:mm a")}
                        </p>
                      </div>
                    </motion.div>
                  ))}

                  {/* Thinking indicator */}
                  {isThinking && (
                    <div className="flex items-center gap-2 text-neutral-500">
                      <motion.div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="w-2 h-2 bg-gray-500 rounded-full"
                            animate={{ y: [0, -8, 0] }}
                            transition={{
                              repeat: Infinity,
                              duration: 0.6,
                              delay: i * 0.2,
                            }}
                          />
                        ))}
                      </motion.div>
                      <span className="text-sm">Thinking...</span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input area */}
            {currentSession && (
              <div className="border-t border-neutral-200 dark:border-neutral-700 p-3">
                <div className="flex gap-2">
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !e.shiftKey && sendMessage()
                    }
                    placeholder="Share what's on your mind..."
                    className="flex-1"
                    disabled={isThinking}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!input.trim() || isThinking}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── 4. Quick Actions ───────────────────────────────────── */}
        <Card className="rounded-xl border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  onClick={() => {
                    if (action.type === "exercise") {
                      setIsBreathingExercise(true);
                    } else {
                      startNewSession(action.type);
                    }
                  }}
                  className="text-sm rounded-lg gap-2"
                >
                  <span>{action.emoji}</span>
                  {action.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ── 5. Insights & Patterns ─────────────────────────────── */}
        <Card className="rounded-xl border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Insights &amp; Patterns
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {insights.map((insight, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg text-sm border-l-[3px]",
                    insight.type === "warning" &&
                      "border-l-amber-500 bg-amber-50 dark:bg-amber-900/20",
                    insight.type === "suggestion" &&
                      "border-l-green-500 bg-green-50 dark:bg-green-900/20",
                    insight.type === "pattern" &&
                      "border-l-gray-500 bg-gray-100 dark:bg-gray-800",
                    insight.type === "insight" &&
                      "border-l-gray-500 bg-gray-100 dark:bg-gray-800",
                  )}
                >
                  <span className="text-lg">{insight.icon}</span>
                  <p>{insight.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 6. Breathing Exercise Modal ────────────────────────────── */}
      <BreathingExerciseModal
        open={isBreathingExercise}
        onClose={() => setIsBreathingExercise(false)}
      />
    </AppLayout>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// Breathing Exercise Modal
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
              <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                <Wind className="w-12 h-12 text-white" />
              </div>
              <p className="text-neutral-500 text-sm">
                This 4-7-8 breathing technique helps reduce anxiety and promote
                relaxation.
              </p>
              <Button onClick={() => setIsActive(true)} className="mt-4">
                Start Exercise
              </Button>
            </div>
          ) : (
            <>
              <motion.div
                className="w-32 h-32 mx-auto rounded-full bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center"
                animate={{
                  scale:
                    phase === "inhale" ? 1.3 : phase === "exhale" ? 0.8 : 1.1,
                }}
                transition={{
                  duration:
                    phase === "inhale" ? 4 : phase === "exhale" ? 8 : 0.5,
                }}
              >
                <span className="text-4xl font-bold text-white">{count}</span>
              </motion.div>

              <h2 className="text-2xl font-bold mt-8 capitalize">{phase}</h2>
              <p className="text-neutral-500 mt-2 text-sm">
                {phase === "inhale" && "Breathe in slowly through your nose"}
                {phase === "hold" && "Hold your breath gently"}
                {phase === "exhale" && "Release slowly through your mouth"}
              </p>

              <p className="mt-6 text-sm text-neutral-400">
                Completed cycles: {cycles}
              </p>
            </>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose} variant="outline" className="w-full">
            {isActive ? "End Exercise" : "Close"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
