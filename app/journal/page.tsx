"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  format,
  parseISO,
  subDays,
  eachDayOfInterval,
  isSameDay,
  startOfMonth,
  endOfMonth,
  getDay,
  addMonths,
  subMonths,
} from "date-fns";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Plus,
  PenTool,
  Trash2,
  Calendar,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Heart,
  Zap,
  Brain,
  Lightbulb,
  LayoutGrid,
  List,
  Search,
  RefreshCw,
} from "lucide-react";
import { useApp } from "@/lib/context/app-context";
import { cn } from "@/lib/utils";
import type { JournalEntry } from "@/lib/types";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// Mood emoji scale
const MOOD_SCALE = [
  { value: 1, emoji: "😢", label: "Terrible" },
  { value: 2, emoji: "😔", label: "Bad" },
  { value: 3, emoji: "😕", label: "Down" },
  { value: 4, emoji: "😐", label: "Meh" },
  { value: 5, emoji: "🙂", label: "Okay" },
  { value: 6, emoji: "😊", label: "Good" },
  { value: 7, emoji: "😄", label: "Great" },
  { value: 8, emoji: "😁", label: "Awesome" },
  { value: 9, emoji: "🤩", label: "Amazing" },
  { value: 10, emoji: "🥳", label: "Perfect" },
];

// Energy emoji scale
const ENERGY_SCALE = [
  { value: 1, emoji: "🪫", label: "Drained" },
  { value: 2, emoji: "😴", label: "Exhausted" },
  { value: 3, emoji: "🥱", label: "Tired" },
  { value: 4, emoji: "😶", label: "Low" },
  { value: 5, emoji: "🙂", label: "Neutral" },
  { value: 6, emoji: "😊", label: "Okay" },
  { value: 7, emoji: "💪", label: "Good" },
  { value: 8, emoji: "⚡", label: "Energized" },
  { value: 9, emoji: "🔥", label: "Pumped" },
  { value: 10, emoji: "🚀", label: "Unstoppable" },
];

// Focus emoji scale
const FOCUS_SCALE = [
  { value: 1, emoji: "🌀", label: "Scattered" },
  { value: 2, emoji: "😵", label: "Distracted" },
  { value: 3, emoji: "🤔", label: "Unfocused" },
  { value: 4, emoji: "😶", label: "Low" },
  { value: 5, emoji: "🙂", label: "Neutral" },
  { value: 6, emoji: "😊", label: "Okay" },
  { value: 7, emoji: "🎯", label: "Focused" },
  { value: 8, emoji: "🧘", label: "Clear" },
  { value: 9, emoji: "🔮", label: "Sharp" },
  { value: 10, emoji: "⭐", label: "Laser" },
];

// AI-generated journal prompts
const JOURNAL_PROMPTS = [
  "What are you grateful for today?",
  "What's one thing you learned recently?",
  "Describe a moment that made you smile this week.",
  "What challenge are you currently facing, and how might you overcome it?",
  "What would your future self thank you for doing today?",
  "What's something you've been putting off, and why?",
  "Describe your ideal day. What makes it perfect?",
  "What's a belief you held that has changed over time?",
  "Who inspires you right now, and why?",
  "What would you do if you knew you couldn't fail?",
  "What are you most proud of accomplishing recently?",
  "What does self-care look like for you today?",
  "What boundaries do you need to set or maintain?",
  "Describe a conversation you wish you could have.",
  "What's bringing you joy lately?",
];

// Get mood color based on value
const getMoodColor = (mood: number): string => {
  if (mood <= 3) return "#EF4444";
  if (mood <= 5) return "#F59E0B";
  if (mood <= 7) return "#3B82F6";
  return "#10B981";
};

// Get mood emoji
const getMoodEmoji = (mood: number) =>
  MOOD_SCALE.find((m) => m.value === mood) || MOOD_SCALE[4];

// Format relative date
const formatRelativeDate = (dateString: string): string => {
  const date = parseISO(dateString);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return format(date, "MMM d, yyyy");
};

// Calendar Month View Component
function CalendarView({
  entries,
  selectedDate,
  onSelectDate,
}: {
  entries: JournalEntry[];
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = subDays(monthStart, getDay(monthStart));
  const days = eachDayOfInterval({
    start: startDate,
    end:
      addMonths(monthEnd, 0) > endOfMonth(startDate)
        ? endOfMonth(startDate)
        : monthEnd,
  });

  // Extend to fill grid
  while (days.length < 35) {
    days.push(addMonths(days[days.length - 1] || startDate, 0));
  }

  // Create entry map for quick lookup
  const entryMap = useMemo(() => {
    const map = new Map<string, JournalEntry>();
    entries.forEach((entry) => {
      const dateStr = format(parseISO(entry.date), "yyyy-MM-dd");
      map.set(dateStr, entry);
    });
    return map;
  }, [entries]);

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-medium">{format(currentMonth, "MMMM yyyy")}</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-muted-foreground py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {weeks
          .flat()
          .slice(0, 35)
          .map((day, index) => {
            if (!day) return <div key={index} className="aspect-square" />;

            const dateStr = format(day, "yyyy-MM-dd");
            const entry = entryMap.get(dateStr);
            const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
            const isSelected = isSameDay(day, selectedDate);
            const isToday = isSameDay(day, new Date());

            return (
              <button
                key={index}
                onClick={() => onSelectDate(day)}
                className={cn(
                  "aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all text-sm",
                  !isCurrentMonth && "opacity-30",
                  isSelected && "ring-2 ring-violet-500",
                  isToday &&
                    !isSelected &&
                    "ring-1 ring-neutral-300 dark:ring-neutral-600",
                  entry
                    ? "bg-violet-50 dark:bg-violet-950/30"
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-800",
                )}
              >
                <span className={cn("text-xs", isToday && "font-bold")}>
                  {format(day, "d")}
                </span>
                {entry && (
                  <span
                    className="text-xs mt-0.5"
                    title={getMoodEmoji(entry.mood).label}
                  >
                    {getMoodEmoji(entry.mood).emoji}
                  </span>
                )}
              </button>
            );
          })}
      </div>
    </div>
  );
}

// Emoji Selector Component
function EmojiSelector({
  scale,
  value,
  onChange,
  label,
}: {
  scale: typeof MOOD_SCALE;
  value: number;
  onChange: (value: number) => void;
  label: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">
          {label}
        </label>
        <span className="text-lg">
          {scale.find((s) => s.value === value)?.emoji}
        </span>
      </div>
      <div className="flex justify-between gap-1">
        {scale.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange(item.value)}
            className={cn(
              "p-1.5 rounded-lg transition-all text-lg",
              value === item.value
                ? "bg-violet-100 dark:bg-violet-900/50 scale-110"
                : "hover:bg-neutral-100 dark:hover:bg-neutral-800 opacity-50 hover:opacity-100",
            )}
            title={item.label}
          >
            {item.emoji}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function JournalPage() {
  const { journalEntries, addJournalEntry, deleteJournalEntry } = useApp();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPrompt, setCurrentPrompt] = useState(JOURNAL_PROMPTS[0]);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    mood: 5,
    energy: 5,
    focus: 5,
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");

  // Filtered entries
  const filteredEntries = useMemo(() => {
    let filtered = [...journalEntries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (e) =>
          e.title?.toLowerCase().includes(query) ||
          e.content?.toLowerCase().includes(query) ||
          e.tags?.some((t) => t.toLowerCase().includes(query)),
      );
    }

    return filtered;
  }, [journalEntries, searchQuery]);

  // Entries for selected date (calendar view)
  const entriesForSelectedDate = useMemo(() => {
    return journalEntries.filter((e) =>
      isSameDay(parseISO(e.date), selectedDate),
    );
  }, [journalEntries, selectedDate]);

  // Stats
  const stats = useMemo(() => {
    const total = journalEntries.length;
    const greatDays = journalEntries.filter((e) => e.mood >= 8).length;
    const avgWords =
      total > 0
        ? Math.round(
            journalEntries.reduce(
              (sum, e) => sum + (e.content?.split(" ").length || 0),
              0,
            ) / total,
          )
        : 0;
    const avgMood =
      total > 0
        ? Math.round(
            (journalEntries.reduce((sum, e) => sum + e.mood, 0) / total) * 10,
          ) / 10
        : 5;

    // Streak calculation
    let streak = 0;
    const sortedEntries = [...journalEntries].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    const today = new Date();
    for (let i = 0; i < 365; i++) {
      const checkDate = format(subDays(today, i), "yyyy-MM-dd");
      const hasEntry = sortedEntries.some(
        (e) => format(parseISO(e.date), "yyyy-MM-dd") === checkDate,
      );
      if (hasEntry) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }

    return { total, greatDays, avgWords, avgMood, streak };
  }, [journalEntries]);

  // Generate new prompt
  const generateNewPrompt = () => {
    const available = JOURNAL_PROMPTS.filter((p) => p !== currentPrompt);
    setCurrentPrompt(available[Math.floor(Math.random() * available.length)]);
  };

  // Handle adding tags
  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput("");
    }
  };

  // Handle form submit
  const handleSubmit = () => {
    if (!formData.title.trim() && !formData.content.trim()) return;

    addJournalEntry({
      ...formData,
      title: formData.title || format(new Date(), "MMMM d, yyyy"),
      date: new Date().toISOString(),
    });

    setFormData({
      title: "",
      content: "",
      mood: 5,
      energy: 5,
      focus: 5,
      tags: [],
    });
    setDialogOpen(false);
  };

  return (
    <AppLayout>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6 pb-24"
      >
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-violet-500" />
              Journal
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {journalEntries.length} reflections •{" "}
              {stats.streak > 0
                ? `🔥 ${stats.streak} day streak`
                : "Start your streak today"}
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white border-0">
                <Plus className="h-4 w-4" />
                New Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>New Journal Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                {/* AI Prompt */}
                <div className="p-3 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400 text-sm font-medium">
                      <Lightbulb className="h-4 w-4" />
                      Today's Prompt
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={generateNewPrompt}
                    >
                      <RefreshCw className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="text-sm text-violet-700 dark:text-violet-300">
                    {currentPrompt}
                  </p>
                </div>

                <Input
                  placeholder="Entry title (optional)"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className="text-base"
                />
                <Textarea
                  placeholder="Write your thoughts..."
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  rows={6}
                  className="resize-none"
                />

                {/* Mood/Energy/Focus Selectors */}
                <div className="space-y-4">
                  <EmojiSelector
                    scale={MOOD_SCALE}
                    value={formData.mood}
                    onChange={(v) => setFormData({ ...formData, mood: v })}
                    label="How are you feeling?"
                  />
                  <EmojiSelector
                    scale={ENERGY_SCALE}
                    value={formData.energy}
                    onChange={(v) => setFormData({ ...formData, energy: v })}
                    label="Energy level"
                  />
                  <EmojiSelector
                    scale={FOCUS_SCALE}
                    value={formData.focus}
                    onChange={(v) => setFormData({ ...formData, focus: v })}
                    label="Focus level"
                  />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Tags
                  </label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), handleAddTag())
                      }
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddTag}
                    >
                      Add
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {formData.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              tags: formData.tags.filter((t) => t !== tag),
                            })
                          }
                        >
                          #{tag} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <Button onClick={handleSubmit} className="w-full">
                  Save Entry
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 sm:grid-cols-5 gap-3"
        >
          <div className="p-4 rounded-xl bg-violet-50 dark:bg-violet-950/20 border border-violet-200 dark:border-violet-800">
            <div className="flex items-center gap-2 mb-1">
              <BookOpen className="h-4 w-4 text-violet-500" />
            </div>
            <div className="text-2xl font-semibold text-violet-600 dark:text-violet-400">
              {stats.total}
            </div>
            <div className="text-xs text-violet-600 dark:text-violet-400">
              Total Entries
            </div>
          </div>
          <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-semibold text-green-600 dark:text-green-400">
              {stats.greatDays}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">
              Great Days
            </div>
          </div>
          <div className="p-4 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-4 w-4 text-orange-500" />
            </div>
            <div className="text-2xl font-semibold text-orange-600 dark:text-orange-400">
              {stats.streak}
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400">
              Day Streak
            </div>
          </div>
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-1">
              <Brain className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
              {stats.avgWords}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              Avg Words
            </div>
          </div>
          <div className="p-4 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2 mb-1">
              {getMoodEmoji(Math.round(stats.avgMood)).emoji}
            </div>
            <div className="text-2xl font-semibold">{stats.avgMood}/10</div>
            <div className="text-xs text-muted-foreground">Avg Mood</div>
          </div>
        </motion.div>

        {/* View Controls */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="gap-2"
            >
              <List className="h-4 w-4" />
              List
            </Button>
            <Button
              variant={viewMode === "calendar" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("calendar")}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              Calendar
            </Button>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div variants={itemVariants}>
          {viewMode === "calendar" ? (
            <div className="grid md:grid-cols-2 gap-6">
              <CalendarView
                entries={journalEntries}
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
              />
              <div className="space-y-4">
                <h3 className="font-medium">
                  {format(selectedDate, "MMMM d, yyyy")}
                  {isSameDay(selectedDate, new Date()) && (
                    <span className="text-violet-500 ml-2">Today</span>
                  )}
                </h3>
                {entriesForSelectedDate.length === 0 ? (
                  <div className="text-center py-8 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-dashed border-neutral-200 dark:border-neutral-800">
                    <PenTool className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground text-sm">
                      No entries for this day
                    </p>
                    {isSameDay(selectedDate, new Date()) && (
                      <Button
                        variant="link"
                        onClick={() => setDialogOpen(true)}
                        className="mt-2"
                      >
                        Write today's entry
                      </Button>
                    )}
                  </div>
                ) : (
                  entriesForSelectedDate.map((entry) => (
                    <EntryCard
                      key={entry.id}
                      entry={entry}
                      isSelected={selectedEntry?.id === entry.id}
                      onSelect={() => setSelectedEntry(entry)}
                      onDelete={() => {
                        deleteJournalEntry(entry.id);
                        if (selectedEntry?.id === entry.id)
                          setSelectedEntry(null);
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Entry List */}
              <div className="space-y-4">
                <h3 className="font-medium">Recent Entries</h3>
                {filteredEntries.length === 0 ? (
                  <div className="text-center py-12 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-dashed border-neutral-200 dark:border-neutral-800">
                    <PenTool className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground mb-4">
                      {searchQuery
                        ? "No entries match your search"
                        : "No journal entries yet"}
                    </p>
                    {!searchQuery && (
                      <Button
                        onClick={() => setDialogOpen(true)}
                        variant="outline"
                      >
                        Write your first entry
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredEntries.map((entry) => (
                      <EntryCard
                        key={entry.id}
                        entry={entry}
                        isSelected={selectedEntry?.id === entry.id}
                        onSelect={() => setSelectedEntry(entry)}
                        onDelete={() => {
                          deleteJournalEntry(entry.id);
                          if (selectedEntry?.id === entry.id)
                            setSelectedEntry(null);
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Entry Detail */}
              <div>
                <h3 className="font-medium mb-4">
                  {selectedEntry
                    ? selectedEntry.title || "Untitled Entry"
                    : "Entry Preview"}
                </h3>
                {selectedEntry ? (
                  <EntryDetail entry={selectedEntry} />
                ) : (
                  <div className="text-center py-12 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                    <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      Select an entry to view details
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AppLayout>
  );
}

// Entry Card Component
function EntryCard({
  entry,
  isSelected,
  onSelect,
  onDelete,
}: {
  entry: JournalEntry;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const moodInfo = getMoodEmoji(entry.mood);

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "p-4 rounded-xl cursor-pointer transition-all border",
        isSelected
          ? "bg-violet-50 dark:bg-violet-950/30 border-violet-500"
          : "bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-violet-500/50",
      )}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
          style={{ backgroundColor: `${getMoodColor(entry.mood)}20` }}
        >
          {moodInfo.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm truncate">
              {entry.title || "Untitled Entry"}
            </h4>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 flex-shrink-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
            {entry.content}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-muted-foreground">
              {formatRelativeDate(entry.date)}
            </span>
            <span
              className="text-[10px] px-1.5 py-0.5 rounded text-white"
              style={{ backgroundColor: getMoodColor(entry.mood) }}
            >
              {moodInfo.label}
            </span>
          </div>
          {entry.tags && entry.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-2">
              {entry.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-muted-foreground"
                >
                  #{tag}
                </span>
              ))}
              {entry.tags.length > 3 && (
                <span className="text-[10px] text-muted-foreground">
                  +{entry.tags.length - 3}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Entry Detail Component
function EntryDetail({ entry }: { entry: JournalEntry }) {
  const moodInfo = getMoodEmoji(entry.mood);
  const energyInfo =
    ENERGY_SCALE.find((e) => e.value === entry.energy) || ENERGY_SCALE[4];
  const focusInfo =
    FOCUS_SCALE.find((f) => f.value === entry.focus) || FOCUS_SCALE[4];

  return (
    <div className="p-6 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center gap-3 mb-3">
          <div
            className="h-10 w-10 rounded-full flex items-center justify-center text-xl"
            style={{ backgroundColor: `${getMoodColor(entry.mood)}20` }}
          >
            {moodInfo.emoji}
          </div>
          <div>
            <span
              className="text-xs px-2 py-1 rounded text-white"
              style={{ backgroundColor: getMoodColor(entry.mood) }}
            >
              {moodInfo.label}
            </span>
            <p className="text-xs text-muted-foreground mt-1">
              {format(parseISO(entry.date), "EEEE, MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        </div>
        <h2 className="text-xl font-semibold">
          {entry.title || "Untitled Entry"}
        </h2>
      </div>

      {/* Metrics */}
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-1.5">
          <span className="text-lg">{energyInfo.emoji}</span>
          <span className="text-muted-foreground">
            Energy: {entry.energy}/10
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-lg">{focusInfo.emoji}</span>
          <span className="text-muted-foreground">Focus: {entry.focus}/10</span>
        </div>
      </div>

      {/* Content */}
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <p className="text-muted-foreground whitespace-pre-line leading-relaxed">
          {entry.content}
        </p>
      </div>

      {/* Tags */}
      {entry.tags && entry.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {entry.tags.map((tag) => (
            <span
              key={tag}
              className="text-xs px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800 text-muted-foreground"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* AI Insights */}
      <div className="p-4 rounded-lg bg-violet-50 dark:bg-violet-950/30 border border-violet-200 dark:border-violet-800">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-violet-500" />
          <span className="text-sm font-medium text-violet-700 dark:text-violet-300">
            AI Insights
          </span>
        </div>
        <p className="text-sm text-violet-600 dark:text-violet-400">
          {entry.mood >= 7
            ? "You seem to be in a positive mindset! Your high mood correlates with productive days. Keep nurturing what's working."
            : entry.mood >= 5
              ? "A balanced day. Consider what small wins you can celebrate, and what might give you an extra boost tomorrow."
              : "It looks like today was challenging. Remember that difficult days are part of growth. Be kind to yourself and consider what self-care might help."}
        </p>
      </div>
    </div>
  );
}
