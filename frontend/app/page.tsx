"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { useApp } from "@/lib/context/app-context";
import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { format, startOfWeek, addDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { GreetingHeader } from "@/components/dashboard/greeting-header";
import { QuickStatsRow, type StatCardPayload } from "@/components/dashboard/quick-stats-row";
import { WidgetTodayTasks } from "@/components/dashboard/widget-today-tasks";
import { WidgetTodayHabits, type HabitWithStreak } from "@/components/dashboard/widget-today-habits";
import {
  WidgetNextUp,
  buildUpcomingBlocksFromPlanner,
} from "@/components/dashboard/widget-next-up";
import { WidgetTodayExpense } from "@/components/dashboard/widget-today-expense";
import { WidgetJournalPrompt } from "@/components/dashboard/widget-journal-prompt";
import { DashboardQuickNav } from "@/components/dashboard/dashboard-quick-nav";
import { DayProgress } from "@/components/dashboard/day-progress";
import { DashboardDailySummary } from "@/components/dashboard/dashboard-ai-insight";
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
    journalEntries,
    transactions,
    settings,
    addTask,
    completeTask,
    uncompleteTask,
    completeHabit,
    getHabitStreak,
    getTodayStats,
  } = useApp();

  const [mounted, setMounted] = useState(false);


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


  const quickStats = useMemo((): StatCardPayload => {
    const timeStats = getTodayStats();
    const totalPending = todayTasks.filter((t) => t.status !== "completed").length;
    const done = completedToday.length;
    const total = totalPending + done;
    const taskPct = total > 0 ? Math.round((done / total) * 100) : 0;
    const habitsDone = todayHabits.filter((h) => h.completed).length;
    const bestHabitStreak = Math.max(0, ...todayHabits.map((h) => h.streak));

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
        inProgress: 0,
        onTrackPct: 0,
        segments: undefined,
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



  const toggleTask = (id: string) => {
    const t = tasks.find((x) => x.id === id);
    if (!t) return;
    t.status === "completed" ? uncompleteTask(id) : completeTask(id);
  };

  if (!mounted) return null;

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
          <GreetingHeader />
        </motion.section>

        <motion.section variants={item} className="mb-8">
          <QuickStatsRow stats={quickStats} />
        </motion.section>

        {/* 2×2 widget grid */}
        <motion.section
          variants={item}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6"
          style={{ gridAutoRows: "minmax(280px, 1fr)" }}
        >
          <div className="min-h-[280px] h-full">
            <WidgetTodayTasks
              tasks={todayTasks.filter((t) => t.status !== "completed") as Task[]}
              completedToday={completedToday}
              onToggle={toggleTask}
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
            <WidgetTodayExpense
              transactions={transactions}
              today={today}
            />
          </div>
          <div className="min-h-[280px] h-full">
            <WidgetJournalPrompt
              todayEntry={todayJournal}
              journalStreakDays={journalStreakDays}
            />
          </div>
        </motion.section>

        {/* AI Daily Summary — full width */}
        <motion.section variants={item} className="mb-6">
          <DashboardDailySummary
            completedTaskTitles={completedToday.map(t => t.title)}
            completedHabitNames={todayHabits.filter(h => h.completed).map(h => h.name)}
            habitStreak={habitStreakMax}
            focusMinutes={timeStats.totalMinutes}
            overdueCount={overdueCount}
            pendingTaskCount={todayTasks.filter(t => t.status !== "completed").length}
          />
        </motion.section>

        <motion.section
          variants={item}
          className="pt-6 border-t border-[var(--border-subtle)] mb-6"
        >
          <DashboardQuickNav />
        </motion.section>

        <motion.section variants={item} className="pb-0">
          <DayProgress />
        </motion.section>
      </motion.div>
    </AppLayout>
  );
}
