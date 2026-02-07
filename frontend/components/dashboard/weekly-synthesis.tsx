"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/context/app-context";
import { predictor } from "@/lib/ai/predictor";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Target,
  Zap,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Sparkles,
  Sun,
  Moon,
  Cloud,
} from "lucide-react";

interface DayPrediction {
  day: string;
  shortDay: string;
  energyLevel: number;
  predictedTasks: number;
  riskLevel: "low" | "medium" | "high";
  keyEvent?: string;
}

interface GoalPrediction {
  goalId: string;
  goalName: string;
  probability: number;
  onTrackStatus: "ahead" | "on-track" | "behind" | "at-risk";
  daysRemaining: number;
  suggestion?: string;
}

export function WeeklySynthesis() {
  const [weekPredictions, setWeekPredictions] = useState<DayPrediction[]>([]);
  const [goalPredictions, setGoalPredictions] = useState<GoalPrediction[]>([]);
  const [overallOutlook, setOverallOutlook] = useState<
    "positive" | "neutral" | "cautious"
  >("neutral");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const { tasks, habits, journalEntries, timeEntries, getFinanceStats } =
    useApp();

  useEffect(() => {
    generatePredictions();
  }, [tasks, habits, journalEntries, timeEntries]);

  const generatePredictions = async () => {
    setIsLoading(true);

    // Generate week predictions
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const fullDays = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const today = new Date();
    const predictions: DayPrediction[] = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dayIndex = date.getDay();

      // Simple energy prediction based on day of week
      const baseEnergy =
        dayIndex === 0 || dayIndex === 6
          ? 70
          : dayIndex === 1
            ? 85
            : dayIndex === 5
              ? 60
              : 75;
      const energyVariance = Math.random() * 20 - 10;

      // Count tasks due on this day
      const dateStr = date.toISOString().split("T")[0];
      const tasksOnDay = tasks.filter(
        (t) => t.dueDate?.split("T")[0] === dateStr && t.status !== "completed",
      ).length;

      predictions.push({
        day: fullDays[dayIndex],
        shortDay: days[dayIndex],
        energyLevel: Math.max(30, Math.min(100, baseEnergy + energyVariance)),
        predictedTasks: tasksOnDay,
        riskLevel: tasksOnDay > 5 ? "high" : tasksOnDay > 2 ? "medium" : "low",
        keyEvent: i === 0 ? "Today" : undefined,
      });
    }

    setWeekPredictions(predictions);

    // Generate goal predictions (mock for now)
    const mockGoals: GoalPrediction[] = [
      {
        goalId: "1",
        goalName: "Complete Project",
        probability: 78,
        onTrackStatus: "on-track",
        daysRemaining: 12,
        suggestion: "Maintain current pace",
      },
      {
        goalId: "2",
        goalName: "Exercise 3x/week",
        probability: 92,
        onTrackStatus: "ahead",
        daysRemaining: 5,
      },
      {
        goalId: "3",
        goalName: "Save $500",
        probability: 45,
        onTrackStatus: "behind",
        daysRemaining: 20,
        suggestion: "Reduce discretionary spending",
      },
    ];
    setGoalPredictions(mockGoals);

    // Calculate overall outlook
    const avgEnergy =
      predictions.reduce((s, p) => s + p.energyLevel, 0) / predictions.length;
    const highRiskDays = predictions.filter(
      (p) => p.riskLevel === "high",
    ).length;
    setOverallOutlook(
      avgEnergy > 70 && highRiskDays <= 1
        ? "positive"
        : highRiskDays >= 3
          ? "cautious"
          : "neutral",
    );

    setIsLoading(false);
  };

  const getOutlookStyles = () => {
    switch (overallOutlook) {
      case "positive":
        return { bg: "bg-emerald-500/10", text: "text-emerald-500", icon: Sun };
      case "cautious":
        return { bg: "bg-amber-500/10", text: "text-amber-500", icon: Cloud };
      default:
        return { bg: "bg-blue-500/10", text: "text-blue-500", icon: Sun };
    }
  };

  const getStatusStyles = (status: GoalPrediction["onTrackStatus"]) => {
    switch (status) {
      case "ahead":
        return {
          bg: "bg-emerald-500/10",
          text: "text-emerald-500",
          icon: TrendingUp,
        };
      case "on-track":
        return { bg: "bg-blue-500/10", text: "text-blue-500", icon: Minus };
      case "behind":
        return {
          bg: "bg-amber-500/10",
          text: "text-amber-500",
          icon: TrendingDown,
        };
      case "at-risk":
        return { bg: "bg-red-500/10", text: "text-red-500", icon: AlertCircle };
    }
  };

  const outlookStyles = getOutlookStyles();

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-primary animate-pulse" />
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
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div
            className={cn(
              "w-12 h-12 rounded-xl flex items-center justify-center",
              outlookStyles.bg,
            )}
          >
            <outlookStyles.icon className={cn("w-6 h-6", outlookStyles.text)} />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Weekly Outlook</h3>
            <p className="text-sm text-muted-foreground">
              {overallOutlook === "positive"
                ? "Looking like a great week ahead"
                : overallOutlook === "cautious"
                  ? "Some challenging days ahead"
                  : "Balanced week expected"}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={generatePredictions}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Week Energy Forecast */}
      <div className="p-6 border-b">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-medium">Energy Forecast</span>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {weekPredictions.map((day, i) => (
            <motion.div
              key={day.day}
              className={cn(
                "relative rounded-xl p-3 cursor-pointer transition-all",
                selectedDay === day.day
                  ? "bg-primary/10 ring-2 ring-primary"
                  : "bg-muted/50 hover:bg-muted",
                i === 0 && "ring-1 ring-primary/30",
              )}
              onClick={() =>
                setSelectedDay(selectedDay === day.day ? null : day.day)
              }
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="text-center">
                <span className="text-xs text-muted-foreground">
                  {day.shortDay}
                </span>
                <div className="mt-2 relative">
                  {/* Energy bar */}
                  <div className="h-16 w-full bg-muted rounded-lg overflow-hidden relative">
                    <motion.div
                      className={cn(
                        "absolute bottom-0 left-0 right-0 rounded-lg",
                        day.energyLevel > 70
                          ? "bg-gradient-to-t from-emerald-500 to-emerald-400"
                          : day.energyLevel > 50
                            ? "bg-gradient-to-t from-amber-500 to-amber-400"
                            : "bg-gradient-to-t from-red-500 to-red-400",
                      )}
                      initial={{ height: 0 }}
                      animate={{ height: `${day.energyLevel}%` }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                    />
                  </div>
                  <span className="text-xs font-medium mt-1 block">
                    {Math.round(day.energyLevel)}%
                  </span>
                </div>
                {/* Task indicator */}
                {day.predictedTasks > 0 && (
                  <div
                    className={cn(
                      "mt-2 text-[10px] px-1.5 py-0.5 rounded-full",
                      day.riskLevel === "high"
                        ? "bg-red-500/10 text-red-500"
                        : day.riskLevel === "medium"
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-muted text-muted-foreground",
                    )}
                  >
                    {day.predictedTasks} tasks
                  </div>
                )}
              </div>
              {i === 0 && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
              )}
            </motion.div>
          ))}
        </div>

        {/* Selected day details */}
        <AnimatePresence>
          {selectedDay && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-4 p-4 bg-muted/50 rounded-xl">
                {(() => {
                  const day = weekPredictions.find(
                    (d) => d.day === selectedDay,
                  );
                  if (!day) return null;
                  return (
                    <>
                      <h4 className="font-medium mb-2">{day.day}</h4>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Energy</span>
                          <p className="font-medium">
                            {Math.round(day.energyLevel)}%
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Tasks</span>
                          <p className="font-medium">{day.predictedTasks}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Risk</span>
                          <p
                            className={cn(
                              "font-medium capitalize",
                              day.riskLevel === "high"
                                ? "text-red-500"
                                : day.riskLevel === "medium"
                                  ? "text-amber-500"
                                  : "text-emerald-500",
                            )}
                          >
                            {day.riskLevel}
                          </p>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Goal Predictions */}
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">Goal Predictions</span>
        </div>
        <div className="space-y-3">
          {goalPredictions.map((goal) => {
            const statusStyles = getStatusStyles(goal.onTrackStatus);
            return (
              <motion.div
                key={goal.goalId}
                className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                whileHover={{ scale: 1.01 }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-lg flex items-center justify-center",
                        statusStyles.bg,
                      )}
                    >
                      <statusStyles.icon
                        className={cn("w-3 h-3", statusStyles.text)}
                      />
                    </div>
                    <span className="font-medium text-sm">{goal.goalName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-sm font-bold",
                        goal.probability >= 70
                          ? "text-emerald-500"
                          : goal.probability >= 50
                            ? "text-amber-500"
                            : "text-red-500",
                      )}
                    >
                      {goal.probability}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      likely
                    </span>
                  </div>
                </div>
                <Progress value={goal.probability} className="h-1.5 mb-2" />
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    {goal.daysRemaining} days remaining
                  </span>
                  {goal.suggestion && (
                    <span className="text-primary flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      {goal.suggestion}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
