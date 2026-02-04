"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { useApp } from "@/lib/context/app-context";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Flame,
  Target,
  Calendar,
  Brain,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Clock,
  Wallet,
  BookOpen,
  Zap,
  Activity,
  ChevronRight,
  Star,
  AlertTriangle,
  Sun,
  Moon,
  Sunrise,
  Heart,
  Play,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// Motivational quotes
const QUOTES = [
  {
    text: "The secret of getting ahead is getting started.",
    author: "Mark Twain",
  },
  { text: "Small steps lead to big changes.", author: "Unknown" },
  { text: "Your only limit is your mind.", author: "Unknown" },
  { text: "Progress, not perfection.", author: "Unknown" },
  { text: "Today's effort, tomorrow's success.", author: "Unknown" },
  { text: "Consistency beats intensity.", author: "Unknown" },
  { text: "You're doing better than you think.", author: "Unknown" },
  { text: "Every day is a fresh start.", author: "Unknown" },
];

export default function DashboardPage() {
  const {
    tasks,
    habits,
    goals,
    transactions,
    journalEntries,
    timeEntries,
    completeTask,
    completeHabit,
    getHabitStreak,
    getFinanceStats,
    getGoalStats,
    getTodayStats,
  } = useApp();

  const [mounted, setMounted] = useState(false);
  const [dailyQuote] = useState(
    () => QUOTES[Math.floor(Math.random() * QUOTES.length)],
  );

  const today = format(new Date(), "yyyy-MM-dd");
  const now = new Date();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Get greeting based on time
  const getGreeting = () => {
    const hour = now.getHours();
    if (hour < 5)
      return {
        text: "Good night",
        icon: Moon,
        subtext: "Burning the midnight oil?",
      };
    if (hour < 12)
      return {
        text: "Good morning",
        icon: Sunrise,
        subtext: "Let's make today count",
      };
    if (hour < 17)
      return {
        text: "Good afternoon",
        icon: Sun,
        subtext: "Keep the momentum going",
      };
    if (hour < 21)
      return {
        text: "Good evening",
        icon: Sun,
        subtext: "Winding down the day",
      };
    return { text: "Good night", icon: Moon, subtext: "Rest well, champion" };
  };

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;

  // Calculate comprehensive stats
  const stats = useMemo(() => {
    const pendingTasks = tasks.filter((t) => t.status !== "completed");
    const completedToday = tasks.filter(
      (t) => t.status === "completed" && t.completedAt?.startsWith(today),
    ).length;
    const overdueTasks = pendingTasks.filter(
      (t) => t.dueDate && t.dueDate < today,
    ).length;
    const todayTasks = pendingTasks.filter((t) => t.dueDate === today);

    const activeHabits = habits.filter((h) => h.active !== false);
    const habitsCompletedToday = activeHabits.filter((h) =>
      h.completions?.some((c) => c.date === today && c.completed),
    ).length;

    // Calculate total streak days
    const totalStreakDays = activeHabits.reduce(
      (sum, h) => sum + getHabitStreak(h.id),
      0,
    );

    // Finance stats
    const financeStats = getFinanceStats();

    // Goal stats
    const goalStats = getGoalStats();

    // Time tracking stats
    const todayTimeStats = getTodayStats();

    // Recent journal mood
    const recentJournals = journalEntries.slice(0, 7);
    const avgMood =
      recentJournals.length > 0
        ? recentJournals.reduce((sum, j) => sum + (j.mood || 3), 0) /
          recentJournals.length
        : 3;

    // Calculate productivity score (0-100)
    const taskScore =
      todayTasks.length > 0
        ? (completedToday / (completedToday + todayTasks.length)) * 100
        : completedToday > 0
          ? 100
          : 50;
    const habitScore =
      activeHabits.length > 0
        ? (habitsCompletedToday / activeHabits.length) * 100
        : 50;
    const goalScore = goalStats.total > 0 ? goalStats.avgProgress : 50;
    const productivityScore = Math.round(
      taskScore * 0.4 + habitScore * 0.4 + goalScore * 0.2,
    );

    return {
      pendingTasks: pendingTasks.length,
      completedToday,
      overdueTasks,
      todayTasksCount: todayTasks.length,
      activeHabits: activeHabits.length,
      habitsCompletedToday,
      totalStreakDays,
      financeBalance: financeStats.balance,
      monthlyExpenses: financeStats.expenses,
      goalStats,
      todayMinutes: todayTimeStats.totalMinutes,
      deepFocusMinutes: todayTimeStats.deepFocus,
      avgMood,
      productivityScore,
    };
  }, [
    tasks,
    habits,
    goals,
    transactions,
    journalEntries,
    timeEntries,
    today,
    getHabitStreak,
    getFinanceStats,
    getGoalStats,
    getTodayStats,
  ]);

  // Get top priority tasks for today
  const priorityTasks = useMemo(() => {
    return tasks
      .filter((t) => t.status !== "completed")
      .sort((a, b) => {
        const aOverdue = a.dueDate && a.dueDate < today ? -3 : 0;
        const bOverdue = b.dueDate && b.dueDate < today ? -3 : 0;
        const aDueToday = a.dueDate === today ? -2 : 0;
        const bDueToday = b.dueDate === today ? -2 : 0;
        const priorityOrder: Record<string, number> = {
          critical: 0,
          high: 1,
          medium: 2,
          low: 3,
        };
        return (
          aOverdue - bOverdue ||
          aDueToday - bDueToday ||
          (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2)
        );
      })
      .slice(0, 5);
  }, [tasks, today]);

  // Get today's habits with streaks
  const todaysHabits = useMemo(() => {
    return habits
      .filter((h) => h.active !== false)
      .map((h) => ({
        ...h,
        streak: getHabitStreak(h.id),
        isCompleted:
          h.completions?.some((c) => c.date === today && c.completed) ?? false,
      }))
      .sort((a, b) =>
        a.isCompleted === b.isCompleted
          ? b.streak - a.streak
          : a.isCompleted
            ? 1
            : -1,
      )
      .slice(0, 5);
  }, [habits, today, getHabitStreak]);

  // Get active goals
  const activeGoals = useMemo(() => {
    return goals
      .filter((g) => g.status !== "completed" && g.status !== "abandoned")
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 4);
  }, [goals]);

  // AI Insights based on current state
  const aiInsights = useMemo(() => {
    const insights: {
      type: "warning" | "success" | "info" | "tip";
      message: string;
      icon: typeof AlertTriangle;
    }[] = [];

    if (stats.overdueTasks > 0) {
      insights.push({
        type: "warning",
        message: `You have ${stats.overdueTasks} overdue task${stats.overdueTasks > 1 ? "s" : ""}. Consider rescheduling or prioritizing.`,
        icon: AlertTriangle,
      });
    }

    if (
      stats.habitsCompletedToday === stats.activeHabits &&
      stats.activeHabits > 0
    ) {
      insights.push({
        type: "success",
        message:
          "Amazing! All habits completed for today. You're building great consistency! 🔥",
        icon: Flame,
      });
    } else if (stats.habitsCompletedToday === 0 && stats.activeHabits > 0) {
      insights.push({
        type: "tip",
        message: "Start with your easiest habit to build momentum today.",
        icon: Zap,
      });
    }

    if (stats.totalStreakDays > 20) {
      insights.push({
        type: "success",
        message: `Impressive! ${stats.totalStreakDays} total streak days across your habits.`,
        icon: Star,
      });
    }

    if (stats.productivityScore >= 80) {
      insights.push({
        type: "success",
        message: "You're in the productivity zone! Keep this momentum going.",
        icon: TrendingUp,
      });
    } else if (stats.productivityScore < 40) {
      insights.push({
        type: "tip",
        message:
          "Focus on completing just one important task to gain momentum.",
        icon: Target,
      });
    }

    if (stats.avgMood < 2.5 && journalEntries.length > 0) {
      insights.push({
        type: "info",
        message:
          "Your recent mood has been low. Consider taking a break or talking to someone.",
        icon: Heart,
      });
    }

    return insights.slice(0, 3);
  }, [stats, journalEntries.length]);

  // Handle task completion
  const handleCompleteTask = (taskId: string) => {
    completeTask(taskId);
  };

  // Handle habit completion
  const handleCompleteHabit = (habitId: string) => {
    completeHabit(habitId, today);
  };

  if (!mounted) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
            {getGreeting()}
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <div className="text-2xl font-semibold text-neutral-900 dark:text-white">
              {stats.pendingTasks}
            </div>
            <div className="text-xs text-neutral-500 mt-1">Tasks pending</div>
          </div>
          <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <div className="text-2xl font-semibold text-green-600 dark:text-green-400">
              {stats.completedToday}
            </div>
            <div className="text-xs text-neutral-500 mt-1">Done today</div>
          </div>
          <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <div className="text-2xl font-semibold text-neutral-900 dark:text-white">
              {stats.habitsCompletedToday}/{stats.activeHabits}
            </div>
            <div className="text-xs text-neutral-500 mt-1">Habits today</div>
          </div>
          {stats.overdueTasks > 0 ? (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
              <div className="text-2xl font-semibold text-red-600 dark:text-red-400">
                {stats.overdueTasks}
              </div>
              <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                Overdue
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
              <div className="text-2xl font-semibold text-green-600 dark:text-green-400">
                ✓
              </div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                On track
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Tasks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-neutral-900 dark:text-white">
                Focus today
              </h2>
              <Link
                href="/tasks"
                className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1"
              >
                All tasks <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-1">
              {priorityTasks.length > 0 ? (
                priorityTasks.map((task) => {
                  const isOverdue = task.dueDate && task.dueDate < today;
                  const isDueToday = task.dueDate === today;
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                    >
                      <Circle className="w-4 h-4 text-neutral-300 dark:text-neutral-600 flex-shrink-0" />
                      <span className="flex-1 text-sm text-neutral-700 dark:text-neutral-300 truncate">
                        {task.title}
                      </span>
                      {(isOverdue || isDueToday) && (
                        <span
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded",
                            isOverdue
                              ? "text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400"
                              : "text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400",
                          )}
                        >
                          {isOverdue ? "Overdue" : "Today"}
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-neutral-400 text-sm">
                  No pending tasks
                </div>
              )}
            </div>
          </div>

          {/* Today's Habits */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-neutral-900 dark:text-white">
                Habits
              </h2>
              <Link
                href="/habits"
                className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1"
              >
                All habits <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-1">
              {todaysHabits.length > 0 ? (
                todaysHabits.map((habit) => (
                  <div
                    key={habit.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg transition-colors",
                      habit.isCompleted
                        ? "bg-green-50 dark:bg-green-950/20"
                        : "hover:bg-neutral-50 dark:hover:bg-neutral-900",
                    )}
                  >
                    {habit.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-neutral-300 dark:text-neutral-600 flex-shrink-0" />
                    )}
                    <span
                      className={cn(
                        "flex-1 text-sm truncate",
                        habit.isCompleted
                          ? "text-green-700 dark:text-green-400"
                          : "text-neutral-700 dark:text-neutral-300",
                      )}
                    >
                      {habit.name}
                    </span>
                    {habit.streak > 0 && (
                      <span className="text-xs text-orange-500 flex items-center gap-0.5">
                        <Flame className="w-3 h-3" />
                        {habit.streak}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-neutral-400 text-sm">
                  No habits set up
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-neutral-100 dark:border-neutral-800">
          {[
            { href: "/goals", label: "Goals" },
            { href: "/time", label: "Time tracking" },
            { href: "/journal", label: "Journal" },
            { href: "/insights", label: "AI Insights" },
            { href: "/finance", label: "Finance" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
