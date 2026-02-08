"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

function getDayProgress(): { pct: number; time: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  const pct = ((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100;
  return { pct: Math.min(100, Math.max(0, pct)), time: format(now, "h:mm a") };
}

export function DayProgress() {
  const [progress, setProgress] = useState(() => getDayProgress());

  useEffect(() => {
    const t = setInterval(() => setProgress(getDayProgress()), 60000);
    return () => clearInterval(t);
  }, []);

  const pct = Math.round(progress.pct);

  return (
    <div className="p-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] shadow-sm">
      <div className="flex items-end justify-between mb-4">
        <div>
          <span className="text-sm font-medium text-[var(--color-text-secondary)] block mb-1">
            Day Progress
          </span>
          <div className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">
            {pct}% <span className="text-sm font-normal text-[var(--color-text-tertiary)] ml-1">complete</span>
          </div>
        </div>
        <span className="text-xs font-medium px-2 py-1 rounded-md bg-[var(--color-bg-primary)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
          {progress.time}
        </span>
      </div>

      <div className="relative w-full h-2.5 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-pink-500 rounded-full transition-[width] duration-1000 ease-out shadow-[0_0_10px_rgba(168,85,247,0.4)]"
          style={{ width: `${progress.pct}%` }}
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
        <span>12 AM</span>
        <span>11:59 PM</span>
      </div>
    </div>
  );
}
