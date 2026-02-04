"use client";

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/context/app-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Network,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Sparkles,
  Clock,
  Target,
  Heart,
  DollarSign,
  Zap,
  CheckCircle2,
} from "lucide-react";

// Domain configuration
const DOMAINS = [
  {
    id: "habits",
    label: "Habits",
    icon: CheckCircle2,
    color: "#10b981",
    x: 50,
    y: 15,
  },
  { id: "tasks", label: "Tasks", icon: Target, color: "#3b82f6", x: 85, y: 35 },
  { id: "time", label: "Time", icon: Clock, color: "#8b5cf6", x: 85, y: 65 },
  { id: "mood", label: "Mood", icon: Heart, color: "#ec4899", x: 50, y: 85 },
  { id: "energy", label: "Energy", icon: Zap, color: "#f59e0b", x: 15, y: 65 },
  {
    id: "finance",
    label: "Finance",
    icon: DollarSign,
    color: "#06b6d4",
    x: 15,
    y: 35,
  },
];

interface Connection {
  from: string;
  to: string;
  strength: number;
  direction: "positive" | "negative";
  insight: string;
}

export function CrossDomainMap() {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
  const [selectedConnection, setSelectedConnection] =
    useState<Connection | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const {
    habits,
    tasks,
    timeEntries,
    transactions,
    journalEntries,
    getFinanceStats,
  } = useApp();

  useEffect(() => {
    analyzeCorrelations();
  }, [habits, tasks, timeEntries, transactions, journalEntries]);

  const analyzeCorrelations = async () => {
    setIsLoading(true);

    const today = new Date();
    const { expenses, income, balance } = getFinanceStats();

    // Convert patterns to connections (using local analysis)
    const newConnections: Connection[] = [];

    // Habit → Mood correlation
    const habitsCompleted = habits.filter((h) =>
      h.completions?.some(
        (c) => c.date === today.toISOString().split("T")[0] && c.completed,
      ),
    ).length;
    if (habits.length > 0) {
      const habitRate = habitsCompleted / habits.length;
      newConnections.push({
        from: "habits",
        to: "mood",
        strength: Math.min(0.9, habitRate + 0.3),
        direction: habitRate > 0.5 ? "positive" : "negative",
        insight:
          habitRate > 0.5
            ? "Consistent habits are boosting your mood"
            : "Missing habits may be affecting your mood",
      });
    }

    // Time → Tasks correlation
    const todayTimeLogged = timeEntries
      .filter((t) => t.date.split("T")[0] === today.toISOString().split("T")[0])
      .reduce((s, t) => s + t.duration, 0);
    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    if (tasks.length > 0) {
      const taskRate = completedTasks / tasks.length;
      newConnections.push({
        from: "time",
        to: "tasks",
        strength: Math.min(0.85, todayTimeLogged / 300 + 0.2),
        direction: todayTimeLogged > 180 ? "positive" : "negative",
        insight:
          todayTimeLogged > 180
            ? "Good time investment is driving task completion"
            : "More focused time could improve task completion",
      });
    }

    // Energy → Time correlation
    const avgEnergy =
      journalEntries.length > 0
        ? journalEntries.slice(0, 7).reduce((s, e) => s + (e.energy || 5), 0) /
          Math.min(journalEntries.length, 7)
        : 5;
    newConnections.push({
      from: "energy",
      to: "time",
      strength: avgEnergy / 10 + 0.3,
      direction: avgEnergy > 5 ? "positive" : "negative",
      insight:
        avgEnergy > 5
          ? "High energy is enabling productive work sessions"
          : "Low energy may be limiting deep work capacity",
    });

    // Finance → Mood correlation
    if (balance < 0) {
      newConnections.push({
        from: "finance",
        to: "mood",
        strength: 0.7,
        direction: "negative",
        insight: "Budget stress may be affecting your overall mood",
      });
    } else {
      newConnections.push({
        from: "finance",
        to: "mood",
        strength: 0.4,
        direction: "positive",
        insight: "Financial stability is supporting positive mood",
      });
    }

    // Habits → Energy correlation
    newConnections.push({
      from: "habits",
      to: "energy",
      strength: habits.length > 0 ? 0.65 : 0.3,
      direction: habitsCompleted > 0 ? "positive" : "negative",
      insight:
        habitsCompleted > 0
          ? "Healthy habits are maintaining energy levels"
          : "Building habits could boost your energy",
    });

    // Tasks → Finance correlation (work tasks → income)
    const workTasks = tasks.filter((t) => t.domain === "work");
    if (workTasks.length > 0) {
      newConnections.push({
        from: "tasks",
        to: "finance",
        strength: 0.5,
        direction: "positive",
        insight: "Work task completion supports financial goals",
      });
    }

    setConnections(newConnections);
    setIsLoading(false);
  };

  // Get connections for selected domain
  const activeConnections = useMemo(() => {
    if (!selectedDomain) return connections;
    return connections.filter(
      (c) => c.from === selectedDomain || c.to === selectedDomain,
    );
  }, [connections, selectedDomain]);

  // Calculate SVG path for connection
  const getConnectionPath = (
    from: (typeof DOMAINS)[0],
    to: (typeof DOMAINS)[0],
  ) => {
    const startX = from.x;
    const startY = from.y;
    const endX = to.x;
    const endY = to.y;

    // Curved path
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const curve = 10; // Curve amount

    // Calculate perpendicular offset for curve
    const dx = endX - startX;
    const dy = endY - startY;
    const len = Math.sqrt(dx * dx + dy * dy);
    const offsetX = (-dy / len) * curve;
    const offsetY = (dx / len) * curve;

    return `M ${startX} ${startY} Q ${midX + offsetX} ${midY + offsetY} ${endX} ${endY}`;
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Network className="w-5 h-5 text-primary animate-pulse" />
          </div>
          <div>
            <div className="h-4 w-40 bg-muted animate-pulse rounded" />
            <div className="h-3 w-56 bg-muted animate-pulse rounded mt-2" />
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
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Network className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Life Connections</h3>
            <p className="text-sm text-muted-foreground">
              How different areas of your life affect each other
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={analyzeCorrelations}>
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Map Visualization */}
      <div className="relative h-[300px] p-6">
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ overflow: "visible" }}
        >
          {/* Connection lines */}
          {activeConnections.map((connection, i) => {
            const fromDomain = DOMAINS.find((d) => d.id === connection.from);
            const toDomain = DOMAINS.find((d) => d.id === connection.to);
            if (!fromDomain || !toDomain) return null;

            const isHighlighted =
              selectedConnection?.from === connection.from &&
              selectedConnection?.to === connection.to;

            return (
              <motion.g key={`${connection.from}-${connection.to}`}>
                <motion.path
                  d={getConnectionPath(fromDomain, toDomain)}
                  fill="none"
                  stroke={
                    connection.direction === "positive" ? "#10b981" : "#ef4444"
                  }
                  strokeWidth={isHighlighted ? 3 : connection.strength * 3 + 1}
                  strokeOpacity={
                    selectedDomain && !isHighlighted
                      ? 0.2
                      : connection.strength * 0.6 + 0.2
                  }
                  strokeDasharray={
                    connection.direction === "negative" ? "5,5" : "none"
                  }
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="cursor-pointer"
                  onClick={() =>
                    setSelectedConnection(
                      selectedConnection === connection ? null : connection,
                    )
                  }
                />
                {/* Direction arrow */}
                <motion.circle
                  cx={0}
                  cy={0}
                  r={3}
                  fill={
                    connection.direction === "positive" ? "#10b981" : "#ef4444"
                  }
                  initial={{ opacity: 0 }}
                  animate={{
                    opacity: selectedDomain && !isHighlighted ? 0.2 : 0.8,
                    offsetDistance: ["0%", "100%"],
                  }}
                  transition={{
                    offsetDistance: {
                      duration: 2,
                      repeat: Infinity,
                      ease: "linear",
                    },
                  }}
                  style={{
                    offsetPath: `path("${getConnectionPath(fromDomain, toDomain)}")`,
                  }}
                />
              </motion.g>
            );
          })}
        </svg>

        {/* Domain nodes */}
        {DOMAINS.map((domain) => {
          const isSelected = selectedDomain === domain.id;
          const isConnected =
            selectedDomain &&
            activeConnections.some(
              (c) =>
                (c.from === domain.id || c.to === domain.id) &&
                (c.from === selectedDomain || c.to === selectedDomain),
            );
          const shouldFade = selectedDomain && !isSelected && !isConnected;

          return (
            <motion.div
              key={domain.id}
              className={cn(
                "absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer",
                "transition-opacity duration-200",
                shouldFade && "opacity-30",
              )}
              style={{ left: `${domain.x}%`, top: `${domain.y}%` }}
              onClick={() => setSelectedDomain(isSelected ? null : domain.id)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.div
                className={cn(
                  "w-14 h-14 rounded-2xl flex items-center justify-center",
                  "border-2 transition-all duration-200",
                  isSelected
                    ? "ring-4 ring-offset-2 shadow-lg"
                    : "hover:shadow-md",
                )}
                style={{
                  backgroundColor: `${domain.color}20`,
                  borderColor: domain.color,
                  // @ts-expect-error - ringColor works with CSS variables
                  "--tw-ring-color": isSelected
                    ? `${domain.color}40`
                    : "transparent",
                }}
                animate={{
                  scale: isSelected ? 1.1 : 1,
                }}
              >
                <domain.icon
                  className="w-6 h-6"
                  style={{ color: domain.color }}
                />
              </motion.div>
              <div
                className={cn(
                  "text-xs font-medium text-center mt-2 transition-colors",
                  isSelected ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {domain.label}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Selected Connection Insight */}
      <AnimatePresence>
        {selectedConnection && (
          <motion.div
            className="px-6 pb-6"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div
              className={cn(
                "p-4 rounded-xl border",
                selectedConnection.direction === "positive"
                  ? "bg-emerald-500/5 border-emerald-500/20"
                  : "bg-red-500/5 border-red-500/20",
              )}
            >
              <div className="flex items-center gap-3 mb-2">
                {selectedConnection.direction === "positive" ? (
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-red-500" />
                )}
                <span className="font-medium">
                  {DOMAINS.find((d) => d.id === selectedConnection.from)?.label}
                  <ArrowRight className="w-4 h-4 inline mx-2" />
                  {DOMAINS.find((d) => d.id === selectedConnection.to)?.label}
                </span>
                <span
                  className={cn(
                    "ml-auto text-sm",
                    selectedConnection.direction === "positive"
                      ? "text-emerald-500"
                      : "text-red-500",
                  )}
                >
                  {Math.round(selectedConnection.strength * 100)}% correlation
                </span>
              </div>
              <p className="text-sm text-muted-foreground flex items-start gap-2">
                <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-primary" />
                {selectedConnection.insight}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Legend */}
      <div className="px-6 pb-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-6 h-0.5 bg-emerald-500 rounded" />
          <span>Positive influence</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-0.5 bg-red-500 rounded border-dashed border-red-500 border"
            style={{ borderStyle: "dashed" }}
          />
          <span>Negative influence</span>
        </div>
      </div>
    </Card>
  );
}
