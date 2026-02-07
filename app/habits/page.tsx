"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { useApp } from "@/lib/context/app-context";
import type { Habit } from "@/lib/types";
import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { format, subDays, isFuture, getDay } from "date-fns";
import {
  Plus,
  Flame,
  Trophy,
  TrendingUp,
  Check,
  AlertTriangle,
  Target,
  ChevronDown,
  Zap,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// ─── Categories (only the 6 valid Habit type categories) ───
const CATEGORIES = [
  { value: "health", label: "Health", color: "#10B981" },
  { value: "productivity", label: "Productivity", color: "#8B5CF6" },
  { value: "learning", label: "Learning", color: "#3B82F6" },
  { value: "fitness", label: "Fitness", color: "#F59E0B" },
  { value: "mindfulness", label: "Mindfulness", color: "#06B6D4" },
  { value: "social", label: "Social", color: "#F97316" },
] as const;

const CATEGORY_COLOR_MAP: Record<string, string> = {
  health: "#10B981",
  productivity: "#8B5CF6",
  learning: "#3B82F6",
  fitness: "#F59E0B",
  mindfulness: "#06B6D4",
  social: "#F97316",
};

// ─── GitHub-exact heatmap colors ───
const HEATMAP_COLORS = {
  light: ["#EBEDF0", "#9BE9A8", "#40C463", "#30A14E", "#216E39"],
  dark: ["#161B22", "#0E4429", "#006D32", "#26A641", "#39D353"],
};

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function HabitsPage() {
  const { habits, addHabit, completeHabit, deleteHabit, getHabitStreak } =
    useApp();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedHabit, setSelectedHabit] = useState<string | null>(null);
  const [checkAnimating, setCheckAnimating] = useState<string | null>(null);
  const [newHabit, setNewHabit] = useState({
    name: "",
    description: "",
    frequency: "daily",
    category: "health",
    color: "#10B981",
  });

  const today = format(new Date(), "yyyy-MM-dd");
  const activeHabits = useMemo(
    () => habits.filter((h) => h.active !== false),
    [habits],
  );

  // ─── Computed habit data ───
  const habitData = useMemo(() => {
    return activeHabits.map((h) => {
      const streak = getHabitStreak(h.id);
      const isCompleted =
        h.completions?.some((c) => c.date === today && c.completed) ?? false;
      const last30 = Array.from({ length: 30 }, (_, i) =>
        format(subDays(new Date(), i), "yyyy-MM-dd"),
      );
      const completed30 = last30.filter((d) =>
        h.completions?.some((c) => c.date === d && c.completed),
      ).length;
      const completionRate = Math.round((completed30 / 30) * 100);
      const totalCompletions =
        h.completions?.filter((c) => c.completed).length ?? 0;
      const isAtRisk = !isCompleted && (streak < 2 || completionRate < 30);

      return {
        ...h,
        streak,
        isCompleted,
        completionRate,
        totalCompletions,
        isAtRisk,
      };
    });
  }, [activeHabits, today, getHabitStreak]);

  // ─── Stats ───
  const totalStats = useMemo(() => {
    const completedToday = habitData.filter((h) => h.isCompleted).length;
    const bestStreak = Math.max(
      0,
      ...habitData.map((h) => Math.max(h.streak, h.longestStreak)),
    );
    const activeStreaks = habitData.filter((h) => h.streak > 0).length;
    const overallRate =
      habitData.length > 0
        ? Math.round(
            habitData.reduce((sum, h) => sum + h.completionRate, 0) /
              habitData.length,
          )
        : 0;
    const atRisk = habitData.filter((h) => h.isAtRisk).length;

    return {
      completedToday,
      total: habitData.length,
      bestStreak,
      activeStreaks,
      overallRate,
      atRisk,
    };
  }, [habitData]);

  // ─── Heatmap Data ───
  const getHeatmapData = useCallback((habit: (typeof habits)[0]) => {
    const days: Array<{
      date: Date;
      dateStr: string;
      completed: boolean;
      future: boolean;
    }> = [];
    for (let i = 364; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "yyyy-MM-dd");
      const completed =
        habit.completions?.some((c) => c.date === dateStr && c.completed) ??
        false;
      days.push({ date, dateStr, completed, future: isFuture(date) });
    }
    return days;
  }, []);

  // Group heatmap days into weeks
  const getWeeks = useCallback((days: ReturnType<typeof getHeatmapData>) => {
    const weeks: (typeof days)[] = [];
    let currentWeek: typeof days = [];
    const firstDayOfWeek = getDay(days[0].date);
    for (let i = 0; i < firstDayOfWeek; i++) {
      currentWeek.push({
        date: new Date(0),
        dateStr: "",
        completed: false,
        future: true,
      });
    }
    for (const day of days) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);
    return weeks;
  }, []);

  // Get month label positions for heatmap
  const getMonthLabels = useCallback((weeks: ReturnType<typeof getWeeks>) => {
    const labels: { label: string; col: number }[] = [];
    let lastMonth = -1;
    weeks.forEach((week, i) => {
      for (const day of week) {
        if (day.dateStr) {
          const month = day.date.getMonth();
          if (month !== lastMonth) {
            lastMonth = month;
            labels.push({ label: MONTH_LABELS[month], col: i });
          }
          break;
        }
      }
    });
    return labels;
  }, []);

  const handleCreateHabit = () => {
    if (!newHabit.name.trim()) return;
    addHabit({
      name: newHabit.name,
      description: newHabit.description,
      frequency: newHabit.frequency as "daily" | "weekly" | "custom",
      category: newHabit.category as Habit["category"],
      color: newHabit.color,
      streak: 0,
      longestStreak: 0,
      active: true,
    });
    setNewHabit({
      name: "",
      description: "",
      frequency: "daily",
      category: "health",
      color: "#10B981",
    });
    setCreateOpen(false);
  };

  const handleComplete = (habitId: string) => {
    setCheckAnimating(habitId);
    completeHabit(habitId, today);
    setTimeout(() => setCheckAnimating(null), 300);
  };

  // ─── Detect color scheme for heatmap ───
  const isDark =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches;

  const heatmapColors = isDark ? HEATMAP_COLORS.dark : HEATMAP_COLORS.light;

  // ─── Circular Progress SVG helper ───
  const CircularProgress = ({
    completed,
    total,
    size = 40,
    strokeWidth = 3,
  }: {
    completed: number;
    total: number;
    size?: number;
    strokeWidth?: number;
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const pct = total > 0 ? completed / total : 0;
    const offset = circumference * (1 - pct);

    return (
      <svg width={size} height={size} className="flex-shrink-0">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-gray-200 dark:text-gray-700"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="text-green-500 transition-all duration-500 ease-out"
        />
      </svg>
    );
  };

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="space-y-6 pb-12"
      >
        {/* ═══ Header Section ═══ */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Habits
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              {totalStats.total} active habit{totalStats.total !== 1 ? "s" : ""}{" "}
              • {totalStats.bestStreak} day streak best
            </p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-sm">
                <Plus className="w-4 h-4" /> New Habit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Habit</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input
                  placeholder="Habit name (e.g., Meditate for 10 minutes)"
                  value={newHabit.name}
                  onChange={(e) =>
                    setNewHabit({ ...newHabit, name: e.target.value })
                  }
                  autoFocus
                />
                <Input
                  placeholder="Description (optional)"
                  value={newHabit.description}
                  onChange={(e) =>
                    setNewHabit({ ...newHabit, description: e.target.value })
                  }
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                      Frequency
                    </label>
                    <Select
                      value={newHabit.frequency}
                      onValueChange={(v) =>
                        setNewHabit({ ...newHabit, frequency: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                      Category
                    </label>
                    <Select
                      value={newHabit.category}
                      onValueChange={(v) => {
                        const cat = CATEGORIES.find((c) => c.value === v);
                        setNewHabit({
                          ...newHabit,
                          category: v,
                          color: cat?.color || "#8B5CF6",
                        });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CATEGORIES.map((c) => (
                          <SelectItem key={c.value} value={c.value}>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                style={{ backgroundColor: c.color }}
                              />
                              {c.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateHabit}
                  disabled={!newHabit.name.trim()}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  Create Habit
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* ═══ Stats Cards Row ═══ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          {/* Current Streaks */}
          <div className="relative p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-gradient-to-r from-orange-500 to-amber-500" />
            <div className="flex items-center gap-2 mb-1 mt-1">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-[var(--color-text-tertiary)]">
                Current Streaks
              </span>
            </div>
            <p className="text-lg font-semibold text-[var(--color-text-primary)]">
              {totalStats.activeStreaks}
            </p>
            <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">
              habits with active streaks
            </p>
          </div>

          {/* Completion Rate */}
          <div className="relative p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-gradient-to-r from-green-500 to-emerald-500" />
            <div className="flex items-center gap-2 mb-1 mt-1">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-xs text-[var(--color-text-tertiary)]">
                Completion Rate
              </span>
            </div>
            <p className="text-lg font-semibold text-[var(--color-text-primary)]">
              {totalStats.overallRate}%
            </p>
            <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">
              overall today
            </p>
          </div>

          {/* Best Streak */}
          <div className="relative p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-gradient-to-r from-yellow-500 to-amber-500" />
            <div className="flex items-center gap-2 mb-1 mt-1">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-xs text-[var(--color-text-tertiary)]">
                Best Streak
              </span>
            </div>
            <p className="text-lg font-semibold text-[var(--color-text-primary)]">
              {totalStats.bestStreak} days
            </p>
            <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">
              longest across all habits
            </p>
          </div>

          {/* At Risk */}
          <div className="relative p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-gradient-to-r from-red-500 to-orange-500" />
            <div className="flex items-center gap-2 mb-1 mt-1">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-xs text-[var(--color-text-tertiary)]">
                At Risk
              </span>
            </div>
            <p className="text-lg font-semibold text-[var(--color-text-primary)]">
              {totalStats.atRisk}
            </p>
            <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">
              habits declining or low streak
            </p>
          </div>
        </div>

        {/* ═══ Today's Habits Section ═══ */}
        <div className="mb-6">
          {/* Section header with circular progress */}
          <div className="flex items-center gap-3 mb-4">
            <CircularProgress
              completed={totalStats.completedToday}
              total={totalStats.total}
            />
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                Today&apos;s Habits
              </h2>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                {totalStats.completedToday} of {totalStats.total} completed
              </p>
            </div>
          </div>

          {/* Habit cards list */}
          <div className="space-y-0.5">
            <AnimatePresence>
              {habitData.map((habit, i) => {
                const catColor =
                  CATEGORY_COLOR_MAP[habit.category] || "#8B5CF6";
                const weeks = getWeeks(getHeatmapData(habit));
                const monthLabels = getMonthLabels(weeks);

                return (
                  <motion.div
                    key={habit.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: i * 0.04,
                      duration: 0.2,
                      ease: "easeOut",
                    }}
                    className={cn(
                      "rounded-xl border transition-all duration-200 overflow-hidden",
                      habit.isAtRisk && !habit.isCompleted
                        ? "border-l-2 border-l-orange-400 bg-orange-50/30 dark:bg-orange-950/10"
                        : "",
                      habit.isCompleted
                        ? "bg-green-50/40 dark:bg-green-900/10 border-green-200 dark:border-green-800/50"
                        : !habit.isAtRisk
                          ? "bg-[var(--color-bg-secondary)] border-[var(--color-border)]"
                          : "",
                    )}
                  >
                    {/* Main Row */}
                    <div className="flex items-center gap-4 p-4">
                      {/* Checkbox */}
                      <motion.button
                        onClick={() => handleComplete(habit.id)}
                        animate={
                          checkAnimating === habit.id
                            ? { scale: [1, 1.2, 1] }
                            : {}
                        }
                        transition={{ duration: 0.2 }}
                        className={cn(
                          "w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200",
                          habit.isCompleted
                            ? "border-green-500 bg-green-500"
                            : "border-[var(--color-border)] hover:border-green-400",
                        )}
                      >
                        {habit.isCompleted && (
                          <Check className="w-3.5 h-3.5 text-white" />
                        )}
                      </motion.button>

                      {/* Habit info */}
                      <div className="flex-1 min-w-0">
                        <p
                          className={cn(
                            "text-sm font-medium text-[var(--color-text-primary)]",
                            habit.isCompleted &&
                              "line-through text-[var(--color-text-tertiary)]",
                          )}
                        >
                          {habit.name}
                        </p>
                        <Badge
                          variant="secondary"
                          className="mt-1 text-[10px] px-1.5 py-0 h-4 font-normal capitalize"
                          style={{
                            backgroundColor: `${catColor}15`,
                            color: catColor,
                            borderColor: `${catColor}30`,
                          }}
                        >
                          {habit.category}
                        </Badge>
                      </div>

                      {/* Completion rate (30d) */}
                      <div className="hidden sm:flex flex-col items-end mr-2">
                        <span className="text-[10px] text-[var(--color-text-tertiary)]">
                          30d rate
                        </span>
                        <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                          {habit.completionRate}%
                        </span>
                      </div>

                      {/* Streak counter */}
                      <div className="flex items-center gap-1">
                        <Flame
                          className={cn(
                            "w-4 h-4",
                            habit.streak > 0
                              ? "text-orange-500"
                              : "text-gray-400",
                          )}
                        />
                        <span
                          className={cn(
                            "text-xs font-semibold",
                            habit.streak > 0
                              ? "text-orange-500"
                              : "text-gray-400",
                          )}
                        >
                          {habit.streak}
                        </span>
                      </div>

                      {/* Expand toggle */}
                      <button
                        onClick={() =>
                          setSelectedHabit(
                            selectedHabit === habit.id ? null : habit.id,
                          )
                        }
                        className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-tertiary)] transition-colors duration-200"
                      >
                        <motion.div
                          animate={{
                            rotate: selectedHabit === habit.id ? 180 : 0,
                          }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </motion.div>
                      </button>
                    </div>

                    {/* ═══ Expanded: Heatmap + Stats ═══ */}
                    <AnimatePresence>
                      {selectedHabit === habit.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeOut" }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-2 border-t border-[var(--color-border)]">
                            {/* ─── Mini Stats Grid ─── */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[var(--color-bg-tertiary)]">
                                <Flame className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
                                <div>
                                  <p className="text-xs font-semibold text-[var(--color-text-primary)]">
                                    {habit.streak}
                                  </p>
                                  <p className="text-[10px] text-[var(--color-text-tertiary)]">
                                    Current Streak
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[var(--color-bg-tertiary)]">
                                <Trophy className="w-3.5 h-3.5 text-yellow-500 flex-shrink-0" />
                                <div>
                                  <p className="text-xs font-semibold text-[var(--color-text-primary)]">
                                    {habit.longestStreak}
                                  </p>
                                  <p className="text-[10px] text-[var(--color-text-tertiary)]">
                                    Longest Streak
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[var(--color-bg-tertiary)]">
                                <BarChart3 className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                                <div>
                                  <p className="text-xs font-semibold text-[var(--color-text-primary)]">
                                    {habit.completionRate}%
                                  </p>
                                  <p className="text-[10px] text-[var(--color-text-tertiary)]">
                                    Rate (30d)
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-[var(--color-bg-tertiary)]">
                                <Zap className="w-3.5 h-3.5 text-purple-500 flex-shrink-0" />
                                <div>
                                  <p className="text-xs font-semibold text-[var(--color-text-primary)]">
                                    {habit.totalCompletions}
                                  </p>
                                  <p className="text-[10px] text-[var(--color-text-tertiary)]">
                                    Total Done
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* ─── GitHub-Style Heatmap ─── */}
                            <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-3">
                              365-Day History
                            </p>
                            <TooltipProvider delayDuration={0}>
                              <div className="overflow-x-auto scrollbar-thin">
                                <div className="min-w-max">
                                  {/* Month labels row */}
                                  <div
                                    className="relative h-4 ml-[30px]"
                                    style={{
                                      width: `${weeks.length * 14}px`,
                                    }}
                                  >
                                    {monthLabels.map((m, idx) => (
                                      <span
                                        key={`${m.label}-${idx}`}
                                        className="absolute text-[10px] text-[var(--color-text-tertiary)]"
                                        style={{
                                          left: `${m.col * 14}px`,
                                        }}
                                      >
                                        {m.label}
                                      </span>
                                    ))}
                                  </div>

                                  {/* Heatmap body */}
                                  <div className="flex">
                                    {/* Day labels */}
                                    <div className="flex flex-col gap-[2px] mr-1 pt-0">
                                      {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                                        <div
                                          key={d}
                                          className="flex items-center justify-end"
                                          style={{
                                            height: 12,
                                            width: 26,
                                          }}
                                        >
                                          {d === 1 || d === 3 || d === 5 ? (
                                            <span className="text-[10px] leading-none text-[var(--color-text-tertiary)]">
                                              {DAY_LABELS[d]}
                                            </span>
                                          ) : null}
                                        </div>
                                      ))}
                                    </div>

                                    {/* Grid */}
                                    <div className="flex gap-[2px]">
                                      {weeks.map((week, wi) => (
                                        <div
                                          key={wi}
                                          className="flex flex-col gap-[2px]"
                                        >
                                          {week.map((day, di) => (
                                            <Tooltip key={di}>
                                              <TooltipTrigger asChild>
                                                <div
                                                  className={cn(
                                                    "cursor-pointer transition-all duration-150",
                                                    "hover:scale-[1.4] hover:outline hover:outline-2 hover:outline-purple-500/50 hover:outline-offset-1",
                                                    day.dateStr === "" &&
                                                      "invisible",
                                                  )}
                                                  style={{
                                                    width: 12,
                                                    height: 12,
                                                    borderRadius: 2,
                                                    backgroundColor:
                                                      day.dateStr === ""
                                                        ? "transparent"
                                                        : day.future
                                                          ? "transparent"
                                                          : day.completed
                                                            ? heatmapColors[4]
                                                            : heatmapColors[0],
                                                    border: day.future
                                                      ? "1px dashed var(--color-border)"
                                                      : "none",
                                                  }}
                                                  onClick={() => {
                                                    if (
                                                      day.dateStr &&
                                                      !day.future
                                                    )
                                                      completeHabit(
                                                        habit.id,
                                                        day.dateStr,
                                                      );
                                                  }}
                                                />
                                              </TooltipTrigger>
                                              {day.dateStr && (
                                                <TooltipContent
                                                  side="top"
                                                  className="text-xs"
                                                >
                                                  <p>
                                                    {format(
                                                      day.date,
                                                      "MMM d, yyyy",
                                                    )}
                                                  </p>
                                                  <p className="text-[10px] text-[var(--color-text-tertiary)]">
                                                    {day.future
                                                      ? "Upcoming"
                                                      : day.completed
                                                        ? "✅ Completed"
                                                        : "❌ Missed"}
                                                  </p>
                                                </TooltipContent>
                                              )}
                                            </Tooltip>
                                          ))}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TooltipProvider>

                            {/* Legend (bottom right) */}
                            <div className="flex items-center justify-end gap-2 mt-3">
                              <span className="text-[10px] text-[var(--color-text-tertiary)]">
                                Less
                              </span>
                              <div className="flex gap-1">
                                {heatmapColors.map((color, idx) => (
                                  <div
                                    key={idx}
                                    className="rounded-sm"
                                    style={{
                                      width: 12,
                                      height: 12,
                                      borderRadius: 2,
                                      backgroundColor: color,
                                    }}
                                  />
                                ))}
                              </div>
                              <span className="text-[10px] text-[var(--color-text-tertiary)]">
                                More
                              </span>
                            </div>

                            {/* Streak Warning */}
                            {!habit.isCompleted && habit.streak > 3 && (
                              <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                                <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                                    Don&apos;t break the streak!
                                  </p>
                                  <p className="text-[10px] text-amber-600/80 dark:text-amber-400/60">
                                    Your {habit.streak}-day streak is at risk.
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  className="bg-amber-500 hover:bg-amber-600 text-white text-xs h-7"
                                  onClick={() => handleComplete(habit.id)}
                                >
                                  Mark Done
                                </Button>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {/* Empty state */}
            {habitData.length === 0 && (
              <div className="text-center py-16 rounded-xl bg-[var(--color-bg-secondary)] border border-dashed border-[var(--color-border)]">
                <Target className="w-10 h-10 mx-auto text-purple-500 mb-3" />
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                  No habits yet
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                  Start building consistency today!
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="mt-3 text-purple-600"
                  onClick={() => setCreateOpen(true)}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Create your first habit
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
}
