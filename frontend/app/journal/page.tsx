"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { useApp } from "@/lib/context/app-context";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  getDay,
  isToday,
} from "date-fns";
import {
  BookOpen,
  Sparkles,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  X,
  TrendingUp,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import type { JournalEntry } from "@/lib/types";

// ── Mood Config ──────────────────────────────────────────────────────────────
const MOOD_EMOJIS = [
  {
    value: 2,
    emoji: "😢",
    label: "Awful",
    bg: "bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/30 dark:to-red-800/20",
  },
  {
    value: 4,
    emoji: "😕",
    label: "Bad",
    bg: "bg-gradient-to-br from-orange-100 to-orange-200 dark:from-orange-900/30 dark:to-orange-800/20",
  },
  {
    value: 6,
    emoji: "😐",
    label: "Okay",
    bg: "bg-gradient-to-br from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/20",
  },
  {
    value: 8,
    emoji: "🙂",
    label: "Good",
    bg: "bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/20",
  },
  {
    value: 10,
    emoji: "😄",
    label: "Great",
    bg: "bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/20",
  },
];


export default function JournalPage() {
  const { journalEntries = [], addJournalEntry, deleteJournalEntry } = useApp();

  // ═══ STATE ═══════════════════════════════════════════════════════════════
  const [newEntry, setNewEntry] = useState({
    title: "",
    content: "",
    mood: 6,
    energy: 5,
    focus: 5,
    tags: "",
  });

  // Modal states
  const [showNewEntryModal, setShowNewEntryModal] = useState(false);
  const [expandedEntry, setExpandedEntry] = useState<JournalEntry | null>(null);

  // Calendar states
  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);


  // ═══ DERIVED DATA ════════════════════════════════════════════════════════
  const sortedEntries = useMemo(() => {
    return [...journalEntries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [journalEntries]);

  const filteredEntries = useMemo(() => {
    if (!selectedDay) return sortedEntries;
    return sortedEntries.filter((e) =>
      isSameDay(new Date(e.date), selectedDay),
    );
  }, [sortedEntries, selectedDay]);

  const stats = useMemo(() => {
    const total = journalEntries.length;
    const thisMonth = journalEntries.filter((e) =>
      isSameMonth(new Date(e.date), new Date()),
    ).length;
    let streak = 0;
    const sorted = [...journalEntries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    let checkDate = new Date();
    for (const entry of sorted) {
      if (isSameDay(new Date(entry.date), checkDate)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else break;
    }
    return { total, thisMonth, streak };
  }, [journalEntries]);

  const moodTrend = useMemo(() => {
    const result: Array<{ date: Date; label: string; mood: number | null }> =
      [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const entry = journalEntries.find((e) => isSameDay(new Date(e.date), d));
      result.push({
        date: d,
        label: format(d, "MM/dd"),
        mood: entry?.mood ?? null,
      });
    }
    return result;
  }, [journalEntries]);

  const moodAverage = useMemo(() => {
    const validMoods = moodTrend.filter((d) => d.mood !== null);
    if (validMoods.length === 0) return 5;
    return (
      validMoods.reduce((acc, d) => acc + (d.mood ?? 0), 0) / validMoods.length
    );
  }, [moodTrend]);

  // Calendar helpers
  const firstDayOfMonth = startOfMonth(calendarMonth);
  const lastDayOfMonth = endOfMonth(calendarMonth);
  const calendarDays = eachDayOfInterval({
    start: firstDayOfMonth,
    end: lastDayOfMonth,
  });
  const mondayOffset = (firstDayOfMonth.getDay() + 6) % 7;

  const entryDates = useMemo(() => {
    return new Set(
      journalEntries.map((e) => format(new Date(e.date), "yyyy-MM-dd")),
    );
  }, [journalEntries]);

  // ═══ HANDLERS ════════════════════════════════════════════════════════════
  const handleCreate = () => {
    if (!newEntry.title.trim() || !newEntry.content.trim()) return;
    addJournalEntry({
      title: newEntry.title.trim(),
      content: newEntry.content.trim(),
      mood: newEntry.mood,
      energy: newEntry.energy,
      focus: newEntry.focus,
      date: new Date().toISOString(),
      tags: newEntry.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
    setNewEntry({
      title: "",
      content: "",
      mood: 6,
      energy: 5,
      focus: 5,
      tags: "",
    });
    setShowNewEntryModal(false);
  };



  const getMoodConfig = (value: number) => {
    return MOOD_EMOJIS.reduce((prev, curr) =>
      Math.abs(curr.value - value) < Math.abs(prev.value - value) ? curr : prev,
    );
  };

  // ═══ RENDER ══════════════════════════════════════════════════════════════
  return (
    <AppLayout>
      <motion.div
        className="max-w-7xl mx-auto p-3 sm:p-4"
      >
        {/* ═══ HEADER ═══ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-0.5">
              Journal
            </h1>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              Capture thoughts, track emotions, reflect on your journey
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <BookOpen className="w-3 h-3 text-blue-500" />
              <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                {stats.total}
              </span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <TrendingUp className="w-3 h-3 text-purple-500" />
              <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                {stats.thisMonth}
              </span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
              <Flame className="w-3 h-3 text-orange-500" />
              <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                {stats.streak}d
              </span>
            </div>
            <Button
              size="sm"
              className="text-xs h-7 px-2"
              onClick={() => setShowNewEntryModal(true)}
            >
              <Sparkles className="w-3 h-3 mr-1" />
              New Entry
            </Button>
          </div>
        </div>

        {/* ═══ MAIN LAYOUT ═══ */}
        <div className="grid lg:grid-cols-5 gap-4">
          {/* ═══ LEFT: PAST ENTRIES (60%) ═══ */}
          <div className="lg:col-span-3 space-y-3">
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)] px-1">
              Past Entries
            </h2>

            <AnimatePresence mode="popLayout">
              {filteredEntries.map((entry) => {
                const moodConfig = getMoodConfig(entry.mood);
                return (
                  <motion.div
                    key={entry.id}
                    layout
                    onClick={() => setExpandedEntry(entry)}
                    className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-xl flex-shrink-0">
                          {moodConfig.emoji}
                        </span>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] break-words line-clamp-1">
                            {entry.title}
                          </h3>
                          <p className="text-xs text-[var(--color-text-tertiary)]">
                            {format(
                              new Date(entry.date),
                              "MMM d, yyyy 'at' h:mm a",
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedEntry(entry);
                          }}
                          className="p-1 rounded hover:bg-[var(--color-bg-tertiary)] transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Maximize2 className="w-3 h-3 text-[var(--color-text-tertiary)]" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteJournalEntry(entry.id);
                          }}
                          className="p-1 rounded hover:bg-[var(--color-bg-tertiary)] transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 mb-2 break-words">
                      {entry.content}
                    </p>

                    <div className="flex items-center gap-2 flex-wrap">
                      {entry.tags && entry.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {entry.tags.map((tag, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-1 ml-auto">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div
                              key={i}
                              className={cn(
                                "w-1 h-1 rounded-full",
                                i < entry.energy
                                  ? "bg-blue-500"
                                  : "bg-gray-300 dark:bg-gray-700",
                              )}
                            />
                          ))}
                        </div>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <div
                              key={i}
                              className={cn(
                                "w-1 h-1 rounded-full",
                                i < entry.focus
                                  ? "bg-purple-500"
                                  : "bg-gray-300 dark:bg-gray-700",
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {filteredEntries.length === 0 && (
              <div className="text-center py-12 text-[var(--color-text-tertiary)]">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium mb-0.5">
                  {selectedDay
                    ? "No entries for this day"
                    : "Your journal is empty"}
                </p>
                <p className="text-xs opacity-70">
                  Start writing to track your thoughts and emotions
                </p>
              </div>
            )}
          </div>

          {/* ═══ RIGHT: CALENDAR & INSIGHTS (40%) ═══ */}
          <div className="lg:col-span-2 space-y-4">
            {/* Calendar */}
            <div className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => setCalendarMonth((m) => subMonths(m, 1))}
                  className="p-0.5 rounded hover:bg-[var(--color-bg-tertiary)]"
                >
                  <ChevronLeft className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
                </button>
                <span className="text-xs font-medium text-[var(--color-text-primary)]">
                  {format(calendarMonth, "MMMM yyyy")}
                </span>
                <button
                  onClick={() => setCalendarMonth((m) => addMonths(m, 1))}
                  className="p-0.5 rounded hover:bg-[var(--color-bg-tertiary)]"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-0.5 mb-0.5">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div
                    key={d}
                    className="text-[9px] text-[var(--color-text-tertiary)] text-center"
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-0.5">
                {Array.from({ length: mondayOffset }).map((_, i) => (
                  <div key={`pad-${i}`} className="w-7 h-7" />
                ))}
                {calendarDays.map((day) => {
                  const dayStr = format(day, "yyyy-MM-dd");
                  const hasEntry = entryDates.has(dayStr);
                  const isCurrentMonth = isSameMonth(day, calendarMonth);
                  const isTodayDate = isToday(day);
                  const isSelected = selectedDay
                    ? isSameDay(selectedDay, day)
                    : false;

                  return (
                    <button
                      key={dayStr}
                      onClick={() =>
                        setSelectedDay((prev) =>
                          prev && isSameDay(prev, day) ? null : day,
                        )
                      }
                      className={cn(
                        "w-7 h-7 rounded text-[10px] flex items-center justify-center relative transition-colors",
                        isCurrentMonth
                          ? "text-[var(--color-text-primary)]"
                          : "text-[var(--color-text-tertiary)] opacity-50",
                        isTodayDate && "ring-1 ring-purple-500 font-bold",
                        isSelected && "bg-purple-100 dark:bg-purple-900/30",
                        !isSelected && "hover:bg-[var(--color-bg-tertiary)]",
                      )}
                    >
                      {format(day, "d")}
                      {hasEntry && (
                        <span className="w-0.5 h-0.5 rounded-full bg-purple-500 absolute bottom-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Mood Trend */}
            <div className="p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
              <h3 className="text-xs font-medium text-[var(--color-text-primary)] mb-2">
                Mood Trend (14d)
              </h3>
              <div className="relative h-16">
                <div
                  className="absolute left-0 right-0 border-t border-dashed border-[var(--color-text-tertiary)] opacity-20"
                  style={{ bottom: `${(moodAverage / 10) * 100}%` }}
                />
                <div className="flex items-end gap-[2px] h-full">
                  {moodTrend.map((day, i) => (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center h-full justify-end"
                    >
                      {day.mood !== null ? (
                        <motion.div
                          className={cn(
                            "w-full rounded-t-sm min-h-[3px]",
                            day.mood > 6
                              ? "bg-emerald-400"
                              : day.mood >= 4
                                ? "bg-amber-400"
                                : "bg-red-400",
                          )}
                        />
                      ) : (
                        <div className="w-full h-0.5 rounded-full bg-[var(--color-border)]" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* New Entry CTA */}
            <div className="p-4 rounded-lg border border-[var(--color-border)] bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 text-center">
              <div className="w-10 h-10 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center mx-auto mb-3 shadow-sm text-purple-500">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-1">
                Ready to reflect?
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] mb-3">
                Take a moment to capture your thoughts and feelings.
              </p>
              <Button
                size="sm"
                className="w-full text-xs h-8"
                onClick={() => setShowNewEntryModal(true)}
              >
                Write New Entry
              </Button>
            </div>
          </div>
        </div>

        {/* ═══ NEW ENTRY MODAL ═══ */}
        <Dialog open={showNewEntryModal} onOpenChange={setShowNewEntryModal}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base">New Journal Entry</DialogTitle>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <div>
                <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">
                  Title
                </label>
                <Input
                  value={newEntry.title}
                  onChange={(e) =>
                    setNewEntry((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Give your entry a title..."
                  className="text-sm h-8"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">
                  Content
                </label>
                <Textarea
                  value={newEntry.content}
                  onChange={(e) =>
                    setNewEntry((prev) => ({
                      ...prev,
                      content: e.target.value,
                    }))
                  }
                  placeholder="Write your thoughts..."
                  rows={8}
                  className="text-sm resize-none"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-2 block">
                  Mood
                </label>
                <div className="flex gap-2">
                  {MOOD_EMOJIS.map((m) => (
                    <button
                      key={m.value}
                      onClick={() =>
                        setNewEntry((prev) => ({ ...prev, mood: m.value }))
                      }
                      className={cn(
                        "flex-1 p-2 rounded-lg border-2 transition-all hover:scale-105",
                        newEntry.mood === m.value
                          ? "border-purple-500 shadow-md scale-105"
                          : "border-transparent hover:border-[var(--color-border)]",
                        m.bg,
                      )}
                    >
                      <div className="text-2xl mb-0.5">{m.emoji}</div>
                      <div className="text-[9px] font-medium text-[var(--color-text-primary)]">
                        {m.label}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-2 block">
                    Energy
                  </label>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() =>
                          setNewEntry((prev) => ({ ...prev, energy: i + 1 }))
                        }
                        className={cn(
                          "flex-1 h-8 rounded transition-all",
                          i < newEntry.energy
                            ? "bg-blue-500 hover:bg-blue-600"
                            : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600",
                        )}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-2 block">
                    Focus
                  </label>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() =>
                          setNewEntry((prev) => ({ ...prev, focus: i + 1 }))
                        }
                        className={cn(
                          "flex-1 h-8 rounded transition-all",
                          i < newEntry.focus
                            ? "bg-purple-500 hover:bg-purple-600"
                            : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600",
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">
                  Tags (comma-separated)
                </label>
                <Input
                  value={newEntry.tags}
                  onChange={(e) =>
                    setNewEntry((prev) => ({ ...prev, tags: e.target.value }))
                  }
                  placeholder="work, personal, reflection"
                  className="text-sm h-8"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-7"
                onClick={() => setShowNewEntryModal(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="text-xs h-7"
                onClick={handleCreate}
                disabled={!newEntry.title.trim() || !newEntry.content.trim()}
              >
                Save Entry
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ═══ EXPAND ENTRY MODAL ═══ */}
        <Dialog
          open={!!expandedEntry}
          onOpenChange={() => setExpandedEntry(null)}
        >
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {expandedEntry && (
              <>
                <DialogHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <DialogTitle className="text-base mb-1 break-words">
                        {expandedEntry.title}
                      </DialogTitle>
                      <p className="text-xs text-[var(--color-text-tertiary)]">
                        {format(
                          new Date(expandedEntry.date),
                          "MMMM d, yyyy 'at' h:mm a",
                        )}
                      </p>
                    </div>
                    <span className="text-3xl">
                      {getMoodConfig(expandedEntry.mood).emoji}
                    </span>
                  </div>
                </DialogHeader>

                <div className="space-y-3 py-2">
                  <div>
                    <p className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap break-words">
                      {expandedEntry.content}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[var(--color-border)]">
                    <div>
                      <label className="text-xs font-medium text-[var(--color-text-tertiary)] mb-1.5 block">
                        Energy
                      </label>
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "flex-1 h-6 rounded",
                              i < expandedEntry.energy
                                ? "bg-blue-500"
                                : "bg-gray-200 dark:bg-gray-700",
                            )}
                          />
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-[var(--color-text-tertiary)] mb-1.5 block">
                        Focus
                      </label>
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "flex-1 h-6 rounded",
                              i < expandedEntry.focus
                                ? "bg-purple-500"
                                : "bg-gray-200 dark:bg-gray-700",
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {expandedEntry.tags && expandedEntry.tags.length > 0 && (
                    <div className="pt-3 border-t border-[var(--color-border)]">
                      <label className="text-xs font-medium text-[var(--color-text-tertiary)] mb-1.5 block">
                        Tags
                      </label>
                      <div className="flex gap-1.5 flex-wrap">
                        {expandedEntry.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="text-xs px-2 py-1 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => setExpandedEntry(null)}
                  >
                    Close
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => {
                      deleteJournalEntry(expandedEntry.id);
                      setExpandedEntry(null);
                    }}
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Delete
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </AppLayout>
  );
}
