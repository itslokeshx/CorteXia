"use client";

import { useState, useEffect, useMemo } from "react";
import { useApp } from "@/lib/context/app-context";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  Sparkles,
  RefreshCw,
  X,
  Lightbulb,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AIReasoningProps {
  why?: string;
  whatNext?: string;
  onAction?: () => void;
}

export function AIReasoningStrip({
  why: propWhy,
  whatNext: propWhatNext,
  onAction,
}: AIReasoningProps) {
  const {
    tasks,
    habits,
    transactions,
    journalEntries,
    insights,
    getHabitStreak,
    getFinanceStats,
    addTask,
  } = useApp();

  const [isMinimized, setIsMinimized] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Generate insights from real data
  const { why, whatNext, actionType } = useMemo(() => {
    // Analyze patterns
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Check task completion
    const pendingTasks = tasks.filter((t) => t.status !== "completed");
    const overdueTasks = pendingTasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < today,
    );

    // Check habit streaks
    const brokenStreaks = habits.filter((h) => {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split("T")[0];
      return !h.completions?.some(
        (c) => c.date === yesterdayStr && c.completed,
      );
    });

    // Check spending
    const { expenses, income } = getFinanceStats();
    const spendingRatio = income > 0 ? (expenses / income) * 100 : 0;

    // Check mood trends
    const recentMoods = journalEntries.slice(0, 7).map((e) => e.mood);
    const avgMood =
      recentMoods.length > 0
        ? recentMoods.reduce((a, b) => a + b, 0) / recentMoods.length
        : 5;

    // Generate insights based on patterns
    if (overdueTasks.length > 2) {
      return {
        why: `${overdueTasks.length} overdue tasks detected → potential overwhelm → consider prioritization`,
        whatNext: `Focus on the most important task first: "${overdueTasks[0]?.title}"`,
        actionType: "task" as const,
      };
    }

    if (brokenStreaks.length > 0 && habits.length > 0) {
      const brokenHabit = brokenStreaks[0];
      return {
        why: `Habit "${brokenHabit.name}" streak broken → momentum loss risk → rebuild consistency`,
        whatNext: `Complete "${brokenHabit.name}" today to restart your streak`,
        actionType: "habit" as const,
      };
    }

    if (spendingRatio > 80) {
      return {
        why: `Spending at ${spendingRatio.toFixed(0)}% of income → low savings rate → financial stress risk`,
        whatNext: "Review recent expenses and identify areas to cut back",
        actionType: "finance" as const,
      };
    }

    if (avgMood < 4) {
      return {
        why: `Average mood trending low (${avgMood.toFixed(1)}/10) → wellbeing concern → self-care needed`,
        whatNext:
          "Schedule some relaxation time or reach out to someone you trust",
        actionType: "wellbeing" as const,
      };
    }

    if (pendingTasks.length > 10) {
      return {
        why: `${pendingTasks.length} pending tasks → potential overwhelm → prioritization needed`,
        whatNext:
          "Review your task list and defer or delegate non-essential items",
        actionType: "task" as const,
      };
    }

    // Default positive state
    return {
      why: "Systems running smoothly → habits on track → good momentum building",
      whatNext: "Keep up the great work! Consider adding a new goal or habit",
      actionType: "positive" as const,
    };
  }, [tasks, habits, journalEntries, getFinanceStats]);

  const handleAction = () => {
    if (onAction) {
      onAction();
      return;
    }

    // Default actions based on type
    switch (actionType) {
      case "task":
        toast.success("Opening tasks page...", { duration: 2000 });
        window.location.href = "/tasks";
        break;
      case "habit":
        toast.success("Opening habits page...", { duration: 2000 });
        window.location.href = "/habits";
        break;
      case "finance":
        toast.success("Opening finance page...", { duration: 2000 });
        window.location.href = "/finance";
        break;
      case "wellbeing":
        toast.success("Opening journal page...", { duration: 2000 });
        window.location.href = "/journal";
        break;
      default:
        toast.success("Keep up the momentum!", { duration: 2000 });
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  if (isMinimized) {
    return (
      <button
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:scale-105 transition-transform z-30"
      >
        <Sparkles className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 left-60 right-0 h-28 bg-gradient-to-t from-background via-background/95 to-transparent border-t border-border/30 backdrop-blur-lg flex items-center px-8 z-30">
      <div className="max-w-7xl mx-auto w-full flex items-center gap-6 justify-between">
        {/* AI Icon */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="hidden lg:block">
            <p className="text-xs font-medium text-muted-foreground">
              AI Insight
            </p>
          </div>
        </div>

        {/* Why Section */}
        <div className="flex-1 max-w-sm">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-3 h-3 text-amber-500" />
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Why
            </p>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed line-clamp-2">
            {propWhy || why}
          </p>
        </div>

        {/* Divider */}
        <div className="w-px h-12 bg-border/50 hidden md:block" />

        {/* What Next Section */}
        <div className="flex-1 max-w-sm hidden md:block">
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb className="w-3 h-3 text-blue-500" />
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              What Next
            </p>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed line-clamp-2">
            {propWhatNext || whatNext}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleRefresh}
            className="h-9 w-9"
            disabled={isRefreshing}
          >
            <RefreshCw
              className={cn("w-4 h-4", isRefreshing && "animate-spin")}
            />
          </Button>

          <Button
            onClick={handleAction}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 px-5 h-9 group"
          >
            Take Action
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMinimized(true)}
            className="h-9 w-9"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
