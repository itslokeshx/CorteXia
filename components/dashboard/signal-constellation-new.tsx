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
  excellent: "border-emerald-500 bg-emerald-500/10",
  good: "border-blue-500 bg-blue-500/10",
  warning: "border-amber-500 bg-amber-500/10",
  critical: "border-red-500 bg-red-500/10",
};

const statusGlows = {
  excellent: "hover:shadow-emerald-500/25",
  good: "hover:shadow-blue-500/25",
  warning: "hover:shadow-amber-500/25",
  critical: "hover:shadow-red-500/25",
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
            "group relative overflow-hidden rounded-2xl border-2 p-5 transition-all duration-300",
            "hover:shadow-xl hover:-translate-y-1",
            statusColors[signal.status],
            statusGlows[signal.status],
          )}
        >
          {/* Background Gradient */}
          <div
            className={cn(
              "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
              signal.bgColor,
            )}
          />

          {/* Content */}
          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div
                className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  signal.color,
                )}
              >
                <Icon className="w-6 h-6" />
              </div>

              {signal.trend !== undefined && signal.trend !== 0 && (
                <div
                  className={cn(
                    "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                    signal.trend > 0
                      ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
                      : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
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
              <span className="text-3xl font-bold">{signal.value}</span>
            </div>

            {/* Label */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {signal.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {signal.subtext}
                </p>
              </div>
              <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
            </div>
          </div>

          {/* Shine Effect */}
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
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
