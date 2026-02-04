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
import { useState, useMemo } from "react";
import { useApp } from "@/lib/context/app-context";
import type { JournalEntry } from "@/lib/types";

// Helper to get mood color based on numeric value
const getMoodColor = (mood: number): string => {
  if (mood <= 3) return "#EF4444"; // Red - difficult
  if (mood <= 5) return "#F59E0B"; // Amber - neutral
  if (mood <= 7) return "#3B82F6"; // Blue - good
  return "#10B981"; // Green - great
};

// Helper to get mood label based on numeric value
const getMoodLabel = (mood: number): string => {
  if (mood <= 3) return "😔 Difficult";
  if (mood <= 5) return "😐 Neutral";
  if (mood <= 7) return "🙂 Good";
  if (mood <= 9) return "😊 Great";
  return "🤩 Amazing";
};

// Helper to format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30)
    return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString();
};

export default function JournalPage() {
  const { journalEntries, addJournalEntry, deleteJournalEntry } = useApp();
  const [open, setOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [newEntry, setNewEntry] = useState({
    title: "",
    content: "",
    date: new Date().toISOString().split("T")[0],
    mood: 5,
    energy: 5,
    focus: 5,
    tags: [] as string[],
  });
  const [tagInput, setTagInput] = useState("");

  const handleAddEntry = () => {
    if (newEntry.title.trim() && newEntry.content.trim()) {
      addJournalEntry({
        ...newEntry,
        date: new Date().toISOString(),
      });
      setNewEntry({
        title: "",
        content: "",
        date: new Date().toISOString().split("T")[0],
        mood: 5,
        energy: 5,
        focus: 5,
        tags: [],
      });
      setTagInput("");
      setOpen(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !newEntry.tags.includes(tagInput.trim())) {
      setNewEntry({ ...newEntry, tags: [...newEntry.tags, tagInput.trim()] });
      setTagInput("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setNewEntry({ ...newEntry, tags: newEntry.tags.filter((t) => t !== tag) });
  };

  // Calculate stats from real data
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

    return { total, greatDays, avgWords, avgMood };
  }, [journalEntries]);

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6 pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Journal</h1>
            <p className="text-muted-foreground text-sm md:text-base mt-1">
              {journalEntries.length} reflections recorded
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                New Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-4 sm:mx-auto max-h-[90vh] overflow-y-auto">
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
                          mood: Math.min(
                            10,
                            Math.max(1, parseInt(e.target.value) || 5),
                          ),
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
                          energy: Math.min(
                            10,
                            Math.max(1, parseInt(e.target.value) || 5),
                          ),
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
                          focus: Math.min(
                            10,
                            Math.max(1, parseInt(e.target.value) || 5),
                          ),
                        })
                      }
                    />
                  </div>
                </div>
                {/* Tags Input */}
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Tags</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a tag"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddTag}
                    >
                      Add
                    </Button>
                  </div>
                  {newEntry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {newEntry.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          #{tag} ×
                        </Badge>
                      ))}
                    </div>
                  )}
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
                {stats.total}
              </div>
              <div className="text-[10px] md:text-xs text-muted-foreground mt-1">
                All time
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="text-xs md:text-sm text-muted-foreground mb-1">
                Great Days
              </div>
              <div className="text-2xl md:text-3xl font-bold text-emerald-500">
                {stats.greatDays}
              </div>
              <div className="text-[10px] md:text-xs text-muted-foreground mt-1">
                Mood 8+
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="text-xs md:text-sm text-muted-foreground mb-1">
                Avg Words
              </div>
              <div className="text-2xl md:text-3xl font-bold text-amber-500">
                {stats.avgWords}
              </div>
              <div className="text-[10px] md:text-xs text-muted-foreground mt-1">
                Per entry
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="text-xs md:text-sm text-muted-foreground mb-1">
                Avg Mood
              </div>
              <div className="text-2xl md:text-3xl font-bold text-blue-500">
                {stats.avgMood}/10
              </div>
              <div className="text-[10px] md:text-xs text-muted-foreground mt-1">
                {getMoodLabel(stats.avgMood)}
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
            {journalEntries.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                  <PenTool className="w-12 h-12 text-muted-foreground opacity-50 mb-4" />
                  <h3 className="text-base font-semibold mb-2">
                    No entries yet
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Start journaling to track your thoughts and growth.
                  </p>
                </CardContent>
              </Card>
            ) : (
              journalEntries.map((entry) => (
                <Card
                  key={entry.id}
                  className={`border-border/50 cursor-pointer transition-all hover:shadow-md ${
                    selectedEntry?.id === entry.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => setSelectedEntry(entry)}
                >
                  <CardContent className="p-3 md:p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className="w-3 h-3 md:w-4 md:h-4 rounded-full flex-shrink-0 mt-1"
                        style={{ backgroundColor: getMoodColor(entry.mood) }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-sm md:text-base truncate">
                            {entry.title || "Untitled Entry"}
                          </h3>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive flex-shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteJournalEntry(entry.id);
                              if (selectedEntry?.id === entry.id) {
                                setSelectedEntry(null);
                              }
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                        <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-2">
                          {entry.content}
                        </p>
                        <div className="flex items-center gap-2 mt-2 md:mt-3 flex-wrap">
                          <span className="text-[10px] md:text-xs text-muted-foreground">
                            {formatDate(entry.date)}
                          </span>
                          <span
                            className="text-[10px] md:text-xs px-2 py-0.5 rounded text-white"
                            style={{
                              backgroundColor: getMoodColor(entry.mood),
                            }}
                          >
                            {getMoodLabel(entry.mood)}
                          </span>
                        </div>
                        {entry.tags && entry.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap mt-2">
                            {entry.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="text-[10px] md:text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
                              >
                                #{tag}
                              </span>
                            ))}
                            {entry.tags.length > 3 && (
                              <span className="text-[10px] md:text-xs text-muted-foreground">
                                +{entry.tags.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Entry Detail or Welcome */}
          <div>
            <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4">
              {selectedEntry
                ? selectedEntry.title || "Untitled Entry"
                : "Start Writing"}
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
                          backgroundColor: getMoodColor(selectedEntry.mood),
                        }}
                      />
                      <span
                        className="text-[10px] md:text-sm px-2 py-0.5 md:py-1 rounded text-white"
                        style={{
                          backgroundColor: getMoodColor(selectedEntry.mood),
                        }}
                      >
                        {getMoodLabel(selectedEntry.mood)}
                      </span>
                      <span className="text-xs md:text-sm text-muted-foreground ml-auto">
                        {formatDate(selectedEntry.date)}
                      </span>
                    </div>
                    <h3 className="text-lg md:text-2xl font-bold">
                      {selectedEntry.title || "Untitled Entry"}
                    </h3>
                    {/* Metrics */}
                    <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
                      <span>Energy: {selectedEntry.energy}/10</span>
                      <span>Focus: {selectedEntry.focus}/10</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-sm md:text-base text-muted-foreground whitespace-pre-line leading-relaxed">
                      {selectedEntry.content}
                    </p>
                  </div>

                  {/* Tags */}
                  {selectedEntry.tags && selectedEntry.tags.length > 0 && (
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

                  {/* AI Summary Placeholder */}
                  <div className="p-3 md:p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-xs md:text-sm font-semibold">
                        AI Insights
                      </span>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground">
                      {selectedEntry.mood >= 7
                        ? "You seem to be in a positive mindset! Keep up the great work and maintain this energy."
                        : selectedEntry.mood >= 5
                          ? "A neutral day - consider what small wins you can celebrate or what might lift your spirits."
                          : "It looks like today was challenging. Remember, difficult days are opportunities for growth. Be kind to yourself."}
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
