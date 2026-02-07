"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { useApp } from "@/lib/context/app-context";
import { useState, useMemo, useCallback } from "react";
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
  Plus,
  BookOpen,
  Sparkles,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

// ── Mood Emojis ──────────────────────────────────────────────────────────────
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
    bg: "bg-gradient-to-br from-yellow-100 to-yellow-200 dark:from-yellow-900/30 dark:to-yellow-800/20",
  },
  {
    value: 8,
    emoji: "🙂",
    label: "Good",
    bg: "bg-gradient-to-br from-green-100 to-green-200 dark:from-green-900/30 dark:to-green-800/20",
  },
  {
    value: 10,
    emoji: "😄",
    label: "Great",
    bg: "bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-900/30 dark:to-emerald-800/20",
  },
];

const getMoodEmoji = (mood: number) => {
  if (mood <= 2) return MOOD_EMOJIS[0];
  if (mood <= 4) return MOOD_EMOJIS[1];
  if (mood <= 6) return MOOD_EMOJIS[2];
  if (mood <= 8) return MOOD_EMOJIS[3];
  return MOOD_EMOJIS[4];
};

// ── Writing / Reflection Prompts ─────────────────────────────────────────────
const WRITING_PROMPTS = [
  "What are you grateful for today?",
  "What's one thing you learned today?",
  "What challenged you today, and how did you handle it?",
  "What made you smile today?",
  "What's something you want to improve tomorrow?",
  "Describe a moment today when you felt truly present.",
];

const REFLECTION_PROMPTS = [
  "If today were a chapter in your life story, what would you title it?",
  "What emotion surprised you today, and what triggered it?",
  "What would you tell your future self about this moment?",
  "Name one assumption you held today that turned out to be wrong.",
  "What small, unnoticed act of kindness did you witness or perform?",
  "What are you resisting right now, and what might happen if you let go?",
];

// ── Page Component ───────────────────────────────────────────────────────────
export default function JournalPage() {
  const { journalEntries, addJournalEntry, deleteJournalEntry } = useApp();

  // New-entry form state
  const [newEntry, setNewEntry] = useState({
    title: "",
    content: "",
    mood: 6,
    energy: 6,
    focus: 6,
    tags: "",
  });

  // Calendar state
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);

  // Reflection prompt index
  const [reflectionIdx, setReflectionIdx] = useState(() =>
    Math.floor(Math.random() * REFLECTION_PROMPTS.length),
  );

  // ── Derived data ─────────────────────────────────────────────────────────
  const entries = useMemo(() => {
    return (journalEntries || [])
      .slice()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [journalEntries]);

  const filteredEntries = useMemo(() => {
    if (!selectedDay) return entries;
    const dayStr = format(selectedDay, "yyyy-MM-dd");
    return entries.filter((e) => e.date === dayStr);
  }, [entries, selectedDay]);

  const stats = useMemo(() => {
    const total = entries.length;
    const now = new Date();
    const thisMonth = entries.filter((e) => {
      const d = new Date(e.date);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    }).length;

    // streak
    let streak = 0;
    for (let i = 0; i < 365; i++) {
      const dateStr = format(subDays(now, i), "yyyy-MM-dd");
      if (entries.some((e) => e.date === dateStr)) streak++;
      else break;
    }
    return { total, thisMonth, streak };
  }, [entries]);

  // Mood trend – last 14 days
  const moodTrend = useMemo(() => {
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStr = format(date, "yyyy-MM-dd");
      const dayEntries = entries.filter((e) => e.date === dateStr);
      const avgMood =
        dayEntries.length > 0
          ? dayEntries.reduce((s, e) => s + (e.mood || 5), 0) /
            dayEntries.length
          : null;
      days.push({
        date,
        label: format(date, "d"),
        dayLabel: format(date, "EEE"),
        mood: avgMood,
      });
    }
    return days;
  }, [entries]);

  const moodAverage = useMemo(() => {
    const withMood = moodTrend.filter((d) => d.mood !== null);
    if (withMood.length === 0) return 5;
    return (
      withMood.reduce((s, d) => s + (d.mood as number), 0) / withMood.length
    );
  }, [moodTrend]);

  // Calendar helpers
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    return days;
  }, [calendarMonth]);

  const entryDates = useMemo(() => {
    const set = new Set<string>();
    entries.forEach((e) => set.add(e.date));
    return set;
  }, [entries]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleCreate = useCallback(() => {
    if (!newEntry.content.trim()) return;
    const tags = newEntry.tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    addJournalEntry({
      title: newEntry.title || format(new Date(), "EEEE, MMMM d"),
      content: newEntry.content,
      mood: newEntry.mood,
      energy: newEntry.energy,
      focus: newEntry.focus,
      date: format(new Date(), "yyyy-MM-dd"),
      tags: tags.length > 0 ? tags : undefined,
    });
    setNewEntry({
      title: "",
      content: "",
      mood: 6,
      energy: 6,
      focus: 6,
      tags: "",
    });
  }, [newEntry, addJournalEntry]);

  const applyPrompt = (prompt: string) => {
    setNewEntry((prev) => ({
      ...prev,
      content: prev.content
        ? prev.content + "\n\n" + prompt + "\n"
        : prompt + "\n",
    }));
  };

  // Energy / Focus visual block helpers
  const energyLevel = Math.round(newEntry.energy / 2); // 1-5
  const focusLevel = Math.round(newEntry.focus / 2);

  // ── Calendar grid padding (start of week offset) ─────────────────────────
  const startDayOffset = getDay(startOfMonth(calendarMonth)); // 0=Sun
  const mondayOffset = startDayOffset === 0 ? 6 : startDayOffset - 1; // Mon-based

  // ── RENDER ───────────────────────────────────────────────────────────────
  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-0 pb-12"
      >
        {/* ─── Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Journal
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              {stats.total} entries · {stats.thisMonth} this month ·{" "}
              {stats.streak} day streak
            </p>
          </div>
          <Button
            onClick={() => {
              const el = document.getElementById("journal-content-textarea");
              el?.focus();
            }}
            className="gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-sm"
          >
            <Plus className="w-4 h-4" /> New Entry
          </Button>
        </div>

        {/* ─── Two-Column Layout ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* ═══ LEFT COLUMN (60%) ═══ */}
          <div className="lg:col-span-3 space-y-6">
            {/* ── New Entry Card ──────────────────────────────────────── */}
            <div className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
              <Input
                placeholder="Title your entry..."
                value={newEntry.title}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, title: e.target.value })
                }
                className="text-lg font-medium border-0 bg-transparent px-0 shadow-none focus-visible:ring-0 placeholder:text-[var(--color-text-tertiary)]"
              />

              <Textarea
                id="journal-content-textarea"
                placeholder="What's on your mind today?"
                value={newEntry.content}
                onChange={(e) =>
                  setNewEntry({ ...newEntry, content: e.target.value })
                }
                className="mt-3 min-h-[200px] text-base leading-relaxed border-0 bg-transparent px-0 shadow-none resize-none focus-visible:ring-0 placeholder:text-[var(--color-text-tertiary)]"
                style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}
              />

              {/* Mood Selector */}
              <div className="mt-4">
                <label className="text-sm font-medium text-[var(--color-text-secondary)] mb-2 block">
                  How are you feeling?
                </label>
                <div className="flex items-center gap-3">
                  {MOOD_EMOJIS.map((m) => {
                    const isSelected = newEntry.mood === m.value;
                    return (
                      <button
                        key={m.value}
                        onClick={() =>
                          setNewEntry({ ...newEntry, mood: m.value })
                        }
                        className={cn(
                          "flex flex-col items-center justify-center w-12 h-12 rounded-xl text-2xl transition-all duration-200",
                          m.bg,
                          isSelected
                            ? "ring-2 ring-purple-500 scale-110 shadow-md"
                            : "hover:scale-105 opacity-70 hover:opacity-100",
                        )}
                      >
                        {m.emoji}
                      </button>
                    );
                  })}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  {MOOD_EMOJIS.map((m) => (
                    <span
                      key={m.value}
                      className="w-12 text-center text-[10px] text-[var(--color-text-tertiary)]"
                    >
                      {m.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Energy & Focus Visual Blocks */}
              <div className="mt-4 grid grid-cols-2 gap-4">
                {/* Energy */}
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-1.5 mb-2">
                    Energy
                    <span className="text-xs text-[var(--color-text-tertiary)]">
                      {newEntry.energy}/10
                    </span>
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button
                        key={i}
                        onClick={() =>
                          setNewEntry({ ...newEntry, energy: i * 2 })
                        }
                        className={cn(
                          "w-full h-3 rounded-sm transition-colors",
                          i <= energyLevel
                            ? "bg-purple-500"
                            : "bg-gray-100 dark:bg-gray-800",
                        )}
                      />
                    ))}
                  </div>
                </div>
                {/* Focus */}
                <div>
                  <label className="text-sm font-medium text-[var(--color-text-secondary)] flex items-center gap-1.5 mb-2">
                    Focus
                    <span className="text-xs text-[var(--color-text-tertiary)]">
                      {newEntry.focus}/10
                    </span>
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button
                        key={i}
                        onClick={() =>
                          setNewEntry({ ...newEntry, focus: i * 2 })
                        }
                        className={cn(
                          "w-full h-3 rounded-sm transition-colors",
                          i <= focusLevel
                            ? "bg-blue-500"
                            : "bg-gray-100 dark:bg-gray-800",
                        )}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div className="mt-4">
                <Input
                  placeholder="Tags (comma-separated)..."
                  value={newEntry.tags}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, tags: e.target.value })
                  }
                  className="text-sm"
                />
              </div>

              {/* Save Button */}
              <Button
                onClick={handleCreate}
                disabled={!newEntry.content.trim()}
                className="w-full mt-4 rounded-xl bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white shadow-sm"
              >
                Save Entry
              </Button>
            </div>

            {/* ── Past Entries ─────────────────────────────────────────── */}
            <div>
              {selectedDay && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    Entries for {format(selectedDay, "MMM d, yyyy")}
                  </span>
                  <button
                    onClick={() => setSelectedDay(null)}
                    className="text-xs text-purple-500 hover:underline"
                  >
                    Show all
                  </button>
                </div>
              )}
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredEntries.map((entry) => {
                    const moodInfo = getMoodEmoji(entry.mood || 5);
                    return (
                      <motion.div
                        key={entry.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] hover:shadow-sm transition group"
                      >
                        {/* Row 1: Date + Mood emoji */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[var(--color-text-tertiary)]">
                            {format(new Date(entry.date), "MMM d, yyyy")}
                          </span>
                          <span className="text-lg">{moodInfo.emoji}</span>
                        </div>

                        {/* Row 2: Title */}
                        <h3 className="text-sm font-medium text-[var(--color-text-primary)] mt-1">
                          {entry.title ||
                            format(new Date(entry.date), "EEEE, MMMM d")}
                        </h3>

                        {/* Row 3: Content preview */}
                        <p className="text-xs text-[var(--color-text-tertiary)] line-clamp-2 mt-1">
                          {entry.content}
                        </p>

                        {/* Row 4: Tags */}
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {entry.tags.map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Row 5: Metrics mini bar + delete */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1 text-[10px] text-[var(--color-text-tertiary)]">
                              <span
                                className={cn(
                                  "w-2 h-2 rounded-full inline-block",
                                  (entry.mood || 5) >= 7
                                    ? "bg-emerald-500"
                                    : (entry.mood || 5) >= 5
                                      ? "bg-yellow-500"
                                      : "bg-red-500",
                                )}
                              />
                              Mood {entry.mood || 5}
                            </span>
                            {entry.energy != null && (
                              <span className="flex items-center gap-1 text-[10px] text-[var(--color-text-tertiary)]">
                                <span className="w-2 h-2 rounded-full inline-block bg-purple-500" />
                                Energy {entry.energy}
                              </span>
                            )}
                            {entry.focus != null && (
                              <span className="flex items-center gap-1 text-[10px] text-[var(--color-text-tertiary)]">
                                <span className="w-2 h-2 rounded-full inline-block bg-blue-500" />
                                Focus {entry.focus}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => deleteJournalEntry(entry.id)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {filteredEntries.length === 0 && (
                  <div className="text-center py-16 text-[var(--color-text-tertiary)]">
                    <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm font-medium mb-1">
                      {selectedDay
                        ? "No entries for this day"
                        : "Your journal is empty"}
                    </p>
                    <p className="text-xs">
                      Start writing to track your thoughts and emotions.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ═══ RIGHT COLUMN (40%) ═══ */}
          <div className="lg:col-span-2 space-y-6">
            {/* ── Mini Calendar ───────────────────────────────────────── */}
            <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
              {/* Month header */}
              <div className="flex items-center justify-between mb-3">
                <button
                  onClick={() => setCalendarMonth((m) => subMonths(m, 1))}
                  className="p-1 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                </button>
                <span className="text-sm font-medium text-[var(--color-text-primary)]">
                  {format(calendarMonth, "MMMM yyyy")}
                </span>
                <button
                  onClick={() => setCalendarMonth((m) => addMonths(m, 1))}
                  className="p-1 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-[var(--color-text-tertiary)]" />
                </button>
              </div>

              {/* Day-of-week headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                  <div
                    key={d}
                    className="text-[10px] text-[var(--color-text-tertiary)] text-center"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1">
                {/* leading blank cells */}
                {Array.from({ length: mondayOffset }).map((_, i) => (
                  <div key={`pad-${i}`} className="w-8 h-8" />
                ))}

                {calendarDays.map((day) => {
                  const dayStr = format(day, "yyyy-MM-dd");
                  const hasEntry = entryDates.has(dayStr);
                  const isCurrentMonth = isSameMonth(day, calendarMonth);
                  const isTodayDate = isToday(day);
                  const isSelected = selectedDay
                    ? isSameDay(day, selectedDay)
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
                        "w-8 h-8 rounded-lg text-xs flex flex-col items-center justify-center relative transition-colors",
                        isCurrentMonth
                          ? "text-[var(--color-text-primary)]"
                          : "text-[var(--color-text-tertiary)] opacity-50",
                        isTodayDate && "ring-2 ring-purple-500 font-bold",
                        isSelected && "bg-purple-100 dark:bg-purple-900/30",
                        !isSelected && "hover:bg-[var(--color-bg-tertiary)]",
                      )}
                    >
                      <span className="leading-none">{format(day, "d")}</span>
                      {hasEntry && (
                        <span className="w-1 h-1 rounded-full bg-purple-500 absolute bottom-1" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ── Mood Trend Chart ────────────────────────────────────── */}
            <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
              <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">
                Mood Trend
              </h3>
              <div className="relative h-20">
                {/* Average line */}
                <div
                  className="absolute left-0 right-0 border-t border-dashed border-[var(--color-text-tertiary)] opacity-30"
                  style={{ bottom: `${(moodAverage / 10) * 100}%` }}
                />
                <div className="flex items-end gap-[3px] h-full">
                  {moodTrend.map((day, i) => (
                    <div
                      key={i}
                      className="flex-1 flex flex-col items-center h-full justify-end"
                    >
                      {day.mood !== null ? (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${(day.mood / 10) * 100}%` }}
                          transition={{ duration: 0.4, delay: i * 0.03 }}
                          className={cn(
                            "w-full rounded-t-sm min-h-[4px]",
                            day.mood > 6
                              ? "bg-emerald-400"
                              : day.mood >= 4
                                ? "bg-amber-400"
                                : "bg-red-400",
                          )}
                        />
                      ) : (
                        <div className="w-full h-1 rounded-full bg-[var(--color-border)]" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              {/* Date labels */}
              <div className="flex gap-[3px] mt-1">
                {moodTrend.map((day, i) => (
                  <div key={i} className="flex-1 text-center">
                    <span
                      className="text-[9px] text-[var(--color-text-tertiary)] block"
                      style={{
                        transform: "rotate(-45deg)",
                        transformOrigin: "center",
                      }}
                    >
                      {day.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ── AI Reflection Prompt ────────────────────────────────── */}
            <div className="p-4 rounded-xl border border-[var(--color-border)] bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium text-[var(--color-text-primary)]">
                  Reflection Prompt
                </span>
              </div>
              <p className="text-sm italic text-[var(--color-text-secondary)] mb-3">
                {REFLECTION_PROMPTS[reflectionIdx]}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => applyPrompt(REFLECTION_PROMPTS[reflectionIdx])}
                >
                  Use this prompt
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-[var(--color-text-tertiary)]"
                  onClick={() =>
                    setReflectionIdx((i) => (i + 1) % REFLECTION_PROMPTS.length)
                  }
                >
                  Next →
                </Button>
              </div>
            </div>

            {/* ── Writing Prompts ─────────────────────────────────────── */}
            <div className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
              <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Writing Prompts
              </h3>
              <div className="space-y-0.5">
                {WRITING_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => applyPrompt(prompt)}
                    className="w-full text-left p-3 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-sm text-[var(--color-text-secondary)] cursor-pointer transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
}
