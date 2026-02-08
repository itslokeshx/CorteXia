"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type UpcomingBlock = {
  id: string;
  title: string;
  startTime: string; // "2:00 PM"
  endTime: string;
  type: string;
  description?: string;
  isCurrent: boolean;
  statusLabel: string; // "→ Current (in progress)" or "Starts in X minutes"
  accentColor: string;
};

const TYPE_LABELS: Record<string, string> = {
  task: "FOCUS",
  deep_work: "FOCUS",
  shallow_work: "WORK",
  meeting: "MEETING",
  habit: "PERSONAL",
  personal: "PERSONAL",
  break: "BREAK",
  blocked: "BLOCKED",
};

const TYPE_COLORS: Record<string, string> = {
  task: "#6b7280",
  deep_work: "#6b7280",
  shallow_work: "#6b7280",
  meeting: "#3b82f6",
  habit: "#10b981",
  personal: "#10b981",
  break: "#ec4899",
  blocked: "#ef4444",
};

function formatTime12(hour: number, minute: number): string {
  const h = hour % 12 || 12;
  const m = minute.toString().padStart(2, "0");
  const ampm = hour < 12 ? "AM" : "PM";
  return `${h}:${m} ${ampm}`;
}

function getMinutesSinceMidnight(): number {
  const d = new Date();
  return d.getHours() * 60 + d.getMinutes();
}

export function WidgetNextUp({
  blocks,
  emptyMessage = "Schedule is clear",
  subMessage = "Enjoy your free time!",
}: {
  blocks: UpcomingBlock[];
  emptyMessage?: string;
  subMessage?: string;
}) {
  const displayList = blocks.slice(0, 2);

  return (
    <div className="dashboard-card h-full">
      <div className="dashboard-card-header">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          Next Up
        </h2>
      </div>

      <div className="dashboard-card-body scrollbar-thin">
        {displayList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <span className="text-4xl mb-3">✨</span>
            <p className="text-base text-[var(--text-secondary)]">
              {emptyMessage}
            </p>
            <p className="text-sm text-[var(--text-tertiary)] mt-1">
              {subMessage}
            </p>
            <Link
              href="/day-planner"
              className="mt-4 inline-flex items-center justify-center rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              + Add time block
            </Link>
          </div>
        ) : (
          displayList.map((block) => (
            <Link
              key={block.id}
              href="/day-planner"
              className={cn(
                "block relative pl-5 pr-4 py-3 border-b border-[var(--border-subtle)] transition-colors hover:bg-[var(--bg-tertiary)]",
                block.isCurrent && "dashboard-pulse",
              )}
              style={{
                borderLeftWidth: "4px",
                borderLeftColor: block.accentColor,
                ...(block.isCurrent
                  ? {
                      background: `linear-gradient(to right, ${block.accentColor}0D, transparent)`,
                      boxShadow: `0 0 0 2px ${block.accentColor}1A`,
                    }
                  : {}),
              }}
            >
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {block.startTime} – {block.endTime}
              </p>
              <div className="flex items-center justify-between gap-2 mt-1">
                <p className="text-base font-medium text-[var(--text-primary)]">
                  {block.title}
                </p>
                <span
                  className="text-[11px] font-bold uppercase tracking-wider px-2 py-1 rounded-md flex-shrink-0"
                  style={{
                    color: block.accentColor,
                    backgroundColor: `${block.accentColor}1A`,
                  }}
                >
                  {block.type}
                </span>
              </div>
              {block.description && (
                <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-1">
                  {block.description}
                </p>
              )}
              <p
                className={cn(
                  "text-[13px] font-medium mt-2",
                  block.isCurrent ? "text-[#10b981]" : "text-[var(--text-tertiary)]",
                )}
              >
                {block.statusLabel}
              </p>
            </Link>
          ))
        )}
      </div>

      {blocks.length > 0 && (
        <div className="dashboard-card-footer flex justify-end">
          <Link
            href="/day-planner"
            className="text-sm font-medium text-[#3b82f6] hover:underline inline-flex items-center gap-1 transition-transform hover:translate-x-0.5"
          >
            View full schedule
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

export function buildUpcomingBlocksFromPlanner(
  plannerBlocks: Array<{
    id: string;
    title: string;
    date: string;
    type: string;
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
    notes?: string;
    completed?: boolean;
  }>,
  today: string,
): UpcomingBlock[] {
  const now = getMinutesSinceMidnight();
  const withSort: (UpcomingBlock & { _startM: number })[] = [];
  for (const b of plannerBlocks) {
    if (b.date !== today || b.completed) continue;
    const startM = b.startHour * 60 + b.startMinute;
    const endM = b.endHour * 60 + b.endMinute;
    const isCurrent = now >= startM && now < endM;
    const isFuture = startM > now;
    if (!isCurrent && !isFuture) continue;
    let statusLabel: string;
    if (isCurrent) statusLabel = "→ Current (in progress)";
    else {
      const mins = startM - now;
      if (mins < 60) statusLabel = `Starts in ${mins} minutes`;
      else statusLabel = `Starts in ${Math.floor(mins / 60)}h ${mins % 60}m`;
    }
    withSort.push({
      id: b.id,
      title: b.title,
      startTime: formatTime12(b.startHour, b.startMinute),
      endTime: formatTime12(b.endHour, b.endMinute),
      type: TYPE_LABELS[b.type] || b.type.toUpperCase(),
      description: b.notes,
      isCurrent,
      statusLabel,
      accentColor: TYPE_COLORS[b.type] || "#6b7280",
      _startM: startM,
    });
  }
  withSort.sort((a, b) => {
    if (a.isCurrent) return -1;
    if (b.isCurrent) return 1;
    return a._startM - b._startM;
  });
  return withSort.map(({ _startM: _, ...x }) => x);
}
