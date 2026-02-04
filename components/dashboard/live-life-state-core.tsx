"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/context/app-context";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  RefreshCw,
  Zap,
  Target,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface LifeState {
  label: string;
  description: string;
  color: string;
  bgGradient: string;
  glowColor: string;
  particleColor: string;
}

const LIFE_STATES: Record<string, LifeState> = {
  momentum: {
    label: "High Momentum",
    description:
      "Strong habit consistency + ahead on goals + controlled spending",
    color: "#10B981",
    bgGradient: "from-emerald-500/20 via-emerald-500/10 to-transparent",
    glowColor: "shadow-emerald-500/50",
    particleColor: "#10B981",
  },
  ontrack: {
    label: "On Track",
    description: "Progressing well with balanced habits and sustainable focus",
    color: "#3B82F6",
    bgGradient: "from-blue-500/20 via-blue-500/10 to-transparent",
    glowColor: "shadow-blue-500/50",
    particleColor: "#3B82F6",
  },
  drifting: {
    label: "Drifting",
    description: "Some areas slipping but recovery is possible with focus",
    color: "#F59E0B",
    bgGradient: "from-amber-500/20 via-amber-500/10 to-transparent",
    glowColor: "shadow-amber-500/50",
    particleColor: "#F59E0B",
  },
  overloaded: {
    label: "Overloaded",
    description: "Too many commitments, need to reduce scope and prioritize",
    color: "#EF4444",
    bgGradient: "from-red-500/20 via-red-500/10 to-transparent",
    glowColor: "shadow-red-500/50",
    particleColor: "#EF4444",
  },
};

// Animated particles for momentum state
const Particle = ({ color, delay }: { color: string; delay: number }) => (
  <motion.div
    className="absolute w-1 h-1 rounded-full"
    style={{ backgroundColor: color }}
    initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
    animate={{
      opacity: [0, 1, 0],
      scale: [0, 1, 0],
      x: [0, (Math.random() - 0.5) * 100],
      y: [0, -50 - Math.random() * 50],
    }}
    transition={{
      duration: 2,
      delay,
      repeat: Infinity,
      repeatDelay: Math.random() * 2,
    }}
  />
);

export function LiveLifeStateCore() {
  const {
    tasks,
    habits,
    journalEntries,
    getHabitStreak,
    getFinanceStats,
    generateInsights,
    isLoading,
  } = useApp();

  const [isHovered, setIsHovered] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);

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

    // Average habit streaks bonus
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

  // Animate score on change
  useEffect(() => {
    const duration = 1500;
    const startTime = Date.now();
    const startScore = animatedScore;
    const endScore = lifeScore;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing function
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(
        Math.round(startScore + (endScore - startScore) * easeOut),
      );

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [lifeScore]);

  // Determine current state
  const currentState = useMemo(() => {
    if (lifeScore >= 80) return LIFE_STATES.momentum;
    if (lifeScore >= 60) return LIFE_STATES.ontrack;
    if (lifeScore >= 40) return LIFE_STATES.drifting;
    return LIFE_STATES.overloaded;
  }, [lifeScore]);

  // Calculate trend
  const { trend, trendValue } = useMemo(() => {
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

    const diff =
      olderTasks > 0 ? ((recentTasks - olderTasks) / olderTasks) * 100 : 0;

    if (recentTasks > olderTasks * 1.2)
      return { trend: "up", trendValue: Math.round(diff) };
    if (recentTasks < olderTasks * 0.8)
      return { trend: "down", trendValue: Math.round(diff) };
    return { trend: "stable", trendValue: 0 };
  }, [tasks]);

  // Contributing factors
  const factors = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const factors: {
      label: string;
      value: string;
      positive: boolean;
      link: string;
    }[] = [];

    // Habits
    const habitsToday = habits.filter((h) =>
      h.completions?.some((c) => c.date === today && c.completed),
    ).length;
    factors.push({
      label: "Habits completed",
      value: `${habitsToday}/${habits.length}`,
      positive: habitsToday >= habits.length * 0.7,
      link: "/habits",
    });

    // Tasks
    const pendingTasks = tasks.filter((t) => t.status !== "completed").length;
    const overdueTasks = tasks.filter(
      (t) =>
        t.status !== "completed" &&
        t.dueDate &&
        new Date(t.dueDate) < new Date(),
    ).length;
    factors.push({
      label: overdueTasks > 0 ? "Tasks overdue" : "Tasks pending",
      value: overdueTasks > 0 ? `${overdueTasks}` : `${pendingTasks}`,
      positive: overdueTasks === 0,
      link: "/tasks",
    });

    // Finance
    const { income, expenses } = getFinanceStats();
    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
    factors.push({
      label: "Savings rate",
      value: `${savingsRate.toFixed(0)}%`,
      positive: savingsRate > 20,
      link: "/finance",
    });

    // Mood
    const recentMood = journalEntries.slice(0, 3);
    const avgMood =
      recentMood.length > 0
        ? recentMood.reduce((s, e) => s + e.mood, 0) / recentMood.length
        : 5;
    factors.push({
      label: "Recent mood",
      value: `${avgMood.toFixed(1)}/10`,
      positive: avgMood >= 6,
      link: "/journal",
    });

    return factors;
  }, [tasks, habits, journalEntries, getFinanceStats]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await generateInsights();
    setIsRefreshing(false);
  };

  // SVG circle parameters
  const size = 280;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (animatedScore / 100) * circumference;

  return (
    <motion.div
      className="relative flex flex-col items-center justify-center py-8"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* Background Glow */}
      <motion.div
        className={cn(
          "absolute inset-0 rounded-3xl blur-3xl transition-all duration-1000",
          `bg-gradient-radial ${currentState.bgGradient}`,
        )}
        animate={{
          opacity: isHovered ? 0.8 : 0.5,
          scale: isHovered ? 1.1 : 1,
        }}
      />

      {/* Main Card */}
      <motion.div
        className={cn(
          "relative w-full max-w-md px-8 py-10 rounded-3xl border border-border/50 backdrop-blur-md",
          "bg-gradient-to-br from-background/90 to-background/50",
          `shadow-2xl ${currentState.glowColor}`,
        )}
        animate={{
          boxShadow: isHovered
            ? `0 0 60px ${currentState.color}40`
            : `0 0 30px ${currentState.color}20`,
        }}
        transition={{ duration: 0.5 }}
      >
        {/* Particles for momentum state */}
        {lifeScore >= 80 && (
          <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
            {Array.from({ length: 12 }).map((_, i) => (
              <Particle
                key={i}
                color={currentState.particleColor}
                delay={i * 0.2}
              />
            ))}
          </div>
        )}

        {/* State Label */}
        <motion.div
          className="text-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.h2
            className="text-4xl md:text-5xl font-bold tracking-tight"
            style={{ color: currentState.color }}
            animate={{
              textShadow: isHovered
                ? `0 0 40px ${currentState.color}60`
                : `0 0 20px ${currentState.color}30`,
            }}
          >
            {currentState.label}
          </motion.h2>

          {/* Trend indicator */}
          <motion.div
            className="flex items-center justify-center gap-2 mt-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {trend === "up" && (
              <>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <span className="text-sm text-emerald-500 font-medium">
                  +{Math.abs(trendValue)}% this week
                </span>
              </>
            )}
            {trend === "down" && (
              <>
                <TrendingDown className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-500 font-medium">
                  {trendValue}% this week
                </span>
              </>
            )}
            {trend === "stable" && (
              <>
                <Minus className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Stable</span>
              </>
            )}
          </motion.div>
        </motion.div>

        {/* Animated Score Ring */}
        <div className="relative flex items-center justify-center my-8">
          <svg
            width={size}
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            className="transform -rotate-90"
          >
            {/* Background circle */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-muted/20"
            />

            {/* Gradient definition */}
            <defs>
              <linearGradient
                id="scoreGradient"
                x1="0%"
                y1="0%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor={currentState.color} />
                <stop
                  offset="100%"
                  stopColor={currentState.color}
                  stopOpacity={0.5}
                />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Progress circle */}
            <motion.circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="url(#scoreGradient)"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              filter="url(#glow)"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: circumference - progress }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
          </svg>

          {/* Center content */}
          <div className="absolute flex flex-col items-center justify-center">
            <motion.span
              className="text-7xl font-bold tabular-nums"
              style={{ color: currentState.color }}
              animate={{
                scale: isHovered ? 1.05 : 1,
              }}
            >
              {animatedScore}
            </motion.span>
            <span className="text-sm text-muted-foreground font-medium mt-1">
              Life Score
            </span>
          </div>
        </div>

        {/* Description */}
        <motion.p
          className="text-center text-muted-foreground mb-6 px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {currentState.description}
        </motion.p>

        {/* Contributing Factors */}
        <motion.div
          className="grid grid-cols-2 gap-3 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {factors.map((factor, i) => (
            <motion.a
              key={factor.label}
              href={factor.link}
              className={cn(
                "p-3 rounded-xl border transition-all",
                "hover:scale-[1.02] hover:shadow-md",
                factor.positive
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-amber-500/30 bg-amber-500/5",
              )}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-xs text-muted-foreground">
                {factor.label}
              </div>
              <div
                className={cn(
                  "text-lg font-bold",
                  factor.positive ? "text-emerald-500" : "text-amber-500",
                )}
              >
                {factor.value}
              </div>
            </motion.a>
          ))}
        </motion.div>

        {/* Refresh Button */}
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Button
            variant="outline"
            size="lg"
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="gap-2"
          >
            <RefreshCw
              className={cn(
                "w-4 h-4",
                (isRefreshing || isLoading) && "animate-spin",
              )}
            />
            {isRefreshing ? "Analyzing..." : "Refresh Life State"}
          </Button>
        </motion.div>
      </motion.div>

      {/* Quick Stats Strip */}
      <motion.div
        className="flex items-center gap-6 mt-8 text-sm text-muted-foreground"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4" />
          <span>{habits.length} habits tracked</span>
        </div>
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4" />
          <span>
            {tasks.filter((t) => t.status === "completed").length} tasks done
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4" />
          <span>AI-powered insights</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
