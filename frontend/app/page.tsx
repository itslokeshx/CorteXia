"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { useApp } from "@/lib/context/app-context";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format, parseISO, isToday, differenceInDays } from "date-fns";
import {
  CheckCircle2,
  Clock,
  Flame,
  Target,
  Calendar,
  Sparkles,
  Plus,
  Timer,
  Play,
  DollarSign,
  StickyNote,
  Zap,
  Award,
  ChevronRight,
  Brain,
  BookOpen,
  ArrowUpRight,
  Sun,
  Moon,
  CloudSun,
  Sunset,
  CircleDot,
  BarChart3,
  Pen,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

// ═══ ANIMATION VARIANTS ═══
const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
} as const;

const item = {
  hidden: { opacity: 0, y: 12 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 30,
    },
  },
} as const;

// ═══ MOTIVATIONAL LINES ═══
const MOTTOS = [
  "Small steps compound into extraordinary results.",
  "Focus on progress, not perfection.",
  "The best time to start is now.",
  "Discipline is choosing what you want most over what you want now.",
  "Your future self will thank you.",
  "Consistency beats intensity.",
  "One task at a time. One day at a time.",
  "Build the life you don't need a vacation from.",
  "Energy flows where attention goes.",
  "You're closer than you think.",
];

export default function DashboardPage() {
  const router = useRouter();
  const {
    tasks,
    habits,
    goals,
    journalEntries,
    addTask,
    addJournalEntry,
    updateJournalEntry,
    completeTask,
    uncompleteTask,
    completeHabit,
    getHabitStreak,
    getFinanceStats,
    getTodayStats,
    getGoalStats,
  } = useApp();

  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const today = format(new Date(), "yyyy-MM-dd");

  // Quick add
  const [showQuickTask, setShowQuickTask] = useState(false);
  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const [quickTaskPriority, setQuickTaskPriority] = useState<
    "medium" | "high" | "critical"
  >("high");


  // Daily motto — stable per day
  const dailyMotto = useMemo(() => {
    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      86400000,
    );
    return MOTTOS[dayOfYear % MOTTOS.length];
  }, []);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // ═══ GREETING ═══
  const greeting = useMemo(() => {
    const h = currentTime.getHours();
    if (h < 5) return { text: "Still up?", Icon: Moon };
    if (h < 12) return { text: "Good morning", Icon: Sun };
    if (h < 17) return { text: "Good afternoon", Icon: CloudSun };
    if (h < 21) return { text: "Good evening", Icon: Sunset };
    return { text: "Good night", Icon: Moon };
  }, [currentTime]);

  // ═══ TODAY'S TASKS ═══
  const todayTasks = useMemo(() => {
    return tasks
      .filter((t) => {
        if (t.status === "completed") return false;
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
        return (order[a.priority] ?? 2) - (order[b.priority] ?? 2);
      })
      .slice(0, 6);
  }, [tasks, today]);

  // ═══ COMPLETED TODAY ═══
  const completedToday = useMemo(
    () =>
      tasks.filter(
        (t) => t.status === "completed" && t.completedAt?.startsWith(today),
      ),
    [tasks, today],
  );

  // ═══ TODAY'S HABITS ═══
  const todayHabits = useMemo(() => {
    return habits
      .filter((h) => h.active !== false)
      .map((h) => ({
        ...h,
        completed:
          h.completions?.some((c) => c.date === today && c.completed) || false,
        streak: getHabitStreak(h.id),
      }))
      .sort((a, b) =>
        a.completed === b.completed
          ? b.streak - a.streak
          : a.completed
            ? 1
            : -1,
      )
      .slice(0, 6);
  }, [habits, today, getHabitStreak]);

  // ═══ ACTIVE GOALS ═══
  const activeGoals = useMemo(() => {
    return goals
      .filter((g) => g.status === "active")
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 3);
  }, [goals]);

  // ═══ RECENT JOURNAL ═══
  const recentJournal = useMemo(() => {
    return journalEntries
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 1)[0];
  }, [journalEntries]);

  // ═══ STATS ═══
  const stats = useMemo(() => {
    const totalPending = todayTasks.length;
    const done = completedToday.length;
    const total = totalPending + done;
    const habitsCount = todayHabits.length;
    const habitsDone = todayHabits.filter((h) => h.completed).length;
    const timeStats = getTodayStats();
    const goalStats = getGoalStats();

    return {
      done,
      total,
      taskPct: total > 0 ? Math.round((done / total) * 100) : 0,
      habitsDone,
      habitsCount,
      habitPct:
        habitsCount > 0 ? Math.round((habitsDone / habitsCount) * 100) : 0,
      focusMins: timeStats.totalMinutes,
      goalsDone: goalStats.completed,
      goalsTotal: goalStats.total,
    };
  }, [todayTasks, completedToday, todayHabits, getTodayStats, getGoalStats]);

  // ═══ HANDLERS ═══
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

  // ═══ LOADING ═══
  if (!mounted) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Brain className="w-6 h-6 text-[var(--color-text-tertiary)]" />
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  const GIcon = greeting.Icon;
  const priorityDot: Record<string, string> = {
    critical: "bg-red-500",
    high: "bg-orange-500",
    medium: "bg-yellow-500",
    low: "bg-[var(--color-text-tertiary)]",
  };

  return (
    <AppLayout>
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-8 pb-24 max-w-5xl mx-auto px-3 sm:px-6"
      >
        {/* ──────────────────────────────────────────────────────────────
            GREETING
        ────────────────────────────────────────────────────────────── */}
        <motion.section variants={item} className="pt-2">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <GIcon className="w-5 h-5 text-[var(--color-text-tertiary)]" />
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
                  {greeting.text}
                </h1>
              </div>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                {format(currentTime, "EEEE, MMMM d")} ·{" "}
                {format(currentTime, "h:mm a")}
              </p>
            </div>

            {/* Quick add buttons */}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => setShowQuickTask(true)}
                className="gap-1.5 h-9 px-3.5 rounded-lg"
              >
                <Plus className="w-3.5 h-3.5" /> Task
              </Button>

            </div>
          </div>

          {/* Motto */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-3 text-[13px] italic text-[var(--color-text-tertiary)] leading-relaxed"
          >
            "{dailyMotto}"
          </motion.p>
        </motion.section>

        {/* ──────────────────────────────────────────────────────────────
            DAILY OVERVIEW — compact stat row
        ────────────────────────────────────────────────────────────── */}
        <motion.section variants={item}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              {
                label: "Tasks",
                value: `${stats.done}/${stats.total}`,
                sub: `${stats.taskPct}% done`,
                accent: "text-blue-600 dark:text-blue-400",
                bg: "bg-blue-50 dark:bg-blue-950/30",
                icon: CheckCircle2,
              },
              {
                label: "Habits",
                value: `${stats.habitsDone}/${stats.habitsCount}`,
                sub: `${stats.habitPct}% done`,
                accent: "text-emerald-600 dark:text-emerald-400",
                bg: "bg-emerald-50 dark:bg-emerald-950/30",
                icon: Flame,
              },
              {
                label: "Focus",
                value: `${stats.focusMins}m`,
                sub:
                  stats.focusMins >= 120
                    ? "Excellent"
                    : stats.focusMins >= 60
                      ? "Good"
                      : "Get started",
                accent: "text-purple-600 dark:text-purple-400",
                bg: "bg-purple-50 dark:bg-purple-950/30",
                icon: Timer,
              },
              {
                label: "Goals",
                value: `${stats.goalsDone}/${stats.goalsTotal}`,
                sub:
                  stats.goalsTotal > 0
                    ? `${Math.round((stats.goalsDone / stats.goalsTotal) * 100)}%`
                    : "None set",
                accent: "text-amber-600 dark:text-amber-400",
                bg: "bg-amber-50 dark:bg-amber-950/30",
                icon: Target,
              },
            ].map((s) => (
              <div
                key={s.label}
                className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] transition-colors"
              >
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center",
                      s.bg,
                    )}
                  >
                    <s.icon className={cn("w-3.5 h-3.5", s.accent)} />
                  </div>
                  <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                    {s.label}
                  </span>
                </div>
                <p className="text-xl font-semibold text-[var(--color-text-primary)] tracking-tight">
                  {s.value}
                </p>
                <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">
                  {s.sub}
                </p>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ──────────────────────────────────────────────────────────────
            TODAY'S TASKS
        ────────────────────────────────────────────────────────────── */}
        <motion.section variants={item} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
              Priorities
            </h2>
            <Link
              href="/tasks"
              className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] flex items-center gap-0.5 transition-colors"
            >
              All tasks <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          {todayTasks.length > 0 ? (
            <div className="space-y-1">
              {todayTasks.map((task, i) => {
                const overdue = task.dueDate ? task.dueDate < today : false;
                return (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="group flex items-center gap-3 py-2.5 px-3 -mx-3 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="w-[18px] h-[18px] rounded-full border-[1.5px] border-[var(--color-border)] hover:border-[var(--color-text-secondary)] flex items-center justify-center flex-shrink-0 transition-colors"
                    >
                      {task.status === "completed" && (
                        <CheckCircle2 className="w-[18px] h-[18px] text-[var(--color-success)]" />
                      )}
                    </button>

                    {/* Priority dot */}
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full flex-shrink-0",
                        priorityDot[task.priority] ?? "bg-gray-400",
                      )}
                    />

                    {/* Title */}
                    <span className="flex-1 text-sm text-[var(--color-text-primary)] truncate">
                      {task.title}
                    </span>

                    {/* Meta */}
                    {overdue && (
                      <span className="text-[10px] font-medium text-red-500 flex-shrink-0">
                        Overdue
                      </span>
                    )}
                    {task.dueDate === today && !overdue && (
                      <span className="text-[10px] text-[var(--color-text-tertiary)] flex-shrink-0">
                        Today
                      </span>
                    )}

                    {/* Quick timer */}
                    <button
                      onClick={() =>
                        router.push(`/time-tracker?taskId=${task.id}`)
                      }
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--color-bg-tertiary)] transition-all flex-shrink-0"
                    >
                      <Play className="w-3 h-3 text-[var(--color-text-tertiary)]" />
                    </button>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="py-10 text-center rounded-xl border border-dashed border-[var(--color-border)]">
              <CheckCircle2 className="w-8 h-8 mx-auto text-[var(--color-success)] mb-2" />
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                All clear
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                No priority tasks for today
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowQuickTask(true)}
                className="mt-3 h-8 gap-1.5 text-xs"
              >
                <Plus className="w-3 h-3" /> Add task
              </Button>
            </div>
          )}

          {/* Completed today */}
          {completedToday.length > 0 && (
            <div className="pt-1">
              <p className="text-[11px] font-medium text-[var(--color-text-tertiary)] mb-1.5">
                Completed today · {completedToday.length}
              </p>
              <div className="space-y-0.5">
                {completedToday.slice(0, 3).map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center gap-3 py-1.5 px-3 -mx-3"
                  >
                    <CheckCircle2 className="w-[18px] h-[18px] text-[var(--color-success)] flex-shrink-0" />
                    <span className="text-sm text-[var(--color-text-tertiary)] line-through truncate">
                      {t.title}
                    </span>
                  </div>
                ))}
                {completedToday.length > 3 && (
                  <p className="text-[11px] text-[var(--color-text-tertiary)] pl-8">
                    +{completedToday.length - 3} more
                  </p>
                )}
              </div>
            </div>
          )}
        </motion.section>

        {/* ──────────────────────────────────────────────────────────────
            HABITS
        ────────────────────────────────────────────────────────────── */}
        {todayHabits.length > 0 && (
          <motion.section variants={item} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
                Habits
              </h2>
              <Link
                href="/habits"
                className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] flex items-center gap-0.5 transition-colors"
              >
                All habits <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {todayHabits.map((habit, i) => (
                <motion.button
                  key={habit.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() =>
                    !habit.completed && completeHabit(habit.id, today)
                  }
                  disabled={habit.completed}
                  className={cn(
                    "relative p-3.5 rounded-xl border text-left transition-all",
                    habit.completed
                      ? "border-[var(--color-success)]/20 bg-[var(--color-success)]/5"
                      : "border-[var(--color-border)] bg-[var(--color-bg-primary)] hover:border-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-secondary)]",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={cn(
                        "text-[13px] font-medium leading-snug",
                        habit.completed
                          ? "text-[var(--color-text-tertiary)]"
                          : "text-[var(--color-text-primary)]",
                      )}
                    >
                      {habit.name}
                    </p>
                    {habit.completed && (
                      <CheckCircle2 className="w-4 h-4 text-[var(--color-success)] flex-shrink-0 mt-0.5" />
                    )}
                  </div>

                  {habit.streak > 0 && (
                    <div className="flex items-center gap-1 mt-2">
                      <Flame className="w-3 h-3 text-orange-500" />
                      <span className="text-[11px] font-medium text-[var(--color-text-tertiary)]">
                        {habit.streak}d
                      </span>
                    </div>
                  )}
                </motion.button>
              ))}
            </div>
          </motion.section>
        )}

        {/* ──────────────────────────────────────────────────────────────
            GOALS & JOURNAL — two-col
        ────────────────────────────────────────────────────────────── */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* GOALS */}
          {activeGoals.length > 0 && (
            <motion.section variants={item} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
                  Goals
                </h2>
                <Link
                  href="/goals"
                  className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] flex items-center gap-0.5 transition-colors"
                >
                  All goals <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-2">
                {activeGoals.map((goal, i) => (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2.5">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                        {goal.title}
                      </p>
                      <span className="text-xs font-semibold tabular-nums text-[var(--color-text-secondary)] flex-shrink-0">
                        {goal.progress}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${goal.progress}%` }}
                        transition={{
                          duration: 0.8,
                          delay: i * 0.1,
                          ease: "easeOut",
                        }}
                        className="h-full bg-[var(--color-text-primary)] rounded-full"
                      />
                    </div>
                    {goal.targetDate && (
                      <p className="text-[11px] text-[var(--color-text-tertiary)] mt-2">
                        {differenceInDays(
                          parseISO(goal.targetDate),
                          new Date(),
                        )}{" "}
                        days remaining
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {/* JOURNAL SNAPSHOT */}
          <motion.section variants={item} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
                Journal
              </h2>
              <Link
                href="/journal"
                className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] flex items-center gap-0.5 transition-colors"
              >
                Open <ChevronRight className="w-3 h-3" />
              </Link>
            </div>

            {recentJournal ? (
              <Link
                href="/journal"
                className="block p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-secondary)] transition-colors group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-[var(--color-text-tertiary)]">
                    {recentJournal.date === today
                      ? "Today"
                      : format(parseISO(recentJournal.date), "MMM d")}
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-[var(--color-text-tertiary)] group-hover:text-[var(--color-text-primary)] transition-colors" />
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] line-clamp-3 leading-relaxed">
                  {recentJournal.content
                    ? recentJournal.content.slice(0, 180) +
                    (recentJournal.content.length > 180 ? "…" : "")
                    : "No entry yet."}
                </p>
                {recentJournal.mood && (
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t border-[var(--color-border)]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-[var(--color-text-tertiary)]">
                        Mood
                      </span>
                      <span className="text-xs font-medium text-[var(--color-text-primary)]">
                        {recentJournal.mood}/10
                      </span>
                    </div>
                    {recentJournal.energy && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-[var(--color-text-tertiary)]">
                          Energy
                        </span>
                        <span className="text-xs font-medium text-[var(--color-text-primary)]">
                          {recentJournal.energy}/10
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </Link>
            ) : (
              <button
                onClick={() => router.push("/journal")}
                className="w-full p-6 rounded-xl border border-dashed border-[var(--color-border)] hover:border-[var(--color-text-tertiary)] bg-[var(--color-bg-primary)] text-center transition-colors"
              >
                <BookOpen className="w-6 h-6 mx-auto text-[var(--color-text-tertiary)] mb-2" />
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Start today's entry
                </p>
              </button>
            )}
          </motion.section>
        </div>

        {/* ──────────────────────────────────────────────────────────────
            NAVIGATE — minimal link grid
        ────────────────────────────────────────────────────────────── */}
        <motion.section variants={item} className="space-y-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
            Navigate
          </h2>
          <div className="grid grid-cols-4 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {[
              {
                icon: Calendar,
                label: "Planner",
                href: "/day-planner",
                accent: "text-blue-600 dark:text-blue-400",
                bg: "bg-blue-50 dark:bg-blue-950/30",
              },
              {
                icon: Timer,
                label: "Timer",
                href: "/time-tracker",
                accent: "text-purple-600 dark:text-purple-400",
                bg: "bg-purple-50 dark:bg-purple-950/30",
              },
              {
                icon: Brain,
                label: "AI Coach",
                href: "/ai-coach",
                accent: "text-orange-600 dark:text-orange-400",
                bg: "bg-orange-50 dark:bg-orange-950/30",
              },
              {
                icon: DollarSign,
                label: "Finance",
                href: "/finance",
                accent: "text-emerald-600 dark:text-emerald-400",
                bg: "bg-emerald-50 dark:bg-emerald-950/30",
              },
              {
                icon: Target,
                label: "Goals",
                href: "/goals",
                accent: "text-amber-600 dark:text-amber-400",
                bg: "bg-amber-50 dark:bg-amber-950/30",
              },
              {
                icon: Clock,
                label: "Timeline",
                href: "/timeline",
                accent: "text-pink-600 dark:text-pink-400",
                bg: "bg-pink-50 dark:bg-pink-950/30",
              },
              {
                icon: BarChart3,
                label: "Insights",
                href: "/insights",
                accent: "text-indigo-600 dark:text-indigo-400",
                bg: "bg-indigo-50 dark:bg-indigo-950/30",
              },
              {
                icon: Sparkles,
                label: "Journal",
                href: "/journal",
                accent: "text-teal-600 dark:text-teal-400",
                bg: "bg-teal-50 dark:bg-teal-950/30",
              },
            ].map((a, i) => (
              <motion.button
                key={a.label}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + i * 0.02 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => router.push(a.href)}
                className="flex flex-col items-center gap-1.5 py-3.5 px-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-text-tertiary)] transition-all"
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center",
                    a.bg,
                  )}
                >
                  <a.icon className={cn("w-4 h-4", a.accent)} />
                </div>
                <span className="text-[10px] sm:text-xs font-medium text-[var(--color-text-secondary)]">
                  {a.label}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.section>

        {/* ──────────────────────────────────────────────────────────────
            DAY PROGRESS BAR — bottom subtle indicator
        ────────────────────────────────────────────────────────────── */}
        <motion.section variants={item}>
          <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)]">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                Day progress
              </span>
              <span className="text-xs tabular-nums text-[var(--color-text-tertiary)]">
                {format(currentTime, "h:mm a")}
              </span>
            </div>
            <div className="w-full h-1.5 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.round(((currentTime.getHours() * 60 + currentTime.getMinutes()) / 1440) * 100)}%`,
                }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-[var(--color-text-primary)] rounded-full opacity-40"
              />
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-[var(--color-text-tertiary)]">
                12 AM
              </span>
              <span className="text-[10px] text-[var(--color-text-tertiary)]">
                {Math.round(
                  ((currentTime.getHours() * 60 + currentTime.getMinutes()) /
                    1440) *
                  100,
                )}
                % of day elapsed
              </span>
              <span className="text-[10px] text-[var(--color-text-tertiary)]">
                11:59 PM
              </span>
            </div>
          </div>
        </motion.section>
      </motion.div>

      {/* ──────────────────────────────────────────────────────────────
          MODALS
      ────────────────────────────────────────────────────────────── */}
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
              onValueChange={(v: any) => setQuickTaskPriority(v)}
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
