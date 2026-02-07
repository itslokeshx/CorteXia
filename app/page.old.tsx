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
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-8 pb-12"
      >
        {/* Hero Section */}
        <motion.div variants={itemVariants} className="relative">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                <GreetingIcon className="h-6 w-6 text-violet-500" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
                  {greeting.text}
                </h1>
                <p className="text-neutral-500 text-sm">
                  {format(now, "EEEE, MMMM d")} • {greeting.subtext}
                </p>
              </div>
            </div>

            {/* Productivity Score */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20">
              <div className="relative h-10 w-10">
                <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-neutral-200 dark:text-neutral-700"
                  />
                  <motion.circle
                    cx="18"
                    cy="18"
                    r="15.5"
                    fill="none"
                    stroke="url(#scoreGradient)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeDasharray={`${stats.productivityScore * 0.97} 100`}
                    initial={{ strokeDasharray: "0 100" }}
                    animate={{
                      strokeDasharray: `${stats.productivityScore * 0.97} 100`,
                    }}
                    transition={{ duration: 1, ease: "easeOut" }}
                  />
                  <defs>
                    <linearGradient
                      id="scoreGradient"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="0%"
                    >
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#a855f7" />
                    </linearGradient>
                  </defs>
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold">
                  {stats.productivityScore}
                </span>
              </div>
              <div>
                <div className="text-xs font-medium text-violet-600 dark:text-violet-400">
                  Productivity
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Score Today
                </div>
              </div>
            </div>
          </div>

          {/* Motivational Quote */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/20"
          >
            <p className="text-sm italic text-amber-700 dark:text-amber-400">
              "{dailyQuote.text}"
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              — {dailyQuote.author}
            </p>
          </motion.div>
        </motion.div>

        {/* Quick Stats Grid */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          <Link href="/tasks" className="group">
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-violet-500/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-blue-500" />
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:text-violet-500 transition-colors" />
              </div>
              <div className="text-2xl font-semibold text-neutral-900 dark:text-white">
                {stats.completedToday}
                <span className="text-sm text-muted-foreground font-normal">
                  /{stats.todayTasksCount + stats.completedToday}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Tasks done today
              </div>
            </div>
          </Link>

          <Link href="/habits" className="group">
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-violet-500/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <Flame className="h-4 w-4 text-orange-500" />
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:text-violet-500 transition-colors" />
              </div>
              <div className="text-2xl font-semibold text-neutral-900 dark:text-white">
                {stats.habitsCompletedToday}
                <span className="text-sm text-muted-foreground font-normal">
                  /{stats.activeHabits}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">
                Habits completed
              </div>
            </div>
          </Link>

          <Link href="/goals" className="group">
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-violet-500/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Target className="h-4 w-4 text-green-500" />
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:text-violet-500 transition-colors" />
              </div>
              <div className="text-2xl font-semibold text-neutral-900 dark:text-white">
                {stats.goalStats.avgProgress}%
              </div>
              <div className="text-xs text-muted-foreground">
                Avg. goal progress
              </div>
            </div>
          </Link>

          <Link href="/finance" className="group">
            <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-violet-500/50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Wallet className="h-4 w-4 text-emerald-500" />
                </div>
                <ChevronRight className="h-4 w-4 text-neutral-400 group-hover:text-violet-500 transition-colors" />
              </div>
              <div className="text-2xl font-semibold text-neutral-900 dark:text-white">
                ${stats.financeBalance.toFixed(0)}
              </div>
              <div className="text-xs text-muted-foreground">Balance</div>
            </div>
          </Link>
        </motion.div>

        {/* AI Insights Strip */}
        {aiInsights.length > 0 && (
          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-2 mb-3">
              <Brain className="h-4 w-4 text-violet-500" />
              <h2 className="text-sm font-medium text-neutral-900 dark:text-white">
                AI Insights
              </h2>
            </div>
            <div className="space-y-2">
              {aiInsights.map((insight, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * i }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border",
                    insight.type === "warning" &&
                      "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800",
                    insight.type === "success" &&
                      "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800",
                    insight.type === "info" &&
                      "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
                    insight.type === "tip" &&
                      "bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800",
                  )}
                >
                  <insight.icon
                    className={cn(
                      "h-4 w-4 flex-shrink-0",
                      insight.type === "warning" && "text-amber-500",
                      insight.type === "success" && "text-green-500",
                      insight.type === "info" && "text-blue-500",
                      insight.type === "tip" && "text-violet-500",
                    )}
                  />
                  <p className="text-sm text-neutral-700 dark:text-neutral-300">
                    {insight.message}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Tasks */}
          <motion.div variants={itemVariants} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-blue-500" />
                <h2 className="text-sm font-medium text-neutral-900 dark:text-white">
                  Focus Today
                </h2>
              </div>
              <Link
                href="/tasks"
                className="text-xs text-violet-500 hover:text-violet-600 flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2">
              {priorityTasks.length > 0 ? (
                priorityTasks.map((task, index) => {
                  const isOverdue = task.dueDate && task.dueDate < today;
                  const isDueToday = task.dueDate === today;
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-violet-500/50 transition-all group"
                    >
                      <button
                        onClick={() => handleCompleteTask(task.id)}
                        className="flex-shrink-0 h-5 w-5 rounded-full border-2 border-neutral-300 dark:border-neutral-600 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/50 transition-colors flex items-center justify-center group/btn"
                      >
                        <CheckCircle2 className="h-3 w-3 text-transparent group-hover/btn:text-green-500" />
                      </button>
                      <span className="flex-1 text-sm text-neutral-700 dark:text-neutral-300 truncate">
                        {task.title}
                      </span>
                      <div className="flex items-center gap-2">
                        {task.priority === "high" ||
                        task.priority === "critical" ? (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                          >
                            {task.priority === "critical" ? "Critical" : "High"}
                          </Badge>
                        ) : null}
                        {isOverdue && (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                          >
                            Overdue
                          </Badge>
                        )}
                        {isDueToday && !isOverdue && (
                          <Badge
                            variant="outline"
                            className="text-[10px] bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                          >
                            Today
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              ) : (
                <div className="text-center py-8 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-dashed border-neutral-200 dark:border-neutral-800">
                  <CheckCircle2 className="h-8 w-8 mx-auto text-green-500 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    All caught up! 🎉
                  </p>
                  <Link href="/tasks">
                    <Button variant="link" size="sm" className="mt-2">
                      <Plus className="h-3 w-3 mr-1" />
                      Add new task
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>

          {/* Today's Habits */}
          <motion.div variants={itemVariants} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <h2 className="text-sm font-medium text-neutral-900 dark:text-white">
                  Habits
                </h2>
                {stats.totalStreakDays > 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    🔥 {stats.totalStreakDays} streak days
                  </Badge>
                )}
              </div>
              <Link
                href="/habits"
                className="text-xs text-violet-500 hover:text-violet-600 flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="space-y-2">
              {todaysHabits.length > 0 ? (
                todaysHabits.map((habit, index) => (
                  <motion.div
                    key={habit.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border transition-all",
                      habit.isCompleted
                        ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                        : "bg-neutral-50 dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-violet-500/50",
                    )}
                  >
                    <button
                      onClick={() => handleCompleteHabit(habit.id)}
                      className={cn(
                        "flex-shrink-0 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-colors",
                        habit.isCompleted
                          ? "border-green-500 bg-green-500"
                          : "border-neutral-300 dark:border-neutral-600 hover:border-green-500",
                      )}
                    >
                      {habit.isCompleted && (
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      )}
                    </button>
                    <div
                      className="h-2 w-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: habit.color || "#8b5cf6" }}
                    />
                    <span
                      className={cn(
                        "flex-1 text-sm truncate",
                        habit.isCompleted
                          ? "text-green-700 dark:text-green-400 line-through"
                          : "text-neutral-700 dark:text-neutral-300",
                      )}
                    >
                      {habit.name}
                    </span>
                    {habit.streak > 0 && (
                      <span className="text-xs text-orange-500 flex items-center gap-0.5 font-medium">
                        <Flame className="w-3 h-3" />
                        {habit.streak}
                      </span>
                    )}
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-dashed border-neutral-200 dark:border-neutral-800">
                  <Target className="h-8 w-8 mx-auto text-orange-500 mb-2" />
                  <p className="text-sm text-muted-foreground">No habits yet</p>
                  <Link href="/habits">
                    <Button variant="link" size="sm" className="mt-2">
                      <Plus className="h-3 w-3 mr-1" />
                      Create habit
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Goals Progress Section */}
        {activeGoals.length > 0 && (
          <motion.div variants={itemVariants} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-green-500" />
                <h2 className="text-sm font-medium text-neutral-900 dark:text-white">
                  Goal Progress
                </h2>
              </div>
              <Link
                href="/goals"
                className="text-xs text-violet-500 hover:text-violet-600 flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {activeGoals.map((goal, index) => (
                <motion.div
                  key={goal.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-violet-500/50 transition-all"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-sm text-neutral-900 dark:text-white truncate pr-2">
                      {goal.title}
                    </h3>
                    <span className="text-xs font-semibold text-violet-500">
                      {goal.progress}%
                    </span>
                  </div>
                  <Progress value={goal.progress} className="h-1.5 mb-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="capitalize">{goal.category}</span>
                    {goal.deadline && (
                      <span>
                        Due {format(parseISO(goal.deadline), "MMM d")}
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Quick Actions */}
        <motion.div variants={itemVariants}>
          <h2 className="text-sm font-medium text-neutral-900 dark:text-white mb-3">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              { href: "/tasks", label: "Add Task", icon: Plus },
              { href: "/day-planner", label: "Plan Day", icon: Calendar },
              { href: "/time-tracker", label: "Start Focus", icon: Play },
              { href: "/journal", label: "Write Journal", icon: BookOpen },
              { href: "/ai-coach", label: "AI Coach", icon: Brain },
              { href: "/goals", label: "Goals", icon: Target },
              { href: "/finance", label: "Log Expense", icon: Wallet },
              { href: "/insights", label: "Insights", icon: Activity },
            ].map((action) => (
              <Link key={action.href} href={action.href}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2 hover:bg-violet-50 dark:hover:bg-violet-950/30 hover:border-violet-500/50 hover:text-violet-600 dark:hover:text-violet-400"
                >
                  <action.icon className="h-3.5 w-3.5" />
                  {action.label}
                </Button>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          variants={itemVariants}
          className="pt-4 border-t border-neutral-200 dark:border-neutral-800"
        >
          <p className="text-xs text-center text-muted-foreground">
            Press{" "}
            <kbd className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-[10px]">
              ⌘K
            </kbd>{" "}
            anytime to open AI assistant
          </p>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
}
