"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import type { JournalEntry } from "@/lib/types";

const MOOD_EMOJI: Record<number, string> = {
  1: "😔",
  2: "😔",
  3: "😐",
  4: "😐",
  5: "😐",
  6: "😊",
  7: "😊",
  8: "😊",
  9: "😊",
  10: "😊",
};
const ENERGY_LABEL: Record<number, string> = {
  1: "Low",
  2: "Low",
  3: "Low",
  4: "Medium",
  5: "Medium",
  6: "Medium",
  7: "High",
  8: "High",
  9: "High",
  10: "High",
};

const STARTER_QUESTIONS = [
  "What went well today?",
  "What challenged you?",
  "What are you grateful for?",
  "What will you do differently tomorrow?",
  "Who made you smile today?",
];

export function WidgetJournalPrompt({
  todayEntry,
  journalStreakDays = 0,
}: {
  todayEntry: JournalEntry | null;
  journalStreakDays?: number;
}) {
  const hasEntry = todayEntry && (todayEntry.content?.trim().length ?? 0) > 0;
  const preview = hasEntry
    ? todayEntry.content!.slice(0, 160) + (todayEntry.content!.length > 160 ? "…" : "")
    : "";
  const mood = todayEntry?.mood ?? 0;
  const energy = todayEntry?.energy ?? 0;

  return (
    <div className="dashboard-card h-full bg-[var(--color-bg-tertiary)]">
      <div className="dashboard-card-header bg-[var(--color-bg-tertiary)]">
        <h2 className="text-base font-semibold text-[var(--text-primary)]">
          Reflection
        </h2>
        <div className="flex items-center gap-2">
          {journalStreakDays >= 3 && (
            <span
              className="text-[11px] font-medium px-2 py-0.5 rounded-lg"
              style={{ backgroundColor: "rgba(16, 185, 129, 0.08)", color: "#10b981" }}
            >
              🔥 {journalStreakDays}d
            </span>
          )}
          <span className="text-base">📖</span>
        </div>
      </div>

      <div className="flex-1 p-4 min-h-0 overflow-y-auto">
        {hasEntry ? (
          <>
            <p className="text-[15px] font-normal text-[var(--text-primary)] leading-relaxed italic line-clamp-3">
              "{preview}"
            </p>
            {(mood > 0 || energy > 0) && (
              <p className="text-[13px] font-medium text-[var(--text-secondary)] mt-3">
                {mood > 0 && (
                  <span>
                    {MOOD_EMOJI[mood] ?? "😐"} Mood:{" "}
                    {mood <= 4 ? "Low" : mood <= 7 ? "Okay" : "Great"}
                  </span>
                )}
                {mood > 0 && energy > 0 && " · "}
                {energy > 0 && (
                  <span>⚡ Energy: {ENERGY_LABEL[energy] ?? "—"}</span>
                )}
              </p>
            )}
            <div
              className="w-[40%] h-px bg-[var(--border-subtle)] my-4"
              style={{ minWidth: "80px" }}
            />
            <div className="flex flex-wrap gap-3">
              <Link
                href="/journal"
                className="text-sm font-medium text-[#3b82f6] hover:underline inline-flex items-center gap-1.5"
              >
                ✏️ Continue writing
              </Link>
              <Link
                href="/journal#insights"
                className="text-sm font-medium text-[#3b82f6] hover:underline inline-flex items-center gap-1.5"
              >
                📊 View insights
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="text-base font-medium text-[var(--text-primary)] text-center mt-6 mb-5">
              What's on your mind today?
            </p>
            <p className="text-sm text-[var(--text-secondary)] mb-2">
              A few questions to get started:
            </p>
            <ul className="text-sm text-[var(--text-tertiary)] leading-relaxed space-y-1 list-none pl-0">
              {STARTER_QUESTIONS.slice(0, 3).map((q, i) => (
                <li key={i}>• {q}</li>
              ))}
            </ul>
            <div className="mt-6">
              <Link
                href="/journal"
                className={cn(
                  "inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-semibold transition-all",
                  "bg-[var(--accent-primary)] text-white dark:bg-[var(--accent-primary)] dark:text-black",
                  "hover:opacity-90 hover:scale-[1.02]",
                )}
              >
                ✏️ Write today's entry
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
