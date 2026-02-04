"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  CheckSquare,
  Clock,
  Target,
  DollarSign,
  BookOpen,
  Flag,
  Brain,
  PenTool,
  TrendingUp,
  TrendingDown,
  Flame,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import { useApp } from "@/lib/context/app-context";
import { cn } from "@/lib/utils";

interface SignalData {
  id: string;
  name: string;
  icon: React.ElementType;
  value: string | number;
  subtext: string;
  trend?: number;
  status: "excellent" | "good" | "warning" | "critical";
  href: string;
  color: string;
  bgColor: string;
}

const statusColors = {
  excellent: "border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30",
  good: "border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30",
  warning: "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30",
  critical: "border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30",
};

const statusGlows = {
  excellent: "",
  good: "",
  warning: "",
  critical: "",
};

function SignalCard({ signal, index }: { signal: SignalData; index: number }) {
  const Icon = signal.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Link href={signal.href}>
        <div
          className={cn(
            "group relative overflow-hidden rounded-lg border p-4 transition-all duration-200",
            "hover:border-neutral-300 dark:hover:border-neutral-700",
            statusColors[signal.status],
          )}
        >
          {/* Content */}
          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div
                className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center",
                  signal.color,
                )}
              >
                <Icon className="w-4 h-4" />
              </div>

              {signal.trend !== undefined && signal.trend !== 0 && (
                <div
                  className={cn(
                    "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                    signal.trend > 0
                      ? "bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400"
                      : "bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400",
                  )}
                >
                  {signal.trend > 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  <span>{Math.abs(signal.trend)}%</span>
                </div>
              )}
            </div>

            {/* Value */}
            <div className="mb-1">
              <span className="text-2xl font-semibold text-neutral-900 dark:text-white">{signal.value}</span>
            </div>

            {/* Label */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  {signal.name}
                </p>
                <p className="text-xs text-neutral-500 dark:text-neutral-500">
                  {signal.subtext}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-neutral-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function SignalConstellation() {
  const { tasks, habits, timeEntries, goals, getFinanceStats, journalEntries } =
    useApp();

  const today = new Date().toISOString().split("T")[0];

  const signals = useMemo<SignalData[]>(() => {
    // Tasks Signal
    const pendingTasks = tasks.filter((t) => t.status !== "completed").length;
    const completedToday = tasks.filter((t) =>
      t.completedAt?.startsWith(today),
    ).length;
    const overdueTasks = tasks.filter(
      (t) => t.status !== "completed" && t.dueDate && t.dueDate < today,
    ).length;
    const taskStatus =
      overdueTasks > 3
        ? "critical"
        : overdueTasks > 0
          ? "warning"
          : pendingTasks < 5
            ? "excellent"
            : "good";

    // Habits Signal
    const activeHabits = habits.filter((h) => h.active);
    const habitsCompletedToday = activeHabits.filter((h) =>
      h.completions?.some((c) => c.date === today && c.completed),
    ).length;
    const habitRate =
      activeHabits.length > 0 ? habitsCompletedToday / activeHabits.length : 0;
    const totalStreaks = habits.reduce((sum, h) => sum + (h.streak || 0), 0);
    const habitStatus =
      habitRate >= 0.8
        ? "excellent"
        : habitRate >= 0.5
          ? "good"
          : habitRate >= 0.25
            ? "warning"
            : "critical";

    // Time Signal
    const todayMinutes = timeEntries
      .filter((t) => t.date?.startsWith(today))
      .reduce((sum, t) => sum + t.duration, 0);
    const focusHours = Math.round((todayMinutes / 60) * 10) / 10;
    const deepFocusMinutes = timeEntries
      .filter((t) => t.date?.startsWith(today) && t.focusQuality === "deep")
      .reduce((sum, t) => sum + t.duration, 0);
    const timeStatus =
      focusHours >= 4
        ? "excellent"
        : focusHours >= 2
          ? "good"
          : focusHours >= 1
            ? "warning"
            : "critical";

    // Finance Signal
    const { expenses, income, balance } = getFinanceStats();
    const financeStatus =
      balance > 0
        ? balance > 1000
          ? "excellent"
          : "good"
        : balance > -500
          ? "warning"
          : "critical";

    // Goals Signal
    const activeGoals = goals.filter((g) => g.status === "active");
    const avgProgress =
      activeGoals.length > 0
        ? Math.round(
            activeGoals.reduce((sum, g) => sum + g.progress, 0) /
              activeGoals.length,
          )
        : 0;
    const goalStatus =
      avgProgress >= 70
        ? "excellent"
        : avgProgress >= 40
          ? "good"
          : avgProgress >= 20
            ? "warning"
            : "critical";

    // Journal Signal
    const recentJournals = journalEntries.filter((j) => {
      const jDate = new Date(j.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return jDate >= weekAgo;
    });
    const avgMood =
      recentJournals.length > 0
        ? Math.round(
            (recentJournals.reduce((sum, j) => sum + (j.mood || 5), 0) /
              recentJournals.length) *
              10,
          ) / 10
        : 5;
    const journalStatus =
      avgMood >= 7
        ? "excellent"
        : avgMood >= 5
          ? "good"
          : avgMood >= 3
            ? "warning"
            : "critical";

    return [
      {
        id: "tasks",
        name: "Tasks",
        icon: CheckSquare,
        value: pendingTasks,
        subtext: `${completedToday} completed today`,
        trend: completedToday > 0 ? 15 : -5,
        status: taskStatus,
        href: "/tasks",
        color: "bg-blue-500 text-white",
        bgColor: "bg-gradient-to-br from-blue-500/10 to-blue-600/5",
      },
      {
        id: "habits",
        name: "Habits",
        icon: Flame,
        value: `${habitsCompletedToday}/${activeHabits.length}`,
        subtext: `${totalStreaks} total streak days`,
        trend: Math.round(habitRate * 100) - 50,
        status: habitStatus,
        href: "/habits",
        color: "bg-orange-500 text-white",
        bgColor: "bg-gradient-to-br from-orange-500/10 to-orange-600/5",
      },
      {
        id: "time",
        name: "Focus Time",
        icon: Clock,
        value: `${focusHours}h`,
        subtext: `${Math.round((deepFocusMinutes / 60) * 10) / 10}h deep work`,
        status: timeStatus,
        href: "/time",
        color: "bg-cyan-500 text-white",
        bgColor: "bg-gradient-to-br from-cyan-500/10 to-cyan-600/5",
      },
      {
        id: "goals",
        name: "Goals",
        icon: Flag,
        value: activeGoals.length,
        subtext: `${avgProgress}% avg progress`,
        trend: avgProgress > 50 ? 10 : -10,
        status: goalStatus,
        href: "/goals",
        color: "bg-pink-500 text-white",
        bgColor: "bg-gradient-to-br from-pink-500/10 to-pink-600/5",
      },
      {
        id: "finance",
        name: "Money",
        icon: DollarSign,
        value: `$${Math.abs(balance).toLocaleString()}`,
        subtext: balance >= 0 ? "Positive balance" : "Negative balance",
        status: financeStatus,
        href: "/finance",
        color: "bg-emerald-500 text-white",
        bgColor: "bg-gradient-to-br from-emerald-500/10 to-emerald-600/5",
      },
      {
        id: "mood",
        name: "Wellbeing",
        icon: Brain,
        value: avgMood.toFixed(1),
        subtext: `Average mood (${recentJournals.length} entries)`,
        status: journalStatus,
        href: "/journal",
        color: "bg-violet-500 text-white",
        bgColor: "bg-gradient-to-br from-violet-500/10 to-violet-600/5",
      },
    ];
  }, [
    tasks,
    habits,
    timeEntries,
    goals,
    getFinanceStats,
    journalEntries,
    today,
  ]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {signals.map((signal, index) => (
        <SignalCard key={signal.id} signal={signal} index={index} />
      ))}
    </div>
  );
}
