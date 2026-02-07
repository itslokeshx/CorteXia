"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { useApp } from "@/lib/context/app-context";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import {
  CheckCircle2,
  ArrowRight,
  Flame,
  Target,
  Calendar,
  Brain,
  Sparkles,
  Wallet,
  ChevronRight,
  Plus,
  Timer,
  Play,
  PenLine,
  DollarSign,
  StickyNote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function DashboardPage() {
  const router = useRouter();
  const {
    tasks,
    habits,
    addTask,
    addTransaction,
    addJournalEntry,
    updateJournalEntry,
    journalEntries,
    completeTask,
    uncompleteTask,
    completeHabit,
    getHabitStreak,
    getFinanceStats,
    getTodayStats,
  } = useApp();

  const [mounted, setMounted] = useState(false);
  const today = format(new Date(), "yyyy-MM-dd");
  const now = new Date();

  // Quick add modals
  const [showQuickTask, setShowQuickTask] = useState(false);
  const [showQuickExpense, setShowQuickExpense] = useState(false);
  const [showQuickNote, setShowQuickNote] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const [quickTaskPriority, setQuickTaskPriority] = useState<
    "medium" | "high" | "critical"
  >("high");
  const [quickExpenseDesc, setQuickExpenseDesc] = useState("");
  const [quickExpenseAmount, setQuickExpenseAmount] = useState("");
  const [quickExpenseCat, setQuickExpenseCat] = useState("food");
  const [quickNote, setQuickNote] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // ═══ TODAY'S TASKS - PRIORITY FILTERED ═══
  const todayTasks = useMemo(() => {
    const pending = tasks.filter((t) => {
      if (t.status === "completed") return false;
      // Today's tasks, overdue tasks, or high priority
      return (
        t.dueDate === today ||
        (t.dueDate && t.dueDate < today) ||
        t.priority === "high" ||
        t.priority === "critical"
      );
    });

    return pending
      .sort((a, b) => {
        const priorityOrder: Record<string, number> = {
          critical: 0,
          high: 1,
          medium: 2,
          low: 3,
        };
        // First by priority
        const pDiff =
          (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
        if (pDiff !== 0) return pDiff;
        // Then by due date
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return 0;
      })
      .slice(0, 8);
  }, [tasks, today]);

  // ═══ TODAY'S HABITS ═══
  const todayHabits = useMemo(() => {
    return habits
      .filter((h) => h.active !== false)
      .map((h) => ({
        ...h,
        completed:
          h.completions?.some((c) => c.date === today && c.completed) || false,
        streak: getHabitStreak(h.id),
      }))
      .sort((a, b) =>
        a.completed === b.completed
          ? b.streak - a.streak
          : a.completed
            ? 1
            : -1,
      )
      .slice(0, 6);
  }, [habits, today, getHabitStreak]);

  // ═══ STATS ═══
  const stats = useMemo(() => {
    const completedToday = tasks.filter(
      (t) => t.status === "completed" && t.completedAt?.startsWith(today),
    ).length;
    const totalToday = todayTasks.length + completedToday;
    const habitsCompleted = todayHabits.filter((h) => h.completed).length;
    const habitsTotal = todayHabits.length;
    const overdue = tasks.filter(
      (t) => t.status !== "completed" && t.dueDate && t.dueDate < today,
    ).length;
    const timeStats = getTodayStats();
    const financeStats = getFinanceStats();

    const taskProgress =
      totalToday > 0 ? (completedToday / totalToday) * 100 : 0;
    const habitProgress =
      habitsTotal > 0 ? (habitsCompleted / habitsTotal) * 100 : 0;

    return {
      completedToday,
      totalToday,
      taskProgress,
      habitsCompleted,
      habitsTotal,
      habitProgress,
      overdue,
      focusMinutes: timeStats.totalMinutes,
      balance: financeStats.balance,
    };
  }, [tasks, todayTasks, todayHabits, today, getTodayStats, getFinanceStats]);

  // ═══ AI INSIGHTS ═══
  const aiInsights = useMemo(() => {
    const insights: Array<{
      type: "success" | "warning" | "info" | "tip";
      title: string;
      description: string;
      action?: { label: string; href: string };
    }> = [];

    // Morning motivation
    const hour = now.getHours();
    if (hour >= 5 && hour < 9 && stats.completedToday === 0) {
      insights.push({
        type: "tip",
        title: "Start with momentum",
        description:
          "Complete your first task within the next hour to set a productive tone for the day.",
        action: { label: "View tasks", href: "/tasks" },
      });
    }

    // Overdue alert
    if (stats.overdue > 0) {
      insights.push({
        type: "warning",
        title: `${stats.overdue} task${stats.overdue > 1 ? "s" : ""} overdue`,
        description:
          "These tasks are past their due date. Consider rescheduling or completing them first.",
        action: { label: "Review tasks", href: "/tasks" },
      });
    }

    // Habit celebration
    if (stats.habitsCompleted === stats.habitsTotal && stats.habitsTotal > 0) {
      insights.push({
        type: "success",
        title: "Perfect habit day! 🔥",
        description:
          "All habits completed. You're building incredible consistency.",
      });
    } else if (
      stats.habitsCompleted > 0 &&
      stats.habitsCompleted < stats.habitsTotal
    ) {
      const remaining = stats.habitsTotal - stats.habitsCompleted;
      insights.push({
        type: "info",
        title: `${remaining} habit${remaining > 1 ? "s" : ""} remaining`,
        description:
          "You're making progress! Complete the rest to maintain your streak.",
        action: { label: "View habits", href: "/habits" },
      });
    }

    // Task completion
    if (stats.taskProgress >= 100 && stats.totalToday > 0) {
      insights.push({
        type: "success",
        title: "All tasks completed! 🎉",
        description:
          "You've cleared your priority list. Time to relax or tackle bonus work.",
      });
    } else if (stats.taskProgress >= 70) {
      insights.push({
        type: "info",
        title: "You're crushing it!",
        description: `${Math.round(stats.taskProgress)}% of tasks done. Keep the momentum going.`,
      });
    }

    // Focus time
    if (hour >= 9 && hour < 17 && stats.focusMinutes < 30) {
      insights.push({
        type: "tip",
        title: "Time for deep work",
        description:
          "You haven't logged much focus time today. Consider a 25-minute Pomodoro session.",
        action: { label: "Start timer", href: "/time-tracker" },
      });
    }

    // Evening reflection
    if (hour >= 18 && stats.completedToday > 0) {
      insights.push({
        type: "info",
        title: "Journal your day",
        description: "Reflect on today's wins and learnings before bed.",
        action: { label: "Write entry", href: "/journal" },
      });
    }

    return insights.slice(0, 3);
  }, [stats, now, today]);

  // Quick add handlers
  const handleQuickTask = () => {
    if (!quickTaskTitle.trim()) return;
    addTask({
      title: quickTaskTitle.trim(),
      domain: "personal",
      priority: quickTaskPriority,
      status: "todo",
      dueDate: today,
      scheduledFor: "today",
    });
    setQuickTaskTitle("");
    setShowQuickTask(false);
  };

  const handleQuickExpense = () => {
    const amount = parseFloat(quickExpenseAmount);
    if (!quickExpenseDesc.trim() || isNaN(amount) || amount <= 0) return;
    addTransaction({
      description: quickExpenseDesc.trim(),
      amount: -Math.abs(amount),
      category: quickExpenseCat as any,
      type: "expense",
      date: today,
    });
    setQuickExpenseDesc("");
    setQuickExpenseAmount("");
    setShowQuickExpense(false);
  };

  const handleQuickNote = () => {
    if (!quickNote.trim()) return;
    // Find today's journal entry or create one
    const todayEntry = journalEntries.find((j) => j.date === today);
    if (todayEntry) {
      // Append note to existing entry
      const separator = todayEntry.content ? "\n\n" : "";
      const timestamp = format(new Date(), "h:mm a");
      updateJournalEntry(todayEntry.id, {
        content: `${todayEntry.content}${separator}📝 [${timestamp}] ${quickNote.trim()}`,
      });
    } else {
      // Create new journal entry for today
      const timestamp = format(new Date(), "h:mm a");
      addJournalEntry({
        date: today,
        title: format(new Date(), "EEEE, MMMM d"),
        content: `📝 [${timestamp}] ${quickNote.trim()}`,
        mood: 6,
        energy: 6,
        focus: 6,
        tags: ["quick-note"],
      });
    }
    setQuickNote("");
    setShowQuickNote(false);
  };

  const toggleTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    if (task.status === "completed") {
      uncompleteTask(taskId);
    } else {
      completeTask(taskId);
    }
  };

  if (!mounted) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div>
            <Brain className="w-10 h-10 text-gray-400" />
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 pb-16 max-w-5xl mx-auto">
        {/* ═══ HEADER ═══ */}
        <motion.div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
              {now.getHours() < 12
                ? "Good morning"
                : now.getHours() < 18
                  ? "Good afternoon"
                  : "Good evening"}
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              {format(now, "EEEE, MMMM d, yyyy")}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowQuickTask(true)}
              size="sm"
              className="gap-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900"
            >
              <Plus className="w-4 h-4" />
              Quick Add
            </Button>
          </div>
        </motion.div>

        {/* ═══ PROGRESS OVERVIEW ═══ */}
        <motion.div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-xs text-[var(--color-text-tertiary)]">
                Tasks
              </span>
            </div>
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
              {stats.completedToday}/{stats.totalToday}
            </p>
            <Progress value={stats.taskProgress} className="h-1 mt-2" />
          </div>

          <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-xs text-[var(--color-text-tertiary)]">
                Habits
              </span>
            </div>
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
              {stats.habitsCompleted}/{stats.habitsTotal}
            </p>
            <Progress value={stats.habitProgress} className="h-1 mt-2" />
          </div>

          <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
            <div className="flex items-center gap-2 mb-2">
              <Timer className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-xs text-[var(--color-text-tertiary)]">
                Focus Time
              </span>
            </div>
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
              {stats.focusMinutes}m
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
              {stats.focusMinutes >= 120 ? "Excellent!" : "Keep going"}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              <span className="text-xs text-[var(--color-text-tertiary)]">
                Balance
              </span>
            </div>
            <p className="text-2xl font-bold text-[var(--color-text-primary)]">
              ${Math.abs(stats.balance).toFixed(0)}
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
              {stats.balance >= 0 ? "Positive" : "Negative"}
            </p>
          </div>
        </motion.div>

        {/* ═══ TODAY'S PRIORITIES - TASKS ═══ */}
        <motion.div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Today's Priorities
              </h2>
              <Badge variant="secondary" className="text-xs">
                {todayTasks.length}
              </Badge>
            </div>
            <Link
              href="/tasks"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-1"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-2">
            {todayTasks.length > 0 ? (
              todayTasks.map((task, i) => {
                const isOverdue = task.dueDate && task.dueDate < today;
                const isDone = task.status === "completed";
                const priorityConfig = {
                  critical: {
                    color:
                      "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
                    label: "Critical",
                  },
                  high: {
                    color:
                      "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
                    label: "High",
                  },
                  medium: {
                    color:
                      "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
                    label: "Med",
                  },
                  low: {
                    color:
                      "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
                    label: "Low",
                  },
                }[task.priority] || {
                  color:
                    "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300",
                  label: "Med",
                };

                return (
                  <motion.div
                    key={task.id}
                    layout
                    className="group flex items-center gap-3 p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-gray-300 dark:hover:border-gray-600 transition-all"
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleTask(task.id)}
                      className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all",
                        isDone
                          ? "bg-green-500 border-green-500"
                          : "border-gray-300 dark:border-gray-600 hover:border-gray-500",
                      )}
                    >
                      {isDone && (
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      )}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={cn(
                          "text-sm font-medium break-words",
                          isDone
                            ? "text-gray-400 line-through"
                            : "text-[var(--color-text-primary)]",
                        )}
                      >
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge
                          className={cn(
                            "text-[10px] h-5",
                            priorityConfig.color,
                          )}
                        >
                          {priorityConfig.label}
                        </Badge>
                        {task.dueDate && (
                          <span
                            className={cn(
                              "text-xs",
                              isOverdue
                                ? "text-red-500 font-medium"
                                : "text-[var(--color-text-tertiary)]",
                            )}
                          >
                            {isOverdue
                              ? "Overdue"
                              : task.dueDate === today
                                ? "Today"
                                : format(parseISO(task.dueDate), "MMM d")}
                          </span>
                        )}
                        {task.timeEstimate && (
                          <span className="text-xs text-[var(--color-text-tertiary)]">
                            • {task.timeEstimate}m
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!isDone && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() =>
                            router.push(`/time-tracker?taskId=${task.id}`)
                          }
                        >
                          <Play className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-12 rounded-xl bg-[var(--color-bg-secondary)] border border-dashed border-[var(--color-border)]">
                <CheckCircle2 className="w-12 h-12 mx-auto text-green-500 mb-3" />
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  All clear! 🎉
                </p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                  No priority tasks for today
                </p>
                <Button
                  onClick={() => setShowQuickTask(true)}
                  size="sm"
                  variant="outline"
                  className="mt-4 gap-2"
                >
                  <Plus className="w-3 h-3" />
                  Add Task
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {/* ═══ TODAY'S HABITS ═══ */}
        {todayHabits.length > 0 && (
          <motion.div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  Today's Habits
                </h2>
              </div>
              <Link
                href="/habits"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 flex items-center gap-1"
              >
                View all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {todayHabits.map((habit, i) => (
                <motion.button
                  key={habit.id}
                  onClick={() => completeHabit(habit.id, today)}
                  disabled={habit.completed}
                  className={cn(
                    "p-4 rounded-xl border text-left transition-all",
                    habit.completed
                      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                      : "bg-[var(--color-bg-secondary)] border-[var(--color-border)] hover:border-gray-300 dark:hover:border-gray-600",
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={cn(
                        "text-xs font-medium px-2 py-0.5 rounded-full",
                        habit.completed
                          ? "bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
                      )}
                    >
                      {habit.completed ? "Done" : "Pending"}
                    </span>
                    {habit.streak > 0 && (
                      <div className="flex items-center gap-1">
                        <Flame className="w-3 h-3 text-orange-500" />
                        <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                          {habit.streak}
                        </span>
                      </div>
                    )}
                  </div>
                  <p
                    className={cn(
                      "text-sm font-medium break-words",
                      habit.completed
                        ? "text-gray-600 dark:text-gray-400"
                        : "text-[var(--color-text-primary)]",
                    )}
                  >
                    {habit.name}
                  </p>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ═══ QUICK ACTIONS ═══ */}
        <motion.div className="space-y-3">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                icon: Plus,
                label: "Add Task",
                onClick: () => setShowQuickTask(true),
              },
              {
                icon: DollarSign,
                label: "Log Expense",
                onClick: () => setShowQuickExpense(true),
              },
              {
                icon: Play,
                label: "Start Focus",
                onClick: () => router.push("/time-tracker"),
              },
              {
                icon: PenLine,
                label: "Journal",
                onClick: () => router.push("/journal"),
              },
              {
                icon: Calendar,
                label: "Plan Day",
                onClick: () => router.push("/day-planner"),
              },
              {
                icon: Brain,
                label: "AI Coach",
                onClick: () => router.push("/ai-coach"),
              },
              {
                icon: Target,
                label: "Goals",
                onClick: () => router.push("/goals"),
              },
              {
                icon: StickyNote,
                label: "Quick Note",
                onClick: () => setShowQuickNote(true),
              },
            ].map((action, i) => (
              <motion.button
                key={action.label}
                onClick={action.onClick}
                className="p-4 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm transition-all text-center group"
              >
                <action.icon className="w-5 h-5 mx-auto mb-2 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors" />
                <p className="text-xs font-medium text-[var(--color-text-primary)]">
                  {action.label}
                </p>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* ═══ AI INSIGHTS ═══ */}
        {aiInsights.length > 0 && (
          <motion.div className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                AI Insights
              </h2>
            </div>
            <div className="grid gap-3">
              {aiInsights.map((insight, i) => {
                const config = {
                  success: {
                    bg: "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
                    border: "border-green-200 dark:border-green-800",
                    icon: "🎉",
                  },
                  warning: {
                    bg: "bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20",
                    border: "border-amber-200 dark:border-amber-800",
                    icon: "⚠️",
                  },
                  info: {
                    bg: "bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20",
                    border: "border-blue-200 dark:border-blue-800",
                    icon: "💡",
                  },
                  tip: {
                    bg: "bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20",
                    border: "border-purple-200 dark:border-purple-800",
                    icon: "✨",
                  },
                }[insight.type];

                return (
                  <motion.div
                    key={i}
                    className={cn(
                      "p-4 rounded-xl border flex items-start justify-between gap-4",
                      config.bg,
                      config.border,
                    )}
                  >
                    <div className="flex items-start gap-3 flex-1">
                      <span className="text-2xl">{config.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-semibold text-[var(--color-text-primary)] mb-1">
                          {insight.title}
                        </h3>
                        <p className="text-sm text-[var(--color-text-secondary)] break-words">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                    {insight.action && (
                      <Link href={insight.action.href}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2 flex-shrink-0"
                        >
                          {insight.action.label}
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </Link>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Quick Add Task Modal */}
        <Dialog open={showQuickTask} onOpenChange={setShowQuickTask}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Quick Add Task</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="What needs to be done?"
                value={quickTaskTitle}
                onChange={(e) => setQuickTaskTitle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleQuickTask()}
                autoFocus
                className="text-sm"
              />
              <Select
                value={quickTaskPriority}
                onValueChange={(v: any) => setQuickTaskPriority(v)}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">🔴 Critical</SelectItem>
                  <SelectItem value="high">🟠 High</SelectItem>
                  <SelectItem value="medium">🟡 Medium</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowQuickTask(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleQuickTask}
                disabled={!quickTaskTitle.trim()}
              >
                Add Task
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Quick Add Expense Modal */}
        <Dialog open={showQuickExpense} onOpenChange={setShowQuickExpense}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Quick Log Expense</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="What did you buy?"
                value={quickExpenseDesc}
                onChange={(e) => setQuickExpenseDesc(e.target.value)}
                className="text-sm"
              />
              <Input
                type="number"
                placeholder="Amount"
                value={quickExpenseAmount}
                onChange={(e) => setQuickExpenseAmount(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleQuickExpense()}
                className="text-sm"
              />
              <Select
                value={quickExpenseCat}
                onValueChange={setQuickExpenseCat}
              >
                <SelectTrigger className="text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">🍔 Food</SelectItem>
                  <SelectItem value="transport">🚗 Transport</SelectItem>
                  <SelectItem value="entertainment">
                    🎬 Entertainment
                  </SelectItem>
                  <SelectItem value="health">❤️ Health</SelectItem>
                  <SelectItem value="shopping">🛍️ Shopping</SelectItem>
                  <SelectItem value="utilities">⚡ Utilities</SelectItem>
                  <SelectItem value="other">📦 Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowQuickExpense(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleQuickExpense}
                disabled={!quickExpenseDesc.trim() || !quickExpenseAmount}
              >
                Log Expense
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Quick Note Modal */}
        <Dialog open={showQuickNote} onOpenChange={setShowQuickNote}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Quick Note</DialogTitle>
            </DialogHeader>
            <div className="space-y-2 py-4">
              <p className="text-xs text-[var(--color-text-tertiary)]">
                This note will be saved to today's journal entry.
              </p>
              <textarea
                placeholder="What's on your mind?"
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.metaKey) handleQuickNote();
                }}
                className="flex w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm placeholder:text-[var(--color-text-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500/40 focus-visible:ring-offset-0 min-h-[120px] resize-none"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowQuickNote(false)}>
                Cancel
              </Button>
              <Button onClick={handleQuickNote} disabled={!quickNote.trim()}>
                Save Note
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
