"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { useApp } from "@/lib/context/app-context";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { format, parseISO, differenceInDays, isToday } from "date-fns";
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
  Flag,
  Repeat,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" as const },
  },
};

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
  const today = format(new Date(), "yyyy-MM-dd");
  const now = new Date();
  useEffect(() => {
    setMounted(true);
  }, []);

  const getGreeting = () => {
    const hour = now.getHours();
    if (hour < 5) return { text: "Good night", icon: Moon, emoji: "🌙" };
    if (hour < 12) return { text: "Good morning", icon: Sunrise, emoji: "🌅" };
    if (hour < 18) return { text: "Good afternoon", icon: Sun, emoji: "☀️" };
    if (hour < 21) return { text: "Good evening", icon: Sun, emoji: "🌇" };
    return { text: "Good night", icon: Moon, emoji: "🌙" };
  };
  const greeting = getGreeting();

  // ─── Stats ───
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
    const totalStreakDays = activeHabits.reduce(
      (sum, h) => sum + getHabitStreak(h.id),
      0,
    );
    const financeStats = getFinanceStats();
    const goalStats = getGoalStats();
    const todayTimeStats = getTodayStats();

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
      taskScore * 0.35 + habitScore * 0.35 + goalScore * 0.3,
    );

    const lifeState =
      productivityScore >= 85
        ? {
            label: "High Momentum",
            emoji: "🚀",
            color: "text-green-600 dark:text-green-400",
          }
        : productivityScore >= 70
          ? {
              label: "On Track",
              emoji: "✨",
              color: "text-blue-600 dark:text-blue-400",
            }
          : productivityScore >= 50
            ? {
                label: "Drifting",
                emoji: "⚠️",
                color: "text-amber-600 dark:text-amber-400",
              }
            : {
                label: "Needs Attention",
                emoji: "🚨",
                color: "text-red-600 dark:text-red-400",
              };

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
      productivityScore,
      lifeState,
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

  // ─── Priority Items ───
  const priorities = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      type: "task" | "habit" | "goal";
      priority?: string;
      dueDate?: string;
      streak?: number;
      completed: boolean;
    }> = [];

    // High-priority tasks due today or overdue
    tasks
      .filter(
        (t) =>
          t.status !== "completed" &&
          (t.dueDate === today ||
            (t.dueDate && t.dueDate < today) ||
            t.priority === "high" ||
            t.priority === "critical"),
      )
      .sort((a, b) => {
        const po: Record<string, number> = {
          critical: 0,
          high: 1,
          medium: 2,
          low: 3,
        };
        return (po[a.priority] ?? 2) - (po[b.priority] ?? 2);
      })
      .slice(0, 3)
      .forEach((t) =>
        items.push({
          id: t.id,
          title: t.title,
          type: "task",
          priority: t.priority,
          dueDate: t.dueDate,
          completed: false,
        }),
      );

    // Uncompleted habits with streaks
    habits
      .filter(
        (h) =>
          h.active !== false &&
          !h.completions?.some((c) => c.date === today && c.completed),
      )
      .sort((a, b) => getHabitStreak(b.id) - getHabitStreak(a.id))
      .slice(0, 2)
      .forEach((h) =>
        items.push({
          id: h.id,
          title: h.name,
          type: "habit",
          streak: getHabitStreak(h.id),
          completed: false,
        }),
      );

    return items.slice(0, 5);
  }, [tasks, habits, today, getHabitStreak]);

  // ─── Active Goals ───
  const activeGoals = useMemo(() => {
    return goals
      .filter((g) => g.status !== "completed" && g.status !== "abandoned")
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 3);
  }, [goals]);

  // ─── AI Insights ───
  const aiInsights = useMemo(() => {
    const insights: Array<{
      type: "celebration" | "warning" | "suggestion" | "pattern";
      title: string;
      description: string;
    }> = [];

    if (
      stats.habitsCompletedToday === stats.activeHabits &&
      stats.activeHabits > 0
    ) {
      insights.push({
        type: "celebration",
        title: "All habits completed! 🔥",
        description:
          "Perfect day for habits. You're building incredible consistency.",
      });
    }
    if (stats.overdueTasks > 0) {
      insights.push({
        type: "warning",
        title: `${stats.overdueTasks} overdue task${stats.overdueTasks > 1 ? "s" : ""}`,
        description:
          "Consider rescheduling or prioritizing to clear your backlog.",
      });
    }
    if (stats.totalStreakDays > 15) {
      insights.push({
        type: "celebration",
        title: `${stats.totalStreakDays} total streak days!`,
        description:
          "Your consistency is building powerful habits. Keep it up!",
      });
    }
    if (stats.productivityScore < 40) {
      insights.push({
        type: "suggestion",
        title: "Start with one small win",
        description:
          "Focus on completing just one important task to build momentum.",
      });
    }
    if (stats.productivityScore >= 80) {
      insights.push({
        type: "pattern",
        title: "You're in the zone!",
        description:
          "High productivity detected. Consider scheduling your most challenging work now.",
      });
    }
    return insights.slice(0, 3);
  }, [stats]);

  const getGoalStatus = (goal: (typeof goals)[0]) => {
    if (!goal.targetDate) return { label: "Active", color: "blue" };
    const daysLeft = differenceInDays(parseISO(goal.targetDate), new Date());
    if (goal.progress >= 100) return { label: "Completed", color: "green" };
    if (daysLeft < 0) return { label: "Overdue", color: "red" };
    if (daysLeft < 7 && goal.progress < 80)
      return { label: "At Risk", color: "amber" };
    return { label: "On Track", color: "green" };
  };

  if (!mounted) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Brain className="w-10 h-10 text-purple-500" />
          </motion.div>
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
        className="space-y-8 pb-16"
      >
        {/* ═══ GREETING HERO ═══ */}
        <motion.div variants={itemVariants}>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 p-8 text-white">
            {/* Ambient circles */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-400/20 rounded-full translate-y-1/2 -translate-x-1/4 blur-2xl" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                  {greeting.emoji} {greeting.text}!
                </h1>
                <p className="text-white/70 mt-2 text-lg">
                  {format(now, "EEEE, MMMM d, yyyy")}
                </p>
                <p className="text-white/60 mt-1 text-sm">
                  {stats.completedToday > 0 || stats.habitsCompletedToday > 0
                    ? `Already completed ${stats.completedToday} task${stats.completedToday !== 1 ? "s" : ""} and ${stats.habitsCompletedToday} habit${stats.habitsCompletedToday !== 1 ? "s" : ""} today.`
                    : `${stats.todayTasksCount + stats.pendingTasks} tasks and ${stats.activeHabits} habits waiting for you.`}
                </p>
              </div>

              {/* Life Score */}
              <div className="flex items-center gap-4 bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20">
                <div className="relative w-16 h-16">
                  <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                    <circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="5"
                    />
                    <motion.circle
                      cx="32"
                      cy="32"
                      r="28"
                      fill="none"
                      stroke="white"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 28}`}
                      strokeDashoffset={`${2 * Math.PI * 28 * (1 - stats.productivityScore / 100)}`}
                      initial={{ strokeDashoffset: `${2 * Math.PI * 28}` }}
                      animate={{
                        strokeDashoffset: `${2 * Math.PI * 28 * (1 - stats.productivityScore / 100)}`,
                      }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold">
                      {stats.productivityScore}
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-white/90">
                    Life Score
                  </div>
                  <div className="text-xs text-white/60">
                    {stats.lifeState.emoji} {stats.lifeState.label}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Row */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              {[
                {
                  label: "Tasks Done",
                  value: `${stats.completedToday}/${stats.completedToday + stats.todayTasksCount}`,
                  icon: CheckCircle2,
                },
                {
                  label: "Habits",
                  value: `${stats.habitsCompletedToday}/${stats.activeHabits}`,
                  icon: Flame,
                },
                {
                  label: "Streak Days",
                  value: stats.totalStreakDays.toString(),
                  icon: Zap,
                },
                {
                  label: "Focus Time",
                  value: `${stats.todayMinutes}m`,
                  icon: Timer,
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <stat.icon className="w-3.5 h-3.5 text-white/60" />
                    <span className="text-xs text-white/60">{stat.label}</span>
                  </div>
                  <span className="text-lg font-semibold">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ═══ AI INSIGHTS ═══ */}
        {aiInsights.length > 0 && (
          <motion.div variants={itemVariants} className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                AI Insights
              </h2>
            </div>
            <div className="grid gap-2">
              {aiInsights.map((insight, i) => {
                const config = {
                  celebration: {
                    bg: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
                    icon: "🎉",
                  },
                  warning: {
                    bg: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",
                    icon: "⚠️",
                  },
                  suggestion: {
                    bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
                    icon: "💡",
                  },
                  pattern: {
                    bg: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",
                    icon: "📊",
                  },
                }[insight.type];
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * i }}
                    className={cn(
                      "flex items-start gap-3 p-4 rounded-xl border",
                      config.bg,
                    )}
                  >
                    <span className="text-lg flex-shrink-0">{config.icon}</span>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        {insight.title}
                      </p>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        {insight.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ═══ TODAY'S PRIORITIES ═══ */}
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Target className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Today&apos;s Priorities
              </h2>
              <span className="text-xs text-[var(--color-text-tertiary)]">
                {priorities.length} items
              </span>
            </div>
            <Link
              href="/tasks"
              className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-2">
            {priorities.length > 0 ? (
              priorities.map((item, i) => {
                const TypeIcon =
                  item.type === "task"
                    ? CheckCircle2
                    : item.type === "habit"
                      ? Repeat
                      : Flag;
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group flex items-center gap-3 p-3.5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] hover:border-purple-300 dark:hover:border-purple-700 transition-all"
                  >
                    {/* Number */}
                    <div className="w-6 h-6 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xs font-semibold text-purple-600 dark:text-purple-400 flex-shrink-0">
                      {i + 1}
                    </div>
                    {/* Icon */}
                    <TypeIcon className="w-4 h-4 text-[var(--color-text-tertiary)] flex-shrink-0" />
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-[var(--color-text-primary)] truncate block">
                        {item.title}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-[var(--color-text-tertiary)] capitalize">
                          {item.type}
                        </span>
                        {item.dueDate && (
                          <span className="text-[10px] text-[var(--color-text-tertiary)]">
                            • Due{" "}
                            {item.dueDate === today
                              ? "today"
                              : format(parseISO(item.dueDate), "MMM d")}
                          </span>
                        )}
                        {item.streak && item.streak > 0 && (
                          <span className="text-[10px] text-orange-500">
                            • 🔥 {item.streak} days
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Priority badge */}
                    {item.priority &&
                      (item.priority === "high" ||
                        item.priority === "critical") && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                        >
                          {item.priority}
                        </Badge>
                      )}
                    {/* Complete button */}
                    <button
                      onClick={() => {
                        if (item.type === "task") completeTask(item.id);
                        else if (item.type === "habit")
                          completeHabit(item.id, today);
                      }}
                      className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-full border-2 border-[var(--color-border)] hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-900/30 transition-all flex items-center justify-center"
                    >
                      <CheckCircle2 className="w-3 h-3 text-transparent hover:text-green-500" />
                    </button>
                  </motion.div>
                );
              })
            ) : (
              <div className="text-center py-10 rounded-xl bg-[var(--color-bg-secondary)] border border-dashed border-[var(--color-border)]">
                <CheckCircle2 className="w-8 h-8 mx-auto text-green-500 mb-2" />
                <p className="text-sm text-[var(--color-text-secondary)]">
                  All caught up! 🎉
                </p>
                <Link href="/tasks">
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-2 text-purple-600"
                  >
                    <Plus className="w-3 h-3 mr-1" />
                    Add task
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </motion.div>

        {/* ═══ GOAL PROGRESS ═══ */}
        {activeGoals.length > 0 && (
          <motion.div variants={itemVariants} className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Flag className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Goal Progress
                </h2>
              </div>
              <Link
                href="/goals"
                className="text-xs text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {activeGoals.map((goal, i) => {
                const status = getGoalStatus(goal);
                return (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: i * 0.06 }}
                    className="p-5 rounded-xl bg-[var(--color-bg-secondary)] border border-[var(--color-border)] card-hover"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium text-sm text-[var(--color-text-primary)] line-clamp-1 pr-2">
                        {goal.title}
                      </h3>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] flex-shrink-0",
                          status.color === "green" &&
                            "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800",
                          status.color === "amber" &&
                            "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
                          status.color === "red" &&
                            "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
                          status.color === "blue" &&
                            "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
                        )}
                      >
                        {status.label}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-[var(--color-text-tertiary)] capitalize">
                          {goal.category}
                        </span>
                        <span className="font-medium text-purple-600 dark:text-purple-400">
                          {goal.progress}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${Math.min(goal.progress, 100)}%`,
                          }}
                          transition={{ duration: 1, ease: "easeOut" }}
                        />
                      </div>
                      {goal.targetDate && (
                        <p className="text-[10px] text-[var(--color-text-tertiary)]">
                          Due {format(parseISO(goal.targetDate), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ═══ QUICK ACTIONS ═══ */}
        <motion.div variants={itemVariants} className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
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
              { href: "/habits", label: "Habits", icon: Flame },
            ].map((action) => (
              <Link key={action.href} href={action.href}>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-2 rounded-xl hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-300 dark:hover:border-purple-700 hover:text-purple-600 dark:hover:text-purple-400 transition-all"
                >
                  <action.icon className="w-3.5 h-3.5" />
                  {action.label}
                </Button>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* ═══ FOOTER ═══ */}
        <motion.div
          variants={itemVariants}
          className="pt-6 border-t border-[var(--color-border)]"
        >
          <p className="text-xs text-center text-[var(--color-text-tertiary)]">
            Press{" "}
            <kbd className="px-1.5 py-0.5 rounded-md bg-[var(--color-bg-tertiary)] text-[10px] font-mono">
              ⌘K
            </kbd>{" "}
            to open AI assistant
          </p>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
}
