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
      value: stats.tasks ? `${stats.tasks.done} / ${stats.tasks.total}` : "0 / 0",
    },
    {
      ...CARD_CONFIG[1],
      value: stats.habits ? `${stats.habits.count}` : "0",
    },
    {
      ...CARD_CONFIG[2],
      value: stats.goals ? `${stats.goals.inProgress}` : "0",
    },
    {
      ...CARD_CONFIG[3],
      value: stats.focus
        ? `${Math.floor(stats.focus.minutes / 60)}h ${stats.focus.minutes % 60}m`
        : "0m",
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
            "p-3 min-h-[80px] flex flex-row items-center justify-between transition-all duration-200 ease-out",
            "hover:border-[var(--color-border)] hover:shadow-sm",
          )}
        >
          <div className="flex flex-col justify-center">
            <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider mb-0.5">
              {card.label}
            </span>
            <p className="text-lg font-bold tracking-tight text-[var(--text-primary)]">
              {card.value}
            </p>
          </div>
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 opacity-80 group-hover:opacity-100 transition-opacity"
            style={{ backgroundColor: card.iconBg }}
          >
            <card.icon className="w-4 h-4" style={{ color: card.iconColor }} />
          </div>
        </Link>
      ))}
    </div>
  );
}
