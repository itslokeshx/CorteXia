"use client";

import Link from "next/link";
import { CheckCircle2, Flame, Target, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

const CARD_CONFIG = [
  {
    key: "tasks",
    label: "Today's Tasks",
    href: "/tasks",
    icon: CheckCircle2,
    iconColor: "#3b82f6",
    iconBg: "rgba(59, 130, 246, 0.08)",
    hasProgress: true,
  },
  {
    key: "habits",
    label: "Active Habits",
    href: "/habits",
    icon: Flame,
    iconColor: "#10b981",
    iconBg: "rgba(16, 185, 129, 0.08)",
    hasProgress: false,
  },
  {
    key: "goals",
    label: "Goals Progress",
    href: "/goals",
    icon: Target,
    iconColor: "#3b82f6",
    iconBg: "rgba(59, 130, 246, 0.08)",
    hasProgress: true,
  },
  {
    key: "focus",
    label: "Focus Time Today",
    href: "/time-tracker",
    icon: Timer,
    iconColor: "#f59e0b",
    iconBg: "rgba(245, 158, 11, 0.08)",
    hasProgress: true,
  },
] as const;

export type StatCardPayload = {
  tasks?: { done: number; total: number; pct: number };
  habits?: { count: number; bestStreak: number };
  goals?: { inProgress: number; onTrackPct: number; segments?: { green: number; yellow: number; red: number } };
  focus?: { minutes: number; sessions: number; goalMinutes?: number };
};

export function QuickStatsRow({ stats }: { stats: StatCardPayload }) {
  const taskPct = stats.tasks && stats.tasks.total > 0
    ? Math.round((stats.tasks.done / stats.tasks.total) * 100)
    : 0;
  const focusGoal = stats.focus?.goalMinutes ?? 240; // 4h default
  const focusPct = stats.focus
    ? Math.min(100, Math.round((stats.focus.minutes / focusGoal) * 100))
    : 0;

  const cards = [
    {
      ...CARD_CONFIG[0],
      main: stats.tasks ? `${stats.tasks.done} / ${stats.tasks.total} completed` : "0 / 0 completed",
      sub: `${taskPct}% done today`,
      progress: taskPct,
    },
    {
      ...CARD_CONFIG[1],
      main: stats.habits ? `${stats.habits.count} habits tracked` : "0 habits tracked",
      sub: stats.habits?.bestStreak ? `Best: ${stats.habits.bestStreak}-day streak` : "No streaks yet",
      progress: null,
    },
    {
      ...CARD_CONFIG[2],
      main: stats.goals ? `${stats.goals.inProgress} goals in progress` : "0 goals in progress",
      sub: stats.goals ? `${stats.goals.onTrackPct}% on track` : "No goals set",
      progress: stats.goals?.segments,
    },
    {
      ...CARD_CONFIG[3],
      main: stats.focus
        ? `${Math.floor(stats.focus.minutes / 60)}h ${stats.focus.minutes % 60}m`
        : "0m",
      sub: stats.focus ? `${stats.focus.sessions} sessions completed` : "Start a session",
      progress: focusPct,
      progressExceeded: stats.focus ? stats.focus.minutes >= focusGoal : false,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <Link
          key={card.key}
          href={card.href}
          className={cn(
            "group rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)]",
            "p-4 min-h-[100px] flex flex-col transition-all duration-200 ease-out",
            "hover:border-[var(--color-border)] hover:shadow-sm",
          )}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: card.iconBg }}
            >
              <card.icon className="w-5 h-5" style={{ color: card.iconColor }} />
            </div>
            <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
              {card.label}
            </span>
          </div>
          <p className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
            {card.main}
          </p>
          {card.progress != null && typeof card.progress === "number" && (
            <div className="mt-1.5 mb-0.5">
              <div className="h-1 rounded-full w-full overflow-hidden bg-[var(--bg-tertiary)]">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500 ease-out",
                    card.key === "focus" && card.progressExceeded && "bg-gradient-to-b from-amber-500 to-yellow-500",
                  )}
                  style={{
                    width: `${Math.min(100, card.progress)}%`,
                    backgroundColor:
                      card.key === "focus" && !card.progressExceeded
                        ? "#f59e0b"
                        : card.key === "tasks" || card.key === "goals"
                          ? "#3b82f6"
                          : card.key !== "focus"
                            ? "#f59e0b"
                            : undefined,
                    borderRadius: "9999px",
                  }}
                />
              </div>
            </div>
          )}
          {card.progress != null && typeof card.progress === "object" && card.progress && "green" in card.progress && (
            <div className="mt-1.5 mb-0.5 flex gap-0.5 h-1 rounded-full overflow-hidden bg-[var(--bg-tertiary)]">
              {[
                { w: (card.progress as { green: number; yellow: number; red: number }).green, c: "#10b981" },
                { w: (card.progress as { green: number; yellow: number; red: number }).yellow, c: "#f59e0b" },
                { w: (card.progress as { green: number; yellow: number; red: number }).red, c: "#ef4444" },
              ].map((seg, i) => (
                <div
                  key={i}
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${seg.w}%`,
                    backgroundColor: seg.c,
                    minWidth: seg.w > 0 ? "4px" : "0",
                  }}
                />
              ))}
            </div>
          )}
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            {card.sub}
          </p>
        </Link>
      ))}
    </div>
  );
}
