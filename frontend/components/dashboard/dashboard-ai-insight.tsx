"use client";

type SummaryContext = {
  completedTaskTitles: string[];
  completedHabitNames: string[];
  habitStreak: number;
  focusMinutes: number;
  overdueCount: number;
  pendingTaskCount: number;
  hour: number;
};

function generateSummary(ctx: SummaryContext): string[] {
  const { completedTaskTitles, completedHabitNames, habitStreak, focusMinutes, overdueCount, pendingTaskCount, hour } = ctx;
  const taskCount = completedTaskTitles.length;
  const habitCount = completedHabitNames.length;
  const totalDone = taskCount + habitCount;
  const isLate = hour >= 22 || hour < 5;

  const lines: string[] = [];

  // Line 1: What they did
  const activityParts: string[] = [];
  if (taskCount > 0) {
    if (taskCount === 1) activityParts.push(`1 task: ${completedTaskTitles[0]}`);
    else if (taskCount <= 3) activityParts.push(`${taskCount} tasks: ${completedTaskTitles.join(", ")}`);
    else activityParts.push(`${taskCount} tasks: ${completedTaskTitles.slice(0, 2).join(", ")} and ${taskCount - 2} more`);
  }
  if (habitCount > 0) {
    if (habitCount === 1)
      activityParts.push(habitStreak >= 3 ? `${completedHabitNames[0]} (${habitStreak}-day streak)` : completedHabitNames[0]);
    else activityParts.push(`${habitCount} habits: ${completedHabitNames.join(", ")}`);
  }
  if (focusMinutes >= 25) {
    const hrs = Math.floor(focusMinutes / 60);
    const mins = focusMinutes % 60;
    const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
    activityParts.push(`${timeStr} focus`);
  }
  if (activityParts.length > 0) {
    lines.push(totalDone > 0 ? `Today: ${activityParts.join(". ")}.` : "A quiet start.");
  } else {
    lines.push(isLate ? "The day began slowly." : "A quiet start.");
  }

  // Line 2: Context / reflection
  if (totalDone === 0) {
    if (overdueCount > 0) lines.push(`${overdueCount} overdue — one step forward could shift the day.`);
    else if (pendingTaskCount > 0) lines.push("There's still time to move one task forward.");
    else lines.push("Showing up counts.");
  } else if (totalDone >= 3) {
    lines.push("Solid day of progress.");
  } else if (pendingTaskCount > 0) {
    lines.push(`${pendingTaskCount} pending. Steady momentum.`);
  } else {
    lines.push("You showed up — that's progress.");
  }

  // Line 3: Insight / nudge
  if (totalDone === 0 && (overdueCount > 0 || pendingTaskCount > 0)) {
    lines.push("One focused action could turn today around.");
  } else if (totalDone >= 3) {
    lines.push("Keep the rhythm going.");
  } else if (habitCount > 0 && taskCount === 0 && pendingTaskCount > 0) {
    lines.push("One task could seal it.");
  } else {
    lines.push("There's still time to move forward.");
  }

  return lines.slice(0, 3);
}

export function DashboardDailySummary({
  completedTaskTitles,
  completedHabitNames,
  habitStreak,
  focusMinutes,
  overdueCount,
  pendingTaskCount,
}: {
  completedTaskTitles: string[];
  completedHabitNames: string[];
  habitStreak?: number;
  focusMinutes?: number;
  overdueCount?: number;
  pendingTaskCount?: number;
}) {
  const lines = generateSummary({
    completedTaskTitles,
    completedHabitNames,
    habitStreak: habitStreak ?? 0,
    focusMinutes: focusMinutes ?? 0,
    overdueCount: overdueCount ?? 0,
    pendingTaskCount: pendingTaskCount ?? 0,
    hour: new Date().getHours(),
  });

  return (
    <section className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5 sm:p-6">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-3">
        AI Insight
      </h2>
      <div className="space-y-1.5">
        {lines.map((line, i) => (
          <p key={i} className="text-sm text-[var(--text-secondary)] leading-relaxed">
            {line}
          </p>
        ))}
      </div>
    </section>
  );
}
