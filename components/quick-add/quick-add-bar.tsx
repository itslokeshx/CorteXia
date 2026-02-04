"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useApp } from "@/lib/context/app-context";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  Zap,
  CheckSquare,
  Target,
  Clock,
  DollarSign,
  BookOpen,
  PenTool,
  Flame,
  Sparkles,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ParsedInput {
  type: "task" | "expense" | "habit" | "time" | "study" | "journal" | "goal";
  data: any;
  confidence: number;
}

const TYPE_ICONS = {
  task: CheckSquare,
  expense: DollarSign,
  habit: Flame,
  time: Clock,
  study: BookOpen,
  journal: PenTool,
  goal: Target,
};

const TYPE_COLORS = {
  task: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  expense: "bg-green-500/20 text-green-400 border-green-500/30",
  habit: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  time: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  study: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  journal: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  goal: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

const EXAMPLES = [
  { text: "finish report by friday", type: "task" },
  { text: "spent $45 on lunch", type: "expense" },
  { text: "did meditation", type: "habit" },
  { text: "worked on project for 2h", type: "time" },
  { text: "studied ML for 90 min", type: "study" },
  { text: "feeling productive today", type: "journal" },
];

export function QuickAddBar() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [parsed, setParsed] = useState<ParsedInput | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    addTask,
    addHabit,
    addTransaction,
    addTimeEntry,
    addStudySession,
    addJournalEntry,
    addGoal,
  } = useApp();

  // Parse input with debounce
  useEffect(() => {
    if (!input.trim()) {
      setParsed(null);
      return;
    }

    const timer = setTimeout(() => {
      const result = parseInput(input);
      setParsed(result);
    }, 150);

    return () => clearTimeout(timer);
  }, [input]);

  // Keyboard shortcut: Cmd/Ctrl + K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input when dialog opens
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setInput("");
      setParsed(null);
      setShowSuccess(false);
    }
  }, [open]);

  // Simple local parsing (can call API for more advanced)
  const parseInput = (text: string): ParsedInput => {
    const lowerText = text.toLowerCase();

    // Expense patterns
    if (lowerText.match(/spent|\$|paid|bought|cost/)) {
      const amountMatch = text.match(/\$?(\d+(?:\.\d{2})?)/);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

      let category = "other";
      if (
        lowerText.includes("food") ||
        lowerText.includes("lunch") ||
        lowerText.includes("dinner") ||
        lowerText.includes("coffee")
      ) {
        category = "food";
      } else if (
        lowerText.includes("uber") ||
        lowerText.includes("taxi") ||
        lowerText.includes("transport") ||
        lowerText.includes("gas")
      ) {
        category = "transport";
      } else if (
        lowerText.includes("movie") ||
        lowerText.includes("netflix") ||
        lowerText.includes("game")
      ) {
        category = "entertainment";
      }

      return {
        type: "expense",
        data: { amount, category, description: text, type: "expense" },
        confidence: 0.9,
      };
    }

    // Time patterns
    if (lowerText.match(/worked|for \d+\s*(h|hours?|min|minutes?)/)) {
      const durationMatch = text.match(/(\d+)\s*(?:hours?|h|minutes?|min|m)/i);
      const duration = durationMatch ? parseInt(durationMatch[1]) : 30;
      const isHours = durationMatch?.[0].match(/hours?|h/i);

      return {
        type: "time",
        data: {
          task: text.replace(/for \d+.*$/i, "").trim(),
          duration: isHours ? duration * 60 : duration,
          category: lowerText.includes("study") ? "study" : "work",
        },
        confidence: 0.85,
      };
    }

    // Study patterns
    if (lowerText.match(/studied|learning|read.*chapter|practicing/)) {
      const durationMatch = text.match(/(\d+)\s*(?:minutes?|min|m|hours?|h)/i);
      const duration = durationMatch ? parseInt(durationMatch[1]) : 30;
      const isHours = durationMatch?.[0].match(/hours?|h/i);

      return {
        type: "study",
        data: {
          subject: text.replace(/studied|for \d+.*$/gi, "").trim() || "General",
          duration: isHours ? duration * 60 : duration,
        },
        confidence: 0.85,
      };
    }

    // Habit patterns
    if (
      lowerText.match(
        /did|completed|finished|went to gym|meditated|exercised|drank water/,
      )
    ) {
      return {
        type: "habit",
        data: { name: text, completed: true },
        confidence: 0.8,
      };
    }

    // Journal patterns
    if (
      lowerText.match(
        /feeling|mood|today was|grateful|stressed|happy|sad|anxious/,
      )
    ) {
      return {
        type: "journal",
        data: {
          content: text,
          mood:
            lowerText.includes("happy") || lowerText.includes("great")
              ? "happy"
              : lowerText.includes("sad") || lowerText.includes("stressed")
                ? "difficult"
                : "neutral",
          moodScore:
            lowerText.includes("happy") || lowerText.includes("great")
              ? 8
              : lowerText.includes("sad")
                ? 4
                : 6,
        },
        confidence: 0.75,
      };
    }

    // Goal patterns
    if (lowerText.match(/goal|want to|aim to|plan to|achieve/)) {
      return {
        type: "goal",
        data: { title: text, category: "personal" },
        confidence: 0.7,
      };
    }

    // Default to task
    return {
      type: "task",
      data: {
        title: text,
        domain: lowerText.includes("work")
          ? "work"
          : lowerText.includes("health") || lowerText.includes("gym")
            ? "health"
            : lowerText.includes("study") || lowerText.includes("learn")
              ? "study"
              : "personal",
        priority:
          lowerText.includes("urgent") || lowerText.includes("asap")
            ? "high"
            : "medium",
      },
      confidence: 0.6,
    };
  };

  const handleSubmit = useCallback(async () => {
    if (!parsed || !input.trim()) return;

    setIsProcessing(true);

    try {
      switch (parsed.type) {
        case "task":
          addTask({
            title: parsed.data.title,
            description: "",
            domain: parsed.data.domain || "work",
            priority: parsed.data.priority || "medium",
            status: "todo",
          });
          break;
        case "expense":
          addTransaction({
            type: "expense",
            amount: parsed.data.amount,
            category: parsed.data.category,
            description: parsed.data.description,
            date: new Date().toISOString(),
          });
          break;
        case "time":
          addTimeEntry({
            task: parsed.data.task,
            category: parsed.data.category,
            duration: parsed.data.duration,
            date: new Date().toISOString(),
            focusQuality: "moderate",
            interruptions: 0,
          });
          break;
        case "study":
          addStudySession({
            subject: parsed.data.subject,
            duration: parsed.data.duration,
            pomodoros: Math.ceil(parsed.data.duration / 25),
            difficulty: "medium",
            startTime: new Date().toISOString(),
            endTime: new Date(
              Date.now() + parsed.data.duration * 60000,
            ).toISOString(),
          });
          break;
        case "journal":
          addJournalEntry({
            title: "Quick Entry",
            content: parsed.data.content,
            mood: parsed.data.moodScore || 5,
            energy: 5,
            focus: 5,
            date: new Date().toISOString(),
          });
          break;
        case "goal":
          addGoal({
            title: parsed.data.title,
            description: "",
            category: parsed.data.category || "personal",
            priority: "medium",
            targetDate: new Date(
              Date.now() + 90 * 24 * 60 * 60 * 1000,
            ).toISOString(),
            progress: 0,
            status: "active",
            milestones: [],
          });
          break;
        default:
          break;
      }

      setShowSuccess(true);
      setTimeout(() => {
        setOpen(false);
      }, 800);
    } catch (error) {
      console.error("Error adding item:", error);
    } finally {
      setIsProcessing(false);
    }
  }, [
    parsed,
    input,
    addTask,
    addTransaction,
    addTimeEntry,
    addStudySession,
    addJournalEntry,
    addGoal,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const TypeIcon = parsed ? TYPE_ICONS[parsed.type] : Zap;

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
      >
        <Command className="w-4 h-4" />
        <span className="text-sm">Quick Add</span>
        <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
          {/* Success State */}
          {showSuccess ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-lg font-medium">Added successfully!</p>
            </div>
          ) : (
            <>
              {/* Input Area */}
              <div className="flex items-center gap-3 p-4 border-b">
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center transition-colors",
                    parsed ? TYPE_COLORS[parsed.type] : "bg-secondary",
                  )}
                >
                  <TypeIcon className="w-5 h-5" />
                </div>
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="What would you like to add? (e.g., 'finish report by friday' or 'spent $20 on lunch')"
                  className="flex-1 border-0 shadow-none focus-visible:ring-0 text-base"
                />
                {isProcessing && (
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                )}
              </div>

              {/* Preview */}
              {parsed && input.trim() && (
                <div className="p-4 bg-muted/50 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn("capitalize", TYPE_COLORS[parsed.type])}
                      >
                        {parsed.type}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {parsed.confidence >= 0.8
                          ? "High confidence"
                          : "Best guess"}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleSubmit}
                      disabled={isProcessing}
                      className="gap-2"
                    >
                      Add <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Preview Details */}
                  <div className="mt-3 text-sm space-y-1">
                    {parsed.type === "task" && (
                      <p>
                        📝 Task: <strong>{parsed.data.title}</strong> (
                        {parsed.data.priority} priority)
                      </p>
                    )}
                    {parsed.type === "expense" && (
                      <p>
                        💰 ${parsed.data.amount.toFixed(2)} -{" "}
                        {parsed.data.category}
                      </p>
                    )}
                    {parsed.type === "time" && (
                      <p>
                        ⏱️ {parsed.data.duration} min of {parsed.data.category}
                      </p>
                    )}
                    {parsed.type === "study" && (
                      <p>
                        📚 {parsed.data.duration} min studying{" "}
                        {parsed.data.subject}
                      </p>
                    )}
                    {parsed.type === "habit" && (
                      <p>✅ Mark habit complete: {parsed.data.name}</p>
                    )}
                    {parsed.type === "journal" && (
                      <p>📖 Journal entry (mood: {parsed.data.mood})</p>
                    )}
                    {parsed.type === "goal" && (
                      <p>🎯 New goal: {parsed.data.title}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Examples */}
              {!input.trim() && (
                <div className="p-4">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
                    Examples
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {EXAMPLES.map((example, i) => {
                      const Icon =
                        TYPE_ICONS[example.type as keyof typeof TYPE_ICONS];
                      return (
                        <button
                          key={i}
                          onClick={() => setInput(example.text)}
                          className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors text-left text-sm"
                        >
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {example.text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="p-3 bg-muted/30 border-t flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>
                    Press{" "}
                    <kbd className="px-1 py-0.5 rounded bg-muted">Enter</kbd> to
                    add
                  </span>
                  <span>
                    Press{" "}
                    <kbd className="px-1 py-0.5 rounded bg-muted">Esc</kbd> to
                    close
                  </span>
                </div>
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI-powered parsing
                </span>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
