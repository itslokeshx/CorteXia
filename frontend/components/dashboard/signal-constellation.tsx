"use client";

import React, { useMemo } from "react";
import { useState } from "react";
import { useApp } from "@/lib/context/app-context";
import {
  Clock,
  Brain,
  RotateCw,
  Target,
  DollarSign,
  BookOpen,
  PenTool,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Signal {
  id: string;
  icon: React.ReactNode;
  label: string;
  status: "stable" | "warning" | "critical";
  value: string;
  domain: string;
  href: string;
}

const STATUS_COLORS = {
  stable: "#10B981",
  warning: "#F59E0B",
  critical: "#EF4444",
};

export function SignalConstellation() {
  const [hoveredSignal, setHoveredSignal] = useState<string | null>(null);

  const {
    tasks,
    habits,
    transactions,
    timeEntries,
    goals,
    studySessions,
    journalEntries,
    getHabitStreak,
    getFinanceStats,
    getTodayStats,
    getGoalStats,
  } = useApp();

  // Generate signals from real data
  const signals: Signal[] = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const { totalMinutes } = getTodayStats();
    const { expenses, income } = getFinanceStats();
    const { avgProgress } = getGoalStats();

    // Time tracking
    const productiveHours = (totalMinutes / 60).toFixed(1);
    const timeStatus =
      totalMinutes > 360
        ? "stable"
        : totalMinutes > 180
          ? "warning"
          : "critical";

    // Focus quality
    const deepFocusEntries = timeEntries.filter(
      (e) => e.focusQuality === "deep",
    ).length;
    const focusPercentage =
      timeEntries.length > 0
        ? Math.round((deepFocusEntries / timeEntries.length) * 100)
        : 0;
    const focusStatus =
      focusPercentage > 60
        ? "stable"
        : focusPercentage > 30
          ? "warning"
          : "critical";

    // Habits
    const todayHabits = habits.filter((h) =>
      h.completions?.some((c) => c.date === today && c.completed),
    ).length;
    const habitStatus =
      habits.length > 0
        ? todayHabits / habits.length > 0.7
          ? "stable"
          : todayHabits / habits.length > 0.4
            ? "warning"
            : "critical"
        : "stable";

    // Goals
    const goalStatus =
      avgProgress > 60 ? "stable" : avgProgress > 30 ? "warning" : "critical";

    // Budget
    const budgetRemaining =
      income > 0 ? Math.round(((income - expenses) / income) * 100) : 100;
    const budgetStatus =
      budgetRemaining > 30
        ? "stable"
        : budgetRemaining > 10
          ? "warning"
          : "critical";

    // Study time
    const todayStudy = studySessions
      .filter((s) => s.startTime?.split("T")[0] === today)
      .reduce((sum, s) => sum + s.duration, 0);
    const studyHours = (todayStudy / 60).toFixed(1);
    const studyStatus =
      todayStudy > 60 ? "stable" : todayStudy > 30 ? "warning" : "critical";

    // Journal/Wellbeing
    const recentMoods = journalEntries.slice(0, 7).map((e) => e.mood);
    const avgMood =
      recentMoods.length > 0
        ? Math.round(
            (recentMoods.reduce((a, b) => a + b, 0) / recentMoods.length) * 10,
          )
        : 50;
    const wellbeingStatus =
      avgMood > 60 ? "stable" : avgMood > 40 ? "warning" : "critical";

    // Energy (from recent journal entries)
    const recentEnergy = journalEntries.slice(0, 3).map((e) => e.energy);
    const avgEnergy =
      recentEnergy.length > 0
        ? Math.round(
            (recentEnergy.reduce((a, b) => a + b, 0) / recentEnergy.length) *
              10,
          )
        : 50;
    const energyStatus =
      avgEnergy > 60 ? "stable" : avgEnergy > 40 ? "warning" : "critical";

    return [
      {
        id: "time",
        icon: <Clock className="w-8 h-8" />,
        label: "Time",
        status: timeStatus as "stable" | "warning" | "critical",
        value: `${productiveHours}h`,
        domain: "Productive hours today",
        href: "/time",
      },
      {
        id: "focus",
        icon: <Brain className="w-8 h-8" />,
        label: "Focus",
        status: focusStatus as "stable" | "warning" | "critical",
        value: `${focusPercentage}%`,
        domain: "Deep work quality",
        href: "/time",
      },
      {
        id: "habits",
        icon: <RotateCw className="w-8 h-8" />,
        label: "Habits",
        status: habitStatus as "stable" | "warning" | "critical",
        value: `${todayHabits}/${habits.length}`,
        domain: "Daily habits completed",
        href: "/habits",
      },
      {
        id: "goals",
        icon: <Target className="w-8 h-8" />,
        label: "Goals",
        status: goalStatus as "stable" | "warning" | "critical",
        value: `${avgProgress}%`,
        domain: "Average progress",
        href: "/goals",
      },
      {
        id: "money",
        icon: <DollarSign className="w-8 h-8" />,
        label: "Money",
        status: budgetStatus as "stable" | "warning" | "critical",
        value: `${Math.max(budgetRemaining, 0)}%`,
        domain: "Budget remaining",
        href: "/finance",
      },
      {
        id: "study",
        icon: <BookOpen className="w-8 h-8" />,
        label: "Study",
        status: studyStatus as "stable" | "warning" | "critical",
        value: `${studyHours}h`,
        domain: "Learning time today",
        href: "/tasks",
      },
      {
        id: "journal",
        icon: <PenTool className="w-8 h-8" />,
        label: "Mood",
        status: wellbeingStatus as "stable" | "warning" | "critical",
        value: `${avgMood}%`,
        domain: "Wellbeing score",
        href: "/journal",
      },
      {
        id: "energy",
        icon: <Zap className="w-8 h-8" />,
        label: "Energy",
        status: energyStatus as "stable" | "warning" | "critical",
        value: `${avgEnergy}%`,
        domain: "Energy level",
        href: "/journal",
      },
    ];
  }, [
    tasks,
    habits,
    timeEntries,
    studySessions,
    journalEntries,
    getTodayStats,
    getFinanceStats,
    getGoalStats,
  ]);

  // Calculate positions for 8 signals in a circle
  const radius = 220;
  const positionedSignals = signals.map((signal, index) => {
    const angle = (index * 360) / signals.length - 90; // Start from top
    const x = Math.cos((angle * Math.PI) / 180) * radius;
    const y = Math.sin((angle * Math.PI) / 180) * radius;
    return { ...signal, x, y };
  });

  return (
    <div className="relative w-full flex justify-center py-8">
      <div className="relative w-full max-w-2xl aspect-square">
        {/* Orbital paths (subtle) */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <circle
            cx="50%"
            cy="50%"
            r={`${(radius / 480) * 100}%`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeDasharray="4 4"
            className="text-muted-foreground"
          />
        </svg>

        {/* Connection lines to center */}
        <svg className="absolute inset-0 w-full h-full opacity-10">
          {positionedSignals.map((signal) => (
            <line
              key={signal.id}
              x1="50%"
              y1="50%"
              x2={`calc(50% + ${signal.x}px)`}
              y2={`calc(50% + ${signal.y}px)`}
              stroke="currentColor"
              strokeWidth="1"
              className="text-muted-foreground"
            />
          ))}
        </svg>

        {/* Signals */}
        {positionedSignals.map((signal) => (
          <Link
            key={signal.id}
            href={signal.href}
            className="absolute w-24 h-24 flex items-center justify-center"
            style={{
              left: "50%",
              top: "50%",
              transform: `translate(calc(-50% + ${signal.x}px), calc(-50% + ${signal.y}px))`,
              transition: "all 0.3s ease-out",
            }}
            onMouseEnter={() => setHoveredSignal(signal.id)}
            onMouseLeave={() => setHoveredSignal(null)}
          >
            <div
              className={cn(
                "w-full h-full rounded-2xl border-2 transition-all duration-300",
                "flex flex-col items-center justify-center gap-1",
                "hover:shadow-lg hover:scale-110 cursor-pointer",
                hoveredSignal === signal.id
                  ? "bg-secondary border-primary/50 shadow-lg scale-110"
                  : "bg-background border-border hover:border-primary/30",
              )}
              title={signal.domain}
            >
              {/* Status Indicator */}
              <div
                className={cn(
                  "absolute top-3 right-3 w-2.5 h-2.5 rounded-full transition-all",
                  hoveredSignal === signal.id && "animate-pulse",
                )}
                style={{ backgroundColor: STATUS_COLORS[signal.status] }}
              />

              {/* Icon */}
              <div
                className="opacity-80 transition-colors"
                style={{
                  color:
                    hoveredSignal === signal.id
                      ? STATUS_COLORS[signal.status]
                      : undefined,
                }}
              >
                {signal.icon}
              </div>

              {/* Label */}
              <span className="text-xs font-semibold uppercase tracking-wider">
                {signal.label}
              </span>

              {/* Value (shown on hover or always) */}
              <span
                className={cn(
                  "text-sm font-mono transition-opacity",
                  hoveredSignal === signal.id ? "opacity-100" : "opacity-60",
                )}
                style={{ color: STATUS_COLORS[signal.status] }}
              >
                {signal.value}
              </span>
            </div>
          </Link>
        ))}

        {/* Center - Life Score Preview */}
        <Link
          href="/"
          className="absolute top-1/2 left-1/2 w-20 h-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary border-2 border-border flex items-center justify-center hover:scale-110 transition-transform cursor-pointer group"
        >
          <div className="text-center">
            <span className="text-xs text-muted-foreground block">LIFE</span>
            <span className="text-lg font-bold group-hover:text-primary transition-colors">
              CORE
            </span>
          </div>
        </Link>
      </div>
    </div>
  );
}
