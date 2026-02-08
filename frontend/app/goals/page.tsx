"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { useApp } from "@/lib/context/app-context";
import type { Goal, Milestone } from "@/lib/types";
import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { format, parseISO, differenceInDays, addMonths } from "date-fns";
import {
  Plus,
  ChevronDown,
  ChevronRight,
  Check,
  ArrowLeft,
  Calendar,
  Sparkles,
  BarChart3,
  Zap,
  Clock,
  Pause,
  Play,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ═════════════════════════════════════════════════════════════════════════════
//  TYPES
// ═════════════════════════════════════════════════════════════════════════════

interface SubGoal {
  id: string;
  title: string;
  completed: boolean;
}

interface MonthBlock {
  month: string; // "2026-02"
  label: string; // "February"
  subGoals: SubGoal[];
}

interface QuarterBlock {
  id: string;
  label: string; // "Q1 (Feb – Apr)"
  months: MonthBlock[];
}

// ═════════════════════════════════════════════════════════════════════════════
//  HELPERS
// ═════════════════════════════════════════════════════════════════════════════

const TIMEFRAMES = [
  { value: "3", label: "3 months" },
  { value: "6", label: "6 months" },
  { value: "12", label: "1 year" },
  { value: "custom", label: "Custom" },
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function generateQuarters(startDate: Date, months: number): QuarterBlock[] {
  const quarters: QuarterBlock[] = [];
  const startMonth = startDate.getMonth();
  const startYear = startDate.getFullYear();
  let monthIndex = 0;
  let quarterNum = 1;

  while (monthIndex < months) {
    const quarterMonths: MonthBlock[] = [];
    for (let i = 0; i < 3 && monthIndex < months; i++) {
      const m = (startMonth + monthIndex) % 12;
      const y = startYear + Math.floor((startMonth + monthIndex) / 12);
      quarterMonths.push({
        month: `${y}-${String(m + 1).padStart(2, "0")}`,
        label: MONTH_NAMES[m],
        subGoals: [],
      });
      monthIndex++;
    }

    const startLabel = quarterMonths[0].label.slice(0, 3);
    const endLabel = quarterMonths[quarterMonths.length - 1].label.slice(0, 3);
    quarters.push({
      id: `q${quarterNum}`,
      label: `Q${quarterNum} (${startLabel} – ${endLabel})`,
      months: quarterMonths,
    });
    quarterNum++;
  }
  return quarters;
}

function getStatusDots(progress: number) {
  const filled = Math.round((progress / 100) * 5);
  return Array.from({ length: 5 }, (_, i) => i < filled);
}

// ═════════════════════════════════════════════════════════════════════════════
//  COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

export default function GoalsPage() {
  const { goals, addGoal, updateGoal, deleteGoal, tasks } = useApp();

  // State
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [goalName, setGoalName] = useState("");
  const [timeframe, setTimeframe] = useState("6");
  const [customDate, setCustomDate] = useState("");
  const [goalStructures, setGoalStructures] = useState<
    Record<string, QuarterBlock[]>
  >({});
  const [expandedQuarters, setExpandedQuarters] = useState<Set<string>>(
    new Set(),
  );
  const [expandedMonths, setExpandedMonths] = useState<Set<string>>(new Set());
  const [addingSubGoal, setAddingSubGoal] = useState<string | null>(null);
  const [newSubGoalText, setNewSubGoalText] = useState("");

  // Derived
  const activeGoals = useMemo(
    () => goals.filter((g) => g.status !== "abandoned"),
    [goals],
  );

  const selectedGoal = useMemo(
    () => goals.find((g) => g.id === selectedGoalId) || null,
    [goals, selectedGoalId],
  );

  // ── Structure builder ────────────────────────────────────────────────────
  const getGoalStructure = useCallback(
    (goal: Goal): QuarterBlock[] => {
      if (goalStructures[goal.id]) return goalStructures[goal.id];

      const targetMonths = goal.targetDate
        ? Math.max(
            1,
            Math.ceil(
              differenceInDays(
                parseISO(goal.targetDate),
                parseISO(goal.createdAt),
              ) / 30,
            ),
          )
        : 6;
      const quarters = generateQuarters(parseISO(goal.createdAt), targetMonths);

      // Populate from milestones (format: "month_key|subgoal_title")
      if (goal.milestones?.length) {
        for (const m of goal.milestones) {
          const pipe = m.title.indexOf("|");
          if (pipe > 0) {
            const monthKey = m.title.slice(0, pipe);
            const subTitle = m.title.slice(pipe + 1);
            for (const q of quarters) {
              for (const mo of q.months) {
                if (mo.month === monthKey) {
                  mo.subGoals.push({
                    id: m.id,
                    title: subTitle,
                    completed: m.completed,
                  });
                }
              }
            }
          } else {
            // Legacy — first month
            if (quarters[0]?.months[0]) {
              quarters[0].months[0].subGoals.push({
                id: m.id,
                title: m.title,
                completed: m.completed,
              });
            }
          }
        }
      }
      return quarters;
    },
    [goalStructures],
  );

  // ── Progress calculators ─────────────────────────────────────────────────
  const calcProgress = useCallback((qs: QuarterBlock[]): number => {
    let total = 0,
      done = 0;
    for (const q of qs)
      for (const m of q.months)
        for (const s of m.subGoals) {
          total++;
          if (s.completed) done++;
        }
    return total === 0 ? 0 : Math.round((done / total) * 100);
  }, []);

  const monthProgress = useCallback((m: MonthBlock) => {
    if (!m.subGoals.length) return 0;
    return Math.round(
      (m.subGoals.filter((s) => s.completed).length / m.subGoals.length) * 100,
    );
  }, []);

  const quarterProgress = useCallback((q: QuarterBlock) => {
    let total = 0,
      done = 0;
    for (const m of q.months)
      for (const s of m.subGoals) {
        total++;
        if (s.completed) done++;
      }
    return total === 0 ? 0 : Math.round((done / total) * 100);
  }, []);

  // ── Sync structure → milestones ──────────────────────────────────────────
  const syncToMilestones = useCallback(
    (goalId: string, structure: QuarterBlock[]) => {
      const milestones: Milestone[] = [];
      for (const q of structure)
        for (const m of q.months)
          for (const sg of m.subGoals) {
            milestones.push({
              id: sg.id,
              title: `${m.month}|${sg.title}`,
              targetDate: `${m.month}-15`,
              completed: sg.completed,
              completedAt: sg.completed ? new Date().toISOString() : undefined,
            });
          }

      const progress = calcProgress(structure);
      const isComplete = progress === 100 && milestones.length > 0;

      updateGoal(goalId, {
        milestones,
        progress,
        status: isComplete ? "completed" : "active",
        ...(isComplete ? { completedAt: new Date().toISOString() } : {}),
      });
    },
    [calcProgress, updateGoal],
  );

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleCreateGoal = () => {
    if (!goalName.trim()) return;
    const months =
      timeframe === "custom"
        ? customDate
          ? Math.max(
              1,
              Math.ceil(
                differenceInDays(parseISO(customDate), new Date()) / 30,
              ),
            )
          : 6
        : parseInt(timeframe) || 6;
    const targetDate = addMonths(new Date(), months).toISOString();

    const newGoal = addGoal({
      title: goalName.trim(),
      description: "",
      category: "personal" as Goal["category"],
      priority: "medium" as Goal["priority"],
      targetDate,
      progress: 0,
      status: "active",
      level: months <= 3 ? "quarterly" : months <= 12 ? "yearly" : "life",
      milestones: [],
    });
    setGoalName("");
    setSelectedGoalId(newGoal.id);
  };

  const toggleSubGoal = useCallback(
    (goalId: string, subGoalId: string) => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal) return;
      const structure = getGoalStructure(goal).map((q) => ({
        ...q,
        months: q.months.map((m) => ({
          ...m,
          subGoals: m.subGoals.map((sg) =>
            sg.id === subGoalId ? { ...sg, completed: !sg.completed } : sg,
          ),
        })),
      }));
      setGoalStructures((prev) => ({ ...prev, [goalId]: structure }));
      syncToMilestones(goalId, structure);
    },
    [goals, getGoalStructure, syncToMilestones],
  );

  const addSubGoalToMonth = useCallback(
    (goalId: string, monthKey: string, title: string) => {
      const goal = goals.find((g) => g.id === goalId);
      if (!goal || !title.trim()) return;
      const newId = `sg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const structure = getGoalStructure(goal).map((q) => ({
        ...q,
        months: q.months.map((m) =>
          m.month === monthKey
            ? {
                ...m,
                subGoals: [
                  ...m.subGoals,
                  { id: newId, title: title.trim(), completed: false },
                ],
              }
            : m,
        ),
      }));
      setGoalStructures((prev) => ({ ...prev, [goalId]: structure }));
      syncToMilestones(goalId, structure);
    },
    [goals, getGoalStructure, syncToMilestones],
  );

  const toggleQuarter = (id: string) =>
    setExpandedQuarters((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const toggleMonth = (key: string) =>
    setExpandedMonths((prev) => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });

  // ── Goal Health ──────────────────────────────────────────────────────────
  const getGoalHealth = useCallback(
    (goal: Goal) => {
      const structure = getGoalStructure(goal);
      const progress = calcProgress(structure);

      let monthsWithWork = 0,
        totalMonths = 0;
      for (const q of structure)
        for (const m of q.months) {
          totalMonths++;
          if (m.subGoals.length > 0) monthsWithWork++;
        }
      const consistency =
        totalMonths > 0 ? Math.round((monthsWithWork / totalMonths) * 100) : 0;

      const linkedTasks = tasks.filter((t) => t.linkedGoalId === goal.id);
      const timeSpent = linkedTasks.reduce((s, t) => s + (t.timeSpent || 0), 0);
      const timeEstimate = linkedTasks.reduce(
        (s, t) => s + (t.timeEstimate || 0),
        0,
      );
      const timeInvested =
        timeEstimate > 0
          ? Math.min(100, Math.round((timeSpent / timeEstimate) * 100))
          : progress > 0
            ? Math.round(progress * 0.6)
            : 0;

      const recentCompleted = linkedTasks.filter(
        (t) =>
          t.status === "completed" &&
          t.completedAt &&
          differenceInDays(new Date(), parseISO(t.completedAt)) < 7,
      ).length;
      const momentum = Math.min(
        100,
        Math.round(progress * 0.5 + recentCompleted * 15 + consistency * 0.3),
      );

      return { consistency, timeInvested, momentum, progress };
    },
    [getGoalStructure, calcProgress, tasks],
  );

  const getInsight = useCallback(
    (goal: Goal) => {
      const h = getGoalHealth(goal);
      if (h.momentum > 70) return "You're on fire! Keep this momentum going.";
      if (h.consistency < 30)
        return "Try breaking this down into smaller monthly targets.";
      if (h.timeInvested > h.progress)
        return "Great time investment — results will follow.";
      if (h.progress > 50) return "Past the halfway mark. Stay consistent.";
      return "You make the most progress when tasks are time-blocked.";
    },
    [getGoalHealth],
  );

  // ═══════════════════════════════════════════════════════════════════════════
  //  DETAIL VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  if (selectedGoal) {
    const structure = getGoalStructure(selectedGoal);
    const health = getGoalHealth(selectedGoal);
    const daysLeft = selectedGoal.targetDate
      ? differenceInDays(parseISO(selectedGoal.targetDate), new Date())
      : null;
    const dots = getStatusDots(health.progress);

    return (
      <AppLayout>
        <motion.div className="pb-12 max-w-3xl mx-auto">
          {/* Back */}
          <button
            onClick={() => setSelectedGoalId(null)}
            className="flex items-center gap-1.5 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            All Goals
          </button>

          {/* ── Goal Identity ──────────────────────────────────────────── */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)] break-words">
              {selectedGoal.title}
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              {daysLeft !== null && daysLeft > 0
                ? `${Math.ceil(daysLeft / 30)} month goal`
                : "Goal"}
            </p>

            {/* Status ●●●○○ */}
            <div className="flex items-center gap-2 mt-3">
              <span className="text-xs text-[var(--color-text-secondary)]">
                Status:
              </span>
              <span className="text-xs font-medium text-[var(--color-text-primary)] capitalize">
                {selectedGoal.status === "active"
                  ? "In Progress"
                  : selectedGoal.status.replace("_", " ")}
              </span>
              <div className="flex items-center gap-1 ml-1">
                {dots.map((filled, i) => (
                  <span
                    key={i}
                    className={cn(
                      "w-2.5 h-2.5 rounded-full transition-colors",
                      filled ? "bg-purple-500" : "bg-gray-200 dark:bg-gray-700",
                    )}
                  />
                ))}
              </div>
            </div>

            <p className="text-[11px] text-[var(--color-text-tertiary)] mt-2">
              Started: {format(parseISO(selectedGoal.createdAt), "MMM d")}
              {selectedGoal.targetDate && (
                <>
                  {" "}
                  | Target:{" "}
                  {format(parseISO(selectedGoal.targetDate), "MMM d, yyyy")}
                </>
              )}
            </p>

            {/* Quick actions */}
            <div className="flex items-center gap-2 mt-4">
              {selectedGoal.status === "active" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5 rounded-lg h-8"
                  onClick={() =>
                    updateGoal(selectedGoal.id, { status: "paused" })
                  }
                >
                  <Pause className="w-3 h-3" /> Pause
                </Button>
              )}
              {selectedGoal.status === "paused" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs gap-1.5 rounded-lg h-8"
                  onClick={() =>
                    updateGoal(selectedGoal.id, { status: "active" })
                  }
                >
                  <Play className="w-3 h-3" /> Resume
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                className="text-xs gap-1.5 rounded-lg h-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                onClick={() => {
                  deleteGoal(selectedGoal.id);
                  setSelectedGoalId(null);
                }}
              >
                <Trash2 className="w-3 h-3" /> Delete
              </Button>
            </div>
          </div>

          {/* ── Progression ────────────────────────────────────────────── */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
                Progression
              </h2>
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {health.progress}%
              </span>
            </div>

            {/* Overall bar */}
            <div className="w-full h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden mb-6">
              <motion.div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${health.progress}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>

            {/* Quarter accordion */}
            <div className="space-y-1">
              {structure.map((quarter) => {
                const qProg = quarterProgress(quarter);
                const isOpen = expandedQuarters.has(quarter.id);
                const hasContent = quarter.months.some(
                  (m) => m.subGoals.length > 0,
                );

                return (
                  <div key={quarter.id}>
                    <button
                      onClick={() => toggleQuarter(quarter.id)}
                      className="flex items-center gap-3 w-full py-3 px-4 rounded-xl hover:bg-[var(--color-bg-secondary)] transition-colors"
                    >
                      <motion.div>
                        <ChevronDown className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                      </motion.div>
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">
                        {quarter.label}
                      </span>
                      {hasContent && (
                        <span className="text-xs text-[var(--color-text-tertiary)] ml-auto">
                          {qProg}%
                        </span>
                      )}
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div className="overflow-hidden">
                          <div className="pl-7 space-y-0.5">
                            {quarter.months.map((month) => {
                              const mProg = monthProgress(month);
                              const mKey = `${quarter.id}-${month.month}`;
                              const mOpen = expandedMonths.has(mKey);

                              return (
                                <div key={month.month}>
                                  <button
                                    onClick={() => toggleMonth(mKey)}
                                    className="flex items-center gap-3 w-full py-2.5 px-3 rounded-lg hover:bg-[var(--color-bg-secondary)] transition-colors"
                                  >
                                    <motion.div>
                                      <ChevronDown className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
                                    </motion.div>
                                    <span className="text-sm text-[var(--color-text-primary)]">
                                      {month.label}
                                    </span>

                                    {month.subGoals.length > 0 && (
                                      <div className="flex items-center gap-0.5 ml-auto">
                                        {month.subGoals.map((sg) => (
                                          <span
                                            key={sg.id}
                                            className={cn(
                                              "w-1.5 h-1.5 rounded-full",
                                              sg.completed
                                                ? "bg-green-500"
                                                : "bg-gray-300 dark:bg-gray-600",
                                            )}
                                          />
                                        ))}
                                        <span className="text-xs text-[var(--color-text-tertiary)] ml-2">
                                          {mProg}%
                                        </span>
                                      </div>
                                    )}
                                  </button>

                                  <AnimatePresence initial={false}>
                                    {mOpen && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{
                                          duration: 0.15,
                                          ease: "easeOut",
                                        }}
                                        className="overflow-hidden"
                                      >
                                        <div className="pl-7 py-1 space-y-1">
                                          {month.subGoals.map((sg) => (
                                            <motion.div
                                              key={sg.id}
                                              layout
                                              className="flex items-center gap-3 py-1.5"
                                            >
                                              <button
                                                onClick={() =>
                                                  toggleSubGoal(
                                                    selectedGoal.id,
                                                    sg.id,
                                                  )
                                                }
                                                className={cn(
                                                  "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200",
                                                  sg.completed
                                                    ? "border-green-500 bg-green-500"
                                                    : "border-gray-300 dark:border-gray-600 hover:border-green-400",
                                                )}
                                              >
                                                {sg.completed && (
                                                  <Check className="w-3 h-3 text-white" />
                                                )}
                                              </button>
                                              <span
                                                className={cn(
                                                  "text-sm",
                                                  sg.completed
                                                    ? "line-through text-[var(--color-text-tertiary)]"
                                                    : "text-[var(--color-text-primary)]",
                                                )}
                                              >
                                                {sg.title}
                                              </span>
                                            </motion.div>
                                          ))}

                                          {/* Add sub-goal inline */}
                                          {addingSubGoal === month.month ? (
                                            <div className="flex items-center gap-2 py-1">
                                              <Input
                                                value={newSubGoalText}
                                                onChange={(e) =>
                                                  setNewSubGoalText(
                                                    e.target.value,
                                                  )
                                                }
                                                onKeyDown={(e) => {
                                                  if (
                                                    e.key === "Enter" &&
                                                    newSubGoalText.trim()
                                                  ) {
                                                    addSubGoalToMonth(
                                                      selectedGoal.id,
                                                      month.month,
                                                      newSubGoalText,
                                                    );
                                                    setNewSubGoalText("");
                                                  }
                                                  if (e.key === "Escape") {
                                                    setAddingSubGoal(null);
                                                    setNewSubGoalText("");
                                                  }
                                                }}
                                                placeholder="What needs to happen?"
                                                className="h-8 text-sm flex-1"
                                                autoFocus
                                              />
                                              <Button
                                                size="sm"
                                                variant="ghost"
                                                className="h-8 text-xs"
                                                onClick={() => {
                                                  if (newSubGoalText.trim()) {
                                                    addSubGoalToMonth(
                                                      selectedGoal.id,
                                                      month.month,
                                                      newSubGoalText,
                                                    );
                                                    setNewSubGoalText("");
                                                  }
                                                  setAddingSubGoal(null);
                                                }}
                                              >
                                                Done
                                              </Button>
                                            </div>
                                          ) : (
                                            <button
                                              onClick={() =>
                                                setAddingSubGoal(month.month)
                                              }
                                              className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)] hover:text-gray-700 dark:hover:text-gray-300 transition-colors py-1"
                                            >
                                              <Plus className="w-3.5 h-3.5" />
                                              Add sub-goal
                                            </button>
                                          )}
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Goal Health Dashboard ──────────────────────────────────── */}
          <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] mb-4">
              Goal Health
            </h2>

            <div className="space-y-4">
              {/* Consistency */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1.5">
                    <BarChart3 className="w-3.5 h-3.5" /> Consistency
                  </span>
                  <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                    {health.consistency}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${health.consistency}%` }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Time Invested */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Time Invested
                  </span>
                  <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                    {health.timeInvested}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${health.timeInvested}%` }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
                  />
                </div>
              </div>

              {/* Momentum */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-[var(--color-text-secondary)] flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> Momentum
                  </span>
                  <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                    {health.momentum}%
                  </span>
                </div>
                <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${health.momentum}%` }}
                    transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
                  />
                </div>
              </div>
            </div>

            {/* AI Insight */}
            <div className="mt-5 p-3 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
              <p className="text-xs text-[var(--color-text-secondary)] flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 text-purple-500 flex-shrink-0 mt-0.5" />
                <span className="italic">{getInsight(selectedGoal)}</span>
              </p>
            </div>
          </div>
        </motion.div>
      </AppLayout>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  LIST VIEW
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <AppLayout>
      <motion.div className="pb-12 max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Goals
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {activeGoals.filter((g) => g.status !== "completed").length} active
            · {activeGoals.filter((g) => g.status === "completed").length}{" "}
            completed
          </p>
        </div>

        {/* ── Dead Simple Creation ──────────────────────────────────────── */}
        <div className="mb-10 p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
          <div className="space-y-3">
            <Input
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreateGoal()}
              placeholder="What do you want to achieve?"
              className="h-11 text-base border-0 bg-transparent px-0 focus-visible:ring-0 placeholder:text-[var(--color-text-tertiary)]"
            />
            <div className="flex items-center gap-3">
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="w-[140px] h-9 text-xs rounded-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TIMEFRAMES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {timeframe === "custom" && (
                <Input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-[160px] h-9 text-xs rounded-lg"
                />
              )}

              <Button
                onClick={handleCreateGoal}
                disabled={!goalName.trim()}
                className="ml-auto h-9 px-4 text-xs rounded-lg bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" />
                Create Goal
              </Button>
            </div>
          </div>
        </div>

        {/* ── Goal List ─────────────────────────────────────────────────── */}
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {activeGoals.length > 0 ? (
              activeGoals.map((goal, i) => {
                const h = getGoalHealth(goal);
                const dLeft = goal.targetDate
                  ? differenceInDays(parseISO(goal.targetDate), new Date())
                  : null;
                const sDots = getStatusDots(h.progress);
                const isDone = goal.status === "completed" || h.progress >= 100;

                return (
                  <motion.button
                    key={goal.id}
                    layout
                    onClick={() => setSelectedGoalId(goal.id)}
                    className={cn(
                      "w-full text-left p-4 rounded-xl border transition-all duration-200 group",
                      isDone
                        ? "bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800/50 opacity-70"
                        : "bg-[var(--color-bg-secondary)] border-[var(--color-border)] hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-sm",
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3
                            className={cn(
                              "text-sm font-medium break-words line-clamp-1",
                              isDone
                                ? "text-[var(--color-text-tertiary)] line-through"
                                : "text-[var(--color-text-primary)]",
                            )}
                          >
                            {goal.title}
                          </h3>
                          {isDone && (
                            <span className="text-xs text-green-500">✓</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex items-center gap-0.5">
                            {sDots.map((filled, j) => (
                              <span
                                key={j}
                                className={cn(
                                  "w-1.5 h-1.5 rounded-full",
                                  filled
                                    ? isDone
                                      ? "bg-green-400"
                                      : "bg-purple-500"
                                    : "bg-gray-200 dark:bg-gray-700",
                                )}
                              />
                            ))}
                          </div>
                          <span className="text-xs text-[var(--color-text-tertiary)]">
                            {h.progress}%
                          </span>
                          {dLeft !== null && dLeft > 0 && (
                            <>
                              <span className="text-[var(--color-text-tertiary)]">
                                ·
                              </span>
                              <span className="text-xs text-[var(--color-text-tertiary)]">
                                {dLeft}d left
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </motion.button>
                );
              })
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="w-6 h-6 text-purple-500/60" />
                </div>
                <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                  No goals yet
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                  Type your goal above and start making progress
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AppLayout>
  );
}
