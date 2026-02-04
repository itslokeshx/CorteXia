"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  format,
  parseISO,
  isToday,
  isTomorrow,
  isThisWeek,
  isThisMonth,
  addDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from "date-fns";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
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
  Clock,
  Flag,
  CheckCircle2,
  Circle,
  TrendingUp,
  Calendar,
  Target,
  Trash2,
  Edit2,
  Search,
  Filter,
  ArrowRight,
  Zap,
  AlertTriangle,
  CalendarDays,
  LayoutGrid,
  List,
  ChevronRight,
  Link2,
  Timer,
  Repeat,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/context/app-context";
import type { Task as TaskType } from "@/lib/types";

// View modes
type ViewMode = "today" | "tomorrow" | "week" | "month" | "all";
type LayoutMode = "list" | "grid";

// Priority colors
const PRIORITY_CONFIG = {
  low: {
    color:
      "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
    dot: "bg-slate-400",
  },
  medium: {
    color:
      "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
    dot: "bg-blue-500",
  },
  high: {
    color:
      "bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800",
    dot: "bg-orange-500",
  },
  critical: {
    color:
      "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800",
    dot: "bg-red-500",
  },
};

const DOMAIN_COLORS: Record<string, string> = {
  work: "#3b82f6",
  health: "#22c55e",
  study: "#a855f7",
  personal: "#f59e0b",
  finance: "#10b981",
  focus: "#8b5cf6",
  leisure: "#ec4899",
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export default function TasksPage() {
  const { tasks, goals, addTask, deleteTask, completeTask, updateTask } =
    useApp();

  const [viewMode, setViewMode] = useState<ViewMode>("today");
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("list");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "pending" | "completed"
  >("all");
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskType | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    domain: "work" as const,
    priority: "medium" as "low" | "medium" | "high" | "critical",
    dueDate: format(new Date(), "yyyy-MM-dd"),
    dueTime: "",
    linkedGoalId: "",
    timeEstimate: 30,
    tags: [] as string[],
    recurrence: "none" as "none" | "daily" | "weekly" | "monthly",
  });

  const today = format(new Date(), "yyyy-MM-dd");
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");

  // Filter tasks based on view mode and filters
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // View mode filter
    switch (viewMode) {
      case "today":
        result = result.filter(
          (t) =>
            t.dueDate === today ||
            (t.dueDate && t.dueDate < today && t.status !== "completed"),
        );
        break;
      case "tomorrow":
        result = result.filter((t) => t.dueDate === tomorrow);
        break;
      case "week":
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
        const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
        result = result.filter((t) => {
          if (!t.dueDate) return false;
          const dueDate = parseISO(t.dueDate);
          return (
            isWithinInterval(dueDate, { start: weekStart, end: weekEnd }) ||
            (t.dueDate < today && t.status !== "completed")
          );
        });
        break;
      case "month":
        const monthStart = startOfMonth(new Date());
        const monthEnd = endOfMonth(new Date());
        result = result.filter((t) => {
          if (!t.dueDate) return false;
          const dueDate = parseISO(t.dueDate);
          return (
            isWithinInterval(dueDate, { start: monthStart, end: monthEnd }) ||
            (t.dueDate < today && t.status !== "completed")
          );
        });
        break;
      case "all":
      default:
        break;
    }

    // Status filter
    if (statusFilter === "pending") {
      result = result.filter((t) => t.status !== "completed");
    } else if (statusFilter === "completed") {
      result = result.filter((t) => t.status === "completed");
    }

    // Domain filter
    if (domainFilter !== "all") {
      result = result.filter((t) => t.domain === domainFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(query) ||
          t.description?.toLowerCase().includes(query),
      );
    }

    // Sort: overdue first, then by priority, then by due date
    return result.sort((a, b) => {
      // Completed tasks at the bottom
      if (a.status === "completed" && b.status !== "completed") return 1;
      if (a.status !== "completed" && b.status === "completed") return -1;

      // Overdue tasks first
      const aOverdue =
        a.dueDate && a.dueDate < today && a.status !== "completed";
      const bOverdue =
        b.dueDate && b.dueDate < today && b.status !== "completed";
      if (aOverdue && !bOverdue) return -1;
      if (!aOverdue && bOverdue) return 1;

      // Then by priority
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const aPriority =
        priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2;
      const bPriority =
        priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2;
      if (aPriority !== bPriority) return aPriority - bPriority;

      // Then by due date
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;

      return 0;
    });
  }, [
    tasks,
    viewMode,
    statusFilter,
    domainFilter,
    searchQuery,
    today,
    tomorrow,
  ]);

  // Stats
  const stats = useMemo(() => {
    const pending = filteredTasks.filter(
      (t) => t.status !== "completed",
    ).length;
    const completed = filteredTasks.filter(
      (t) => t.status === "completed",
    ).length;
    const overdue = filteredTasks.filter(
      (t) => t.dueDate && t.dueDate < today && t.status !== "completed",
    ).length;
    const highPriority = filteredTasks.filter(
      (t) =>
        (t.priority === "high" || t.priority === "critical") &&
        t.status !== "completed",
    ).length;
    const completionRate =
      filteredTasks.length > 0
        ? Math.round((completed / filteredTasks.length) * 100)
        : 0;

    return {
      pending,
      completed,
      overdue,
      highPriority,
      completionRate,
      total: filteredTasks.length,
    };
  }, [filteredTasks, today]);

  // Handle creating/updating task
  const handleSubmit = () => {
    if (!formData.title.trim()) return;

    const taskData = {
      title: formData.title,
      description: formData.description,
      domain: formData.domain,
      priority: formData.priority,
      dueDate: formData.dueDate,
      dueTime: formData.dueTime || undefined,
      linkedGoalId: formData.linkedGoalId || undefined,
      timeEstimate: formData.timeEstimate,
      tags: formData.tags,
      recurrence:
        formData.recurrence !== "none"
          ? { type: formData.recurrence, interval: 1 }
          : undefined,
      status: "pending" as const,
    };

    if (editingTask) {
      updateTask(editingTask.id, taskData);
    } else {
      addTask(taskData);
    }

    resetForm();
    setDialogOpen(false);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      domain: "work",
      priority: "medium",
      dueDate: format(new Date(), "yyyy-MM-dd"),
      dueTime: "",
      linkedGoalId: "",
      timeEstimate: 30,
      tags: [],
      recurrence: "none",
    });
    setEditingTask(null);
  };

  const handleEdit = (task: TaskType) => {
    setFormData({
      title: task.title,
      description: task.description || "",
      domain: task.domain,
      priority: task.priority as "low" | "medium" | "high" | "critical",
      dueDate: task.dueDate || format(new Date(), "yyyy-MM-dd"),
      dueTime: task.dueTime || "",
      linkedGoalId: task.linkedGoalId || "",
      timeEstimate: task.timeEstimate || 30,
      tags: task.tags || [],
      recurrence: task.recurrence?.type || "none",
    });
    setEditingTask(task);
    setDialogOpen(true);
  };

  const handleDelete = (taskId: string) => {
    deleteTask(taskId);
  };

  const handleComplete = (taskId: string) => {
    completeTask(taskId);
  };

  // Get linked goal name
  const getGoalName = (goalId: string | undefined) => {
    if (!goalId) return null;
    const goal = goals.find((g) => g.id === goalId);
    return goal?.title;
  };

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
              Tasks
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {stats.pending} pending • {stats.completed} completed
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
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>
                  {editingTask ? "Edit Task" : "Create New Task"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Input
                  placeholder="Task title"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="text-base"
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={2}
                />
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Domain
                    </label>
                    <Select
                      value={formData.domain}
                      onValueChange={(v) =>
                        setFormData({
                          ...formData,
                          domain: v as typeof formData.domain,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="work">💼 Work</SelectItem>
                        <SelectItem value="health">💪 Health</SelectItem>
                        <SelectItem value="study">📚 Study</SelectItem>
                        <SelectItem value="personal">👤 Personal</SelectItem>
                        <SelectItem value="finance">💰 Finance</SelectItem>
                        <SelectItem value="focus">🎯 Focus</SelectItem>
                        <SelectItem value="leisure">🎮 Leisure</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Priority
                    </label>
                    <Select
                      value={formData.priority}
                      onValueChange={(v) =>
                        setFormData({
                          ...formData,
                          priority: v as typeof formData.priority,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">🟢 Low</SelectItem>
                        <SelectItem value="medium">🔵 Medium</SelectItem>
                        <SelectItem value="high">🟠 High</SelectItem>
                        <SelectItem value="critical">🔴 Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Due Date
                    </label>
                    <Input
                      type="date"
                      value={formData.dueDate}
                      onChange={(e) =>
                        setFormData({ ...formData, dueDate: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Due Time (optional)
                    </label>
                    <Input
                      type="time"
                      value={formData.dueTime}
                      onChange={(e) =>
                        setFormData({ ...formData, dueTime: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Time Estimate (min)
                    </label>
                    <Input
                      type="number"
                      min={5}
                      step={5}
                      value={formData.timeEstimate}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          timeEstimate: parseInt(e.target.value) || 30,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Repeat
                    </label>
                    <Select
                      value={formData.recurrence}
                      onValueChange={(v) =>
                        setFormData({
                          ...formData,
                          recurrence: v as typeof formData.recurrence,
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No repeat</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {goals.length > 0 && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                      <Link2 className="h-3 w-3" />
                      Link to Goal
                    </label>
                    <Select
                      value={formData.linkedGoalId || "none"}
                      onValueChange={(v) =>
                        setFormData({
                          ...formData,
                          linkedGoalId: v === "none" ? "" : v,
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
                  {editingTask ? "Update Task" : "Create Task"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* View Mode Tabs */}
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap items-center gap-2"
        >
          <div className="flex rounded-lg bg-neutral-100 dark:bg-neutral-900 p-1">
            {(["today", "tomorrow", "week", "month", "all"] as ViewMode[]).map(
              (mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={cn(
                    "px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize",
                    viewMode === mode
                      ? "bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white",
                  )}
                >
                  {mode}
                </button>
              ),
            )}
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "h-9 w-9",
                layoutMode === "list" && "bg-neutral-100 dark:bg-neutral-800",
              )}
              onClick={() => setLayoutMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className={cn(
                "h-9 w-9",
                layoutMode === "grid" && "bg-neutral-100 dark:bg-neutral-800",
              )}
              onClick={() => setLayoutMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <div className="text-2xl font-semibold">{stats.pending}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
            <div className="text-2xl font-semibold text-green-600 dark:text-green-400">
              {stats.completed}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">
              Completed
            </div>
          </div>
          {stats.overdue > 0 && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
              <div className="text-2xl font-semibold text-red-600 dark:text-red-400">
                {stats.overdue}
              </div>
              <div className="text-xs text-red-600 dark:text-red-400">
                Overdue
              </div>
            </div>
          )}
          {stats.highPriority > 0 && (
            <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
              <div className="text-2xl font-semibold text-orange-600 dark:text-orange-400">
                {stats.highPriority}
              </div>
              <div className="text-xs text-orange-600 dark:text-orange-400">
                High Priority
              </div>
            </div>
          )}
        </motion.div>

        {/* Filters */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={domainFilter} onValueChange={setDomainFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              <SelectItem value="work">💼 Work</SelectItem>
              <SelectItem value="health">💪 Health</SelectItem>
              <SelectItem value="study">📚 Study</SelectItem>
              <SelectItem value="personal">👤 Personal</SelectItem>
              <SelectItem value="finance">💰 Finance</SelectItem>
              <SelectItem value="focus">🎯 Focus</SelectItem>
              <SelectItem value="leisure">🎮 Leisure</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Tasks List/Grid */}
        <motion.div
          variants={containerVariants}
          className={cn(
            layoutMode === "grid"
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
              : "space-y-2",
          )}
        >
          <AnimatePresence mode="popLayout">
            {filteredTasks.length === 0 ? (
              <motion.div
                variants={itemVariants}
                className="col-span-full text-center py-12 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-dashed border-neutral-200 dark:border-neutral-800"
              >
                <CheckCircle2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No tasks found</p>
                <Button
                  variant="link"
                  onClick={() => setDialogOpen(true)}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Create a task
                </Button>
              </motion.div>
            ) : (
              filteredTasks.map((task) => {
                const isOverdue =
                  task.dueDate &&
                  task.dueDate < today &&
                  task.status !== "completed";
                const isDueToday = task.dueDate === today;
                const isDueTomorrow = task.dueDate === tomorrow;
                const linkedGoal = getGoalName(task.linkedGoalId);
                const priorityConfig =
                  PRIORITY_CONFIG[
                    task.priority as keyof typeof PRIORITY_CONFIG
                  ] || PRIORITY_CONFIG.medium;

                return (
                  <motion.div
                    key={task.id}
                    layout
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={cn(
                      "group p-4 rounded-xl border transition-all",
                      task.status === "completed"
                        ? "bg-neutral-50/50 dark:bg-neutral-900/50 border-neutral-200 dark:border-neutral-800 opacity-60"
                        : isOverdue
                          ? "bg-red-50/50 dark:bg-red-950/10 border-red-200 dark:border-red-900"
                          : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-violet-500/50",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox */}
                      <button
                        onClick={() => handleComplete(task.id)}
                        className={cn(
                          "flex-shrink-0 h-5 w-5 mt-0.5 rounded-full border-2 flex items-center justify-center transition-colors",
                          task.status === "completed"
                            ? "border-green-500 bg-green-500"
                            : "border-neutral-300 dark:border-neutral-600 hover:border-green-500 hover:bg-green-50 dark:hover:bg-green-950/50",
                        )}
                      >
                        {task.status === "completed" && (
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        )}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            className={cn(
                              "font-medium text-sm",
                              task.status === "completed" &&
                                "line-through text-muted-foreground",
                            )}
                          >
                            {task.title}
                          </h3>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleEdit(task)}
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-red-500 hover:text-red-600"
                              onClick={() => handleDelete(task.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>

                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          {/* Domain */}
                          <div
                            className="h-1.5 w-1.5 rounded-full"
                            style={{
                              backgroundColor:
                                DOMAIN_COLORS[task.domain] || "#8b5cf6",
                            }}
                          />
                          <span className="text-xs text-muted-foreground capitalize">
                            {task.domain}
                          </span>

                          {/* Priority */}
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5",
                              priorityConfig.color,
                            )}
                          >
                            {task.priority}
                          </Badge>

                          {/* Due Date */}
                          {task.dueDate && (
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] px-1.5",
                                isOverdue
                                  ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                                  : isDueToday
                                    ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                                    : isDueTomorrow
                                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"
                                      : "",
                              )}
                            >
                              <Calendar className="h-3 w-3 mr-1" />
                              {isOverdue
                                ? "Overdue"
                                : isDueToday
                                  ? "Today"
                                  : isDueTomorrow
                                    ? "Tomorrow"
                                    : format(parseISO(task.dueDate), "MMM d")}
                            </Badge>
                          )}

                          {/* Time Estimate */}
                          {task.timeEstimate && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Timer className="h-3 w-3" />
                              {task.timeEstimate}m
                            </span>
                          )}

                          {/* Recurrence */}
                          {task.recurrence && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                              <Repeat className="h-3 w-3" />
                              {task.recurrence.type}
                            </span>
                          )}

                          {/* Linked Goal */}
                          {linkedGoal && (
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5"
                            >
                              <Target className="h-3 w-3 mr-1" />
                              {linkedGoal}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </motion.div>

        {/* Progress Summary */}
        {stats.total > 0 && (
          <motion.div
            variants={itemVariants}
            className="p-4 rounded-xl bg-gradient-to-r from-violet-500/10 to-purple-500/10 border border-violet-500/20"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Completion Progress</span>
              <span className="text-sm font-bold text-violet-600 dark:text-violet-400">
                {stats.completionRate}%
              </span>
            </div>
            <Progress value={stats.completionRate} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {stats.completed} of {stats.total} tasks completed in this view
            </p>
          </motion.div>
        )}
      </motion.div>
    </AppLayout>
  );
}
