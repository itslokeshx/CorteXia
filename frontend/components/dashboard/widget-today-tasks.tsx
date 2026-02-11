"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, Play } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Task } from "@/lib/types";
import { format, parseISO, isToday } from "date-fns";

const PRIORITY_COLORS: Record<string, string> = {
  critical: "#ef4444",
  high: "#f59e0b",
  medium: "#fbbf24",
  low: "#10b981",
};

function formatDueTime(task: Task, today: string): string {
  if (task.dueDate && task.dueDate < today) return "Overdue";
  if (task.dueTime) {
    try {
      const [h, m] = task.dueTime.split(":").map(Number);
      const d = new Date();
      d.setHours(h, m, 0, 0);
      return format(d, "h:mm a");
    } catch {
      return "Today";
    }
  }
  if (task.dueDate === today) return "Today";
  if (task.dueDate) return "EOD";
  return "—";
}

function getMetadata(task: Task, today: string): string {
  if (task.status === "completed" && task.completedAt) {
    const completed = task.completedAt.slice(0, 16);
    try {
      const d = parseISO(completed);
      const mins = Math.round((Date.now() - d.getTime()) / 60000);
      if (mins < 60) return `✓ Completed ${mins}m ago`;
      const hours = Math.floor(mins / 60);
      return `✓ Completed ${hours}h ago`;
    } catch {
      return "✓ Completed";
    }
  }
  if (task.timeEstimate) return `${task.timeEstimate} minutes`;
  if (task.recurrence) return "Recurring";
  if (task.status === "blocked") return "Blocked • Waiting on team";
  if (task.dueDate === today && task.dueTime) {
    try {
      const [h, m] = task.dueTime.split(":").map(Number);
      const due = new Date();
      due.setHours(h, m, 0, 0);
      const mins = Math.round((due.getTime() - Date.now()) / 60000);
      if (mins <= 0) return "Overdue";
      if (mins < 60) return `Due in ${mins} minutes`;
      return `Due in ${Math.floor(mins / 60)}h ${mins % 60}m`;
    } catch {
      return "Today";
    }
  }
  return "";
}

export function WidgetTodayTasks({
  tasks,
  completedToday,
  onToggle,
}: {
  tasks: Task[];
  completedToday: Task[];
  onToggle: (id: string) => void;
}) {
  const router = useRouter();
  const today = new Date().toISOString().split("T")[0];
  const all = [...tasks, ...completedToday];
  const displayList = all.slice(0, 3);

  return (
    <div className="dashboard-card h-full">
      <div className="dashboard-card-header">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          Today's Tasks
        </h2>
        <span className="text-xs font-medium text-[var(--text-secondary)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-lg">
          {all.length} tasks
        </span>
      </div>

      <div className="dashboard-card-body scrollbar-thin">
        {displayList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center mb-3">
              <span className="text-2xl">📝</span>
            </div>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              No tasks scheduled for today
            </p>
            <Link
              href="/tasks"
              className={cn(
                "inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition-all",
                "bg-[var(--accent-primary)] text-white dark:bg-[var(--accent-primary)] dark:text-black",
                "hover:opacity-90 hover:scale-[1.02]",
              )}
            >
              Create Task
            </Link>
          </div>
        ) : (
          displayList.map((task) => {
            const isCompleted = task.status === "completed";
            const overdue = task.dueDate ? task.dueDate < today : false;
            const timeStr = formatDueTime(task, today);
            const meta = getMetadata(task, today);
            return (
              <div
                key={task.id}
                role="button"
                tabIndex={0}
                onClick={() => onToggle(task.id)}
                onKeyDown={(e) => e.key === "Enter" && onToggle(task.id)}
                className={cn(
                  "group flex items-start gap-3 px-4 py-2.5 border-b border-[var(--border-subtle)] cursor-pointer transition-colors hover:bg-[var(--bg-tertiary)]",
                  isCompleted && "opacity-60",
                )}
              >
                <div className="flex-shrink-0 mt-0.5">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-[#10b981]" />
                  ) : (
                    <div
                      className="w-5 h-5 rounded-md border-2 border-[var(--color-border)] hover:border-[var(--text-secondary)] transition-colors"
                      style={{ borderRadius: "6px" }}
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        isCompleted && "opacity-50",
                      )}
                      style={{
                        backgroundColor: isCompleted
                          ? "var(--text-tertiary)"
                          : PRIORITY_COLORS[task.priority] ?? "var(--text-tertiary)",
                      }}
                    />
                    <span
                      className={cn(
                        "text-[15px] font-medium text-[var(--text-primary)] truncate",
                        isCompleted && "line-through",
                      )}
                    >
                      {task.title}
                    </span>
                  </div>
                  {meta && (
                    <p className="text-[13px] text-[var(--text-tertiary)] mt-0.5">
                      {meta}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      overdue && !isCompleted
                        ? "text-[#ef4444]"
                        : "text-[var(--text-secondary)]",
                    )}
                  >
                    {timeStr}
                  </span>
                  {!isCompleted && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/time-tracker?taskId=${task.id}`);
                      }}
                      className="p-1 rounded hover:bg-[var(--bg-tertiary)] opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                      aria-label="Start timer"
                    >
                      <Play className="w-3.5 h-3.5 text-[var(--text-tertiary)]" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {all.length > 0 && (
        <div className="dashboard-card-footer flex justify-end">
          <Link
            href="/tasks"
            className="text-sm font-medium text-[#3b82f6] hover:underline inline-flex items-center gap-1 transition-transform hover:translate-x-0.5"
          >
            View all tasks
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      )}
    </div>
  );
}
