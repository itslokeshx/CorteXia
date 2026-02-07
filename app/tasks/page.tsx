"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { useApp } from "@/lib/context/app-context";
import type { Task, Subtask, Goal } from "@/lib/types";
import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  format,
  parseISO,
  addDays,
  endOfWeek,
  endOfMonth,
  endOfYear,
} from "date-fns";
import { useRouter } from "next/navigation";
import {
  Plus,
  Check,
  Clock,
  Trash2,
  Play,
  Pencil,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// ═════════════════════════════════════════════════════════════════════════════
//  CONFIG
// ═════════════════════════════════════════════════════════════════════════════

const priorityConfig = {
  critical: {
    label: "Critical",
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-800",
    dot: "bg-red-600",
  },
  high: {
    label: "High",
    bg: "bg-red-100 dark:bg-red-900/30",
    text: "text-red-700 dark:text-red-300",
    border: "border-red-200 dark:border-red-800",
    dot: "bg-orange-500",
  },
  medium: {
    label: "Medium",
    bg: "bg-amber-100 dark:bg-amber-900/30",
    text: "text-amber-700 dark:text-amber-300",
    border: "border-amber-200 dark:border-amber-800",
    dot: "bg-amber-500",
  },
  low: {
    label: "Low",
    bg: "bg-gray-100 dark:bg-gray-800",
    text: "text-gray-700 dark:text-gray-300",
    border: "border-gray-200 dark:border-gray-700",
    dot: "bg-gray-400",
  },
};

type TabView = "today" | "tomorrow" | "week" | "month" | "year";
type SortBy = "priority" | "dueDate" | "title" | "created";

// ═════════════════════════════════════════════════════════════════════════════
//  MAIN COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export default function TasksPage() {
  const router = useRouter();
  const { tasks, addTask, completeTask, updateTask, deleteTask, goals } =
    useApp();

  const [view, setView] = useState<TabView>("today");
  const [sortBy, setSortBy] = useState<SortBy>("priority");
  const [filterPriority, setFilterPriority] = useState("all");
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});
  const [showModal, setShowModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [addingSubtask, setAddingSubtask] = useState<string | null>(null);
  const [newSubtaskText, setNewSubtaskText] = useState("");

  const [formTitle, setFormTitle] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPriority, setFormPriority] = useState<Task["priority"]>("medium");
  const [formSchedule, setFormSchedule] = useState<
    "today" | "tomorrow" | "week" | "month" | "year"
  >("today");
  const [formGoalId, setFormGoalId] = useState("");
  const [formTimeBlock, setFormTimeBlock] = useState(false);
  const [formStartTime, setFormStartTime] = useState("09:00");
  const [formEndTime, setFormEndTime] = useState("10:00");
  const [formDurH, setFormDurH] = useState(0);
  const [formDurM, setFormDurM] = useState(30);

  const today = format(new Date(), "yyyy-MM-dd");
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");
  const weekEnd = format(
    endOfWeek(new Date(), { weekStartsOn: 1 }),
    "yyyy-MM-dd",
  );
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");
  const yearEnd = format(endOfYear(new Date()), "yyyy-MM-dd");

  const scheduleToDate = (s: string) => {
    switch (s) {
      case "today":
        return today;
      case "tomorrow":
        return tomorrow;
      case "week":
        return format(addDays(new Date(), 3), "yyyy-MM-dd");
      case "month":
        return format(addDays(new Date(), 14), "yyyy-MM-dd");
      case "year":
        return format(addDays(new Date(), 90), "yyyy-MM-dd");
      default:
        return today;
    }
  };

  const filteredTasks = useMemo(() => {
    let filtered = [...tasks];
    switch (view) {
      case "today":
        filtered = filtered.filter(
          (t) =>
            t.dueDate === today ||
            (t.dueDate && t.dueDate < today && t.status !== "completed"),
        );
        break;
      case "tomorrow":
        filtered = filtered.filter((t) => t.dueDate === tomorrow);
        break;
      case "week":
        filtered = filtered.filter(
          (t) => t.dueDate && t.dueDate >= today && t.dueDate <= weekEnd,
        );
        break;
      case "month":
        filtered = filtered.filter(
          (t) => t.dueDate && t.dueDate >= today && t.dueDate <= monthEnd,
        );
        break;
      case "year":
        filtered = filtered.filter(
          (t) => t.dueDate && t.dueDate >= today && t.dueDate <= yearEnd,
        );
        break;
    }

    if (filterPriority !== "all") {
      filtered = filtered.filter((t) => t.priority === filterPriority);
    }

    const po: Record<string, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    filtered.sort((a, b) => {
      if (a.status === "completed" && b.status !== "completed") return 1;
      if (a.status !== "completed" && b.status === "completed") return -1;
      switch (sortBy) {
        case "priority":
          return (po[a.priority] ?? 2) - (po[b.priority] ?? 2);
        case "dueDate":
          return (a.dueDate || "9999").localeCompare(b.dueDate || "9999");
        case "title":
          return a.title.localeCompare(b.title);
        case "created":
          return b.createdAt.localeCompare(a.createdAt);
        default:
          return 0;
      }
    });
    return filtered;
  }, [
    tasks,
    view,
    sortBy,
    filterPriority,
    today,
    tomorrow,
    weekEnd,
    monthEnd,
    yearEnd,
  ]);

  const pending = filteredTasks.filter((t) => t.status !== "completed");
  const completed = filteredTasks.filter((t) => t.status === "completed");

  const resetForm = () => {
    setFormTitle("");
    setFormDescription("");
    setFormPriority("medium");
    setFormSchedule("today");
    setFormGoalId("");
    setFormTimeBlock(false);
    setFormStartTime("09:00");
    setFormEndTime("10:00");
    setFormDurH(0);
    setFormDurM(30);
  };

  const handleCreate = () => {
    if (!formTitle.trim()) return;
    const dur = formDurH * 60 + formDurM;
    addTask({
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      domain: "personal",
      priority: formPriority,
      status: "todo",
      dueDate: scheduleToDate(formSchedule),
      dueTime: formTimeBlock ? formStartTime : undefined,
      scheduledFor: formSchedule,
      timeEstimate: dur > 0 ? dur : undefined,
      linkedGoalId: formGoalId || undefined,
    });
    resetForm();
    setShowModal(false);
  };

  const handleSaveEdit = () => {
    if (!editingTaskId || !formTitle.trim()) return;
    const dur = formDurH * 60 + formDurM;
    updateTask(editingTaskId, {
      title: formTitle.trim(),
      description: formDescription.trim() || undefined,
      priority: formPriority,
      dueDate: scheduleToDate(formSchedule),
      dueTime: formTimeBlock ? formStartTime : undefined,
      scheduledFor: formSchedule,
      timeEstimate: dur > 0 ? dur : undefined,
      linkedGoalId: formGoalId || undefined,
    });
    resetForm();
    setEditingTaskId(null);
    setShowModal(false);
  };

  const openEdit = (task: Task) => {
    setFormTitle(task.title);
    setFormDescription(task.description || "");
    setFormPriority(task.priority);
    setFormSchedule(task.scheduledFor || "today");
    setFormGoalId(task.linkedGoalId || "");
    setFormDurH(Math.floor((task.timeEstimate || 0) / 60));
    setFormDurM((task.timeEstimate || 0) % 60);
    if (task.dueTime) {
      setFormTimeBlock(true);
      setFormStartTime(task.dueTime);
    }
    setEditingTaskId(task.id);
    setShowModal(true);
  };

  const handleAddSubtask = useCallback(
    (taskId: string, title: string) => {
      if (!title.trim()) return;
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;
      const st: Subtask = {
        id: `st_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: title.trim(),
        completed: false,
      };
      updateTask(taskId, { subtasks: [...(task.subtasks || []), st] });
    },
    [tasks, updateTask],
  );

  const handleToggleSubtask = useCallback(
    (taskId: string, subtaskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task?.subtasks) return;
      const subs = task.subtasks.map((s) =>
        s.id === subtaskId
          ? {
              ...s,
              completed: !s.completed,
              completedAt: !s.completed ? new Date().toISOString() : undefined,
            }
          : s,
      );
      updateTask(taskId, { subtasks: subs });
      if (subs.length > 0 && subs.every((s) => s.completed)) {
        completeTask(taskId);
      }
    },
    [tasks, updateTask, completeTask],
  );

  const handleStartTimer = (task: Task) => {
    router.push(
      `/time-tracker?task=${encodeURIComponent(task.title)}&taskId=${task.id}`,
    );
  };

  const toggleSection = (key: string) =>
    setExpandedSections((p) => ({ ...p, [key]: !p[key] }));

  const fmtDue = (task: Task) => {
    if (!task.dueDate) return null;
    const isOverdue = task.status !== "completed" && task.dueDate < today;
    const time = task.dueTime
      ? format(parseISO(`2000-01-01T${task.dueTime}`), "h:mm a")
      : null;
    let label: string;
    if (task.dueDate === today) label = time || "Today";
    else if (task.dueDate === tomorrow) label = "Tomorrow";
    else label = format(parseISO(task.dueDate), "MMM d");
    return { label, isOverdue, isToday: task.dueDate === today };
  };

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="pb-8 max-w-4xl mx-auto"
      >
        {/* Header + Tabs */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-[20px] font-semibold tracking-tight text-[var(--color-text-primary)]">
              Tasks
            </h1>
            <div className="flex items-center gap-1">
              {(
                [
                  ["today", "Today"],
                  ["tomorrow", "Tomorrow"],
                  ["week", "Week"],
                  ["month", "Month"],
                  ["year", "Year"],
                ] as const
              ).map(([val, label]) => (
                <button
                  key={val}
                  onClick={() => setView(val)}
                  className={cn(
                    "px-2.5 py-1 text-[12px] font-medium rounded-md transition-all duration-150",
                    view === val
                      ? "bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/50",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                resetForm();
                setEditingTaskId(null);
                setShowModal(true);
              }}
              className="h-8 px-3 text-[13px] font-medium rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              New
            </Button>

            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="h-8 w-[100px] text-[12px] rounded-lg border-gray-300 dark:border-gray-600">
                <Filter className="w-3 h-3 mr-1 text-gray-500" />
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={sortBy}
              onValueChange={(v) => setSortBy(v as SortBy)}
            >
              <SelectTrigger className="h-8 w-[100px] text-[12px] rounded-lg border-gray-300 dark:border-gray-600">
                <ArrowUpDown className="w-3 h-3 mr-1 text-gray-500" />
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="priority">Priority</SelectItem>
                <SelectItem value="dueDate">Due Date</SelectItem>
                <SelectItem value="title">Title</SelectItem>
                <SelectItem value="created">Created</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-1.5">
          <AnimatePresence mode="popLayout">
            {pending.length > 0 ? (
              <>
                {(() => {
                  const collapsed = !expandedSections[view];
                  const slice =
                    collapsed && pending.length > 5
                      ? pending.slice(0, 3)
                      : pending;
                  const hiddenN = pending.length - 3;

                  return (
                    <>
                      {slice.map((task, i) => (
                        <TaskCard
                          key={task.id}
                          task={task}
                          i={i}
                          today={today}
                          tomorrow={tomorrow}
                          goals={goals}
                          fmtDue={fmtDue}
                          onComplete={completeTask}
                          onDelete={deleteTask}
                          onEdit={() => openEdit(task)}
                          onStartTimer={() => handleStartTimer(task)}
                          addingSubtask={addingSubtask}
                          setAddingSubtask={setAddingSubtask}
                          newSubtaskText={newSubtaskText}
                          setNewSubtaskText={setNewSubtaskText}
                          addSubtask={handleAddSubtask}
                          toggleSubtask={handleToggleSubtask}
                          updateTask={updateTask}
                        />
                      ))}
                      {collapsed && pending.length > 5 && (
                        <motion.button
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          onClick={() => toggleSection(view)}
                          className="w-full py-2 text-[12px] text-purple-600 dark:text-purple-400 hover:text-purple-700 font-medium"
                        >
                          +{hiddenN} more
                        </motion.button>
                      )}
                      {!collapsed && pending.length > 5 && (
                        <motion.button
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          onClick={() => toggleSection(view)}
                          className="w-full py-2 text-[12px] text-purple-600 dark:text-purple-400 hover:text-purple-700 font-medium"
                        >
                          Show less
                        </motion.button>
                      )}
                    </>
                  );
                })()}
              </>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-purple-500" />
                </div>
                <p className="text-[14px] font-medium text-[var(--color-text-primary)]">
                  All clear
                </p>
                <p className="text-[12px] text-gray-500 mt-1">
                  {view === "today"
                    ? "No tasks today"
                    : view === "tomorrow"
                      ? "Nothing planned tomorrow"
                      : "No tasks"}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Completed */}
          {completed.length > 0 && (
            <div className="mt-6">
              <div className="mb-2 pb-1 border-b border-gray-100 dark:border-gray-800">
                <span className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  Completed ({completed.length})
                </span>
              </div>
              <div className="space-y-1.5">
                {(expandedSections["done"]
                  ? completed
                  : completed.slice(0, 3)
                ).map((task, i) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    i={i}
                    today={today}
                    tomorrow={tomorrow}
                    goals={goals}
                    fmtDue={fmtDue}
                    onComplete={completeTask}
                    onDelete={deleteTask}
                    onEdit={() => openEdit(task)}
                    onStartTimer={() => handleStartTimer(task)}
                    addingSubtask={addingSubtask}
                    setAddingSubtask={setAddingSubtask}
                    newSubtaskText={newSubtaskText}
                    setNewSubtaskText={setNewSubtaskText}
                    addSubtask={handleAddSubtask}
                    toggleSubtask={handleToggleSubtask}
                    updateTask={updateTask}
                    compact
                  />
                ))}
                {completed.length > 3 && (
                  <button
                    onClick={() => toggleSection("done")}
                    className="w-full py-1.5 text-[11px] text-gray-500 hover:text-purple-600 transition-colors"
                  >
                    {expandedSections["done"]
                      ? "Show less"
                      : `+${completed.length - 3} more`}
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Modal */}
      <Dialog
        open={showModal}
        onOpenChange={(open) => {
          if (!open) {
            setShowModal(false);
            setEditingTaskId(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl rounded-2xl border-[var(--color-border)] p-0 gap-0 overflow-hidden">
          <DialogHeader className="h-14 px-5 flex flex-row items-center border-b border-gray-200 dark:border-gray-700">
            <DialogTitle className="text-[18px] font-semibold text-[var(--color-text-primary)]">
              {editingTaskId ? "Edit Task" : "Create Task"}
            </DialogTitle>
          </DialogHeader>

          <div className="px-5 py-4 space-y-3 max-h-[70vh] overflow-y-auto">
            <div>
              <label className="text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Task Name <span className="text-red-500">*</span>
              </label>
              <Input
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && formTitle.trim()) {
                    editingTaskId ? handleSaveEdit() : handleCreate();
                  }
                }}
                placeholder="What needs to be done?"
                className="h-10 text-[14px] rounded-lg border-[1.5px]"
                autoFocus
              />
            </div>

            <div>
              <label className="text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Description
              </label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Optional details"
                className="min-h-[70px] max-h-[150px] text-[13px] rounded-lg resize-vertical"
              />
            </div>

            <div>
              <label className="text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                Schedule
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(
                  [
                    ["today", "Today"],
                    ["tomorrow", "Tomorrow"],
                    ["week", "Week"],
                    ["month", "Month"],
                    ["year", "Year"],
                  ] as const
                ).map(([val, label]) => (
                  <button
                    key={val}
                    onClick={() => setFormSchedule(val)}
                    className={cn(
                      "px-3 py-1.5 text-[12px] font-medium rounded-lg border transition-all",
                      formSchedule === val
                        ? "border-purple-600 dark:border-purple-500 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                        : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1.5 block">
                Priority
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(["low", "medium", "high", "critical"] as const).map((p) => {
                  const c = priorityConfig[p];
                  return (
                    <button
                      key={p}
                      onClick={() => setFormPriority(p)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium rounded-lg border transition-all",
                        formPriority === p
                          ? `${c.bg} ${c.text} ${c.border}`
                          : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800",
                      )}
                    >
                      <span className={cn("w-1.5 h-1.5 rounded-full", c.dot)} />
                      {c.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Goal
              </label>
              <Select
                value={formGoalId || "none"}
                onValueChange={(v) => setFormGoalId(v === "none" ? "" : v)}
              >
                <SelectTrigger className="h-10 text-[13px] rounded-lg">
                  <SelectValue placeholder="Link to goal (optional)" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="none">None</SelectItem>
                  {goals
                    .filter(
                      (g) =>
                        g.status !== "completed" && g.status !== "abandoned",
                    )
                    .map((g) => (
                      <SelectItem key={g.id} value={g.id}>
                        {g.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formTimeBlock}
                  onChange={(e) => setFormTimeBlock(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className="text-[13px] font-medium text-gray-700 dark:text-gray-300">
                  Block time
                </span>
              </label>
              <AnimatePresence>
                {formTimeBlock && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="flex items-center gap-3 mt-2 ml-6">
                      <Input
                        type="time"
                        value={formStartTime}
                        onChange={(e) => setFormStartTime(e.target.value)}
                        className="w-28 h-9 text-center text-[12px]"
                      />
                      <span className="text-gray-400">to</span>
                      <Input
                        type="time"
                        value={formEndTime}
                        onChange={(e) => setFormEndTime(e.target.value)}
                        className="w-28 h-9 text-center text-[12px]"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div>
              <label className="text-[13px] font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Duration
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={12}
                  value={formDurH}
                  onChange={(e) => setFormDurH(parseInt(e.target.value) || 0)}
                  className="w-16 h-9 text-center text-[13px]"
                />
                <span className="text-[12px] text-gray-500">h</span>
                <Input
                  type="number"
                  min={0}
                  max={59}
                  value={formDurM}
                  onChange={(e) => setFormDurM(parseInt(e.target.value) || 0)}
                  className="w-16 h-9 text-center text-[13px]"
                />
                <span className="text-[12px] text-gray-500">m</span>
              </div>
            </div>
          </div>

          <DialogFooter className="h-16 px-5 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowModal(false);
                setEditingTaskId(null);
                resetForm();
              }}
              className="h-9 px-4 text-[13px] rounded-lg"
            >
              Cancel
            </Button>
            <Button
              onClick={editingTaskId ? handleSaveEdit : handleCreate}
              disabled={!formTitle.trim()}
              className="h-9 px-5 text-[13px] rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-sm disabled:opacity-50"
            >
              {editingTaskId ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

// TaskCard
interface TaskCardProps {
  task: Task;
  i: number;
  today: string;
  tomorrow: string;
  goals: Goal[];
  fmtDue: (
    t: Task,
  ) => { label: string; isOverdue: boolean; isToday: boolean } | null;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: () => void;
  onStartTimer: () => void;
  addingSubtask: string | null;
  setAddingSubtask: (id: string | null) => void;
  newSubtaskText: string;
  setNewSubtaskText: (t: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  compact?: boolean;
}

function TaskCard({
  task,
  i,
  today,
  tomorrow,
  goals,
  fmtDue,
  onComplete,
  onDelete,
  onEdit,
  onStartTimer,
  addingSubtask,
  setAddingSubtask,
  newSubtaskText,
  setNewSubtaskText,
  addSubtask,
  toggleSubtask,
  updateTask,
  compact,
}: TaskCardProps) {
  const isDone = task.status === "completed";
  const due = fmtDue(task);
  const priority =
    priorityConfig[task.priority as keyof typeof priorityConfig] ||
    priorityConfig.medium;
  const goal = goals.find((g) => g.id === task.linkedGoalId);
  const subtasks = task.subtasks || [];
  const subtasksDone = subtasks.filter((s) => s.completed).length;

  if (compact) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 2 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, height: 0 }}
        transition={{ delay: i * 0.01, duration: 0.12 }}
        className="flex items-center gap-2.5 p-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 opacity-60"
      >
        <div
          onClick={() => onComplete(task.id)}
          className="w-4 h-4 rounded border-2 border-green-500 bg-green-500 flex items-center justify-center flex-shrink-0 cursor-pointer"
        >
          <Check className="w-2.5 h-2.5 text-white" />
        </div>
        <span className="text-[13px] text-gray-400 line-through flex-1 truncate">
          {task.title}
        </span>
        <button
          onClick={() => onDelete(task.id)}
          className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -12, height: 0 }}
      transition={{ delay: i * 0.02, duration: 0.15 }}
      className={cn(
        "group p-3 rounded-lg border transition-all duration-150",
        isDone
          ? "border-green-200 dark:border-green-800/50 bg-green-50/50 dark:bg-green-900/10 opacity-60"
          : "border-gray-200 dark:border-gray-700 bg-[var(--color-bg-secondary)] hover:border-purple-200 dark:hover:border-purple-800 hover:shadow-sm hover:-translate-y-[1px]",
      )}
    >
      <div className="flex items-start gap-2.5 mb-1.5">
        <div
          onClick={() => onComplete(task.id)}
          className={cn(
            "w-4 h-4 mt-0.5 rounded border-2 flex items-center justify-center flex-shrink-0 cursor-pointer transition-all duration-150",
            isDone
              ? "border-green-500 bg-green-500"
              : "border-gray-300 dark:border-gray-600 hover:border-purple-400",
          )}
        >
          {isDone && <Check className="w-2.5 h-2.5 text-white" />}
        </div>
        <p
          className={cn(
            "flex-1 text-[14px] font-medium leading-[1.4]",
            isDone
              ? "text-gray-400 line-through"
              : "text-gray-900 dark:text-gray-100",
          )}
        >
          {task.title}
        </p>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap ml-6.5 mb-1.5">
        {due && (
          <span
            className={cn(
              "text-[11px]",
              due.isOverdue
                ? "text-red-600 dark:text-red-400 font-semibold"
                : due.isToday
                  ? "text-amber-600 dark:text-amber-400 font-semibold"
                  : "text-gray-500 dark:text-gray-400",
            )}
          >
            {due.label}
          </span>
        )}
        {due && (
          <span className="text-gray-300 dark:text-gray-600 text-[11px]">
            ·
          </span>
        )}
        <span
          className={cn(
            "px-1.5 py-0.5 rounded text-[10px] font-medium border",
            priority.bg,
            priority.text,
            priority.border,
          )}
        >
          {priority.label}
        </span>
        {goal && (
          <>
            <span className="text-gray-300 dark:text-gray-600 text-[11px]">
              ·
            </span>
            <span className="text-[11px] font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 hover:underline cursor-pointer">
              {goal.title}
            </span>
          </>
        )}
        {subtasks.length > 0 && (
          <>
            <span className="text-gray-300 dark:text-gray-600 text-[11px]">
              ·
            </span>
            <span className="text-[11px] text-gray-500">
              {subtasksDone}/{subtasks.length}
            </span>
          </>
        )}
      </div>

      {task.dueTime && (
        <div className="ml-6.5 mb-1.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800/50 text-[11px]">
            <Clock className="w-3 h-3" />
            {format(parseISO(`2000-01-01T${task.dueTime}`), "h:mm a")}
            {task.timeEstimate && (
              <>
                {" · "}
                {task.timeEstimate >= 60
                  ? `${Math.floor(task.timeEstimate / 60)}h${task.timeEstimate % 60 > 0 ? `${task.timeEstimate % 60}m` : ""}`
                  : `${task.timeEstimate}m`}
              </>
            )}
          </span>
        </div>
      )}

      {subtasks.length > 0 && (
        <div className="ml-6.5 mb-1.5 space-y-0.5">
          {subtasks.map((st) => (
            <div key={st.id} className="flex items-center gap-2 py-0.5">
              <button
                onClick={() => toggleSubtask(task.id, st.id)}
                className={cn(
                  "w-3.5 h-3.5 rounded border flex items-center justify-center flex-shrink-0 transition-all",
                  st.completed
                    ? "border-green-500 bg-green-500"
                    : "border-gray-300 dark:border-gray-600 hover:border-green-400",
                )}
              >
                {st.completed && <Check className="w-2 h-2 text-white" />}
              </button>
              <span
                className={cn(
                  "text-[11px]",
                  st.completed
                    ? "line-through text-gray-400"
                    : "text-gray-600 dark:text-gray-300",
                )}
              >
                {st.title}
              </span>
            </div>
          ))}
        </div>
      )}

      {addingSubtask === task.id ? (
        <div className="ml-6.5 mb-1.5">
          <Input
            value={newSubtaskText}
            onChange={(e) => setNewSubtaskText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newSubtaskText.trim()) {
                addSubtask(task.id, newSubtaskText);
                setNewSubtaskText("");
              }
              if (e.key === "Escape") {
                setAddingSubtask(null);
                setNewSubtaskText("");
              }
            }}
            placeholder="Add sub-task..."
            className="h-7 text-[12px] w-48"
            autoFocus
          />
        </div>
      ) : (
        <button
          onClick={() => setAddingSubtask(task.id)}
          className="ml-6.5 mb-1 flex items-center gap-1 text-[11px] text-gray-400 hover:text-purple-500 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add sub-task
        </button>
      )}

      <div className="flex items-center gap-1.5 ml-6.5 pt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <button
          onClick={onEdit}
          className="flex items-center gap-0.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
        >
          <Pencil className="w-3 h-3" />
          Edit
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="flex items-center gap-0.5 text-[11px] font-medium text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          Delete
        </button>
        {!isDone && (
          <button
            onClick={onStartTimer}
            className="flex items-center gap-1 px-2 py-1 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-[11px] font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors ml-auto"
          >
            <Play className="w-3 h-3" />
            Start
          </button>
        )}
      </div>
    </motion.div>
  );
}
