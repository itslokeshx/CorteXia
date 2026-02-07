"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Clock,
  TrendingUp,
  Trash2,
  Calendar,
  Play,
  Pause,
  Square,
  ChevronLeft,
  ChevronRight,
  Timer,
  Zap,
  Target,
  BarChart3,
  Flame,
} from "lucide-react";
import { useState, useMemo, useEffect, useCallback } from "react";
import { useApp } from "@/lib/context/app-context";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

// Time Block Type
interface TimeBlock {
  id: string;
  title: string;
  category: "work" | "study" | "health" | "personal";
  startHour: number;
  duration: number; // in hours (0.5, 1, 1.5, etc.)
  date: string;
  completed: boolean;
  color: string;
}

// Hours for the calendar
const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 6 AM to 10 PM

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  work: "bg-blue-500",
  study: "bg-purple-500",
  health: "bg-emerald-500",
  personal: "bg-amber-500",
};

const CATEGORY_LIGHT_COLORS: Record<string, string> = {
  work: "bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700",
  study:
    "bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700",
  health:
    "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700",
  personal:
    "bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700",
};

// Visual Time Block Component
function VisualTimeBlock({
  block,
  onDelete,
  onToggleComplete,
}: {
  block: TimeBlock;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string) => void;
}) {
  const heightPercent = block.duration * 100; // Each hour = 60px
  const topOffset = (block.startHour - 6) * 60; // Position from 6 AM

  return (
    <motion.div
      className={cn(
        "absolute left-1 right-1 rounded-lg border-l-4 px-2 py-1 cursor-pointer group transition-all hover:shadow-lg",
        CATEGORY_LIGHT_COLORS[block.category],
        block.completed && "opacity-60",
      )}
      style={{
        top: `${topOffset}px`,
        height: `${heightPercent * 0.6}px`,
        minHeight: "30px",
        borderLeftColor: CATEGORY_COLORS[block.category].replace("bg-", ""),
      }}
      onClick={() => onToggleComplete(block.id)}
    >
      <div className="flex items-start justify-between gap-1">
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "font-medium text-xs truncate",
              block.completed && "line-through text-muted-foreground",
            )}
          >
            {block.title}
          </p>
          {block.duration >= 1 && (
            <p className="text-[10px] text-muted-foreground">
              {block.duration}h • {block.category}
            </p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(block.id);
          }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
        >
          <Trash2 className="w-3 h-3 text-red-500" />
        </button>
      </div>
    </motion.div>
  );
}

// Day Calendar View
function DayCalendarView({
  date,
  blocks,
  onAddBlock,
  onDeleteBlock,
  onToggleComplete,
}: {
  date: Date;
  blocks: TimeBlock[];
  onAddBlock: (hour: number) => void;
  onDeleteBlock: (id: string) => void;
  onToggleComplete: (id: string) => void;
}) {
  const dateStr = date.toISOString().split("T")[0];
  const dayBlocks = blocks.filter((b) => b.date === dateStr);
  const currentHour = new Date().getHours();
  const isToday = dateStr === new Date().toISOString().split("T")[0];

  return (
    <div className="relative">
      {/* Time grid */}
      <div className="relative border rounded-lg overflow-hidden">
        {HOURS.map((hour) => (
          <div
            key={hour}
            className={cn(
              "flex border-b last:border-b-0 group cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50",
              isToday &&
                hour === currentHour &&
                "bg-blue-50 dark:bg-blue-900/20",
            )}
            style={{ height: "60px" }}
            onClick={() => onAddBlock(hour)}
          >
            {/* Hour label */}
            <div className="w-16 flex-shrink-0 px-2 py-1 text-xs text-muted-foreground border-r bg-gray-50/50 dark:bg-gray-900/50">
              {hour % 12 === 0 ? 12 : hour % 12}
              {hour < 12 ? " AM" : " PM"}
            </div>

            {/* Time slot */}
            <div className="flex-1 relative">
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Plus className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        ))}

        {/* Current time indicator */}
        {isToday && currentHour >= 6 && currentHour <= 22 && (
          <div
            className="absolute left-16 right-0 h-0.5 bg-red-500 z-20 pointer-events-none"
            style={{
              top: `${(currentHour - 6) * 60 + (new Date().getMinutes() / 60) * 60}px`,
            }}
          >
            <div className="absolute -left-1 -top-1 w-2 h-2 bg-red-500 rounded-full" />
          </div>
        )}

        {/* Time blocks */}
        <div className="absolute left-16 right-0 top-0 bottom-0 pointer-events-none">
          <AnimatePresence mode="popLayout">
            {dayBlocks.map((block) => (
              <div key={block.id} className="pointer-events-auto">
                <VisualTimeBlock
                  block={block}
                  onDelete={onDeleteBlock}
                  onToggleComplete={onToggleComplete}
                />
              </div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Week View Component
function WeekView({
  startDate,
  blocks,
  onAddBlock,
  onDeleteBlock,
  onToggleComplete,
}: {
  startDate: Date;
  blocks: TimeBlock[];
  onAddBlock: (date: string, hour: number) => void;
  onDeleteBlock: (id: string) => void;
  onToggleComplete: (id: string) => void;
}) {
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return d;
  });

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[800px]">
        {/* Week header */}
        <div className="grid grid-cols-8 gap-1 mb-2">
          <div className="w-12" />
          {weekDays.map((day) => {
            const dateStr = day.toISOString().split("T")[0];
            const isToday = dateStr === todayStr;
            return (
              <div
                key={dateStr}
                className={cn(
                  "text-center py-2 rounded-lg",
                  isToday && "bg-primary text-primary-foreground",
                )}
              >
                <p className="text-xs font-medium">
                  {day.toLocaleDateString("en-US", { weekday: "short" })}
                </p>
                <p className="text-lg font-bold">{day.getDate()}</p>
              </div>
            );
          })}
        </div>

        {/* Week grid */}
        <div className="border rounded-lg overflow-hidden">
          {HOURS.filter((_, i) => i % 2 === 0).map((hour) => (
            <div
              key={hour}
              className="grid grid-cols-8 border-b last:border-b-0"
            >
              {/* Hour label */}
              <div className="w-12 px-1 py-2 text-[10px] text-muted-foreground bg-gray-50/50 dark:bg-gray-900/50 border-r">
                {hour % 12 === 0 ? 12 : hour % 12}
                {hour < 12 ? "AM" : "PM"}
              </div>

              {/* Day slots */}
              {weekDays.map((day) => {
                const dateStr = day.toISOString().split("T")[0];
                const dayBlocks = blocks.filter(
                  (b) =>
                    b.date === dateStr &&
                    b.startHour >= hour &&
                    b.startHour < hour + 2,
                );

                return (
                  <div
                    key={dateStr}
                    className="border-r last:border-r-0 p-1 min-h-[60px] cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 relative"
                    onClick={() => onAddBlock(dateStr, hour)}
                  >
                    {dayBlocks.map((block) => (
                      <div
                        key={block.id}
                        className={cn(
                          "text-[10px] p-1 rounded mb-1 truncate",
                          CATEGORY_LIGHT_COLORS[block.category],
                          block.completed && "opacity-50 line-through",
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleComplete(block.id);
                        }}
                      >
                        {block.title}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Pomodoro Timer Component
function PomodoroTimer() {
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes
  const [mode, setMode] = useState<"work" | "break">("work");
  const [completedPomodoros, setCompletedPomodoros] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      if (mode === "work") {
        setCompletedPomodoros((prev) => prev + 1);
        setMode("break");
        setTimeLeft(5 * 60); // 5 minute break
      } else {
        setMode("work");
        setTimeLeft(25 * 60);
      }
      setIsRunning(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeLeft, mode]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const progress =
    mode === "work"
      ? (1 - timeLeft / (25 * 60)) * 100
      : (1 - timeLeft / (5 * 60)) * 100;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Timer className="w-5 h-5 text-red-500" />
          Pomodoro Timer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Timer Display */}
        <div className="relative w-32 h-32 mx-auto">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="currentColor"
              strokeWidth="6"
              className="text-gray-200 dark:text-gray-800"
            />
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={mode === "work" ? "#EF4444" : "#10B981"}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 45}
                strokeDashoffset: 2 * Math.PI * 45 * (1 - progress / 100),
              }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">{formatTime(timeLeft)}</span>
            <span className="text-xs text-muted-foreground capitalize">
              {mode}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-2">
          <Button
            variant={isRunning ? "destructive" : "default"}
            size="sm"
            onClick={() => setIsRunning(!isRunning)}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4 mr-1" /> Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-1" /> Start
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsRunning(false);
              setTimeLeft(25 * 60);
              setMode("work");
            }}
          >
            <Square className="w-4 h-4 mr-1" /> Reset
          </Button>
        </div>

        {/* Completed */}
        <div className="flex items-center justify-center gap-2 text-sm">
          <Flame className="w-4 h-4 text-orange-500" />
          <span>{completedPomodoros} pomodoros completed</span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function TimeBlockingPage() {
  const {
    timeEntries,
    addTimeEntry,
    deleteTimeEntry,
    getTodayStats,
    getWeeklyStats,
  } = useApp();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [blocks, setBlocks] = useState<TimeBlock[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newBlock, setNewBlock] = useState({
    title: "",
    category: "work" as "work" | "study" | "health" | "personal",
    startHour: 9,
    duration: 1,
    date: new Date().toISOString().split("T")[0],
  });
  const [activeView, setActiveView] = useState<"day" | "week">("day");

  const todayStats = getTodayStats();
  const weeklyStats = getWeeklyStats();

  // Load blocks from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("cortexia-time-blocks");
    if (saved) {
      try {
        setBlocks(JSON.parse(saved));
      } catch {
        // ignore
      }
    }
  }, []);

  // Save blocks to localStorage
  useEffect(() => {
    localStorage.setItem("cortexia-time-blocks", JSON.stringify(blocks));
  }, [blocks]);

  const handleAddBlock = useCallback(
    (hour: number, date?: string) => {
      setNewBlock((prev) => ({
        ...prev,
        startHour: hour,
        date: date || selectedDate.toISOString().split("T")[0],
      }));
      setDialogOpen(true);
    },
    [selectedDate],
  );

  const handleCreateBlock = () => {
    if (newBlock.title.trim()) {
      const block: TimeBlock = {
        id: crypto.randomUUID(),
        ...newBlock,
        completed: false,
        color: CATEGORY_COLORS[newBlock.category],
      };
      setBlocks((prev) => [...prev, block]);
      setDialogOpen(false);
      setNewBlock({
        title: "",
        category: "work",
        startHour: 9,
        duration: 1,
        date: selectedDate.toISOString().split("T")[0],
      });
    }
  };

  const handleDeleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleToggleComplete = (id: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, completed: !b.completed } : b)),
    );
  };

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(selectedDate);
    if (activeView === "day") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
    } else {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
    }
    setSelectedDate(newDate);
  };

  const getWeekStart = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    d.setDate(d.getDate() - day);
    return d;
  };

  // Stats calculations
  const dateStr = selectedDate.toISOString().split("T")[0];
  const dayBlocks = blocks.filter((b) => b.date === dateStr);
  const plannedHours = dayBlocks.reduce((sum, b) => sum + b.duration, 0);
  const completedHours = dayBlocks
    .filter((b) => b.completed)
    .reduce((sum, b) => sum + b.duration, 0);

  return (
    <AppLayout>
      <div className="space-y-6 pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Clock className="w-7 h-7 text-primary" />
              Time Blocking
            </h1>
            <p className="text-muted-foreground text-sm md:text-base mt-1">
              Plan your day with intentional time blocks
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Block
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create Time Block</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="What are you working on?"
                  value={newBlock.title}
                  onChange={(e) =>
                    setNewBlock({ ...newBlock, title: e.target.value })
                  }
                />
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    value={newBlock.category}
                    onValueChange={(v) =>
                      setNewBlock({
                        ...newBlock,
                        category: v as typeof newBlock.category,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="study">Study</SelectItem>
                      <SelectItem value="health">Health</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={newBlock.duration.toString()}
                    onValueChange={(v) =>
                      setNewBlock({ ...newBlock, duration: parseFloat(v) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">30 min</SelectItem>
                      <SelectItem value="1">1 hour</SelectItem>
                      <SelectItem value="1.5">1.5 hours</SelectItem>
                      <SelectItem value="2">2 hours</SelectItem>
                      <SelectItem value="3">3 hours</SelectItem>
                      <SelectItem value="4">4 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    type="date"
                    value={newBlock.date}
                    onChange={(e) =>
                      setNewBlock({ ...newBlock, date: e.target.value })
                    }
                  />
                  <Select
                    value={newBlock.startHour.toString()}
                    onValueChange={(v) =>
                      setNewBlock({ ...newBlock, startHour: parseInt(v) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {HOURS.map((h) => (
                        <SelectItem key={h} value={h.toString()}>
                          {h % 12 === 0 ? 12 : h % 12}:00 {h < 12 ? "AM" : "PM"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateBlock} className="w-full">
                  Create Block
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                <div className="text-2xl md:text-3xl font-bold">
                  {plannedHours}h
                </div>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Planned Today
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-emerald-500" />
                <div className="text-2xl md:text-3xl font-bold text-emerald-500">
                  {completedHours}h
                </div>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Completed
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-purple-500" />
                <div className="text-2xl md:text-3xl font-bold text-purple-500">
                  {Math.round(todayStats.totalMinutes / 60)}h
                </div>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Logged Today
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-amber-500" />
                <div className="text-2xl md:text-3xl font-bold text-amber-500">
                  {Math.round(weeklyStats.total / 60)}h
                </div>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                This Week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Calendar Area */}
          <div className="xl:col-span-3 space-y-4">
            {/* View Toggle & Navigation */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateDate("prev")}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => navigateDate("next")}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <h2 className="font-semibold ml-2">
                  {activeView === "day"
                    ? selectedDate.toLocaleDateString("en-US", {
                        weekday: "long",
                        month: "long",
                        day: "numeric",
                      })
                    : `Week of ${getWeekStart(selectedDate).toLocaleDateString(
                        "en-US",
                        {
                          month: "short",
                          day: "numeric",
                        },
                      )}`}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date())}
                >
                  Today
                </Button>
                <Tabs
                  value={activeView}
                  onValueChange={(v) => setActiveView(v as "day" | "week")}
                >
                  <TabsList className="h-8">
                    <TabsTrigger value="day" className="text-xs px-3">
                      Day
                    </TabsTrigger>
                    <TabsTrigger value="week" className="text-xs px-3">
                      Week
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Calendar Views */}
            <Card className="border-border/50 overflow-hidden">
              <CardContent className="p-4">
                {activeView === "day" ? (
                  <DayCalendarView
                    date={selectedDate}
                    blocks={blocks}
                    onAddBlock={(hour) => handleAddBlock(hour)}
                    onDeleteBlock={handleDeleteBlock}
                    onToggleComplete={handleToggleComplete}
                  />
                ) : (
                  <WeekView
                    startDate={getWeekStart(selectedDate)}
                    blocks={blocks}
                    onAddBlock={(date, hour) => handleAddBlock(hour, date)}
                    onDeleteBlock={handleDeleteBlock}
                    onToggleComplete={handleToggleComplete}
                  />
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Pomodoro Timer */}
            <PomodoroTimer />

            {/* Today's Blocks */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  Today's Blocks
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {dayBlocks.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No blocks planned for today
                  </p>
                ) : (
                  dayBlocks
                    .sort((a, b) => a.startHour - b.startHour)
                    .map((block) => (
                      <div
                        key={block.id}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg",
                          CATEGORY_LIGHT_COLORS[block.category],
                          block.completed && "opacity-60",
                        )}
                      >
                        <div
                          className={cn(
                            "w-2 h-2 rounded-full",
                            CATEGORY_COLORS[block.category],
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p
                            className={cn(
                              "text-sm font-medium truncate",
                              block.completed && "line-through",
                            )}
                          >
                            {block.title}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {block.startHour % 12 === 0
                              ? 12
                              : block.startHour % 12}
                            {block.startHour < 12 ? "AM" : "PM"} •{" "}
                            {block.duration}h
                          </p>
                        </div>
                        <Badge variant="secondary" className="text-[9px]">
                          {block.category}
                        </Badge>
                      </div>
                    ))
                )}
              </CardContent>
            </Card>

            {/* Category Legend */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Categories</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {Object.entries(CATEGORY_COLORS).map(([category, color]) => (
                  <div
                    key={category}
                    className="flex items-center gap-2 text-sm"
                  >
                    <div className={cn("w-3 h-3 rounded", color)} />
                    <span className="capitalize">{category}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
