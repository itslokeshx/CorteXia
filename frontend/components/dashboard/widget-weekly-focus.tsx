"use client";

import Link from "next/link";
import { format, startOfWeek, addDays, isToday } from "date-fns";
import { cn } from "@/lib/utils";
import type { TimeEntry } from "@/lib/types";

const BAR_COLOR = "#f59e0b";

export function WidgetWeeklyFocus({
  timeEntries,
  startOfWeekSetting = "monday",
}: {
  timeEntries: TimeEntry[];
  startOfWeekSetting?: "monday" | "sunday";
}) {
  const weekStart = startOfWeek(new Date(), {
    weekStartsOn: startOfWeekSetting === "sunday" ? 0 : 1,
  });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const byDay = days.map((d) => {
    const dateStr = format(d, "yyyy-MM-dd");
    const minutes = timeEntries
      .filter((e) => e.date === dateStr)
      .reduce((sum, e) => sum + e.duration, 0);
    const sessions = timeEntries.filter((e) => e.date === dateStr).length;
    return {
      dateStr,
      label: format(d, "EEE"),
      labelShort: format(d, "EEEEEE"),
      minutes,
      hours: minutes / 60,
      isToday: isToday(d),
      sessions,
    };
  });

  const totalHours = byDay.reduce((s, d) => s + d.hours, 0);
  const maxHours = Math.max(1, ...byDay.map((d) => d.hours));
  const yLabels = [0, 2, 4, 6, 8].filter((h) => h <= maxHours + 1);

  const mostProductive = byDay.reduce(
    (best, d) => (d.hours > (best?.hours ?? 0) ? d : best),
    null as { label: string; hours: number } | null,
  );

  if (timeEntries.length === 0 && totalHours === 0) {
    return (
      <div className="dashboard-card h-full">
        <div className="dashboard-card-header">
          <h2 className="text-base font-semibold text-[var(--text-primary)]">
            Focus This Week
          </h2>
          <span className="text-xs font-semibold text-[var(--text-primary)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-lg">
            0 hrs
          </span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center py-10 px-4 text-center min-h-0">
          <span className="text-4xl mb-3">📊</span>
          <p className="text-base text-[var(--text-secondary)]">
            No focus data yet
          </p>
          <p className="text-sm text-[var(--text-tertiary)] mt-1">
            Start your first session today!
          </p>
          <Link
            href="/time-tracker"
            className="mt-4 inline-flex items-center justify-center rounded-lg bg-[var(--accent-primary)] text-white dark:bg-[var(--accent-primary)] dark:text-black px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            ⏱️ Start Focus Session
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-card h-full">
      <div className="dashboard-card-header">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          Focus This Week
        </h2>
        <span className="text-xs font-semibold text-[var(--text-primary)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-lg">
          {totalHours.toFixed(1)}h
        </span>
      </div>

      <div className="flex-1 p-4 min-h-0 flex flex-col">
        <div className="h-[160px] flex-shrink-0 flex items-end gap-2">
          {byDay.map((d, i) => (
            <div
              key={d.dateStr}
              className="flex-1 flex flex-col items-center gap-2 group relative"
            >
              <div
                className="w-full rounded-t-md transition-all duration-200 hover:brightness-110 min-h-[4px]"
                style={{
                  height: `${Math.max(4, (d.hours / maxHours) * 100)}%`,
                  background: `linear-gradient(to bottom, ${BAR_COLOR}, ${BAR_COLOR}b3)`,
                  boxShadow: d.isToday ? `0 0 12px ${BAR_COLOR}40` : undefined,
                }}
                title={`${d.label}: ${d.hours.toFixed(1)} hrs • ${d.sessions} sessions`}
              />
              <span
                className={cn(
                  "text-xs font-medium",
                  d.isToday
                    ? "text-[var(--text-primary)] font-semibold"
                    : "text-[var(--text-secondary)]",
                )}
              >
                {typeof window !== "undefined" && window.innerWidth < 640
                  ? d.labelShort
                  : d.label}
              </span>
              {d.isToday && (
                <span className="absolute -top-4 left-1/2 -translate-x-1/2 text-[10px] text-[var(--text-tertiary)]">
                  ↑ Today
                </span>
              )}
            </div>
          ))}
        </div>

        {mostProductive && mostProductive.hours > 0 && (
          <div className="mt-3 p-2.5 rounded-lg bg-[var(--bg-tertiary)] text-xs text-[var(--text-secondary)]">
            💡 Your most productive day: {mostProductive.label} (
            {mostProductive.hours.toFixed(1)} hrs)
          </div>
        )}
      </div>
    </div>
  );
}
