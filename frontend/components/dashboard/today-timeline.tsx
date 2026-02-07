"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle2,
  Circle,
  Play,
  Pause,
  Plus,
  Target,
  Book,
  Coffee,
  Dumbbell,
  Briefcase,
  ChevronRight,
} from "lucide-react";
import { useApp } from "@/lib/context/app-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TimeBlockData {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: "task" | "habit" | "meeting" | "break" | "free" | "focus";
  status: "completed" | "in_progress" | "planned" | "skipped";
  linkedGoal?: string;
  color: string;
  icon: React.ElementType;
}

const typeConfig = {
  task: {
    color: "bg-blue-500",
    icon: CheckCircle2,
    borderColor: "border-blue-500",
  },
  habit: {
    color: "bg-orange-500",
    icon: Target,
    borderColor: "border-orange-500",
  },
  meeting: {
    color: "bg-purple-500",
    icon: Briefcase,
    borderColor: "border-purple-500",
  },
  break: {
    color: "bg-emerald-500",
    icon: Coffee,
    borderColor: "border-emerald-500",
  },
  focus: { color: "bg-cyan-500", icon: Book, borderColor: "border-cyan-500" },
  free: { color: "bg-gray-400", icon: Clock, borderColor: "border-gray-400" },
};

function TimeBlockCard({
  block,
  index,
}: {
  block: TimeBlockData;
  index: number;
}) {
  const config = typeConfig[block.type] || typeConfig.free;
  const Icon = config.icon;
  const isNow = block.status === "in_progress";
  const isCompleted = block.status === "completed";
  const isSkipped = block.status === "skipped";

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className={cn("relative flex gap-4 group", isSkipped && "opacity-50")}
    >
      {/* Time Column */}
      <div className="w-16 flex-shrink-0 text-right">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
          {block.startTime}
        </span>
      </div>

      {/* Timeline Line */}
      <div className="relative flex flex-col items-center">
        <div
          className={cn(
            "w-4 h-4 rounded-full flex items-center justify-center z-10",
            isCompleted
              ? "bg-emerald-500"
              : isNow
                ? "bg-blue-500 animate-pulse"
                : "bg-gray-300 dark:bg-gray-600",
          )}
        >
          {isCompleted && <CheckCircle2 className="w-3 h-3 text-white" />}
          {isNow && <div className="w-2 h-2 bg-white rounded-full" />}
        </div>
        <div
          className={cn(
            "w-0.5 flex-1 min-h-[60px]",
            isCompleted ? "bg-emerald-500" : "bg-gray-200 dark:bg-gray-700",
          )}
        />
      </div>

      {/* Block Card */}
      <div
        className={cn(
          "flex-1 mb-4 rounded-xl p-4 transition-all duration-200",
          "border-l-4",
          config.borderColor,
          isNow
            ? "bg-blue-50 dark:bg-blue-950/30 shadow-lg ring-2 ring-blue-500/20"
            : "bg-white dark:bg-gray-800 hover:shadow-md",
          isSkipped && "line-through",
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
              config.color,
              "text-white",
            )}
          >
            <Icon className="w-5 h-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4
                className={cn(
                  "font-semibold truncate",
                  isSkipped && "line-through text-gray-400",
                )}
              >
                {block.title}
              </h4>
              {isNow && (
                <span className="px-2 py-0.5 text-xs font-medium bg-blue-500 text-white rounded-full">
                  NOW
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
              <span>
                {block.startTime} - {block.endTime}
              </span>
              <span>•</span>
              <span>{block.duration} min</span>
              {block.linkedGoal && (
                <>
                  <span>•</span>
                  <span className="text-pink-500 flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {block.linkedGoal}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          {!isCompleted && !isSkipped && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {isNow ? (
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Pause className="w-4 h-4" />
                </Button>
              ) : (
                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                  <Play className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function TodayTimeline() {
  const { tasks, habits, timeEntries } = useApp();
  const [showAll, setShowAll] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const currentHour = new Date().getHours();

  // Generate mock time blocks based on actual data
  const timeBlocks = useMemo<TimeBlockData[]>(() => {
    const blocks: TimeBlockData[] = [];

    // Add completed habits
    const completedHabitsToday = habits.filter((h) =>
      h.completions?.some((c) => c.date === today && c.completed),
    );

    completedHabitsToday.forEach((habit, i) => {
      blocks.push({
        id: `habit-${habit.id}`,
        title: habit.name,
        startTime: `0${7 + i}:00`.slice(-5),
        endTime: `0${7 + i}:30`.slice(-5),
        duration: 30,
        type: "habit",
        status: "completed",
        color: "bg-orange-500",
        icon: Target,
      });
    });

    // Add completed tasks
    const completedTasksToday = tasks
      .filter((t) => t.completedAt?.startsWith(today))
      .slice(0, 3);

    completedTasksToday.forEach((task, i) => {
      blocks.push({
        id: `task-${task.id}`,
        title: task.title,
        startTime: `${9 + i}:00`,
        endTime: `${10 + i}:00`,
        duration: 60,
        type: "task",
        status: "completed",
        color: "bg-blue-500",
        icon: CheckCircle2,
      });
    });

    // Add time entries
    const todayEntries = timeEntries.filter((t) => t.date?.startsWith(today));
    todayEntries.forEach((entry, i) => {
      if (!blocks.some((b) => b.title === entry.task)) {
        blocks.push({
          id: `time-${entry.id}`,
          title: entry.task,
          startTime: `${12 + i}:00`,
          endTime: `${12 + i}:${Math.min(59, entry.duration)}`,
          duration: entry.duration,
          type: "focus",
          status: "completed",
          color: "bg-cyan-500",
          icon: Book,
        });
      }
    });

    // Add current/upcoming blocks
    const pendingTasks = tasks
      .filter(
        (t) => t.status !== "completed" && t.dueDate?.split("T")[0] === today,
      )
      .slice(0, 3);

    pendingTasks.forEach((task, i) => {
      const hour = currentHour + i;
      blocks.push({
        id: `pending-${task.id}`,
        title: task.title,
        startTime: `${hour}:00`,
        endTime: `${hour + 1}:00`,
        duration: 60,
        type: "task",
        status: i === 0 ? "in_progress" : "planned",
        color: "bg-blue-500",
        icon: CheckCircle2,
        linkedGoal: task.domain === "study" ? "Learning" : undefined,
      });
    });

    // Add a break
    if (blocks.length > 2) {
      blocks.splice(Math.floor(blocks.length / 2), 0, {
        id: "break-1",
        title: "Break",
        startTime: "12:00",
        endTime: "12:30",
        duration: 30,
        type: "break",
        status: currentHour >= 13 ? "completed" : "planned",
        color: "bg-emerald-500",
        icon: Coffee,
      });
    }

    // Sort by start time
    return blocks.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [tasks, habits, timeEntries, today, currentHour]);

  const displayedBlocks = showAll ? timeBlocks : timeBlocks.slice(0, 5);
  const completedCount = timeBlocks.filter(
    (b) => b.status === "completed",
  ).length;
  const totalDuration = timeBlocks.reduce((sum, b) => sum + b.duration, 0);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Clock className="w-5 h-5 text-cyan-500" />
              Today's Schedule
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {completedCount}/{timeBlocks.length} blocks completed •{" "}
              {Math.round(totalDuration / 60)}h planned
            </p>
          </div>
          <Button className="gap-2" size="sm">
            <Plus className="w-4 h-4" />
            Add Block
          </Button>
        </div>
      </div>

      {/* Timeline */}
      <div className="p-6">
        {timeBlocks.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              No time blocks scheduled
            </p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Add your first time block to start planning your day
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-0">
              {displayedBlocks.map((block, index) => (
                <TimeBlockCard key={block.id} block={block} index={index} />
              ))}
            </div>

            {timeBlocks.length > 5 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 text-center"
              >
                <Button
                  variant="ghost"
                  onClick={() => setShowAll(!showAll)}
                  className="gap-2"
                >
                  {showAll ? "Show Less" : `Show ${timeBlocks.length - 5} More`}
                  <ChevronRight
                    className={cn(
                      "w-4 h-4 transition-transform",
                      showAll && "rotate-90",
                    )}
                  />
                </Button>
              </motion.div>
            )}
          </>
        )}
      </div>

      {/* Footer Stats */}
      {timeBlocks.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-gray-600 dark:text-gray-400">
                  {completedCount} completed
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-gray-600 dark:text-gray-400">
                  {timeBlocks.filter((b) => b.status === "in_progress").length}{" "}
                  in progress
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span className="text-gray-600 dark:text-gray-400">
                  {timeBlocks.filter((b) => b.status === "planned").length}{" "}
                  planned
                </span>
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
