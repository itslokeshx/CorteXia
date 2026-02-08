"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Goal } from "@/lib/types";
import { differenceInDays, parseISO } from "date-fns";

function getStatus(goal: Goal): { label: string; emoji: string; color: string; bg: string } {
  if (goal.progress >= 60)
    return { label: "On Track", emoji: "🟢", color: "#10b981", bg: "rgba(16, 185, 129, 0.08)" };
  if (goal.progress >= 40)
    return { label: "At Risk", emoji: "🟡", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.08)" };
  return { label: "Behind", emoji: "🔴", color: "#ef4444", bg: "rgba(239, 68, 68, 0.08)" };
}

export function WidgetGoalsOverview({
  goals,
  onTrackPct,
}: {
  goals: Goal[];
  onTrackPct: number;
}) {
  const displayList = goals.slice(0, 2);

  return (
    <div className="dashboard-card h-full">
      <div className="dashboard-card-header">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          Goal Progress
        </h2>
        <span className="text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-lg">
          {goals.length} active
        </span>
      </div>

      <div className="dashboard-card-body scrollbar-thin">
        {displayList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <span className="text-4xl mb-3">🎯</span>
            <p className="text-base text-[var(--text-secondary)]">
              No goals yet
            </p>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              Set your first big objective!
            </p>
            <Link
              href="/goals"
              className="mt-4 inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              + Create a goal
            </Link>
          </div>
        ) : (
          displayList.map((goal) => {
            const status = getStatus(goal);
            const daysLeft = goal.targetDate
              ? differenceInDays(parseISO(goal.targetDate), new Date())
              : null;
            const quarter = goal.targetDate
              ? `Q${Math.ceil(parseISO(goal.targetDate).getMonth() / 3) + 1} ${parseISO(goal.targetDate).getFullYear()}`
              : "";
            return (
              <Link
                key={goal.id}
                href="/goals"
                className={cn(
                  "block px-4 py-3 border-b border-[var(--border-subtle)] transition-colors hover:bg-[var(--bg-tertiary)]",
                  status.label === "At Risk" && "border-l-2 border-l-[#f59e0b]",
                )}
              >
                <p className="text-[15px] font-semibold text-[var(--text-primary)] line-clamp-2 leading-snug">
                  {goal.title}
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <div className="flex-1 h-2 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${Math.min(100, goal.progress)}%`,
                        background: `linear-gradient(to right, ${status.color}, ${status.color}dd)`,
                      }}
                    />
                  </div>
                  <span
                    className="text-sm font-bold tabular-nums flex-shrink-0"
                    style={{ color: status.color }}
                  >
                    {goal.progress}%
                  </span>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-xl flex-shrink-0"
                    style={{ color: status.color, backgroundColor: status.bg }}
                  >
                    {status.emoji} {status.label}
                  </span>
                </div>
                <p className="text-[13px] text-[var(--text-tertiary)] mt-2">
                  {daysLeft != null && daysLeft >= 0 && `Due in ${daysLeft} days`}
                  {quarter && ` • ${quarter}`}
                </p>
              </Link>
            );
          })
        )}
      </div>

      {goals.length > 0 && (
        <div className="dashboard-card-footer flex justify-end">
          <Link
            href="/goals"
            className="text-sm font-medium text-[#3b82f6] hover:underline inline-flex items-center gap-1 transition-transform hover:translate-x-0.5"
          >
            View all goals
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
