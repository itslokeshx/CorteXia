"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/context/app-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Brain,
  Lightbulb,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Target,
  Zap,
  Shield,
  Clock,
  DollarSign,
  Sparkles,
  Activity,
} from "lucide-react";

interface ReasoningPanel {
  id: string;
  title: string;
  icon: React.ElementType;
  color: string;
  content: string;
  details?: string[];
  action?: { label: string; onClick: () => void };
  severity?: "info" | "warning" | "critical";
}

export function AIReasoningStripV2() {
  const [panels, setPanels] = useState<ReasoningPanel[]>([]);
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const {
    tasks,
    habits,
    transactions,
    timeEntries,
    journalEntries,
    getFinanceStats,
  } = useApp();

  useEffect(() => {
    analyzeAndGeneratePanels();
  }, [tasks, habits, transactions, timeEntries, journalEntries]);

  const analyzeAndGeneratePanels = async () => {
    setIsLoading(true);
    const today = new Date().toISOString().split("T")[0];

    // Build data for analysis
    const { expenses, income, balance } = getFinanceStats();
    const todayHabits = habits.filter((h) =>
      h.completions?.some((c) => c.date === today && c.completed),
    );
    const pendingTasks = tasks.filter((t) => t.status !== "completed");
    const overdueTasks = pendingTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date(),
    );
    const todayTimeLogged = timeEntries
      .filter((t) => t.date.split("T")[0] === today)
      .reduce((s, t) => s + t.duration, 0);
    const avgMood =
      journalEntries.length > 0
        ? journalEntries.slice(0, 7).reduce((s, e) => s + (e.mood || 5), 0) /
          Math.min(journalEntries.length, 7)
        : 5;

    // Check for interventions
    // Generate panels based on local analysis (not using async intervention engine)
    const newPanels: ReasoningPanel[] = [];

    // WHY panel - explain current state
    const whyContent = generateWhyContent({
      pendingTasks: pendingTasks.length,
      overdueTasks: overdueTasks.length,
      habitsCompleted: todayHabits.length,
      totalHabits: habits.length,
      timeLogged: todayTimeLogged,
      avgMood,
      balance,
      expenses,
    });
    newPanels.push(whyContent);

    // WHAT HAPPENS panel - predictions
    const whatHappensContent = generateWhatHappensContent({
      overdueTasks,
      habitsAtRisk: habits.filter(
        (h) =>
          h.streak >= 5 &&
          !h.completions?.some((c) => c.date === today && c.completed),
      ),
      budgetRemaining: balance,
      expenses,
    });
    newPanels.push(whatHappensContent);

    // WHAT TO DO panel - actionable recommendations
    const whatToDoContent = generateWhatToDoContent({
      pendingTasks,
      habits,
      todayTimeLogged,
    });
    newPanels.push(whatToDoContent);

    setPanels(newPanels);
    setIsLoading(false);
  };

  const generateWhyContent = (data: {
    pendingTasks: number;
    overdueTasks: number;
    habitsCompleted: number;
    totalHabits: number;
    timeLogged: number;
    avgMood: number;
    balance: number;
    expenses: number;
  }): ReasoningPanel => {
    const factors: string[] = [];
    let severity: "info" | "warning" | "critical" = "info";

    // Analyze task situation
    if (data.overdueTasks > 0) {
      factors.push(`${data.overdueTasks} overdue tasks creating mental load`);
      severity = data.overdueTasks > 3 ? "critical" : "warning";
    }
    if (data.pendingTasks > 10) {
      factors.push(`High task backlog (${data.pendingTasks} pending)`);
    }

    // Analyze habits
    const habitRate =
      data.totalHabits > 0 ? data.habitsCompleted / data.totalHabits : 0;
    if (habitRate < 0.5 && data.totalHabits > 0) {
      factors.push(
        `Only ${Math.round(habitRate * 100)}% of habits completed today`,
      );
    }

    // Analyze time
    if (data.timeLogged > 480) {
      factors.push(
        `Long work session today (${Math.round(data.timeLogged / 60)}h logged)`,
      );
      severity = severity === "info" ? "warning" : severity;
    } else if (data.timeLogged < 60 && new Date().getHours() > 14) {
      factors.push(`Low productivity tracking today`);
    }

    // Analyze mood
    if (data.avgMood < 4) {
      factors.push(`Recent mood trending lower than usual`);
      severity = "warning";
    }

    // Analyze finances
    if (data.balance < 0) {
      factors.push(`Budget overspent by $${Math.abs(data.balance).toFixed(0)}`);
      severity = "critical";
    }

    const mainContent =
      factors.length > 0
        ? factors[0]
        : "Everything is balanced - you're in a good state";

    return {
      id: "why",
      title: "Why You Feel This Way",
      icon: Brain,
      color:
        severity === "critical"
          ? "text-red-500"
          : severity === "warning"
            ? "text-amber-500"
            : "text-blue-500",
      content: mainContent,
      details: factors.slice(1),
      severity,
    };
  };

  const generateWhatHappensContent = (data: {
    overdueTasks: any[];
    habitsAtRisk: any[];
    budgetRemaining: number;
    expenses: number;
  }): ReasoningPanel => {
    const predictions: string[] = [];
    let severity: "info" | "warning" | "critical" = "info";

    if (data.overdueTasks.length > 0) {
      predictions.push(
        `Task backlog will grow to ${data.overdueTasks.length + 2}+ by week's end`,
      );
      severity = "warning";
    }

    if (data.habitsAtRisk.length > 0) {
      predictions.push(
        `${data.habitsAtRisk.length} streak(s) at risk of breaking today`,
      );
      severity = data.habitsAtRisk.some((h) => h.streak >= 10)
        ? "critical"
        : "warning";
    }

    if (data.budgetRemaining < data.expenses * 0.2) {
      predictions.push(`Budget will likely be exceeded by end of week`);
      severity = "warning";
    }

    const mainContent =
      predictions.length > 0
        ? predictions[0]
        : "Trajectory looks positive - keep the momentum";

    return {
      id: "what-happens",
      title: "What Will Happen",
      icon: TrendingUp,
      color:
        severity === "critical"
          ? "text-red-500"
          : severity === "warning"
            ? "text-amber-500"
            : "text-emerald-500",
      content: mainContent,
      details: predictions.slice(1),
      severity,
    };
  };

  const generateWhatToDoContent = (data: {
    pendingTasks: any[];
    habits: any[];
    todayTimeLogged: number;
  }): ReasoningPanel => {
    const actions: string[] = [];

    // Task-based recommendations
    const highPriorityTasks = data.pendingTasks.filter(
      (t) => t.priority === "high",
    );
    if (highPriorityTasks.length > 0) {
      actions.push(`Focus on "${highPriorityTasks[0].title}" first`);
    }

    // Time-based recommendations
    const hour = new Date().getHours();
    if (hour >= 9 && hour <= 11 && data.todayTimeLogged < 60) {
      actions.push(`Morning energy peak - tackle your hardest task now`);
    } else if (hour >= 14 && hour <= 15) {
      actions.push(`Post-lunch dip - good time for routine tasks`);
    } else if (hour >= 17) {
      actions.push(`Wind down mode - focus on habit completion`);
    }

    const mainContent =
      actions.length > 0 ? actions[0] : "Stay the course - you're doing great";

    return {
      id: "what-to-do",
      title: "What To Do Now",
      icon: Target,
      color: "text-primary",
      content: mainContent,
      details: actions.slice(1),
      action: {
        label: "See Full Plan",
        onClick: () => console.log("Open planning view"),
      },
    };
  };

  if (isLoading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary animate-pulse" />
          </div>
          <div>
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="h-3 w-48 bg-muted animate-pulse rounded mt-2" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center justify-between bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">AI Reasoning</h3>
            <p className="text-xs text-muted-foreground">
              Understanding your current state
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={analyzeAndGeneratePanels}
          className="h-8 w-8"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Three-Panel Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
        {panels.map((panel) => (
          <motion.div
            key={panel.id}
            className={cn(
              "p-4 cursor-pointer transition-colors",
              activePanel === panel.id ? "bg-muted/50" : "hover:bg-muted/30",
            )}
            onClick={() =>
              setActivePanel(activePanel === panel.id ? null : panel.id)
            }
          >
            {/* Panel Header */}
            <div className="flex items-center gap-2 mb-3">
              <div
                className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  panel.severity === "critical"
                    ? "bg-red-500/10"
                    : panel.severity === "warning"
                      ? "bg-amber-500/10"
                      : "bg-primary/10",
                )}
              >
                <panel.icon className={cn("w-4 h-4", panel.color)} />
              </div>
              <span className="text-sm font-medium text-muted-foreground">
                {panel.title}
              </span>
              {panel.severity && panel.severity !== "info" && (
                <span
                  className={cn(
                    "ml-auto px-1.5 py-0.5 rounded text-[10px] font-medium uppercase",
                    panel.severity === "critical"
                      ? "bg-red-500/10 text-red-500"
                      : "bg-amber-500/10 text-amber-500",
                  )}
                >
                  {panel.severity}
                </span>
              )}
            </div>

            {/* Main Content */}
            <p className="text-sm font-medium leading-relaxed">
              {panel.content}
            </p>

            {/* Expandable Details */}
            <AnimatePresence>
              {activePanel === panel.id &&
                panel.details &&
                panel.details.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <ul className="mt-3 space-y-1.5 border-t pt-3">
                      {panel.details.map((detail, i) => (
                        <li
                          key={i}
                          className="text-xs text-muted-foreground flex items-start gap-2"
                        >
                          <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
            </AnimatePresence>

            {/* Action Button */}
            {panel.action && (
              <Button
                variant="link"
                size="sm"
                className="mt-2 h-auto p-0 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  panel.action?.onClick();
                }}
              >
                {panel.action.label}
                <ArrowRight className="w-3 h-3 ml-1" />
              </Button>
            )}
          </motion.div>
        ))}
      </div>
    </Card>
  );
}
