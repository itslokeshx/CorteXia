"use client";

import Link from "next/link";
import {
  CheckSquare,
  Target,
  CalendarDays,
  Wallet,
  Flag,
  Timer,
  Brain,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/tasks", label: "Task", icon: CheckSquare, color: "#3b82f6" },
  { href: "/habits", label: "Habit", icon: Target, color: "#10b981" },
  { href: "/day-planner", label: "Plan", icon: CalendarDays, color: "#0ea5e9" },
  { href: "/finance", label: "Finance", icon: Wallet, color: "#22c55e" },
  { href: "/goals", label: "Goal", icon: Flag, color: "#ec4899" },
  { href: "/time-tracker", label: "Focus", icon: Timer, color: "#f59e0b" },
  { href: "/ai-coach", label: "Jarvis", icon: Brain, color: "#8b5cf6" },
  { href: "/journal", label: "Journal", icon: BookOpen, color: "#06b6d4" },
] as const;

export function DashboardQuickNav() {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          Quick navigation
        </h2>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-8 gap-2">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-xl py-4 px-2",
                "border border-[var(--border-subtle)] bg-[var(--bg-secondary)]",
                "transition-all duration-200 hover:border-[var(--color-border)] hover:shadow-sm",
                "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-2",
              )}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${item.color}15` }}
              >
                <Icon className="w-5 h-5" style={{ color: item.color }} />
              </div>
              <span className="text-xs font-medium text-[var(--text-secondary)] text-center leading-tight">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
