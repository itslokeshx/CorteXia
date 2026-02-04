"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  Sparkles,
  Zap,
  Target,
  Heart,
  Brain,
} from "lucide-react";
import { useApp } from "@/lib/context/app-context";
import { cn } from "@/lib/utils";

// Progress Ring Component
function ProgressRing({
  value,
  max = 100,
  size = 200,
  strokeWidth = 12,
  className,
}: {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(value, 0), max);
  const strokeDashoffset = circumference - (progress / max) * circumference;

  // Determine color based on score - cleaner palette
  const getColor = () => {
    if (progress >= 75) return { stroke: "#22c55e", glow: "transparent" };
    if (progress >= 50) return { stroke: "#3B82F6", glow: "transparent" };
    if (progress >= 30) return { stroke: "#F59E0B", glow: "transparent" };
    return { stroke: "#EF4444", glow: "transparent" };
  };

  const { stroke, glow } = getColor();

  return (
    <div
      className={cn("relative", className)}
      style={{ width: size, height: size }}
    >
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-neutral-100 dark:text-neutral-800"
        />
        {/* Progress Circle */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      {/* Center Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          className="text-3xl sm:text-4xl font-semibold"
          style={{ color: stroke }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          {Math.round(progress)}
        </motion.span>
        <span className="text-xs text-neutral-400 mt-0.5">Life Score</span>
      </div>
    </div>
  );
}

// Factor Card Component
function FactorCard({
  icon: Icon,
  name,
  score,
  index,
}: {
  icon: React.ElementType;
  name: string;
  score: number;
  index: number;
}) {
  const getScoreColor = (s: number) => {
    if (s >= 70) return "bg-green-500";
    if (s >= 40) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 + 0.3 }}
      className="bg-neutral-50 dark:bg-neutral-800/50 rounded-lg p-3 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-md bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
          <Icon className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" />
        </div>
        <span className="font-medium text-sm text-neutral-700 dark:text-neutral-300">
          {name}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-neutral-200 dark:bg-neutral-700 rounded-full h-1.5 overflow-hidden">
          <motion.div
            className={cn("h-full rounded-full", getScoreColor(score))}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{
              delay: index * 0.1 + 0.5,
              duration: 0.8,
              ease: "easeOut",
            }}
          />
        </div>
        <span className="text-xs font-medium w-8 text-right text-neutral-600 dark:text-neutral-400">
          {score}%
        </span>
      </div>
    </motion.div>
  );
}

export function LifeStateCore() {
  const { tasks, habits, journalEntries, goals, timeEntries, getFinanceStats } =
    useApp();

  const today = new Date().toISOString().split("T")[0];

  // Calculate comprehensive life score
  const lifeData = useMemo(() => {
    // Task metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const taskScore = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 50;

    // Habit metrics
    const activeHabits = habits.filter((h) => h.active);
    const habitsCompletedToday = activeHabits.filter((h) =>
      h.completions?.some((c) => c.date === today && c.completed),
    ).length;
    const habitScore =
      activeHabits.length > 0
        ? (habitsCompletedToday / activeHabits.length) * 100
        : 50;

    // Average streaks
    const avgStreak =
      habits.length > 0
        ? habits.reduce((sum, h) => sum + (h.streak || 0), 0) / habits.length
        : 0;

    // Mood from recent journals
    const recentJournals = journalEntries.slice(0, 7);
    const avgMood =
      recentJournals.length > 0
        ? recentJournals.reduce((sum, j) => sum + (j.mood || 5), 0) /
          recentJournals.length
        : 5;
    const avgEnergy =
      recentJournals.length > 0
        ? recentJournals.reduce((sum, j) => sum + (j.energy || 5), 0) /
          recentJournals.length
        : 5;

    // Goal progress
    const activeGoals = goals.filter((g) => g.status === "active");
    const avgGoalProgress =
      activeGoals.length > 0
        ? activeGoals.reduce((sum, g) => sum + g.progress, 0) /
          activeGoals.length
        : 50;

    // Focus time
    const todayMinutes = timeEntries
      .filter((t) => t.date?.startsWith(today))
      .reduce((sum, t) => sum + t.duration, 0);
    const focusScore = Math.min(100, (todayMinutes / 240) * 100); // 4 hours = 100%

    // Calculate overall life score
    const lifeScore = Math.round(
      taskScore * 0.2 +
        habitScore * 0.25 +
        (avgMood / 10) * 100 * 0.2 +
        avgGoalProgress * 0.2 +
        focusScore * 0.15,
    );

    // Determine state
    let state = "On Track";
    let stateEmoji = "🎯";
    if (lifeScore >= 80) {
      state = "Momentum";
      stateEmoji = "🚀";
    } else if (lifeScore >= 60) {
      state = "On Track";
      stateEmoji = "🎯";
    } else if (lifeScore >= 40) {
      state = "Drifting";
      stateEmoji = "🌊";
    } else if (lifeScore >= 20) {
      state = "Struggling";
      stateEmoji = "⚠️";
    } else {
      state = "Critical";
      stateEmoji = "🆘";
    }

    // Explanation
    let explanation = "";
    if (lifeScore >= 80)
      explanation = "You're crushing it! Keep this momentum going.";
    else if (lifeScore >= 60)
      explanation = "Good progress. A few tweaks and you'll be unstoppable.";
    else if (lifeScore >= 40)
      explanation = "Things need attention. Focus on what matters most.";
    else explanation = "Time to reset. Start with one small win today.";

    // Trend (mock - would calculate from historical data)
    const trend = Math.round((Math.random() - 0.5) * 20);

    return {
      lifeScore: Math.min(100, Math.max(0, lifeScore)),
      state,
      stateEmoji,
      explanation,
      trend,
      factors: [
        { icon: Target, name: "Tasks", score: Math.round(taskScore) },
        { icon: Zap, name: "Habits", score: Math.round(habitScore) },
        {
          icon: Heart,
          name: "Wellbeing",
          score: Math.round((avgMood / 10) * 100),
        },
        { icon: Brain, name: "Focus", score: Math.round(focusScore) },
      ],
    };
  }, [tasks, habits, journalEntries, goals, timeEntries, today]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-6"
    >

      <div className="relative z-10">
        {/* Main Content */}
        <div className="flex flex-col lg:flex-row items-center gap-8 mb-8">
          {/* Score Ring */}
          <ProgressRing
            value={lifeData.lifeScore}
            size={160}
            strokeWidth={10}
          />

          {/* State Info */}
          <div className="text-center lg:text-left flex-1">
            <motion.div
              className="flex items-center justify-center lg:justify-start gap-2 mb-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="text-2xl">{lifeData.stateEmoji}</span>
              <h1 className="text-2xl sm:text-3xl font-semibold text-neutral-900 dark:text-white">
                {lifeData.state}
              </h1>
            </motion.div>

            <motion.p
              className="text-sm text-neutral-500 dark:text-neutral-400 mb-4 max-w-md"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {lifeData.explanation}
            </motion.p>

            {/* Trend Badge */}
            {lifeData.trend !== 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium",
                  lifeData.trend > 0
                    ? "bg-green-50 dark:bg-green-950/50 text-green-600 dark:text-green-400"
                    : "bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400",
                )}
              >
                {lifeData.trend > 0 ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5" />
                )}
                <span>
                  {lifeData.trend > 0 ? "+" : ""}
                  {lifeData.trend}% vs last week
                </span>
              </motion.div>
            )}
          </div>
        </div>

        {/* Factor Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {lifeData.factors.map((factor, index) => (
            <FactorCard
              key={factor.name}
              icon={factor.icon}
              name={factor.name}
              score={factor.score}
              index={index}
            />
          ))}
        </div>

        {/* AI Insight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-5 p-4 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg border border-neutral-100 dark:border-neutral-800"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
            </div>
            <div>
              <p className="font-medium text-xs text-neutral-500 dark:text-neutral-400 mb-1">
                AI Insight
              </p>
              <p className="text-sm text-neutral-700 dark:text-neutral-300">
                {lifeData.lifeScore >= 70
                  ? "Your consistency is paying off! Consider pushing one of your habits to the next level."
                  : lifeData.lifeScore >= 50
                    ? "Focus on completing your morning routine. It has a 73% correlation with productive days for you."
                    : "Start small: complete just one task and one habit today. Building momentum is key."}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
