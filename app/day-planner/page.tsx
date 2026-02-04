"use client";

import { useState, useMemo, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/lib/context/app-context";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Clock,
  CheckCircle,
  Play,
  GripVertical,
  Target,
  CheckSquare,
  Calendar as CalendarIcon,
} from "lucide-react";
import { format, addDays, subDays, startOfWeek, addWeeks, isToday, isSameDay, parseISO } from "date-fns";
import type { TimeBlock, Task } from "@/lib/types";

// Generate hours array from 6am to 11pm
const HOURS = Array.from({ length: 18 }, (_, i) => i + 6);

// Time block type colors
const TYPE_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  task: { bg: "bg-blue-100 dark:bg-blue-900/30", border: "border-blue-500", text: "text-blue-700 dark:text-blue-300" },
  habit: { bg: "bg-green-100 dark:bg-green-900/30", border: "border-green-500", text: "text-green-700 dark:text-green-300" },
  meeting: { bg: "bg-purple-100 dark:bg-purple-900/30", border: "border-purple-500", text: "text-purple-700 dark:text-purple-300" },
  break: { bg: "bg-gray-100 dark:bg-gray-800/50", border: "border-gray-400", text: "text-gray-600 dark:text-gray-400" },
  deep_work: { bg: "bg-indigo-100 dark:bg-indigo-900/30", border: "border-indigo-500", text: "text-indigo-700 dark:text-indigo-300" },
  shallow_work: { bg: "bg-amber-100 dark:bg-amber-900/30", border: "border-amber-500", text: "text-amber-700 dark:text-amber-300" },
  personal: { bg: "bg-pink-100 dark:bg-pink-900/30", border: "border-pink-500", text: "text-pink-700 dark:text-pink-300" },
};

export default function DayPlannerPage() {
  const { tasks, habits, goals } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [isCreateBlockOpen, setIsCreateBlockOpen] = useState(false);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [newBlockForm, setNewBlockForm] = useState({
    title: "",
    type: "deep_work" as TimeBlock["type"],
    startTime: "09:00",
    endTime: "10:00",
    linkedTaskId: "",
    linkedGoalId: "",
    notes: "",
  });

  // Format today's date for comparison
  const todayStr = useMemo(() => format(selectedDate, "yyyy-MM-dd"), [selectedDate]);

  // Filter time blocks for selected date
  const todayBlocks = useMemo(() => {
    return timeBlocks.filter(block => block.date === todayStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [timeBlocks, todayStr]);

  // Get unscheduled tasks (tasks without time blocks for today)
  const unscheduledTasks = useMemo(() => {
    const blockedTaskIds = todayBlocks
      .filter(b => b.linkedTaskId)
      .map(b => b.linkedTaskId);
    
    return tasks.filter(task => 
      task.status !== "completed" && 
      !blockedTaskIds.includes(task.id)
    ).slice(0, 10);
  }, [tasks, todayBlocks]);

  // Calculate daily summary stats
  const dailySummary = useMemo(() => {
    const planned = todayBlocks.reduce((sum, b) => sum + b.duration, 0);
    const completed = todayBlocks.filter(b => b.status === "completed")
      .reduce((sum, b) => sum + b.duration, 0);
    const deepWork = todayBlocks
      .filter(b => b.type === "deep_work" || b.type === "task")
      .reduce((sum, b) => sum + b.duration, 0);
    const breaks = todayBlocks
      .filter(b => b.type === "break")
      .reduce((sum, b) => sum + b.duration, 0);
    
    return {
      planned: Math.round(planned / 60 * 10) / 10,
      completed: Math.round(completed / 60 * 10) / 10,
      deepWork: Math.round(deepWork / 60 * 10) / 10,
      breaks: Math.round(breaks / 60 * 10) / 10,
      tasksScheduled: todayBlocks.filter(b => b.linkedTaskId).length,
      tasksCompleted: todayBlocks.filter(b => b.linkedTaskId && b.status === "completed").length,
    };
  }, [todayBlocks]);

  // Handle creating a new time block
  const handleCreateBlock = () => {
    if (!newBlockForm.title.trim()) return;

    const startParts = newBlockForm.startTime.split(":");
    const endParts = newBlockForm.endTime.split(":");
    const startMinutes = parseInt(startParts[0]) * 60 + parseInt(startParts[1]);
    const endMinutes = parseInt(endParts[0]) * 60 + parseInt(endParts[1]);
    const duration = endMinutes - startMinutes;

    const newBlock: TimeBlock = {
      id: `tb-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      date: todayStr,
      startTime: newBlockForm.startTime,
      endTime: newBlockForm.endTime,
      duration,
      title: newBlockForm.title,
      type: newBlockForm.type,
      status: "planned",
      linkedTaskId: newBlockForm.linkedTaskId || undefined,
      linkedGoalId: newBlockForm.linkedGoalId || undefined,
      notes: newBlockForm.notes || undefined,
      createdAt: new Date().toISOString(),
    };

    setTimeBlocks(prev => [...prev, newBlock]);
    setIsCreateBlockOpen(false);
    setNewBlockForm({
      title: "",
      type: "deep_work",
      startTime: "09:00",
      endTime: "10:00",
      linkedTaskId: "",
      linkedGoalId: "",
      notes: "",
    });
  };

  // Handle drag and drop for tasks
  const handleDropTask = (hour: number) => {
    if (!draggedTask) return;

    const duration = draggedTask.timeEstimate || 60;
    const startHour = hour.toString().padStart(2, "0");
    const endHour = Math.min(hour + Math.ceil(duration / 60), 23);

    const newBlock: TimeBlock = {
      id: `tb-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      date: todayStr,
      startTime: `${startHour}:00`,
      endTime: `${endHour.toString().padStart(2, "0")}:00`,
      duration,
      title: draggedTask.title,
      type: "task",
      status: "planned",
      linkedTaskId: draggedTask.id,
      linkedGoalId: draggedTask.linkedGoalId,
      createdAt: new Date().toISOString(),
    };

    setTimeBlocks(prev => [...prev, newBlock]);
    setDraggedTask(null);
  };

  // Toggle block status
  const toggleBlockStatus = (blockId: string) => {
    setTimeBlocks(prev => prev.map(block => {
      if (block.id === blockId) {
        const newStatus = block.status === "completed" ? "planned" : "completed";
        return { ...block, status: newStatus };
      }
      return block;
    }));
  };

  // Delete block
  const deleteBlock = (blockId: string) => {
    setTimeBlocks(prev => prev.filter(b => b.id !== blockId));
  };

  // Navigate dates
  const goToPreviousDay = () => setSelectedDate(subDays(selectedDate, 1));
  const goToNextDay = () => setSelectedDate(addDays(selectedDate, 1));
  const goToToday = () => setSelectedDate(new Date());

  // Get blocks for a specific hour
  const getBlocksForHour = (hour: number) => {
    return todayBlocks.filter(block => {
      const blockHour = parseInt(block.startTime.split(":")[0]);
      return blockHour === hour;
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6 pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
              Day Planner
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* View Mode Tabs */}
            <div className="inline-flex rounded-lg bg-neutral-100 dark:bg-neutral-800 p-1">
              {(["day", "week", "month"] as const).map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-medium capitalize transition-colors",
                    viewMode === mode
                      ? "bg-white dark:bg-neutral-700 shadow-sm"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900"
                  )}
                >
                  {mode}
                </button>
              ))}
            </div>

            {/* Date Navigation */}
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPreviousDay}
                className="h-8 w-8"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className={cn(
                  "h-8",
                  isToday(selectedDate) && "bg-purple-100 dark:bg-purple-900/30 border-purple-300"
                )}
              >
                Today
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={goToNextDay}
                className="h-8 w-8"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <Button
              variant="outline"
              onClick={() => {}}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              AI Plan
            </Button>

            <Button onClick={() => setIsCreateBlockOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Block Time
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar View */}
          <div className="lg:col-span-3">
            <Card className="overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto">
                {HOURS.map(hour => {
                  const blocksInHour = getBlocksForHour(hour);
                  const isCurrentHour = isToday(selectedDate) && new Date().getHours() === hour;

                  return (
                    <div
                      key={hour}
                      className={cn(
                        "flex border-b border-neutral-100 dark:border-neutral-800 min-h-[60px] transition-colors",
                        isCurrentHour && "bg-purple-50/50 dark:bg-purple-900/10"
                      )}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => handleDropTask(hour)}
                    >
                      {/* Time Label */}
                      <div className="w-16 sm:w-20 p-2 text-xs sm:text-sm text-neutral-500 border-r border-neutral-100 dark:border-neutral-800 flex-shrink-0">
                        <span className="font-medium">
                          {hour.toString().padStart(2, "0")}:00
                        </span>
                      </div>

                      {/* Time Blocks */}
                      <div className="flex-1 p-1 relative min-h-[60px]">
                        {blocksInHour.length === 0 && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <span className="text-xs text-neutral-400">
                              Drop task here
                            </span>
                          </div>
                        )}
                        
                        {blocksInHour.map(block => {
                          const colors = TYPE_COLORS[block.type] || TYPE_COLORS.task;
                          const heightPx = Math.max((block.duration / 60) * 60, 50);

                          return (
                            <motion.div
                              key={block.id}
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className={cn(
                                "rounded-lg p-2 sm:p-3 cursor-pointer border-l-4 transition-all hover:shadow-md",
                                colors.bg,
                                colors.border,
                                block.status === "completed" && "opacity-60"
                              )}
                              style={{ minHeight: `${heightPx}px` }}
                              onClick={() => toggleBlockStatus(block.id)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <h4 className={cn(
                                    "font-medium text-sm truncate",
                                    colors.text,
                                    block.status === "completed" && "line-through"
                                  )}>
                                    {block.title}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1 text-xs text-neutral-500">
                                    <span>{block.startTime} - {block.endTime}</span>
                                    {block.linkedGoalId && (
                                      <Badge variant="outline" className="text-xs py-0">
                                        <Target className="h-3 w-3 mr-1" />
                                        Goal
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                                {block.status === "completed" ? (
                                  <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Start timer for this block
                                    }}
                                    className="p-1 hover:bg-white/50 rounded transition-colors"
                                  >
                                    <Play className="h-3 w-3" />
                                  </button>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Unscheduled Tasks */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CheckSquare className="h-4 w-4" />
                  Unscheduled Tasks
                </CardTitle>
                <p className="text-xs text-neutral-500">Drag to calendar</p>
              </CardHeader>
              <CardContent className="space-y-2">
                {unscheduledTasks.length === 0 ? (
                  <p className="text-xs text-neutral-500 text-center py-4">
                    All tasks scheduled! 🎉
                  </p>
                ) : (
                  unscheduledTasks.map(task => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={() => setDraggedTask(task)}
                      onDragEnd={() => setDraggedTask(null)}
                      className={cn(
                        "p-2 sm:p-3 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg cursor-grab active:cursor-grabbing hover:bg-neutral-100 dark:hover:bg-neutral-700/50 transition-colors",
                        "border border-transparent hover:border-neutral-200 dark:hover:border-neutral-700"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-neutral-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{task.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {task.timeEstimate && (
                              <span className="text-xs text-neutral-500">
                                {task.timeEstimate}min
                              </span>
                            )}
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs py-0",
                                task.priority === "high" && "border-red-300 text-red-600",
                                task.priority === "medium" && "border-amber-300 text-amber-600"
                              )}
                            >
                              {task.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Daily Summary */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4" />
                  Today&apos;s Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                    <p className="text-lg font-bold text-purple-600">{dailySummary.planned}h</p>
                    <p className="text-xs text-neutral-500">Planned</p>
                  </div>
                  <div className="text-center p-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                    <p className="text-lg font-bold text-green-600">{dailySummary.completed}h</p>
                    <p className="text-xs text-neutral-500">Completed</p>
                  </div>
                  <div className="text-center p-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                    <p className="text-lg font-bold text-blue-600">{dailySummary.deepWork}h</p>
                    <p className="text-xs text-neutral-500">Deep Work</p>
                  </div>
                  <div className="text-center p-2 bg-neutral-50 dark:bg-neutral-800/50 rounded-lg">
                    <p className="text-lg font-bold text-neutral-600">{dailySummary.breaks}h</p>
                    <p className="text-xs text-neutral-500">Breaks</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Tasks</span>
                    <span className="font-medium">
                      {dailySummary.tasksCompleted}/{dailySummary.tasksScheduled} done
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Create Block Dialog */}
      <Dialog open={isCreateBlockOpen} onOpenChange={setIsCreateBlockOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Block Time</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={newBlockForm.title}
                onChange={(e) => setNewBlockForm({ ...newBlockForm, title: e.target.value })}
                placeholder="e.g., Deep Work: ML Assignment"
              />
            </div>

            <div>
              <Label>Type</Label>
              <Select
                value={newBlockForm.type}
                onValueChange={(v) => setNewBlockForm({ ...newBlockForm, type: v as any })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deep_work">🎯 Deep Work</SelectItem>
                  <SelectItem value="shallow_work">📋 Shallow Work</SelectItem>
                  <SelectItem value="task">✅ Task</SelectItem>
                  <SelectItem value="meeting">👥 Meeting</SelectItem>
                  <SelectItem value="habit">🔄 Habit</SelectItem>
                  <SelectItem value="break">☕ Break</SelectItem>
                  <SelectItem value="personal">💜 Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={newBlockForm.startTime}
                  onChange={(e) => setNewBlockForm({ ...newBlockForm, startTime: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={newBlockForm.endTime}
                  onChange={(e) => setNewBlockForm({ ...newBlockForm, endTime: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label>Link to Task (optional)</Label>
              <Select
                value={newBlockForm.linkedTaskId}
                onValueChange={(v) => setNewBlockForm({ ...newBlockForm, linkedTaskId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a task..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No task</SelectItem>
                  {unscheduledTasks.map(task => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Link to Goal (optional)</Label>
              <Select
                value={newBlockForm.linkedGoalId}
                onValueChange={(v) => setNewBlockForm({ ...newBlockForm, linkedGoalId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a goal..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No goal</SelectItem>
                  {goals.filter(g => g.status === "active").map(goal => (
                    <SelectItem key={goal.id} value={goal.id}>
                      {goal.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea
                id="notes"
                value={newBlockForm.notes}
                onChange={(e) => setNewBlockForm({ ...newBlockForm, notes: e.target.value })}
                placeholder="Any additional notes..."
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateBlockOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateBlock} disabled={!newBlockForm.title.trim()}>
              Create Block
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
