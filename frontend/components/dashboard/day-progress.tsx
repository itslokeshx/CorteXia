"use client";

import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { useApp } from "@/lib/context/app-context";

function getDayProgress(): { pct: number; time: string; remaining: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const elapsed = now.getTime() - start.getTime();
  const total = end.getTime() - start.getTime();
  const pct = Math.min(100, Math.max(0, (elapsed / total) * 100));

  const remainMs = end.getTime() - now.getTime();
  const remainH = Math.floor(remainMs / 3600000);
  const remainM = Math.floor((remainMs % 3600000) / 60000);
  const remaining = remainH > 0 ? `${remainH}h ${remainM}m left` : `${remainM}m left`;

  return { pct, time: format(now, "h:mm a"), remaining };
}

export function DayProgress() {
  const [progress, setProgress] = useState<{ pct: number; time: string; remaining: string } | null>(null);
  const { tasks, habits } = useApp();

  useEffect(() => {
    setProgress(getDayProgress());
    const t = setInterval(() => setProgress(getDayProgress()), 60000);
    return () => clearInterval(t);
  }, []);

  // Summary stats
  const stats = useMemo(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const completedTasks = tasks.filter(t => t.status === "completed" && t.completedAt?.startsWith(todayStr)).length;
    const totalTasks = tasks.filter(t =>
      t.status !== "completed" ? (t.dueDate === todayStr || (t.dueDate && t.dueDate < todayStr) || t.priority === "high" || t.priority === "critical") : t.completedAt?.startsWith(todayStr)
    ).length;
    const completedHabits = habits.filter(h => h.active !== false && h.completions?.some(c => c.date === todayStr && c.completed)).length;
    const totalHabits = habits.filter(h => h.active !== false).length;
    return { completedTasks, totalTasks, completedHabits, totalHabits };
  }, [tasks, habits]);

  if (!progress) return null;

  const pct = Math.round(progress.pct);

  return (
    <div
      className="p-5 rounded-xl border"
      style={{
        borderColor: "var(--color-border-subtle)",
        background: "var(--color-bg-secondary)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--color-text-primary)" }}>
            Day Progression
          </h3>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--color-text-tertiary)" }}>
            {progress.time} · {progress.remaining}
          </p>
        </div>
        <span
          className="text-xl font-light tabular-nums"
          style={{ color: "var(--color-text-primary)" }}
        >
          {pct}%
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-2 rounded-full overflow-hidden mb-4"
        style={{ background: "var(--color-bg-tertiary)" }}
      >
        <div
          className="h-full rounded-full transition-[width] duration-1000 relative"
          style={{
            width: `${progress.pct}%`,
            background: pct < 50
              ? "var(--color-info)"
              : pct < 80
                ? "var(--domain-habits)"
                : "var(--color-warning)",
          }}
        >
          {/* Animated edge glow */}
          <div
            className="absolute right-0 top-0 h-full w-3 rounded-full"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.3))",
            }}
          />
        </div>
      </div>

      {/* Quick summary */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: "var(--domain-goals)" }} />
          <span className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
            Tasks: {stats.completedTasks}/{stats.totalTasks}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: "var(--domain-habits)" }} />
          <span className="text-[11px]" style={{ color: "var(--color-text-secondary)" }}>
            Habits: {stats.completedHabits}/{stats.totalHabits}
          </span>
        </div>
        <div className="flex-1" />
        <span className="text-[10px]" style={{ color: "var(--color-text-tertiary)" }}>
          12 AM — 11:59 PM
        </span>
      </div>
    </div>
  );
}
