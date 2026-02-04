"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, PenTool, Trash2, Calendar, Sparkles } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/lib/context/app-context";

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  mood: string;
  tags: string[];
  aiSummary: string;
}

const SAMPLE_ENTRIES = [
  {
    id: "1",
    title: "Learning TypeScript",
    content: `Started learning TypeScript and it's becoming clearer with each day. 
    The type system is a game changer for maintaining large codebases.`,
    date: "1 week ago",
    mood: "great",
    tags: ["typescript", "programming", "growth"],
    aiSummary: "Began learning TypeScript, impressed by its type system.",
  },
  {
    id: "2",
    title: "Project Setbacks",
    content: `Faced some setbacks with the current project. 
    But instead of giving up, I took a step back, reassessed, and found a better approach.
    
    Realized that obstacles are opportunities to learn and improve.
    Cold shower in the morning helped reset my mindset.`,
    date: "2 days ago",
    mood: "difficult",
    tags: ["growth", "challenges", "resilience"],
    aiSummary:
      "Faced project setbacks but demonstrated resilience by reassessing approach and finding solutions.",
  },
];

const MOOD_COLORS = {
  great: "#10B981",
  good: "#3B82F6",
  neutral: "#F59E0B",
  difficult: "#EF4444",
};

const MOOD_LABELS = {
  great: "🌟 Great",
  good: "😊 Good",
  neutral: "😐 Neutral",
  difficult: "😔 Difficult",
};

export default function JournalPage() {
  const { journalEntries, addJournalEntry, deleteJournalEntry } = useApp();
  const [open, setOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    title: "",
    content: "",
    date: new Date().toISOString().split("T")[0],
    mood: 5,
    energy: 5,
    focus: 5,
  });

  const handleAddEntry = () => {
    if (newEntry.title.trim() && newEntry.content.trim()) {
      addJournalEntry(newEntry);
      setNewEntry({
        title: "",
        content: "",
        date: new Date().toISOString().split("T")[0],
        mood: 5,
        energy: 5,
        focus: 5,
      });
      setOpen(false);
    }
  };

  const getMoodEmoji = (mood: number) => {
    if (mood <= 3) return "😔";
    if (mood <= 5) return "😐";
    if (mood <= 7) return "🙂";
    if (mood <= 9) return "😊";
    return "🤩";
  };

  const [entries, setEntries] = useState(SAMPLE_ENTRIES);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6 pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Journal</h1>
            <p className="text-muted-foreground text-sm md:text-base mt-1">
              {entries.length} reflections this week
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-4 sm:mx-auto">
              <DialogHeader>
                <DialogTitle>New Journal Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Entry title"
                  value={newEntry.title}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, title: e.target.value })
                  }
                />
                <Textarea
                  placeholder="Write your thoughts..."
                  value={newEntry.content}
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, content: e.target.value })
                  }
                  rows={6}
                />
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      Mood (1-10)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={newEntry.mood}
                      onChange={(e) =>
                        setNewEntry({
                          ...newEntry,
                          mood: parseInt(e.target.value) || 5,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      Energy (1-10)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={newEntry.energy}
                      onChange={(e) =>
                        setNewEntry({
                          ...newEntry,
                          energy: parseInt(e.target.value) || 5,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      Focus (1-10)
                    </label>
                    <Input
                      type="number"
                      min="1"
                      max="10"
                      value={newEntry.focus}
                      onChange={(e) =>
                        setNewEntry({
                          ...newEntry,
                          focus: parseInt(e.target.value) || 5,
                        })
                      }
                    />
                  </div>
                </div>
                <Button onClick={handleAddEntry} className="w-full">
                  Save Entry
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="text-xs md:text-sm text-muted-foreground mb-1">
                Total Entries
              </div>
              <div className="text-2xl md:text-3xl font-bold text-primary">
                {entries.length}
              </div>
              <div className="text-[10px] md:text-xs text-muted-foreground mt-1">
                This week
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="text-xs md:text-sm text-muted-foreground mb-1">
                Great Days
              </div>
              <div className="text-2xl md:text-3xl font-bold text-emerald-500">
                {entries.filter((e) => e.mood === "great").length}
              </div>
              <div className="text-[10px] md:text-xs text-muted-foreground mt-1">
                Feeling excellent
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="text-xs md:text-sm text-muted-foreground mb-1">
                Avg Words
              </div>
              <div className="text-2xl md:text-3xl font-bold text-amber-500">
                {Math.round(
                  entries.reduce(
                    (sum, e) => sum + e.content.split(" ").length,
                    0,
                  ) / Math.max(1, entries.length),
                )}
              </div>
              <div className="text-[10px] md:text-xs text-muted-foreground mt-1">
                Per entry
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="text-xs md:text-sm text-muted-foreground mb-1">
                Mood
              </div>
              <div className="text-2xl md:text-3xl font-bold text-blue-500">
                😊
              </div>
              <div className="text-[10px] md:text-xs text-muted-foreground mt-1">
                Average mood
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Entries Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
          {/* Entry List */}
          <div className="space-y-3 md:space-y-4">
            <h2 className="text-base md:text-lg font-semibold">
              Recent Entries
            </h2>
            {entries.map((entry) => (
              <Card
                key={entry.id}
                className="border-border/50 cursor-pointer transition-all hover:shadow-md"
                onClick={() => setSelectedEntry(entry)}
              >
                <CardContent className="p-3 md:p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-3 h-3 md:w-4 md:h-4 rounded-full flex-shrink-0 mt-1"
                      style={{ backgroundColor: MOOD_COLORS[entry.mood] }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm md:text-base truncate">
                        {entry.title}
                      </h3>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2">
                        {entry.content}
                      </p>
                      <div className="flex items-center gap-2 mt-2 md:mt-3 flex-wrap">
                        <span className="text-[10px] md:text-xs text-muted-foreground">
                          {entry.date}
                        </span>
                        <span
                          className="text-[10px] md:text-xs px-2 py-0.5 rounded text-white"
                          style={{ backgroundColor: MOOD_COLORS[entry.mood] }}
                        >
                          {MOOD_LABELS[entry.mood]}
                        </span>
                      </div>
                      {entry.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-2">
                          {entry.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-[10px] md:text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Entry Detail or Welcome */}
          <div>
            <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4">
              {selectedEntry ? selectedEntry.title : "Start Writing"}
            </h2>
            {selectedEntry ? (
              <Card className="border-border/50">
                <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
                  {/* Header */}
                  <div className="pb-3 md:pb-4 border-b border-border">
                    <div className="flex items-center gap-2 mb-2 md:mb-3">
                      <div
                        className="w-3 h-3 md:w-4 md:h-4 rounded-full"
                        style={{
                          backgroundColor: MOOD_COLORS[selectedEntry.mood],
                        }}
                      />
                      <span
                        className="text-[10px] md:text-sm px-2 py-0.5 md:py-1 rounded text-white"
                        style={{
                          backgroundColor: MOOD_COLORS[selectedEntry.mood],
                        }}
                      >
                        {MOOD_LABELS[selectedEntry.mood]}
                      </span>
                      <span className="text-xs md:text-sm text-muted-foreground ml-auto">
                        {selectedEntry.date}
                      </span>
                    </div>
                    <h3 className="text-lg md:text-2xl font-bold">
                      {selectedEntry.title}
                    </h3>
                  </div>

                  {/* Content */}
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-sm md:text-base text-muted-foreground whitespace-pre-line leading-relaxed">
                      {selectedEntry.content}
                    </p>
                  </div>

                  {/* Tags */}
                  {selectedEntry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedEntry.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 md:px-3 py-1 rounded-full bg-muted text-muted-foreground"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* AI Summary */}
                  <div className="p-3 md:p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-xs md:text-sm font-semibold">
                        AI Summary
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {selectedEntry.aiSummary}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border/50">
                <CardContent className="flex flex-col items-center justify-center p-8 md:p-12 text-center">
                  <PenTool className="w-12 h-12 md:w-16 md:h-16 text-muted-foreground opacity-50 mb-4" />
                  <h3 className="text-base md:text-lg font-semibold mb-2">
                    Start Your Reflection
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Writing helps you process thoughts and track growth. Click
                    on an entry or create a new one.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
