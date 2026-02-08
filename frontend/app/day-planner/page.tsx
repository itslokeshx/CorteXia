"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { useApp } from "@/lib/context/app-context";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  format,
  addDays,
  subDays,
  isToday as isTodayFn,
  isSameDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  getDay,
} from "date-fns";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Clock,
  Layers,
  Coffee,
  Timer,
  BarChart3,
  CheckCircle2,
  Zap,
  Check,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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

// ─── Types ──────────────────────────────────────────────────────────────────

interface PlannerBlock {
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
}

// ─── Block Type Config ──────────────────────────────────────────────────────

const BLOCK_TYPES: Record<
  string,
  { label: string; color: string; gradient: string; border: string }
> = {
  task: {
    label: "Task",
    color: "#3B82F6",
    gradient: "from-blue-500/15 to-blue-600/10",
    border: "border-blue-500",
  },
  habit: {
    label: "Habit",
    color: "#10B981",
    gradient: "from-green-500/15 to-green-600/10",
    border: "border-green-500",
  },
  meeting: {
    label: "Meeting",
    color: "#8B5CF6",
    gradient: "from-purple-500/15 to-purple-600/10",
    border: "border-purple-500",
  },
  break: {
    label: "Break",
    color: "#F59E0B",
    gradient: "from-amber-500/15 to-amber-600/10",
    border: "border-amber-500",
  },
  deep_work: {
    label: "Deep Work",
    color: "#6366F1",
    gradient: "from-indigo-500/15 to-indigo-600/10",
    border: "border-indigo-500",
  },
  shallow_work: {
    label: "Shallow Work",
    color: "#06B6D4",
    gradient: "from-cyan-500/15 to-cyan-600/10",
    border: "border-cyan-500",
  },
  personal: {
    label: "Personal",
    color: "#EC4899",
    gradient: "from-pink-500/15 to-pink-600/10",
    border: "border-pink-500",
  },
  blocked: {
    label: "Blocked",
    color: "#EF4444",
    gradient: "from-red-500/15 to-red-600/10",
    border: "border-red-500",
  },
};

// Full 24 hours: 12 AM (0) to 11 PM (23)
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function formatHour12(hour: number): string {
  if (hour === 0 || hour === 24) return "12 AM";
  if (hour === 12) return "12 PM";
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

function formatTime12(hour: number, minute: number): string {
  const h = hour % 12 || 12;
  const m = minute.toString().padStart(2, "0");
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h}:${m} ${ampm}`;
}

type ViewMode = "day" | "month";

// ─── Page Component ─────────────────────────────────────────────────────────

export default function DayPlannerPage() {
  const { habits, completeHabit, getHabitStreak, settings, updateSettings } =
    useApp();
  const [timeBlocks, setTimeBlocks] = useState<PlannerBlock[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [createOpen, setCreateOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("day");
  const [monthDate, setMonthDate] = useState(new Date());
  const gridRef = useRef<HTMLDivElement>(null);
  const [newBlock, setNewBlock] = useState({
    title: "",
    type: "task",
    startTime: "09:00",
    endTime: "10:00",
    notes: "",
  });

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const isToday = isTodayFn(selectedDate);
  const isInitialMount = useRef(true);

  // ─── Persistence (via MongoDB settings) ────────────────────────────────

  // Load planner blocks from settings (re-runs when settings hydrate from MongoDB)
  const isLoadingFromSettings = useRef(false);
  useEffect(() => {
    if (settings?.plannerBlocks && Array.isArray(settings.plannerBlocks)) {
      isLoadingFromSettings.current = true;
      setTimeBlocks(settings.plannerBlocks as unknown as PlannerBlock[]);
      // Allow the save effect to skip this state update
      requestAnimationFrame(() => {
        isLoadingFromSettings.current = false;
      });
    }
    const timer = setTimeout(() => {
      isInitialMount.current = false;
    }, 100);
    return () => clearTimeout(timer);
  }, [settings?.plannerBlocks]);

  // Save planner blocks to MongoDB when they change (skip if loading from settings)
  useEffect(() => {
    if (isInitialMount.current || isLoadingFromSettings.current) return;
    updateSettings({
      plannerBlocks: timeBlocks as unknown as Record<string, unknown>[],
    });
  }, [timeBlocks, updateSettings]);

  // Listen for planner-blocks-updated event from other pages
  useEffect(() => {
    const handleCustom = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.blocks && Array.isArray(detail.blocks)) {
        // Use blocks passed directly via event detail (avoids stale settings)
        setTimeBlocks(detail.blocks as unknown as PlannerBlock[]);
      } else if (
        settings?.plannerBlocks &&
        Array.isArray(settings.plannerBlocks)
      ) {
        setTimeBlocks(settings.plannerBlocks as unknown as PlannerBlock[]);
      }
    };

    window.addEventListener("planner-blocks-updated", handleCustom);

    return () => {
      window.removeEventListener("planner-blocks-updated", handleCustom);
    };
  }, [settings]);

  // ─── Clock Tick ─────────────────────────────────────────────────────────

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  // ─── Scroll to current time ─────────────────────────────────────────────

  useEffect(() => {
    if (isToday && gridRef.current && viewMode === "day") {
      const timer = setTimeout(() => {
        if (!gridRef.current) return;
        const now = new Date();
        const minutes = now.getHours() * 60 + now.getMinutes();
        const offset = (minutes / 60) * 64;
        gridRef.current.scrollTo({
          top: Math.max(offset - 200, 0),
          behavior: "smooth",
        });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isToday, viewMode]);

  // ─── Filtered blocks ───────────────────────────────────────────────────

  const dayBlocks = useMemo(() => {
    return timeBlocks.filter((b) => b.date === dateStr);
  }, [timeBlocks, dateStr]);

  // ─── Today's habits ────────────────────────────────────────────────────

  const todayHabits = useMemo(() => {
    return habits
      .filter((h) => h.active !== false)
      .map((h) => ({
        ...h,
        completed:
          h.completions?.some((c) => c.date === dateStr && c.completed) ||
          false,
        streak: getHabitStreak(h.id),
      }))
      .sort((a, b) =>
        a.completed === b.completed
          ? b.streak - a.streak
          : a.completed
            ? 1
            : -1,
      );
  }, [habits, dateStr, getHabitStreak]);

  // ─── Summary stats ─────────────────────────────────────────────────────

  const summaryStats = useMemo(() => {
    let totalMinutes = 0;
    const typeCounts: Record<string, { count: number; minutes: number }> = {};

    dayBlocks.forEach((b) => {
      const dur =
        b.endHour * 60 +
        (b.endMinute || 0) -
        (b.startHour * 60 + (b.startMinute || 0));
      totalMinutes += Math.max(dur, 0);
      if (!typeCounts[b.type]) typeCounts[b.type] = { count: 0, minutes: 0 };
      typeCounts[b.type].count += 1;
      typeCounts[b.type].minutes += Math.max(dur, 0);
    });

    const totalHours = totalMinutes / 60;
    const freeHours = 24 - totalHours;
    const completedBlocks = dayBlocks.filter((b) => b.completed).length;

    return { totalHours, freeHours, totalMinutes, typeCounts, completedBlocks };
  }, [dayBlocks]);

  // ─── CRUD ───────────────────────────────────────────────────────────────

  const addTimeBlock = useCallback((block: Omit<PlannerBlock, "id">) => {
    setTimeBlocks((prev) => [
      ...prev,
      {
        ...block,
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      },
    ]);
  }, []);

  const deleteTimeBlock = useCallback((id: string) => {
    setTimeBlocks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const toggleBlockComplete = useCallback((id: string) => {
    setTimeBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, completed: !b.completed } : b)),
    );
  }, []);

  const handleCreateBlock = () => {
    if (!newBlock.title.trim()) return;
    const [sh, sm] = newBlock.startTime.split(":").map(Number);
    const [eh, em] = newBlock.endTime.split(":").map(Number);
    addTimeBlock({
      title: newBlock.title,
      date: dateStr,
      type: newBlock.type,
      startHour: sh,
      startMinute: sm,
      endHour: eh,
      endMinute: em,
      notes: newBlock.notes || undefined,
    });
    setNewBlock({
      title: "",
      type: "task",
      startTime: "09:00",
      endTime: "10:00",
      notes: "",
    });
    setCreateOpen(false);
  };

  // ─── Current time position ──────────────────────────────────────────────

  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes();
  const currentTimeTop = (currentMinutes / 60) * 64;

  // ─── Month view data ────────────────────────────────────────────────────

  const monthDays = useMemo(() => {
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    return eachDayOfInterval({ start, end });
  }, [monthDate]);

  const getBlocksForDate = useCallback(
    (date: Date) => {
      const ds = format(date, "yyyy-MM-dd");
      return timeBlocks.filter((b) => b.date === ds);
    },
    [timeBlocks],
  );

  return (
    <AppLayout>
      <motion.div className="space-y-4 pb-12">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Day Planner
          </h1>

          <div className="flex items-center gap-2 flex-wrap">
            {/* View Toggle */}
            <div className="flex items-center gap-0.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("day")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  viewMode === "day"
                    ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
                )}
              >
                Day
              </button>
              <button
                onClick={() => setViewMode("month")}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-md transition-all",
                  viewMode === "month"
                    ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                    : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300",
                )}
              >
                Month
              </button>
            </div>

            {viewMode === "day" && (
              <>
                <div className="flex items-center gap-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-[var(--color-bg-tertiary)]"
                    onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm font-medium text-[var(--color-text-primary)] px-2 min-w-[160px] text-center select-none">
                    {format(selectedDate, "EEEE, MMMM d")}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg hover:bg-[var(--color-bg-tertiary)]"
                    onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>

                {!isToday && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 rounded-lg text-xs font-medium px-3"
                    onClick={() => setSelectedDate(new Date())}
                  >
                    Today
                  </Button>
                )}

                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2 rounded-xl bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900 shadow-sm">
                      <Plus className="w-4 h-4" /> Add Block
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Create Time Block</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                          Title
                        </label>
                        <Input
                          placeholder="What are you working on?"
                          value={newBlock.title}
                          onChange={(e) =>
                            setNewBlock({ ...newBlock, title: e.target.value })
                          }
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                          Type
                        </label>
                        <Select
                          value={newBlock.type}
                          onValueChange={(v) =>
                            setNewBlock({ ...newBlock, type: v })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(BLOCK_TYPES).map(([key, val]) => (
                              <SelectItem key={key} value={key}>
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: val.color }}
                                  />
                                  {val.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                            Start
                          </label>
                          <Input
                            type="time"
                            value={newBlock.startTime}
                            onChange={(e) =>
                              setNewBlock({
                                ...newBlock,
                                startTime: e.target.value,
                              })
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                            End
                          </label>
                          <Input
                            type="time"
                            value={newBlock.endTime}
                            onChange={(e) =>
                              setNewBlock({
                                ...newBlock,
                                endTime: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                          Notes
                        </label>
                        <textarea
                          className="flex w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm placeholder:text-[var(--color-text-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-500/40 min-h-[80px] resize-none"
                          placeholder="Optional notes..."
                          value={newBlock.notes}
                          onChange={(e) =>
                            setNewBlock({ ...newBlock, notes: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setCreateOpen(false)}
                        className="rounded-lg"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreateBlock}
                        disabled={!newBlock.title.trim()}
                        className="rounded-lg bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900"
                      >
                        Create
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}

            {viewMode === "month" && (
              <div className="flex items-center gap-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => setMonthDate(subMonths(monthDate, 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium text-[var(--color-text-primary)] px-3 min-w-[140px] text-center select-none">
                  {format(monthDate, "MMMM yyyy")}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  onClick={() => setMonthDate(addMonths(monthDate, 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* ══════════ MONTH VIEW ══════════ */}
        {viewMode === "month" && (
          <div className="space-y-3">
            <div className="grid grid-cols-7 gap-1">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div
                  key={d}
                  className="text-center text-xs font-medium text-[var(--color-text-tertiary)] py-2"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({
                length: (getDay(startOfMonth(monthDate)) + 6) % 7,
              }).map((_, i) => (
                <div key={`empty-${i}`} className="h-20 sm:h-28" />
              ))}
              {monthDays.map((day) => {
                const blocks = getBlocksForDate(day);
                const isCurrentDay = isTodayFn(day);
                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => {
                      const d = new Date(day);
                      requestAnimationFrame(() => {
                        setSelectedDate(d);
                        setViewMode("day");
                      });
                    }}
                    className={cn(
                      "h-20 sm:h-28 p-1.5 rounded-lg border text-left transition-colors active:scale-[0.97] touch-manipulation",
                      isCurrentDay
                        ? "border-gray-900 dark:border-gray-100 bg-gray-50 dark:bg-gray-800/50"
                        : "border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:border-gray-300 dark:hover:border-gray-600",
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span
                        className={cn(
                          "text-xs font-medium",
                          isCurrentDay
                            ? "text-gray-900 dark:text-gray-100 font-bold"
                            : "text-[var(--color-text-primary)]",
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      {blocks.length > 0 && (
                        <span className="text-[10px] text-[var(--color-text-tertiary)]">
                          {blocks.length}
                        </span>
                      )}
                    </div>
                    <div className="space-y-0.5 overflow-hidden">
                      {blocks.slice(0, 3).map((block) => {
                        const bt = BLOCK_TYPES[block.type] || BLOCK_TYPES.task;
                        return (
                          <div
                            key={block.id}
                            className="flex items-center gap-1 px-1 py-0.5 rounded text-[9px] truncate"
                            style={{
                              backgroundColor: bt.color + "15",
                              borderLeft: `2px solid ${bt.color}`,
                            }}
                          >
                            <span className="truncate text-[var(--color-text-primary)]">
                              {block.title}
                            </span>
                          </div>
                        );
                      })}
                      {blocks.length > 3 && (
                        <span className="text-[9px] text-[var(--color-text-tertiary)] px-1">
                          +{blocks.length - 3} more
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════ DAY VIEW ══════════ */}
        {viewMode === "day" && (
          <>
            {/* Summary bar */}
            <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
              <div className="flex items-center gap-6 flex-wrap">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-purple-500" />
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    <span className="font-semibold text-[var(--color-text-primary)]">
                      {summaryStats.totalHours.toFixed(1)}h
                    </span>{" "}
                    scheduled
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Coffee className="w-3.5 h-3.5 text-green-500" />
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    <span className="font-semibold text-[var(--color-text-primary)]">
                      {Math.max(summaryStats.freeHours, 0).toFixed(1)}h
                    </span>{" "}
                    free
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-blue-500" />
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    <span className="font-semibold text-[var(--color-text-primary)]">
                      {dayBlocks.length}
                    </span>{" "}
                    blocks
                  </span>
                </div>
                <div className="w-px h-4 bg-[var(--color-border)]" />
                <div className="flex items-center gap-3 flex-wrap">
                  {Object.entries(summaryStats.typeCounts).map(
                    ([type, data]) => {
                      const bt = BLOCK_TYPES[type] || BLOCK_TYPES.task;
                      return (
                        <div key={type} className="flex items-center gap-1.5">
                          <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: bt.color }}
                          />
                          <span className="text-xs text-[var(--color-text-tertiary)]">
                            {bt.label}{" "}
                            <span className="font-medium text-[var(--color-text-secondary)]">
                              ×{data.count}
                            </span>
                          </span>
                        </div>
                      );
                    },
                  )}
                  {dayBlocks.length === 0 && (
                    <span className="text-xs text-[var(--color-text-tertiary)]">
                      No blocks yet
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Habits section */}
            {todayHabits.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                    Habits
                  </h3>
                  <span className="text-xs text-[var(--color-text-tertiary)]">
                    {todayHabits.filter((h) => h.completed).length}/
                    {todayHabits.length}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {todayHabits.map((habit) => (
                    <button
                      key={habit.id}
                      onClick={() => completeHabit(habit.id, dateStr)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-all",
                        habit.completed
                          ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                          : "bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-gray-300 dark:hover:border-gray-600",
                      )}
                    >
                      <div
                        className={cn(
                          "w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all",
                          habit.completed
                            ? "bg-green-500 border-green-500"
                            : "border-gray-300 dark:border-gray-600",
                        )}
                      >
                        {habit.completed && (
                          <Check className="w-2.5 h-2.5 text-white" />
                        )}
                      </div>
                      <span
                        className={cn(
                          "text-xs font-medium",
                          habit.completed && "line-through opacity-70",
                        )}
                      >
                        {habit.name}
                      </span>
                      {habit.streak > 0 && (
                        <span className="flex items-center gap-0.5 text-[10px] text-orange-500">
                          <Flame className="w-2.5 h-2.5" />
                          {habit.streak}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Time Grid (Full 24h: 12 AM – 11:59 PM) */}
            <div
              ref={gridRef}
              className="relative bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl overflow-y-auto overflow-x-hidden touch-pan-y"
              style={{ maxHeight: "calc(100vh - 260px)" }}
            >
              <div className="flex">
                {/* Time labels */}
                <div className="w-16 sm:w-20 flex-shrink-0 border-r border-[var(--color-border)]">
                  {HOURS.map((hour) => (
                    <div key={hour} className="h-16 relative">
                      <span className="absolute top-0 right-2 sm:right-3 -translate-y-1/2 text-[10px] sm:text-xs font-mono text-[var(--color-text-tertiary)] select-none">
                        {formatHour12(hour)}
                      </span>
                    </div>
                  ))}
                  <div className="h-4" />
                </div>

                {/* Grid area */}
                <div className="flex-1 relative">
                  {HOURS.map((hour) => (
                    <div key={hour} className="h-16 relative">
                      <div className="absolute top-0 left-0 right-0 border-t border-[var(--color-border-subtle)]" />
                      <div className="absolute top-8 left-0 right-0 border-t border-dashed border-[var(--color-border-subtle)]/50" />
                    </div>
                  ))}

                  {/* Blocks */}
                  {dayBlocks.map((block) => {
                    const startMin =
                      block.startHour * 60 + (block.startMinute || 0);
                    const endMin = block.endHour * 60 + (block.endMinute || 0);
                    const top = (startMin / 60) * 64;
                    const height = Math.max(
                      ((endMin - startMin) / 60) * 64,
                      32,
                    );
                    const type = BLOCK_TYPES[block.type] || BLOCK_TYPES.task;

                    return (
                      <motion.div
                        key={block.id}
                        className={cn(
                          "absolute left-1 right-2 rounded-lg border-l-[3px] p-2 group cursor-pointer",
                          "transition-all duration-150 hover:shadow-sm hover:brightness-105",
                          `bg-gradient-to-r ${type.gradient}`,
                          type.border,
                          block.completed && "opacity-60",
                        )}
                        style={{
                          top: `${top}px`,
                          height: `${height}px`,
                          minHeight: "32px",
                        }}
                        onClick={() => toggleBlockComplete(block.id)}
                      >
                        <div className="flex items-start justify-between h-full">
                          <div className="min-w-0 flex-1">
                            <p
                              className={cn(
                                "text-xs font-medium text-[var(--color-text-primary)] break-words line-clamp-2",
                                block.completed && "line-through opacity-70",
                              )}
                            >
                              {block.title}
                            </p>
                            <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">
                              {formatTime12(
                                block.startHour,
                                block.startMinute || 0,
                              )}{" "}
                              –{" "}
                              {formatTime12(
                                block.endHour,
                                block.endMinute || 0,
                              )}
                            </p>
                            {block.notes && height >= 56 && (
                              <p className="text-[10px] text-[var(--color-text-tertiary)] mt-1 break-words line-clamp-1">
                                {block.notes}
                              </p>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTimeBlock(block.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 rounded-md hover:bg-white/50 dark:hover:bg-black/20 transition-all flex-shrink-0"
                          >
                            <Trash2 className="w-3 h-3 text-[var(--color-text-tertiary)]" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Current time indicator */}
                  {isToday && (
                    <div
                      className="absolute left-0 right-0 z-20 pointer-events-none"
                      style={{ top: `${currentTimeTop}px` }}
                    >
                      <div className="absolute left-0 right-0 top-0 border-t-2 border-red-500" />
                      <div className="absolute -top-[5px] left-0 flex items-center gap-1.5">
                        <motion.div
                          className="w-[10px] h-[10px] rounded-full bg-red-500 -ml-[5px]"
                          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.8, 1] }}
                          transition={{
                            repeat: Infinity,
                            duration: 2,
                            ease: "easeInOut",
                          }}
                        />
                        <span className="text-[10px] font-mono text-red-500 bg-red-50 dark:bg-red-900/20 px-1.5 py-0.5 rounded whitespace-nowrap">
                          {format(currentTime, "h:mm a")}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Day summary */}
            <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-500" /> Day Summary
              </h3>
              <div className="flex items-center gap-6 mb-4 flex-wrap">
                <div className="flex items-center gap-2">
                  <Timer className="w-3.5 h-3.5 text-blue-500" />
                  <div>
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      Planned
                    </p>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {summaryStats.totalHours.toFixed(1)}h
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                  <div>
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      Completed
                    </p>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {summaryStats.completedBlocks}/{dayBlocks.length}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <div>
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      Productivity
                    </p>
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                      {dayBlocks.length > 0
                        ? Math.round(
                            (summaryStats.completedBlocks / dayBlocks.length) *
                              100,
                          )
                        : 0}
                      %
                    </p>
                  </div>
                </div>
              </div>

              {summaryStats.totalMinutes > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">
                    Time Distribution
                  </p>
                  <div className="h-3 rounded-full overflow-hidden flex bg-[var(--color-bg-tertiary)]">
                    {Object.entries(summaryStats.typeCounts).map(
                      ([type, data]) => {
                        const bt = BLOCK_TYPES[type] || BLOCK_TYPES.task;
                        const pct =
                          (data.minutes / summaryStats.totalMinutes) * 100;
                        return (
                          <div
                            key={type}
                            className="h-full transition-all duration-300"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: bt.color,
                            }}
                            title={`${bt.label}: ${(data.minutes / 60).toFixed(1)}h`}
                          />
                        );
                      },
                    )}
                  </div>
                  <div className="flex items-center gap-4 flex-wrap mt-2">
                    {Object.entries(summaryStats.typeCounts).map(
                      ([type, data]) => {
                        const bt = BLOCK_TYPES[type] || BLOCK_TYPES.task;
                        return (
                          <div key={type} className="flex items-center gap-1.5">
                            <div
                              className="w-2.5 h-2.5 rounded-sm"
                              style={{ backgroundColor: bt.color }}
                            />
                            <span className="text-xs text-[var(--color-text-tertiary)]">
                              {bt.label}{" "}
                              <span className="font-medium text-[var(--color-text-secondary)]">
                                {(data.minutes / 60).toFixed(1)}h
                              </span>
                            </span>
                          </div>
                        );
                      },
                    )}
                  </div>
                </div>
              )}

              {dayBlocks.length === 0 && (
                <p className="text-xs text-[var(--color-text-tertiary)] text-center py-2">
                  No blocks scheduled yet. Add a block to get started!
                </p>
              )}
            </div>
          </>
        )}
      </motion.div>
    </AppLayout>
  );
}
