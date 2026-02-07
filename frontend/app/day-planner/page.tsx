"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  format,
  addDays,
  subDays,
  startOfDay,
  isToday as isTodayFn,
  isSameDay,
} from "date-fns";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Clock,
  CalendarDays,
  Layers,
  Coffee,
  Timer,
  BarChart3,
  CheckCircle2,
  Zap,
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
};

// Hours range: 6 AM to 11 PM
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6);

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

// ─── Page Component ─────────────────────────────────────────────────────────

export default function DayPlannerPage() {
  const [timeBlocks, setTimeBlocks] = useState<PlannerBlock[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [createOpen, setCreateOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
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

  // ─── Persistence ────────────────────────────────────────────────────────

  useEffect(() => {
    try {
      const saved = localStorage.getItem("cortexia-planner-blocks");
      if (saved) setTimeBlocks(JSON.parse(saved));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("cortexia-planner-blocks", JSON.stringify(timeBlocks));
  }, [timeBlocks]);

  // ─── Clock Tick ─────────────────────────────────────────────────────────

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(interval);
  }, []);

  // ─── Scroll to current time on mount ────────────────────────────────────

  useEffect(() => {
    if (isToday && gridRef.current) {
      const now = new Date();
      const minutes = now.getHours() * 60 + now.getMinutes();
      const offset = ((minutes - 360) / 60) * 64;
      gridRef.current.scrollTo({
        top: Math.max(offset - 200, 0),
        behavior: "smooth",
      });
    }
  }, [isToday]);

  // ─── Filtered blocks ───────────────────────────────────────────────────

  const dayBlocks = useMemo(() => {
    return timeBlocks.filter((b) => b.date === dateStr);
  }, [timeBlocks, dateStr]);

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
    const freeHours = 18 - totalHours; // 18 available hours (6AM-midnight)
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

  // ─── Create handler ─────────────────────────────────────────────────────

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
  const currentTimeTop = ((currentMinutes - 360) / 60) * 64;

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="space-y-4 pb-12"
      >
        {/* ──────────────────── Header ──────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Day Planner
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Date Navigation */}
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

            {/* Today button */}
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

            {/* Add Block */}
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-sm">
                  <Plus className="w-4 h-4" /> Add Block
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Time Block</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Title */}
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

                  {/* Type */}
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

                  {/* Time Inputs */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                        Start Time
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
                        End Time
                      </label>
                      <Input
                        type="time"
                        value={newBlock.endTime}
                        onChange={(e) =>
                          setNewBlock({ ...newBlock, endTime: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                      Notes
                    </label>
                    <textarea
                      className="flex w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm placeholder:text-[var(--color-text-tertiary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/40 focus-visible:ring-offset-0 min-h-[80px] resize-none"
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
                    className="rounded-lg bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                  >
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* ──────────────────── Daily Summary Bar ──────────────────── */}
        <div className="p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] mb-4">
          <div className="flex items-center gap-6 flex-wrap">
            {/* Scheduled Hours */}
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-purple-500" />
              <span className="text-xs text-[var(--color-text-secondary)]">
                <span className="font-semibold text-[var(--color-text-primary)]">
                  {summaryStats.totalHours.toFixed(1)}h
                </span>{" "}
                scheduled
              </span>
            </div>

            {/* Free Hours */}
            <div className="flex items-center gap-2">
              <Coffee className="w-3.5 h-3.5 text-green-500" />
              <span className="text-xs text-[var(--color-text-secondary)]">
                <span className="font-semibold text-[var(--color-text-primary)]">
                  {Math.max(summaryStats.freeHours, 0).toFixed(1)}h
                </span>{" "}
                free
              </span>
            </div>

            {/* Block Count */}
            <div className="flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs text-[var(--color-text-secondary)]">
                <span className="font-semibold text-[var(--color-text-primary)]">
                  {dayBlocks.length}
                </span>{" "}
                blocks
              </span>
            </div>

            {/* Divider */}
            <div className="w-px h-4 bg-[var(--color-border)]" />

            {/* Block type breakdown */}
            <div className="flex items-center gap-3 flex-wrap">
              {Object.entries(summaryStats.typeCounts).map(([type, data]) => {
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
              })}
              {dayBlocks.length === 0 && (
                <span className="text-xs text-[var(--color-text-tertiary)]">
                  No blocks yet
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ──────────────────── Time Grid Calendar ──────────────────── */}
        <div
          ref={gridRef}
          className="relative bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl overflow-y-auto overflow-x-hidden"
          style={{ maxHeight: "calc(100vh - 360px)" }}
        >
          <div className="flex">
            {/* ── Time Label Column ── */}
            <div className="w-20 flex-shrink-0 border-r border-[var(--color-border)]">
              {HOURS.map((hour) => (
                <div key={hour} className="h-16 relative">
                  <span className="absolute top-0 right-3 -translate-y-1/2 text-xs font-mono text-[var(--color-text-tertiary)] select-none">
                    {formatHour12(hour)}
                  </span>
                </div>
              ))}
              {/* Extra spacing at bottom */}
              <div className="h-4" />
            </div>

            {/* ── Grid Area ── */}
            <div className="flex-1 relative">
              {/* Hour & half-hour lines */}
              {HOURS.map((hour) => (
                <div key={hour} className="h-16 relative">
                  {/* Full hour line */}
                  <div className="absolute top-0 left-0 right-0 border-t border-[var(--color-border-subtle)]" />
                  {/* Half-hour dashed line */}
                  <div className="absolute top-8 left-0 right-0 border-t border-dashed border-[var(--color-border-subtle)]/50" />
                </div>
              ))}

              {/* ── Time Blocks ── */}
              {dayBlocks.map((block) => {
                const startMin =
                  (block.startHour - 6) * 60 + (block.startMinute || 0);
                const endMin =
                  (block.endHour - 6) * 60 + (block.endMinute || 0);
                const top = (startMin / 60) * 64;
                const height = Math.max(((endMin - startMin) / 60) * 64, 32);
                const type = BLOCK_TYPES[block.type] || BLOCK_TYPES.task;

                return (
                  <motion.div
                    key={block.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.2 }}
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
                            "text-xs font-medium text-[var(--color-text-primary)] truncate",
                            block.completed && "line-through opacity-70",
                          )}
                        >
                          {block.title}
                        </p>
                        <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">
                          {formatTime12(
                            block.startHour,
                            block.startMinute || 0,
                          )}
                          {" – "}
                          {formatTime12(block.endHour, block.endMinute || 0)}
                        </p>
                        {block.notes && height >= 56 && (
                          <p className="text-[10px] text-[var(--color-text-tertiary)] mt-1 truncate">
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

              {/* ── Current Time Indicator ── */}
              {isToday && currentMinutes >= 360 && currentMinutes <= 1380 && (
                <div
                  className="absolute left-0 right-0 z-20 pointer-events-none"
                  style={{ top: `${currentTimeTop}px` }}
                >
                  {/* Line */}
                  <div className="absolute left-0 right-0 top-0 border-t-2 border-red-500" />
                  {/* Pulsing dot + time label */}
                  <div className="absolute -top-[5px] left-0 flex items-center gap-1.5">
                    <motion.div
                      className="w-[10px] h-[10px] rounded-full bg-red-500 -ml-[5px]"
                      animate={{ scale: [1, 1.3, 1] }}
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

        {/* ──────────────────── Daily Summary Footer ──────────────────── */}
        <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] mt-4">
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-purple-500" />
            Day Summary
          </h3>

          {/* Stats Row */}
          <div className="flex items-center gap-6 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Timer className="w-3.5 h-3.5 text-blue-500" />
              <div>
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  Planned time
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
                        (summaryStats.completedBlocks / dayBlocks.length) * 100,
                      )
                    : 0}
                  %
                </p>
              </div>
            </div>
          </div>

          {/* Category Breakdown Bars */}
          {summaryStats.totalMinutes > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">
                Time Distribution
              </p>
              {/* Stacked bar */}
              <div className="h-3 rounded-full overflow-hidden flex bg-[var(--color-bg-tertiary)]">
                {Object.entries(summaryStats.typeCounts).map(([type, data]) => {
                  const bt = BLOCK_TYPES[type] || BLOCK_TYPES.task;
                  const pct = (data.minutes / summaryStats.totalMinutes) * 100;
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
                })}
              </div>
              {/* Legend */}
              <div className="flex items-center gap-4 flex-wrap mt-2">
                {Object.entries(summaryStats.typeCounts).map(([type, data]) => {
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
                })}
              </div>
            </div>
          )}

          {dayBlocks.length === 0 && (
            <p className="text-xs text-[var(--color-text-tertiary)] text-center py-2">
              No blocks scheduled yet. Add a block to get started!
            </p>
          )}
        </div>
      </motion.div>
    </AppLayout>
  );
}
