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
    <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-primary)]">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-medium text-[var(--color-text-secondary)]">
          Day progress
        </span>
        <span className="text-xs tabular-nums text-[var(--color-text-tertiary)]">
          {progress.time}
        </span>
      </div>
      <div className="w-full h-1.5 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
        <div
          className="h-full bg-[var(--color-text-primary)] rounded-full opacity-90 transition-[width] duration-1000"
          style={{ width: `${progress.pct}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-[var(--color-text-tertiary)]">12 AM</span>
        <span className="text-[10px] text-[var(--color-text-tertiary)]">
          {pct}% of day elapsed
        </span>
        <span className="text-[10px] text-[var(--color-text-tertiary)]">11:59 PM</span>
      </div>
    </div>
  );
}
