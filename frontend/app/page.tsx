"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { useApp } from "@/lib/context/app-context";
import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { format, startOfWeek, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GreetingHeader } from "@/components/dashboard/greeting-header";
import { QuickStatsRow, type StatCardPayload } from "@/components/dashboard/quick-stats-row";
import { WidgetTodayTasks } from "@/components/dashboard/widget-today-tasks";
import { WidgetTodayHabits, type HabitWithStreak } from "@/components/dashboard/widget-today-habits";
import {
  WidgetNextUp,
  buildUpcomingBlocksFromPlanner,
} from "@/components/dashboard/widget-next-up";
import { WidgetGoalsOverview } from "@/components/dashboard/widget-goals-overview";
import { WidgetWeeklyFocus } from "@/components/dashboard/widget-weekly-focus";
import { WidgetJournalPrompt } from "@/components/dashboard/widget-journal-prompt";
import { DashboardQuickNav } from "@/components/dashboard/dashboard-quick-nav";
import { DayProgress } from "@/components/dashboard/day-progress";
import type { Task } from "@/lib/types";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.03 },
  },
} as const;

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 400, damping: 30 } },
} as const;

export default function DashboardPage() {
  const {
    tasks,
    habits,
    goals,
    journalEntries,
    timeEntries,
    settings,
    insights,
    addTask,
    completeTask,
    uncompleteTask,
    completeHabit,
    getHabitStreak,
    getTodayStats,
    getGoalStats,
  } = useApp();

  const [mounted, setMounted] = useState(false);
  const [showQuickTask, setShowQuickTask] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const [quickTaskPriority, setQuickTaskPriority] = useState<
    "medium" | "high" | "critical"
  >("high");

  const today = format(new Date(), "yyyy-MM-dd");

  useEffect(() => {
    setMounted(true);
  }, []);

  // ─── Today's tasks (incomplete first, then completed today)
  const todayTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (t.status === "completed") return t.completedAt?.startsWith(today);
        return (
          t.dueDate === today ||
          (t.dueDate && t.dueDate < today) ||
          t.priority === "high" ||
          t.priority === "critical"
        );
      })
      .sort((a, b) => {
        const order: Record<string, number> = {
          critical: 0,
          high: 1,
          medium: 2,
          low: 3,
        };
        if (a.status === "completed" && b.status !== "completed") return 1;
        if (a.status !== "completed" && b.status === "completed") return -1;
        return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
      });
  }, [tasks, today]);

  const completedToday = useMemo(
    () =>
      tasks.filter(
        (t) => t.status === "completed" && t.completedAt?.startsWith(today),
      ),
    [tasks, today],
  );

  const todayHabits = useMemo((): HabitWithStreak[] => {
    return habits
      .filter((h) => h.active !== false)
      .map((h) => {
        const completed =
          h.completions?.some((c) => c.date === today && c.completed) || false;
        const completion = h.completions?.find(
          (c) => c.date === today && c.completed,
        );
        let completedAt: string | undefined;
        if (completion) {
          const d = new Date();
          d.setHours(14, 15, 0, 0);
          completedAt = format(d, "h:mm a");
        }
        return {
          id: h.id,
          name: h.name,
          completed,
          streak: getHabitStreak(h.id),
          targetTime: h.targetTime,
          duration: h.duration,
          completedAt,
        };
      })
      .sort((a, b) =>
        a.completed === b.completed ? b.streak - a.streak : a.completed ? 1 : -1,
      );
  }, [habits, today, getHabitStreak]);

  const activeGoals = useMemo(() => {
    return goals
      .filter((g) => g.status === "active")
      .sort((a, b) => {
        const risk = (g: { progress: number }) =>
          g.progress >= 60 ? 0 : g.progress >= 40 ? 1 : 2;
        return risk(a) - risk(b);
      });
  }, [goals]);

  const goalStats = useMemo(() => getGoalStats(), [getGoalStats, goals]);
  const onTrackPct =
    goalStats.total > 0
      ? Math.round(
        (goals.filter((g) => g.status === "active" && g.progress >= 60).length /
          Math.max(goalStats.inProgress, 1)) *
        100,
      )
      : 0;

  const quickStats = useMemo((): StatCardPayload => {
    const timeStats = getTodayStats();
    const totalPending = todayTasks.filter((t) => t.status !== "completed").length;
    const done = completedToday.length;
    const total = totalPending + done;
    const taskPct = total > 0 ? Math.round((done / total) * 100) : 0;
    const habitsDone = todayHabits.filter((h) => h.completed).length;
    const bestHabitStreak = Math.max(0, ...todayHabits.map((h) => h.streak));
    const onTrack = goals.filter((g) => g.status === "active" && g.progress >= 60).length;
    const atRisk = goals.filter(
      (g) => g.status === "active" && g.progress >= 40 && g.progress < 60,
    ).length;
    const behind = goals.filter(
      (g) => g.status === "active" && g.progress < 40,
    ).length;
    const totalG = onTrack + atRisk + behind;
    const segments =
      totalG > 0
        ? {
          green: Math.round((onTrack / totalG) * 100),
          yellow: Math.round((atRisk / totalG) * 100),
          red: Math.round((behind / totalG) * 100),
        }
        : undefined;

    return {
      tasks: {
        done,
        total,
        pct: taskPct,
      },
      habits: {
        count: todayHabits.length,
        bestStreak: bestHabitStreak,
      },
      goals: {
        inProgress: goalStats.inProgress,
        onTrackPct:
          goalStats.inProgress > 0
            ? Math.round(
              (goals.filter((g) => g.status === "active" && g.progress >= 60).length /
                goalStats.inProgress) *
              100,
            )
            : 0,
        segments,
      },
      focus: {
        minutes: timeStats.totalMinutes,
        sessions: timeStats.entries.length,
        goalMinutes: 240,
      },
    };
  }, [
    todayTasks,
    completedToday,
    todayHabits,
    goals,
    goalStats,
    getTodayStats,
  ]);

  const upcomingBlocks = useMemo(() => {
    const raw = settings?.plannerBlocks as
      | Array<{
        id: string;
        title: string;
        date: string;
        type: string;
        startHour: number;
        startMinute: number;
        endHour: number;
        endMinute: number;
        notes?: string;
        completed?: boolean;
      }>
      | undefined;
    if (!Array.isArray(raw)) return [];
    return buildUpcomingBlocksFromPlanner(raw, today);
  }, [settings?.plannerBlocks, today]);

  const weekStart = startOfWeek(new Date(), {
    weekStartsOn: settings?.preferences?.startOfWeek === "sunday" ? 0 : 1,
  });
  const weekDates = Array.from({ length: 7 }, (_, i) =>
    format(addDays(weekStart, i), "yyyy-MM-dd"),
  );
  const weeklyTimeEntries = useMemo(
    () =>
      timeEntries.filter((e) => e.date && weekDates.includes(e.date)),
    [timeEntries, weekDates],
  );

  const todayJournal = useMemo(
    () => journalEntries.find((e) => e.date === today) ?? null,
    [journalEntries, today],
  );

  const journalStreakDays = useMemo(() => {
    let count = 0;
    let d = new Date();
    for (let i = 0; i < 365; i++) {
      const dateStr = format(d, "yyyy-MM-dd");
      const hasEntry = journalEntries.some(
        (e) => e.date === dateStr && (e.content?.trim().length ?? 0) > 0,
      );
      if (!hasEntry) break;
      count++;
      d = addDays(d, -1);
    }
    return count;
  }, [journalEntries]);

  const overdueCount = useMemo(
    () => tasks.filter((t) => t.dueDate && t.dueDate < today && t.status !== "completed").length,
    [tasks, today],
  );

  const handleQuickTask = () => {
    if (!quickTaskTitle.trim()) return;
    addTask({
      title: quickTaskTitle.trim(),
      domain: "personal",
      priority: quickTaskPriority,
      status: "todo",
      dueDate: today,
      scheduledFor: "today",
    });
    setQuickTaskTitle("");
    setShowQuickTask(false);
  };

  const toggleTask = (id: string) => {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    t.status === "completed" ? uncompleteTask(id) : completeTask(id);
  };

  if (!mounted) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-[var(--color-border)] border-t-[var(--color-text-primary)] rounded-full"
          />
        </div>
      </AppLayout>
    );
  }

  const timeStats = getTodayStats();
  const habitStreakMax =
    todayHabits.length > 0 ? Math.max(...todayHabits.map((h) => h.streak)) : 0;

  return (
    <AppLayout>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 pb-8 pt-0 sm:pt-6"
      >
        <motion.section variants={item} className="mb-4 sm:mb-10">
          <GreetingHeader onAddTask={() => setShowQuickTask(true)} />
        </motion.section>

        <motion.section variants={item} className="mb-8">
          <QuickStatsRow stats={quickStats} />
        </motion.section>

        {/* Symmetric 2×3 grid: 3 left, 3 right */}
        <motion.section
          variants={item}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10"
          style={{ gridAutoRows: "minmax(280px, 1fr)" }}
        >
          <div className="min-h-[280px] h-full">
            <WidgetTodayTasks
              tasks={todayTasks.filter((t) => t.status !== "completed") as Task[]}
              completedToday={completedToday}
              onToggle={toggleTask}
              onQuickAdd={() => setShowQuickTask(true)}
            />
          </div>
          <div className="min-h-[280px] h-full">
            <WidgetGoalsOverview
              goals={activeGoals}
              onTrackPct={onTrackPct}
            />
          </div>

          <div className="min-h-[280px] h-full">
            <WidgetTodayHabits
              habits={todayHabits}
              onToggle={(id) => completeHabit(id, today)}
              today={today}
            />
          </div>
          <div className="min-h-[280px] h-full">
            <WidgetWeeklyFocus
              timeEntries={weeklyTimeEntries}
              startOfWeekSetting={settings?.preferences?.startOfWeek}
            />
          </div>

          <div className="min-h-[280px] h-full">
            <WidgetNextUp blocks={upcomingBlocks} />
          </div>
          <div className="min-h-[280px] h-full">
            <WidgetJournalPrompt
              todayEntry={todayJournal}
              journalStreakDays={journalStreakDays}
            />
          </div>
        </motion.section>

        <motion.section
          variants={item}
          className="pt-6 border-t border-[var(--border-subtle)] mb-6"
        >
          <DashboardQuickNav />
        </motion.section>

        {/* Day progress */}
        <motion.section variants={item} className="pb-0">
          <DayProgress />
        </motion.section>
      </motion.div>

      <Dialog open={showQuickTask} onOpenChange={setShowQuickTask}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Add Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-3">
            <Input
              placeholder="What needs to be done?"
              value={quickTaskTitle}
              onChange={(e) => setQuickTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleQuickTask()}
              autoFocus
            />
            <Select
              value={quickTaskPriority}
              onValueChange={(v: "medium" | "high" | "critical") =>
                setQuickTaskPriority(v)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuickTask(false)}>
              Cancel
            </Button>
            <Button onClick={handleQuickTask} disabled={!quickTaskTitle.trim()}>
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
