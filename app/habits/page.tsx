"use client";

import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  format,
  subDays,
  startOfYear,
  eachDayOfInterval,
  getDay,
  parseISO,
  differenceInDays,
  addDays,
  isToday,
} from "date-fns";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Check,
  Flame,
  Trash2,
  Calendar,
  Target,
  TrendingUp,
  Award,
  Zap,
  CheckCircle2,
  MoreVertical,
  Edit2,
  Link2,
  Trophy,
  Star,
} from "lucide-react";
import { useApp } from "@/lib/context/app-context";
import { useCelebration } from "@/components/celebration/celebration-provider";
import { cn } from "@/lib/utils";

// Category colors and icons
const CATEGORY_CONFIG: Record<string, { color: string; emoji: string }> = {
  health: { color: "#22c55e", emoji: "💪" },
  productivity: { color: "#3b82f6", emoji: "⚡" },
  learning: { color: "#a855f7", emoji: "📚" },
  fitness: { color: "#f59e0b", emoji: "🏃" },
  mindfulness: { color: "#06b6d4", emoji: "🧘" },
  social: { color: "#ec4899", emoji: "👥" },
  creativity: { color: "#f97316", emoji: "🎨" },
  finance: { color: "#10b981", emoji: "💰" },
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// GitHub-style Year Streak Grid Component
function YearStreakGrid({
  completions,
  color,
}: {
  completions: { date: string; completed: boolean }[];
  color: string;
}) {
  const today = new Date();
  const startDate = subDays(today, 364);
  const days = eachDayOfInterval({ start: startDate, end: today });

  // Create completion map for quick lookup
  const completionMap = useMemo(() => {
    const map = new Map<string, boolean>();
    completions.forEach((c) => map.set(c.date, c.completed));
    return map;
  }, [completions]);

  // Group days by week
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];

  days.forEach((day, index) => {
    if (index === 0) {
      // Pad the first week with empty slots
      const startDay = getDay(day);
      for (let i = 0; i < startDay; i++) {
        currentWeek.push(null as unknown as Date);
      }
    }
    currentWeek.push(day);
    if (getDay(day) === 6 || index === days.length - 1) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const getIntensity = (date: Date | null) => {
    if (!date) return 0;
    const dateStr = format(date, "yyyy-MM-dd");
    return completionMap.get(dateStr) ? 1 : 0;
  };

  const months = [
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
  const weekDays = ["", "Mon", "", "Wed", "", "Fri", ""];

  return (
    <div className="overflow-x-auto pb-2">
      <div className="min-w-[700px]">
        {/* Month labels */}
        <div className="flex text-[10px] text-muted-foreground mb-1 ml-8">
          {months.map((month, i) => (
            <div key={month} className="flex-1 text-center">
              {month}
            </div>
          ))}
        </div>

        <div className="flex gap-0.5">
          {/* Day labels */}
          <div className="flex flex-col gap-0.5 text-[10px] text-muted-foreground pr-1 w-6">
            {weekDays.map((day, i) => (
              <div key={i} className="h-[10px] flex items-center justify-end">
                {day}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-0.5">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-0.5">
                {week.map((day, dayIndex) => {
                  if (!day) {
                    return <div key={dayIndex} className="h-[10px] w-[10px]" />;
                  }
                  const intensity = getIntensity(day);
                  const isCurrentDay = isToday(day);
                  return (
                    <div
                      key={dayIndex}
                      className={cn(
                        "h-[10px] w-[10px] rounded-sm transition-colors",
                        isCurrentDay &&
                          "ring-1 ring-neutral-400 dark:ring-neutral-500",
                        intensity > 0
                          ? ""
                          : "bg-neutral-100 dark:bg-neutral-800",
                      )}
                      style={
                        intensity > 0 ? { backgroundColor: color } : undefined
                      }
                      title={`${format(day, "MMM d, yyyy")}${intensity > 0 ? " - Completed" : ""}`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-2 mt-2 text-[10px] text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-0.5">
            <div className="h-[10px] w-[10px] rounded-sm bg-neutral-100 dark:bg-neutral-800" />
            <div
              className="h-[10px] w-[10px] rounded-sm opacity-40"
              style={{ backgroundColor: color }}
            />
            <div
              className="h-[10px] w-[10px] rounded-sm opacity-70"
              style={{ backgroundColor: color }}
            />
            <div
              className="h-[10px] w-[10px] rounded-sm"
              style={{ backgroundColor: color }}
            />
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}

export default function HabitsPage() {
  const {
    habits,
    goals,
    completeHabit,
    deleteHabit,
    addHabit,
    updateHabit,
    getHabitStreak,
  } = useApp();
  const { celebrate } = useCelebration();

  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<(typeof habits)[0] | null>(
    null,
  );
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "health",
    frequency: "daily" as "daily" | "weekly",
    targetDays: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as string[],
    color: "#22c55e",
    linkedGoalIds: [] as string[],
  });

  const today = format(new Date(), "yyyy-MM-dd");

  // Filtered habits
  const filteredHabits = useMemo(() => {
    return habits.filter(
      (h) => categoryFilter === "all" || h.category === categoryFilter,
    );
  }, [habits, categoryFilter]);

  // Stats
  const stats = useMemo(() => {
    const activeHabits = habits.filter((h) => h.active !== false);
    const completedToday = activeHabits.filter((h) =>
      h.completions?.some((c) => c.date === today && c.completed),
    ).length;

    const totalStreakDays = activeHabits.reduce(
      (sum, h) => sum + getHabitStreak(h.id),
      0,
    );
    const longestStreak = Math.max(
      ...activeHabits.map((h) => h.longestStreak || 0),
      0,
    );
    const totalCompletions = activeHabits.reduce(
      (sum, h) => sum + (h.completions?.filter((c) => c.completed).length || 0),
      0,
    );

    const completionRate =
      activeHabits.length > 0
        ? Math.round((completedToday / activeHabits.length) * 100)
        : 0;

    return {
      total: activeHabits.length,
      completedToday,
      totalStreakDays,
      longestStreak,
      totalCompletions,
      completionRate,
    };
  }, [habits, today, getHabitStreak]);

  // Handle toggle completion
  const handleToggleCompletion = useCallback(
    (habitId: string) => {
      const habit = habits.find((h) => h.id === habitId);
      const isCurrentlyCompleted = habit?.completions?.some(
        (c) => c.date === today && c.completed,
      );

      completeHabit(habitId, today);

      // Trigger celebration if completing
      if (!isCurrentlyCompleted && habit) {
        const newStreak = getHabitStreak(habitId) + 1;

        if (newStreak === 7) {
          celebrate({
            id: crypto.randomUUID(),
            type: "achievement",
            title: "Week Warrior! 🏆",
            subtitle: `You've completed ${habit.name} for 7 days straight!`,
            value: 7,
            icon: "flame",
          });
        } else if (newStreak === 30) {
          celebrate({
            id: crypto.randomUUID(),
            type: "achievement",
            title: "Monthly Master! 👑",
            subtitle: `30 days of ${habit.name}! You're unstoppable!`,
            value: 30,
            icon: "crown",
          });
        } else if (newStreak === 100) {
          celebrate({
            id: crypto.randomUUID(),
            type: "achievement",
            title: "Century Club! 🎖️",
            subtitle: `100 days! ${habit.name} is now part of who you are!`,
            value: 100,
            icon: "trophy",
          });
        } else if (newStreak > 0 && newStreak % 5 === 0) {
          celebrate({
            id: crypto.randomUUID(),
            type: "streak",
            title: `${newStreak} Day Streak! 🔥`,
            subtitle: `Keep up the momentum with ${habit.name}!`,
            value: newStreak,
            icon: "flame",
          });
        }
      }
    },
    [habits, today, completeHabit, celebrate, getHabitStreak],
  );

  // Handle form submit
  const handleSubmit = () => {
    if (!formData.name.trim()) return;

    const habitData = {
      name: formData.name,
      description: formData.description,
      category: formData.category,
      frequency: formData.frequency,
      targetDays: formData.targetDays,
      color: formData.color,
      linkedGoalIds: formData.linkedGoalIds,
      active: true,
      icon: "target",
    };

    if (editingHabit) {
      updateHabit(editingHabit.id, habitData);
    } else {
      addHabit(habitData);
    }

    resetForm();
    setDialogOpen(false);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      category: "health",
      frequency: "daily",
      targetDays: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
      color: "#22c55e",
      linkedGoalIds: [],
    });
    setEditingHabit(null);
  };

  const handleEdit = (habit: (typeof habits)[0]) => {
    setFormData({
      name: habit.name,
      description: habit.description || "",
      category: habit.category,
      frequency: habit.frequency,
      targetDays: habit.targetDays || [
        "mon",
        "tue",
        "wed",
        "thu",
        "fri",
        "sat",
        "sun",
      ],
      color: habit.color || "#22c55e",
      linkedGoalIds: habit.linkedGoalIds || [],
    });
    setEditingHabit(habit);
    setDialogOpen(true);
  };

  const selectedHabit = selectedHabitId
    ? habits.find((h) => h.id === selectedHabitId)
    : null;

  // Day of week toggles
  const DAYS = [
    { key: "mon", label: "M" },
    { key: "tue", label: "T" },
    { key: "wed", label: "W" },
    { key: "thu", label: "T" },
    { key: "fri", label: "F" },
    { key: "sat", label: "S" },
    { key: "sun", label: "S" },
  ];

  return (
    <AppLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 pb-24"
      >
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
              Habits
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {stats.completedToday}/{stats.total} completed today
            </p>
          </div>
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}
          >
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white border-0">
                <Plus className="h-4 w-4" />
                New Habit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingHabit ? "Edit Habit" : "Create New Habit"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder="Habit name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="text-base"
                />
                <Input
                  placeholder="Description (optional)"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Category
                    </label>
                    <Select
                      value={formData.category}
                      onValueChange={(v) =>
                        setFormData({
                          ...formData,
                          category: v,
                          color: CATEGORY_CONFIG[v]?.color || formData.color,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_CONFIG).map(
                          ([key, { emoji }]) => (
                            <SelectItem key={key} value={key}>
                              {emoji}{" "}
                              {key.charAt(0).toUpperCase() + key.slice(1)}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Frequency
                    </label>
                    <Select
                      value={formData.frequency}
                      onValueChange={(v) =>
                        setFormData({
                          ...formData,
                          frequency: v as "daily" | "weekly",
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Target Days */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Target Days
                  </label>
                  <div className="flex gap-1">
                    {DAYS.map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          const newDays = formData.targetDays.includes(key)
                            ? formData.targetDays.filter((d) => d !== key)
                            : [...formData.targetDays, key];
                          setFormData({ ...formData, targetDays: newDays });
                        }}
                        className={cn(
                          "h-9 w-9 rounded-full text-sm font-medium transition-colors",
                          formData.targetDays.includes(key)
                            ? "bg-violet-500 text-white"
                            : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700",
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color Picker */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) =>
                        setFormData({ ...formData, color: e.target.value })
                      }
                      className="h-10 w-14 rounded cursor-pointer border border-neutral-200 dark:border-neutral-700"
                    />
                    <div className="flex gap-2">
                      {[
                        "#22c55e",
                        "#3b82f6",
                        "#a855f7",
                        "#f59e0b",
                        "#ec4899",
                        "#06b6d4",
                      ].map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setFormData({ ...formData, color })}
                          className={cn(
                            "h-8 w-8 rounded-full transition-transform",
                            formData.color === color &&
                              "ring-2 ring-offset-2 ring-violet-500 scale-110",
                          )}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Link to Goals */}
                {goals.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Link2 className="h-3 w-3" />
                      Link to Goals
                    </label>
                    <Select
                      value={formData.linkedGoalIds[0] || "none"}
                      onValueChange={(v) =>
                        setFormData({
                          ...formData,
                          linkedGoalIds: v === "none" ? [] : [v],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a goal" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No linked goal</SelectItem>
                        {goals
                          .filter((g) => g.status !== "completed")
                          .map((goal) => (
                            <SelectItem key={goal.id} value={goal.id}>
                              🎯 {goal.title}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <Button onClick={handleSubmit} className="w-full">
                  {editingHabit ? "Update Habit" : "Create Habit"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2 mb-1">
              <Target className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-semibold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Active Habits</div>
          </div>
          <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-semibold text-green-600 dark:text-green-400">
              {stats.completedToday}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">
              Done Today
            </div>
          </div>
          <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="h-4 w-4 text-orange-500" />
            </div>
            <div className="text-2xl font-semibold text-orange-600 dark:text-orange-400">
              {stats.totalStreakDays}
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400">
              Total Streak Days
            </div>
          </div>
          <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-1">
              <Trophy className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-2xl font-semibold text-purple-600 dark:text-purple-400">
              {stats.longestStreak}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400">
              Best Streak
            </div>
          </div>
        </motion.div>

        {/* Today's Progress */}
        <motion.div
          variants={itemVariants}
          className="p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Today's Progress</span>
            <span className="text-sm font-bold text-violet-600 dark:text-violet-400">
              {stats.completionRate}%
            </span>
          </div>
          <Progress value={stats.completionRate} className="h-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {stats.completedToday === stats.total && stats.total > 0
              ? "🎉 All habits completed! Amazing!"
              : `${stats.total - stats.completedToday} habits remaining today`}
          </p>
        </motion.div>

        {/* Category Filter */}
        <motion.div variants={itemVariants}>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.entries(CATEGORY_CONFIG).map(([key, { emoji }]) => (
                <SelectItem key={key} value={key}>
                  {emoji} {key.charAt(0).toUpperCase() + key.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Habits List */}
        <motion.div variants={containerVariants} className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredHabits.length === 0 ? (
              <motion.div
                variants={itemVariants}
                className="text-center py-12 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-dashed border-neutral-200 dark:border-neutral-800"
              >
                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No habits found</p>
                <Button
                  variant="link"
                  onClick={() => setDialogOpen(true)}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create your first habit
                </Button>
              </motion.div>
            ) : (
              filteredHabits.map((habit) => {
                const todayCompleted = habit.completions?.some(
                  (c) => c.date === today && c.completed,
                );
                const streak = getHabitStreak(habit.id);
                const categoryConfig = CATEGORY_CONFIG[habit.category] || {
                  emoji: "📌",
                };
                const isSelected = selectedHabitId === habit.id;

                return (
                  <motion.div
                    key={habit.id}
                    layout
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "rounded-xl border transition-all overflow-hidden",
                      todayCompleted
                        ? "bg-green-50/50 dark:bg-green-950/10 border-green-200 dark:border-green-800"
                        : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-violet-500/50",
                    )}
                  >
                    {/* Main Content */}
                    <div className="p-4">
                      <div className="flex items-start gap-3">
                        {/* Completion Button */}
                        <button
                          onClick={() => handleToggleCompletion(habit.id)}
                          className={cn(
                            "flex-shrink-0 h-10 w-10 rounded-full border-2 flex items-center justify-center transition-all",
                            todayCompleted
                              ? "border-green-500 bg-green-500 text-white"
                              : "border-neutral-300 dark:border-neutral-600 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/50",
                          )}
                        >
                          <Check
                            className={cn(
                              "h-5 w-5",
                              !todayCompleted && "opacity-0",
                            )}
                          />
                        </button>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: habit.color || "#8b5cf6",
                              }}
                            />
                            <h3
                              className={cn(
                                "font-medium text-base",
                                todayCompleted &&
                                  "text-green-700 dark:text-green-400",
                              )}
                            >
                              {habit.name}
                            </h3>
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5"
                            >
                              {categoryConfig.emoji} {habit.category}
                            </Badge>
                          </div>

                          {habit.description && (
                            <p className="text-xs text-muted-foreground mb-2">
                              {habit.description}
                            </p>
                          )}

                          {/* Streak and stats */}
                          <div className="flex items-center gap-4 text-sm">
                            <div className="flex items-center gap-1">
                              <Flame
                                className={cn(
                                  "h-4 w-4",
                                  streak > 0
                                    ? "text-orange-500"
                                    : "text-neutral-300 dark:text-neutral-600",
                                )}
                              />
                              <span
                                className={cn(
                                  "font-medium",
                                  streak > 0
                                    ? "text-orange-500"
                                    : "text-muted-foreground",
                                )}
                              >
                                {streak} day{streak !== 1 ? "s" : ""}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Trophy className="h-3.5 w-3.5" />
                              <span className="text-xs">
                                Best: {habit.longestStreak || 0}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Star className="h-3.5 w-3.5" />
                              <span className="text-xs">
                                {habit.completions?.filter((c) => c.completed)
                                  .length || 0}{" "}
                                total
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() =>
                              setSelectedHabitId(isSelected ? null : habit.id)
                            }
                          >
                            <Calendar className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(habit)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            onClick={() => deleteHabit(habit.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Year Grid (Expandable) */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="border-t border-neutral-200 dark:border-neutral-800 px-4 py-4 bg-neutral-50/50 dark:bg-neutral-900/50"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">
                              Year Streak Calendar
                            </span>
                          </div>
                          <YearStreakGrid
                            completions={habit.completions || []}
                            color={habit.color || "#8b5cf6"}
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
}
