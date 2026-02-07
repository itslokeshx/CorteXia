"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { useState, useMemo, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  format,
  addDays,
  subDays,
  setHours,
  getHours,
  getMinutes,
} from "date-fns";
import { Plus, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
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

interface PlannerBlock {
  id: string;
  title: string;
  date: string;
  type: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
}

const BLOCK_TYPES: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  task: {
    label: "Task",
    color: "border-blue-400",
    bg: "bg-blue-50 dark:bg-blue-900/20",
  },
  deep_work: {
    label: "Deep Work",
    color: "border-purple-400",
    bg: "bg-purple-50 dark:bg-purple-900/20",
  },
  meeting: {
    label: "Meeting",
    color: "border-amber-400",
    bg: "bg-amber-50 dark:bg-amber-900/20",
  },
  break: {
    label: "Break",
    color: "border-green-400",
    bg: "bg-green-50 dark:bg-green-900/20",
  },
  personal: {
    label: "Personal",
    color: "border-pink-400",
    bg: "bg-pink-50 dark:bg-pink-900/20",
  },
  habit: {
    label: "Habit",
    color: "border-emerald-400",
    bg: "bg-emerald-50 dark:bg-emerald-900/20",
  },
  shallow_work: {
    label: "Shallow Work",
    color: "border-gray-400",
    bg: "bg-gray-50 dark:bg-gray-800",
  },
};

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6);

export default function DayPlannerPage() {
  const [timeBlocks, setTimeBlocks] = useState<PlannerBlock[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [createOpen, setCreateOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [newBlock, setNewBlock] = useState({
    title: "",
    type: "task",
    startHour: "9",
    startMinute: "0",
    endHour: "10",
    endMinute: "0",
  });

  const dateStr = format(selectedDate, "yyyy-MM-dd");

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

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  const dayBlocks = useMemo(() => {
    return timeBlocks.filter((b) => b.date === dateStr);
  }, [timeBlocks, dateStr]);

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

  const handleCreateBlock = () => {
    if (!newBlock.title.trim()) return;
    addTimeBlock({
      title: newBlock.title,
      date: dateStr,
      type: newBlock.type,
      startHour: parseInt(newBlock.startHour),
      startMinute: parseInt(newBlock.startMinute),
      endHour: parseInt(newBlock.endHour),
      endMinute: parseInt(newBlock.endMinute),
    });
    setNewBlock({
      title: "",
      type: "task",
      startHour: "9",
      startMinute: "0",
      endHour: "10",
      endMinute: "0",
    });
    setCreateOpen(false);
  };

  const isToday =
    format(selectedDate, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd");
  const currentMinutes = getHours(currentTime) * 60 + getMinutes(currentTime);

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 pb-12"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Day Planner
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              {dayBlocks.length} blocks scheduled
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setSelectedDate(subDays(selectedDate, 1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 rounded-lg text-xs font-medium px-3"
                onClick={() => setSelectedDate(new Date())}
              >
                {isToday ? "Today" : format(selectedDate, "MMM d")}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-sm">
                  <Plus className="w-4 h-4" /> Add Block
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Time Block</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <Input
                    placeholder="What are you working on?"
                    value={newBlock.title}
                    onChange={(e) =>
                      setNewBlock({ ...newBlock, title: e.target.value })
                    }
                    autoFocus
                  />
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
                            {val.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                        Start Time
                      </label>
                      <Select
                        value={newBlock.startHour}
                        onValueChange={(v) =>
                          setNewBlock({ ...newBlock, startHour: v })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HOURS.map((h) => (
                            <SelectItem key={h} value={h.toString()}>
                              {h.toString().padStart(2, "0")}:00
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                        End Time
                      </label>
                      <Select
                        value={newBlock.endHour}
                        onValueChange={(v) =>
                          setNewBlock({ ...newBlock, endHour: v })
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HOURS.map((h) => (
                            <SelectItem key={h} value={h.toString()}>
                              {h.toString().padStart(2, "0")}:00
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreateOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateBlock}
                    disabled={!newBlock.title.trim()}
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                  >
                    Add Block
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Date Display */}
        <div className="text-center pb-2">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {format(selectedDate, "EEEE, MMMM d, yyyy")}
          </h2>
        </div>

        {/* Calendar Grid */}
        <div className="relative bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl overflow-hidden">
          <div className="flex">
            {/* Time Labels */}
            <div className="w-16 flex-shrink-0 border-r border-[var(--color-border)]">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="h-16 flex items-start justify-end pr-2 pt-0.5"
                >
                  <span className="text-[10px] text-[var(--color-text-tertiary)] font-mono">
                    {format(setHours(new Date(), hour), "h a")}
                  </span>
                </div>
              ))}
            </div>

            {/* Grid */}
            <div className="flex-1 relative">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="h-16 border-b border-[var(--color-border)]/50"
                />
              ))}

              {/* Time Blocks */}
              {dayBlocks.map((block) => {
                const startMin =
                  (block.startHour - 6) * 60 + (block.startMinute || 0);
                const endMin =
                  (block.endHour - 6) * 60 + (block.endMinute || 0);
                const top = (startMin / 60) * 64;
                const height = Math.max(((endMin - startMin) / 60) * 64, 24);
                const type = BLOCK_TYPES[block.type] || BLOCK_TYPES.task;

                return (
                  <motion.div
                    key={block.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={cn(
                      "absolute left-1 right-1 rounded-lg border-l-[3px] px-3 py-1.5 group cursor-pointer transition-all hover:shadow-md",
                      type.bg,
                      type.color,
                    )}
                    style={{ top: `${top}px`, height: `${height}px` }}
                  >
                    <div className="flex items-start justify-between h-full">
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">
                          {block.title}
                        </p>
                        <p className="text-[10px] text-[var(--color-text-tertiary)]">
                          {block.startHour.toString().padStart(2, "0")}:
                          {(block.startMinute || 0).toString().padStart(2, "0")}{" "}
                          - {block.endHour.toString().padStart(2, "0")}:
                          {(block.endMinute || 0).toString().padStart(2, "0")}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteTimeBlock(block.id)}
                        className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/50 dark:hover:bg-black/20 transition-all"
                      >
                        <Trash2 className="w-3 h-3 text-[var(--color-text-tertiary)]" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}

              {/* Current Time Indicator */}
              {isToday && currentMinutes >= 360 && currentMinutes <= 1380 && (
                <div
                  className="absolute left-0 right-0 z-10 pointer-events-none"
                  style={{ top: `${((currentMinutes - 360) / 60) * 64}px` }}
                >
                  <div className="flex items-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1.5" />
                    <div className="flex-1 h-[2px] bg-red-500" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
}
