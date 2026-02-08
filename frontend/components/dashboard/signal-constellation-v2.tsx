"use client";

import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  X,
  TrendingUp,
  TrendingDown,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Signal {
  id: string;
  icon: React.ReactNode;
  label: string;
  status: "stable" | "warning" | "critical";
  value: string;
  domain: string;
  trend?: "up" | "down" | "stable";
  href: string;
  angle: number;
}

const STATUS_COLORS = {
  stable: {
    ring: "#10B981",
    glow: "rgba(16, 185, 129, 0.4)",
    bg: "rgba(16, 185, 129, 0.1)",
  },
  warning: {
    ring: "#F59E0B",
    glow: "rgba(245, 158, 11, 0.4)",
    bg: "rgba(245, 158, 11, 0.1)",
  },
  critical: {
    ring: "#EF4444",
    glow: "rgba(239, 68, 68, 0.4)",
    bg: "rgba(239, 68, 68, 0.1)",
  },
};

const ICONS = {
  time: Clock,
  focus: Brain,
  habits: RotateCw,
  goals: Target,
  money: DollarSign,
  study: BookOpen,
  mood: PenTool,
  energy: Zap,
};

export function SignalConstellationV2() {
  const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
  const [hoveredSignal, setHoveredSignal] = useState<string | null>(null);

  const {
    tasks,
    habits,
    transactions,
    timeEntries,
    goals,
    studySessions,
    journalEntries,
    getFinanceStats,
    getTodayStats,
    getGoalStats,
  } = useApp();

  // Generate signals from real data with orbital positions
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

    // Energy
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
        icon: <Clock className="w-6 h-6" />,
        label: "Time",
        status: timeStatus,
        value: `${productiveHours}h`,
        domain: "Productive hours today",
        href: "/time",
        angle: 0,
      },
      {
        id: "focus",
        icon: <Brain className="w-6 h-6" />,
        label: "Focus",
        status: focusStatus,
        value: `${focusPercentage}%`,
        domain: "Deep work quality",
        href: "/time",
        angle: 45,
      },
      {
        id: "habits",
        icon: <RotateCw className="w-6 h-6" />,
        label: "Habits",
        status: habitStatus,
        value: `${todayHabits}/${habits.length}`,
        domain: "Daily habits",
        href: "/habits",
        angle: 90,
      },
      {
        id: "goals",
        icon: <Target className="w-6 h-6" />,
        label: "Goals",
        status: goalStatus,
        value: `${avgProgress}%`,
        domain: "Average progress",
        href: "/goals",
        angle: 135,
      },
      {
        id: "money",
        icon: <DollarSign className="w-6 h-6" />,
        label: "Money",
        status: budgetStatus,
        value: `${Math.max(budgetRemaining, 0)}%`,
        domain: "Budget remaining",
        href: "/finance",
        angle: 180,
      },
      {
        id: "study",
        icon: <BookOpen className="w-6 h-6" />,
        label: "Study",
        status: studyStatus,
        value: `${studyHours}h`,
        domain: "Learning today",
        href: "/tasks",
        angle: 225,
      },
      {
        id: "mood",
        icon: <PenTool className="w-6 h-6" />,
        label: "Mood",
        status: wellbeingStatus,
        value: `${avgMood}%`,
        domain: "Wellbeing score",
        href: "/journal",
        angle: 270,
      },
      {
        id: "energy",
        icon: <Zap className="w-6 h-6" />,
        label: "Energy",
        status: energyStatus,
        value: `${avgEnergy}%`,
        domain: "Energy level",
        href: "/journal",
        angle: 315,
      },
    ] as Signal[];
  }, [
    tasks,
    habits,
    transactions,
    timeEntries,
    goals,
    studySessions,
    journalEntries,
    getFinanceStats,
    getTodayStats,
    getGoalStats,
  ]);

  // Calculate position on orbit
  const getPosition = (angle: number, radius: number) => {
    const radian = (angle * Math.PI) / 180;
    return {
      x: Math.cos(radian) * radius,
      y: Math.sin(radian) * radius,
    };
  };

  // Connection lines between related signals
  const connections = useMemo(() => {
    return [
      { from: "habits", to: "mood", type: "positive" },
      { from: "focus", to: "goals", type: "positive" },
      { from: "energy", to: "focus", type: "positive" },
      { from: "study", to: "goals", type: "positive" },
    ];
  }, []);

  const orbitRadius = 160;
  const centerSize = 400;

  return (
    <div className="relative py-12">
      {/* Section Header */}
      <div className="text-center mb-12">
        <h2 className="text-2xl font-bold mb-2">Life Signal Constellation</h2>
        <p className="text-muted-foreground">
          Real-time status across all life dimensions
        </p>
      </div>

      {/* Orbital Container */}
      <div
        className="relative mx-auto"
        style={{ width: centerSize, height: centerSize }}
      >
        {/* Orbit Ring */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox={`0 0 ${centerSize} ${centerSize}`}
        >
          {/* Outer orbit */}
          <circle
            cx={centerSize / 2}
            cy={centerSize / 2}
            r={orbitRadius}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-border/30"
            strokeDasharray="4 4"
          />

          {/* Connection lines */}
          {connections.map(({ from, to, type }) => {
            const fromSignal = signals.find((s) => s.id === from);
            const toSignal = signals.find((s) => s.id === to);
            if (!fromSignal || !toSignal) return null;

            const fromPos = getPosition(fromSignal.angle, orbitRadius);
            const toPos = getPosition(toSignal.angle, orbitRadius);

            return (
              <motion.line
                key={`${from}-${to}`}
                x1={centerSize / 2 + fromPos.x}
                y1={centerSize / 2 + fromPos.y}
                x2={centerSize / 2 + toPos.x}
                y2={centerSize / 2 + toPos.y}
                stroke={type === "positive" ? "#10B981" : "#EF4444"}
                strokeWidth="1"
                strokeOpacity="0.3"
                strokeDasharray="4 4"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            );
          })}
        </svg>

        {/* Center Label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="text-center"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium mb-1">
              Life State
            </div>
            <div className="text-2xl font-bold text-primary">
              {signals.filter((s) => s.status === "stable").length}/
              {signals.length}
            </div>
            <div className="text-xs text-muted-foreground">Signals Healthy</div>
          </motion.div>
        </div>

        {/* Signal Nodes */}
        {signals.map((signal, index) => {
          const pos = getPosition(signal.angle, orbitRadius);
          const isHovered = hoveredSignal === signal.id;
          const statusColor = STATUS_COLORS[signal.status];

          return (
            <motion.div
              key={signal.id}
              className="absolute"
              style={{
                left: centerSize / 2 + pos.x - 36,
                top: centerSize / 2 + pos.y - 36,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <motion.button
                className={cn(
                  "relative w-[72px] h-[72px] rounded-2xl border-2 flex flex-col items-center justify-center",
                  "transition-all duration-300 backdrop-blur-sm",
                  "hover:scale-110 hover:z-10",
                )}
                style={{
                  borderColor: statusColor.ring,
                  backgroundColor: statusColor.bg,
                  boxShadow: isHovered
                    ? `0 0 30px ${statusColor.glow}`
                    : `0 0 15px ${statusColor.glow}`,
                }}
                onHoverStart={() => setHoveredSignal(signal.id)}
                onHoverEnd={() => setHoveredSignal(null)}
                onClick={() => setSelectedSignal(signal)}
                animate={
                  signal.status === "critical"
                    ? {
                        scale: [1, 1.05, 1],
                        rotate: [0, 2, -2, 0],
                      }
                    : {}
                }
                transition={
                  signal.status === "critical"
                    ? { repeat: Infinity, duration: 2 }
                    : {}
                }
              >
                {/* Icon */}
                <div style={{ color: statusColor.ring }}>{signal.icon}</div>

                {/* Value */}
                <div
                  className="text-xs font-bold mt-1"
                  style={{ color: statusColor.ring }}
                >
                  {signal.value}
                </div>

                {/* Hover Label */}
                <AnimatePresence>
                  {isHovered && (
                    <motion.div
                      className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                    >
                      <span className="text-xs font-medium text-foreground">
                        {signal.label}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Pulse for critical */}
                {signal.status === "critical" && (
                  <motion.div
                    className="absolute inset-0 rounded-2xl border-2"
                    style={{ borderColor: statusColor.ring }}
                    animate={{
                      scale: [1, 1.3],
                      opacity: [0.5, 0],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 1.5,
                    }}
                  />
                )}
              </motion.button>
            </motion.div>
          );
        })}
      </div>

      {/* Status Legend */}
      <div className="flex items-center justify-center gap-8 mt-8">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-sm text-muted-foreground">Stable</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-sm text-muted-foreground">Warning</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm text-muted-foreground">Critical</span>
        </div>
      </div>

      {/* Signal Detail Panel */}
      <AnimatePresence>
        {selectedSignal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedSignal(null)}
          >
            <motion.div
              className="w-full max-w-md p-6 rounded-2xl bg-background border shadow-2xl"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{
                      backgroundColor: STATUS_COLORS[selectedSignal.status].bg,
                      color: STATUS_COLORS[selectedSignal.status].ring,
                    }}
                  >
                    {selectedSignal.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">
                      {selectedSignal.label}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {selectedSignal.domain}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedSignal(null)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-muted/50">
                  <div className="text-sm text-muted-foreground mb-1">
                    Current Value
                  </div>
                  <div
                    className="text-3xl font-bold"
                    style={{ color: STATUS_COLORS[selectedSignal.status].ring }}
                  >
                    {selectedSignal.value}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-muted/50">
                  <div className="text-sm text-muted-foreground mb-2">
                    Status
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor:
                          STATUS_COLORS[selectedSignal.status].ring,
                      }}
                    />
                    <span className="font-medium capitalize">
                      {selectedSignal.status}
                    </span>
                  </div>
                </div>

                <Link href={selectedSignal.href}>
                  <Button className="w-full gap-2">
                    View Details
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
