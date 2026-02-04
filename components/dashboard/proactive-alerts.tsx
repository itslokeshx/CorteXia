"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/context/app-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  X,
  AlertTriangle,
  Clock,
  DollarSign,
  Flame,
  Target,
  Brain,
  ChevronRight,
  Bell,
  BellOff,
  Sparkles,
} from "lucide-react";

interface Alert {
  id: string;
  type: "burnout" | "budget" | "streak" | "focus";
  severity: "high" | "medium" | "low";
  title: string;
  message: string;
  actionLabel?: string;
}

interface ProactiveAlertProps {
  alert: Alert;
  onDismiss: () => void;
  onSnooze: () => void;
  onAction: () => void;
}

function ProactiveAlert({
  alert,
  onDismiss,
  onSnooze,
  onAction,
}: ProactiveAlertProps) {
  const getIcon = () => {
    switch (alert.type) {
      case "burnout":
        return Brain;
      case "budget":
        return DollarSign;
      case "streak":
        return Flame;
      case "focus":
        return Target;
      default:
        return AlertTriangle;
    }
  };

  const getColors = () => {
    switch (alert.severity) {
      case "high":
        return {
          bg: "bg-red-500/10",
          border: "border-red-500/30",
          text: "text-red-500",
          glow: "shadow-red-500/20",
        };
      case "medium":
        return {
          bg: "bg-amber-500/10",
          border: "border-amber-500/30",
          text: "text-amber-500",
          glow: "shadow-amber-500/20",
        };
      default:
        return {
          bg: "bg-blue-500/10",
          border: "border-blue-500/30",
          text: "text-blue-500",
          glow: "shadow-blue-500/20",
        };
    }
  };

  const Icon = getIcon();
  const colors = getColors();

  return (
    <motion.div
      className={cn(
        "relative rounded-2xl border p-4",
        colors.bg,
        colors.border,
        "shadow-lg",
        colors.glow,
      )}
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      layout
    >
      {/* Severity Pulse */}
      {alert.severity === "high" && (
        <motion.div
          className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500"
          animate={{ scale: [1, 1.3, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      )}

      <div className="flex gap-3">
        {/* Icon */}
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
            colors.bg,
          )}
        >
          <Icon className={cn("w-5 h-5", colors.text)} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span
                className={cn(
                  "text-xs font-medium uppercase tracking-wide",
                  colors.text,
                )}
              >
                {alert.type} Alert
              </span>
              <p className="font-medium text-sm mt-0.5">{alert.message}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0"
              onClick={onDismiss}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2 mt-3">
            {alert.actionLabel && (
              <Button
                size="sm"
                variant="default"
                className="h-7 text-xs"
                onClick={onAction}
              >
                {alert.actionLabel}
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={onSnooze}
            >
              <Clock className="w-3 h-3 mr-1" />
              Later
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function ProactiveAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [snoozedIds, setSnoozedIds] = useState<Map<string, number>>(new Map());
  const [isMuted, setIsMuted] = useState(false);

  const { tasks, habits, timeEntries, getFinanceStats } = useApp();

  useEffect(() => {
    if (isMuted) return;
    checkForAlerts();
    const interval = setInterval(checkForAlerts, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [tasks, habits, timeEntries, isMuted]);

  const checkForAlerts = () => {
    const today = new Date().toISOString().split("T")[0];
    const { balance } = getFinanceStats();
    const newAlerts: Alert[] = [];

    // Check for budget overspending
    if (balance < 0) {
      newAlerts.push({
        id: "budget-overspend",
        type: "budget",
        severity: "high",
        title: "Budget Alert",
        message: `You've overspent by $${Math.abs(balance).toFixed(0)} this month`,
        actionLabel: "Review Spending",
      });
    }

    // Check for habits at risk
    const habitsAtRisk = habits.filter(
      (h) =>
        h.streak >= 5 &&
        !h.completions?.some((c) => c.date === today && c.completed),
    );
    if (habitsAtRisk.length > 0) {
      newAlerts.push({
        id: `streak-${habitsAtRisk[0].id}`,
        type: "streak",
        severity: habitsAtRisk[0].streak >= 10 ? "high" : "medium",
        title: "Streak at Risk",
        message: `Don't break your ${habitsAtRisk[0].streak}-day streak on "${habitsAtRisk[0].name}"!`,
        actionLabel: "Complete Now",
      });
    }

    // Check for focus time
    const todayTimeLogged = timeEntries
      .filter((t) => t.date.split("T")[0] === today)
      .reduce((s, t) => s + t.duration, 0);
    const hour = new Date().getHours();
    if (hour >= 14 && todayTimeLogged < 60) {
      newAlerts.push({
        id: "low-focus-time",
        type: "focus",
        severity: "medium",
        title: "Focus Check",
        message: "Less than an hour logged today. Time for a focus session?",
        actionLabel: "Start Timer",
      });
    }

    // Check for overdue tasks
    const overdueTasks = tasks.filter(
      (t) =>
        t.status !== "completed" &&
        t.dueDate &&
        new Date(t.dueDate) < new Date(),
    );
    if (overdueTasks.length >= 3) {
      newAlerts.push({
        id: "overdue-tasks",
        type: "focus",
        severity: "high",
        title: "Task Backlog",
        message: `${overdueTasks.length} tasks are overdue and need attention`,
        actionLabel: "Review Tasks",
      });
    }

    // Filter out dismissed and snoozed
    const filtered = newAlerts.filter((a) => {
      if (dismissedIds.has(a.id)) return false;
      const snoozeUntil = snoozedIds.get(a.id);
      if (snoozeUntil && Date.now() < snoozeUntil) return false;
      return true;
    });

    setAlerts(filtered);
  };

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSnooze = (id: string) => {
    const snoozeUntil = Date.now() + 30 * 60 * 1000; // 30 minutes
    setSnoozedIds((prev) => new Map(prev).set(id, snoozeUntil));
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const handleAction = (alert: Alert) => {
    // Execute action based on type
    console.log("Action for:", alert);
    handleDismiss(alert.id);
  };

  // Show nothing if muted or no alerts
  if (isMuted || alerts.length === 0) {
    return (
      <motion.button
        className={cn(
          "fixed bottom-24 right-6 z-40 w-10 h-10 rounded-full flex items-center justify-center",
          "bg-muted border shadow-sm",
          isMuted ? "opacity-50" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setIsMuted(false)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <BellOff className="w-4 h-4 text-muted-foreground" />
      </motion.button>
    );
  }

  return (
    <div className="fixed bottom-24 right-6 z-40 w-[360px] space-y-3">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between px-2"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">
            {alerts.length} Alert{alerts.length > 1 ? "s" : ""}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => setIsMuted(true)}
        >
          <BellOff className="w-3 h-3 mr-1" />
          Mute
        </Button>
      </motion.div>

      {/* Alerts Stack */}
      <AnimatePresence mode="popLayout">
        {alerts.slice(0, 3).map((alert) => (
          <ProactiveAlert
            key={alert.id}
            alert={alert}
            onDismiss={() => handleDismiss(alert.id)}
            onSnooze={() => handleSnooze(alert.id)}
            onAction={() => handleAction(alert)}
          />
        ))}
      </AnimatePresence>

      {/* Overflow indicator */}
      {alerts.length > 3 && (
        <motion.div
          className="text-center text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          +{alerts.length - 3} more
        </motion.div>
      )}
    </div>
  );
}
