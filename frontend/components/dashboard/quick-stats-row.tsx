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
  const cards = [
    {
      ...CARD_CONFIG[0],
      value: stats.tasks ? `${stats.tasks.done}/${stats.tasks.total}` : "0/0",
      sub: "completed",
    },
    {
      ...CARD_CONFIG[1],
      value: stats.habits ? `${stats.habits.count}` : "0",
      sub: stats.habits?.bestStreak ? `${stats.habits.bestStreak}d streak` : "active",
    },
    {
      ...CARD_CONFIG[2],
      value: stats.goals ? `${stats.goals.inProgress}` : "0",
      sub: "in progress",
    },
    {
      ...CARD_CONFIG[3],
      value: stats.focus
        ? stats.focus.minutes >= 60
          ? `${Math.floor(stats.focus.minutes / 60)}h${stats.focus.minutes % 60 > 0 ? ` ${stats.focus.minutes % 60}m` : ""}`
          : `${stats.focus.minutes}m`
        : "0m",
      sub: stats.focus?.sessions ? `${stats.focus.sessions} sessions` : "today",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <Link
          key={card.key}
          href={card.href}
          className={cn(
            "group rounded-xl border bg-[var(--color-bg-secondary)]",
            "p-4 flex flex-col gap-1 transition-all duration-200 ease-out",
            "border-[var(--color-border-subtle)]",
            "hover:border-[var(--color-border)] hover:shadow-md hover:-translate-y-0.5",
          )}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-medium uppercase tracking-widest"
              style={{ color: "var(--color-text-tertiary)" }}>
              {card.label}
            </span>
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity"
              style={{ backgroundColor: card.iconBg }}
            >
              <card.icon className="w-3.5 h-3.5" style={{ color: card.iconColor }} />
            </div>
          </div>
          <p className="text-2xl font-semibold tracking-tight" style={{ color: "var(--color-text-primary)" }}>
            {card.value}
          </p>
          <span className="text-[11px]" style={{ color: "var(--color-text-tertiary)" }}>
            {card.sub}
          </span>
        </Link>
      ))}
    </div>
  );
}
