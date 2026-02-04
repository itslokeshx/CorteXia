"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/context/app-context";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Target,
  Flame,
  DollarSign,
  Brain,
  ArrowRight,
  Sparkles,
  Zap,
} from "lucide-react";

// Quick stat card component
function QuickStat({
  icon: Icon,
  label,
  value,
  subtext,
  color,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  color: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="p-4 hover:shadow-md transition-all hover:scale-[1.02] cursor-pointer group border-border/50">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              color,
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="mt-3">
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
          {subtext && (
            <p className="text-xs text-muted-foreground/70 mt-1">{subtext}</p>
          )}
        </div>
      </Card>
    </Link>
  );
}

// Life Score Ring
function LifeScoreRing({ score, state }: { score: number; state: string }) {
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const stateColors: Record<string, { ring: string; text: string }> = {
    momentum: { ring: "var(--color-emerald)", text: "text-emerald-500" },
    ontrack: { ring: "var(--color-blue)", text: "text-blue-500" },
    drifting: { ring: "var(--color-amber)", text: "text-amber-500" },
    overloaded: { ring: "var(--color-red)", text: "text-red-500" },
  };

  const colors = stateColors[state] || stateColors.ontrack;

  return (
    <div className="relative w-28 h-28 md:w-32 md:h-32">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke="currentColor"
          strokeWidth="6"
          className="text-muted/20"
        />
        <motion.circle
          cx="50"
          cy="50"
          r="45"
          fill="none"
          stroke={colors.ring}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={cn("text-2xl md:text-3xl font-bold", colors.text)}>
          {score}
        </span>
        <span className="text-[10px] md:text-xs text-muted-foreground">
          Life Score
        </span>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { tasks, habits, timeEntries, journalEntries, goals, getFinanceStats } =
    useApp();

  const today = new Date().toISOString().split("T")[0];

  // Calculate dashboard stats
  const stats = useMemo(() => {
    const pendingTasks = tasks.filter((t) => t.status !== "completed").length;
    const completedTodayCount = tasks.filter(
      (t) => t.status === "completed" && t.completedAt?.split("T")[0] === today,
    ).length;

    const habitsCompletedToday = habits.filter((h) =>
      h.completions?.some((c) => c.date === today && c.completed),
    ).length;
    const totalStreaks = habits.reduce((sum, h) => sum + (h.streak || 0), 0);

    const minutesToday = timeEntries
      .filter((t) => t.date.split("T")[0] === today)
      .reduce((s, t) => s + t.duration, 0);

    const { expenses } = getFinanceStats();
    const activeGoals = goals.filter((g) => g.status === "active").length;

    const taskScore =
      tasks.length > 0
        ? (tasks.filter((t) => t.status === "completed").length /
            tasks.length) *
          100
        : 50;
    const habitScore =
      habits.length > 0 ? (habitsCompletedToday / habits.length) * 100 : 50;
    const avgMood =
      journalEntries.length > 0
        ? journalEntries.slice(0, 7).reduce((s, e) => s + (e.mood || 5), 0) /
          Math.min(7, journalEntries.length)
        : 5;

    const lifeScore = Math.round(
      taskScore * 0.3 + habitScore * 0.3 + avgMood * 4,
    );

    let state = "ontrack";
    if (lifeScore >= 75) state = "momentum";
    else if (lifeScore >= 50) state = "ontrack";
    else if (lifeScore >= 30) state = "drifting";
    else state = "overloaded";

    return {
      pendingTasks,
      completedTodayCount,
      habitsCompletedToday,
      totalHabits: habits.length,
      totalStreaks,
      minutesToday,
      expenses,
      activeGoals,
      lifeScore: Math.min(100, Math.max(0, lifeScore)),
      state,
    };
  }, [
    tasks,
    habits,
    timeEntries,
    journalEntries,
    goals,
    getFinanceStats,
    today,
  ]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const aiInsight = useMemo(() => {
    if (stats.pendingTasks > 5) {
      return "You have several pending tasks. Consider prioritizing the most important ones.";
    }
    if (
      stats.habitsCompletedToday < stats.totalHabits / 2 &&
      stats.totalHabits > 0
    ) {
      return "Don't forget your habits today! Small consistent actions lead to big results.";
    }
    if (stats.minutesToday < 60 && new Date().getHours() > 14) {
      return "Low focus time logged today. A focused work session could boost your productivity.";
    }
    if (stats.lifeScore >= 70) {
      return "You're doing great! Keep up the momentum and stay consistent.";
    }
    return "Focus on completing your top priority task today for maximum impact.";
  }, [stats]);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{getGreeting()}</h1>
            <p className="text-muted-foreground text-sm md:text-base mt-1">
              Here's your life at a glance
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <p className="text-xs text-muted-foreground">
                {stats.completedTodayCount} tasks completed today
              </p>
            </div>
            <LifeScoreRing score={stats.lifeScore} state={stats.state} />
          </div>
        </div>

        {/* AI Insight Card */}
        <Card className="p-4 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent border-primary/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">AI Insight</p>
              <p className="text-muted-foreground text-sm mt-1">{aiInsight}</p>
            </div>
          </div>
        </Card>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          <QuickStat
            icon={CheckCircle2}
            label="Tasks"
            value={stats.pendingTasks}
            subtext="pending"
            color="bg-blue-500/10 text-blue-500 dark:bg-blue-500/20"
            href="/tasks"
          />
          <QuickStat
            icon={Flame}
            label="Habits"
            value={`${stats.habitsCompletedToday}/${stats.totalHabits}`}
            subtext="today"
            color="bg-orange-500/10 text-orange-500 dark:bg-orange-500/20"
            href="/habits"
          />
          <QuickStat
            icon={Clock}
            label="Focus"
            value={`${Math.round(stats.minutesToday / 60)}h`}
            subtext="logged"
            color="bg-purple-500/10 text-purple-500 dark:bg-purple-500/20"
            href="/time"
          />
          <QuickStat
            icon={DollarSign}
            label="Spent"
            value={`$${stats.expenses.toFixed(0)}`}
            subtext="this month"
            color="bg-emerald-500/10 text-emerald-500 dark:bg-emerald-500/20"
            href="/finance"
          />
          <QuickStat
            icon={Target}
            label="Goals"
            value={stats.activeGoals}
            subtext="active"
            color="bg-pink-500/10 text-pink-500 dark:bg-pink-500/20"
            href="/goals"
          />
          <QuickStat
            icon={Zap}
            label="Streaks"
            value={stats.totalStreaks}
            subtext="total days"
            color="bg-amber-500/10 text-amber-500 dark:bg-amber-500/20"
            href="/habits"
          />
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Today's Tasks */}
          <Card className="p-4 md:p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2 text-sm md:text-base">
                <CheckCircle2 className="w-4 h-4 text-blue-500" />
                Today's Priority
              </h2>
              <Link href="/tasks">
                <Button variant="ghost" size="sm" className="text-xs h-8">
                  View All
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="space-y-2 md:space-y-3">
              {tasks
                .filter((t) => t.status !== "completed")
                .slice(0, 4)
                .map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-2.5 md:p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div
                      className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        task.priority === "high"
                          ? "bg-red-500"
                          : task.priority === "medium"
                            ? "bg-amber-500"
                            : "bg-emerald-500",
                      )}
                    />
                    <span className="flex-1 text-sm truncate">
                      {task.title}
                    </span>
                    {task.dueDate && (
                      <span className="text-xs text-muted-foreground flex-shrink-0">
                        {new Date(task.dueDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                ))}
              {tasks.filter((t) => t.status !== "completed").length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  All tasks completed! 🎉
                </p>
              )}
            </div>
          </Card>

          {/* Habits Progress */}
          <Card className="p-4 md:p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2 text-sm md:text-base">
                <Flame className="w-4 h-4 text-orange-500" />
                Today's Habits
              </h2>
              <Link href="/habits">
                <Button variant="ghost" size="sm" className="text-xs h-8">
                  View All
                  <ArrowRight className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="space-y-2 md:space-y-3">
              {habits.slice(0, 4).map((habit) => {
                const isCompleted = habit.completions?.some(
                  (c) => c.date === today && c.completed,
                );
                return (
                  <div
                    key={habit.id}
                    className="flex items-center gap-3 p-2.5 md:p-3 rounded-lg bg-muted/50"
                  >
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0",
                        isCompleted
                          ? "bg-emerald-500 text-white"
                          : "bg-muted-foreground/20",
                      )}
                    >
                      {isCompleted ? "✓" : ""}
                    </div>
                    <span className="flex-1 text-sm truncate">
                      {habit.name}
                    </span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {habit.streak || 0} 🔥
                    </span>
                  </div>
                );
              })}
              {habits.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No habits yet. Create one to start tracking!
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          <Link href="/tasks">
            <Button
              variant="outline"
              className="w-full h-auto py-3 md:py-4 flex-col gap-1.5 md:gap-2 border-border/50"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-xs">Add Task</span>
            </Button>
          </Link>
          <Link href="/habits">
            <Button
              variant="outline"
              className="w-full h-auto py-3 md:py-4 flex-col gap-1.5 md:gap-2 border-border/50"
            >
              <Flame className="w-5 h-5" />
              <span className="text-xs">Track Habit</span>
            </Button>
          </Link>
          <Link href="/time">
            <Button
              variant="outline"
              className="w-full h-auto py-3 md:py-4 flex-col gap-1.5 md:gap-2 border-border/50"
            >
              <Clock className="w-5 h-5" />
              <span className="text-xs">Log Time</span>
            </Button>
          </Link>
          <Link href="/journal">
            <Button
              variant="outline"
              className="w-full h-auto py-3 md:py-4 flex-col gap-1.5 md:gap-2 border-border/50"
            >
              <Brain className="w-5 h-5" />
              <span className="text-xs">Write Journal</span>
            </Button>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
