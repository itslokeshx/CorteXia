"use client";

import { useState, useMemo } from "react";
import { useApp } from "@/lib/context/app-context";
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LifeState {
  label: string;
  description: string;
  color: string;
  stateColor: string;
}

const LIFE_STATES: Record<string, LifeState> = {
  momentum: {
    label: "High Momentum",
    description:
      "Strong habit consistency + ahead on goals + controlled spending",
    color: "#10B981",
    stateColor: "from-emerald-500/20 to-emerald-500/5",
  },
  ontrack: {
    label: "On Track",
    description: "Progressing well with balanced habits and sustainable focus",
    color: "#3B82F6",
    stateColor: "from-blue-500/20 to-blue-500/5",
  },
  drifting: {
    label: "Drifting",
    description: "Some areas slipping but recovery is possible with focus",
    color: "#F59E0B",
    stateColor: "from-amber-500/20 to-amber-500/5",
  },
  overloaded: {
    label: "Overloaded",
    description: "Too many commitments, need to reduce scope and prioritize",
    color: "#EF4444",
    stateColor: "from-red-500/20 to-red-500/5",
  },
};

export function LifeStateCore() {
  const {
    calculateLifeState,
    tasks,
    habits,
    journalEntries,
    getHabitStreak,
    getFinanceStats,
    generateInsights,
    isLoading,
  } = useApp();

  const [isBreathing, setIsBreathing] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Calculate life score from real data
  const lifeScore = useMemo(() => {
    // Task completion rate (25% weight)
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const taskScore = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 50;

    // Habit consistency (25% weight)
    const today = new Date().toISOString().split("T")[0];
    const habitsCompletedToday = habits.filter((h) =>
      h.completions?.some((c) => c.date === today && c.completed),
    ).length;
    const habitScore =
      habits.length > 0 ? (habitsCompletedToday / habits.length) * 100 : 50;

    // Average habit streaks
    const avgStreak =
      habits.length > 0
        ? habits.reduce((sum, h) => sum + getHabitStreak(h.id), 0) /
          habits.length
        : 0;
    const streakBonus = Math.min(avgStreak * 2, 20);

    // Financial health (25% weight)
    const { income, expenses } = getFinanceStats();
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 50;
    const financeScore = Math.min(Math.max(savingsRate + 50, 0), 100);

    // Wellbeing from journal (25% weight)
    const recentEntries = journalEntries.slice(0, 7);
    const avgMood =
      recentEntries.length > 0
        ? recentEntries.reduce((sum, e) => sum + e.mood, 0) /
          recentEntries.length
        : 5;
    const wellbeingScore = avgMood * 10;

    // Weighted average
    const score = Math.round(
      taskScore * 0.25 +
        habitScore * 0.25 +
        financeScore * 0.25 +
        wellbeingScore * 0.25 +
        streakBonus,
    );

    return Math.min(Math.max(score, 0), 100);
  }, [tasks, habits, journalEntries, getHabitStreak, getFinanceStats]);

  // Determine current state based on score and metrics
  const currentState = useMemo(() => {
    if (lifeScore >= 80) return LIFE_STATES.momentum;
    if (lifeScore >= 60) return LIFE_STATES.ontrack;
    if (lifeScore >= 40) return LIFE_STATES.drifting;
    return LIFE_STATES.overloaded;
  }, [lifeScore]);

  // Calculate trend
  const trend = useMemo(() => {
    // Compare last week's score to this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const recentTasks = tasks.filter(
      (t) => t.completedAt && new Date(t.completedAt) > weekAgo,
    ).length;

    const olderTasks = tasks.filter((t) => {
      const completedDate = t.completedAt ? new Date(t.completedAt) : null;
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      return (
        completedDate && completedDate > twoWeeksAgo && completedDate <= weekAgo
      );
    }).length;

    if (recentTasks > olderTasks * 1.2) return "up";
    if (recentTasks < olderTasks * 0.8) return "down";
    return "stable";
  }, [tasks]);

  const handleRefresh = async () => {
    setIsGenerating(true);
    calculateLifeState();
    await generateInsights();
    setIsGenerating(false);
  };

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-8">
      {/* Life State Card */}
      <div
        className={cn(
          "w-full max-w-lg px-8 py-12 rounded-2xl border border-border/50 bg-gradient-to-br backdrop-blur-sm transition-all duration-500",
          currentState.stateColor,
          isBreathing && "animate-pulse",
        )}
        onMouseEnter={() => setIsBreathing(false)}
        onMouseLeave={() => setIsBreathing(true)}
      >
        <div className="text-center space-y-6">
          {/* State Label */}
          <div className="space-y-2">
            <h1
              className="text-5xl font-bold transition-colors duration-500"
              style={{ color: currentState.color }}
            >
              {currentState.label}
            </h1>
            <div className="flex items-center justify-center gap-2">
              {trend === "up" && (
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              )}
              {trend === "down" && (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
              {trend === "stable" && (
                <Minus className="w-5 h-5 text-muted-foreground" />
              )}
              <span className="text-sm text-muted-foreground">
                {trend === "up"
                  ? "Improving"
                  : trend === "down"
                    ? "Declining"
                    : "Stable"}
              </span>
            </div>
          </div>

          {/* State Description */}
          <p className="text-lg text-muted-foreground leading-relaxed max-w-sm mx-auto">
            {currentState.description}
          </p>

          {/* Life Score */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Activity
                className="w-5 h-5"
                style={{ color: currentState.color }}
              />
              <span
                className="text-4xl font-bold font-mono"
                style={{ color: currentState.color }}
              >
                {lifeScore}
              </span>
              <span className="text-sm text-muted-foreground">/100</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-xs mx-auto h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-1000 ease-out rounded-full"
                style={{
                  width: `${lifeScore}%`,
                  backgroundColor: currentState.color,
                }}
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
            <div className="text-center">
              <p className="text-2xl font-bold">
                {tasks.filter((t) => t.status === "completed").length}
              </p>
              <p className="text-xs text-muted-foreground">Tasks Done</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">
                {habits.length > 0
                  ? Math.round(
                      habits.reduce((sum, h) => sum + getHabitStreak(h.id), 0) /
                        habits.length,
                    )
                  : 0}
              </p>
              <p className="text-xs text-muted-foreground">Avg Streak</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold">{journalEntries.length}</p>
              <p className="text-xs text-muted-foreground">Journal Days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <button
        onClick={handleRefresh}
        disabled={isGenerating || isLoading}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-lg",
          "bg-secondary hover:bg-secondary/80 transition-colors",
          "text-sm text-muted-foreground",
          (isGenerating || isLoading) && "opacity-50 cursor-not-allowed",
        )}
      >
        {isGenerating || isLoading ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
        {isGenerating ? "Analyzing..." : "Refresh Insights"}
      </button>

      {/* State Indicators */}
      <div className="flex gap-3 justify-center">
        {Object.entries(LIFE_STATES).map(([key, state]) => (
          <div
            key={key}
            className={cn(
              "w-3 h-3 rounded-full transition-all duration-300",
              currentState.label === state.label ? "w-8" : "opacity-30",
            )}
            style={{ backgroundColor: state.color }}
            title={state.label}
          />
        ))}
      </div>
    </div>
  );
}
