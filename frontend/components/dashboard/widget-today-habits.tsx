"use client";

import Link from "next/link";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type HabitWithStreak = {
  id: string;
  name: string;
  completed: boolean;
  streak: number;
  targetTime?: string;
  duration?: number;
  completedAt?: string; // time today if completed
};

function streakEmoji(streak: number): string {
  if (streak >= 7) return "🔥";
  if (streak >= 5) return "💎";
  if (streak >= 2) return "⚡";
  if (streak >= 1) return "⭐";
  return "";
}

export function WidgetTodayHabits({
  habits,
  onToggle,
  today,
}: {
  habits: HabitWithStreak[];
  onToggle: (id: string) => void;
  today: string;
}) {
  const displayList = habits.slice(0, 3);

  return (
    <div className="dashboard-card h-full">
      <div className="dashboard-card-header">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          Today's Habits
        </h2>
        <span className="text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-lg">
          {habits.length} habits
        </span>
      </div>

      <div className="dashboard-card-body scrollbar-thin">
        {displayList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <span className="text-4xl mb-3">🎯</span>
            <p className="text-base text-[var(--text-secondary)]">
              No habits yet
            </p>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              Start building consistency!
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => (window.location.href = "/habits")}
              className="mt-4 rounded-lg"
            >
              + Create your first habit
            </Button>
          </div>
        ) : (
          displayList.map((habit) => (
            <button
              key={habit.id}
              type="button"
              onClick={() => !habit.completed && onToggle(habit.id)}
              disabled={habit.completed}
              className={cn(
                "w-full flex items-start gap-3 px-4 py-2.5 border-b border-[var(--border-subtle)] text-left transition-colors hover:bg-[var(--bg-tertiary)] cursor-pointer",
                habit.completed && "cursor-default",
              )}
            >
              <div className="flex-shrink-0 mt-0.5">
                {habit.completed ? (
                  <div className="w-6 h-6 rounded-full bg-[#10b981] flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  </div>
                ) : (
                  <div
                    className="w-6 h-6 rounded-full border-[2.5px] border-[var(--color-border)] hover:border-[var(--text-secondary)] transition-all"
                    style={{ borderRadius: "50%" }}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[15px] font-medium text-[var(--text-primary)]">
                    {habit.name}
                  </span>
                  {habit.streak > 0 && (
                    <span className="text-[13px] font-semibold text-[var(--text-secondary)] flex items-center gap-1 flex-shrink-0">
                      {streakEmoji(habit.streak)} {habit.streak} day streak
                    </span>
                  )}
                </div>
                <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">
                  {habit.completed && habit.completedAt
                    ? `Completed at ${habit.completedAt}`
                    : habit.targetTime && habit.duration
                      ? `${habit.targetTime} • ${habit.duration} minutes`
                      : habit.targetTime || "All day"}
                </p>
              </div>
            </button>
          ))
        )}
      </div>

      {habits.length > 0 && (
        <div className="dashboard-card-footer flex justify-end">
          <Link
            href="/habits"
            className="text-sm font-medium text-[#3b82f6] hover:underline inline-flex items-center gap-1 transition-transform hover:translate-x-0.5"
          >
            See all habits
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
