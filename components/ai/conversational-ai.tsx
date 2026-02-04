"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/context/app-context";
import {
  conversationalAI,
  type Message,
  type ConversationResponse,
} from "@/lib/ai/conversational";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  X,
  Minus,
  Send,
  Mic,
  MicOff,
  Loader2,
  CheckCircle2,
  Calendar,
  BarChart3,
  Lightbulb,
  MessageCircle,
  Bot,
  User,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  actions?: Array<{ type: string; data: Record<string, unknown> }>;
  suggestions?: Array<{ text: string; action: string; reason?: string }>;
}

const QUICK_ACTIONS = [
  { icon: Calendar, label: "Show Today", action: "show_today" },
  { icon: BarChart3, label: "Analyze Patterns", action: "analyze_patterns" },
  { icon: Lightbulb, label: "Give Suggestions", action: "suggestions" },
];

export function ConversationalAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const {
    tasks,
    habits,
    transactions,
    timeEntries,
    journalEntries,
    addTask,
    addHabit,
    addTransaction,
    completeHabit,
    getFinanceStats,
  } = useApp();

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus input when opening
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen, isMinimized]);

  // Build context for AI
  const buildContext = useCallback(() => {
    const today = new Date().toISOString().split("T")[0];
    const { expenses, income, balance } = getFinanceStats();

    return {
      history: messages,
      currentPage: pathname,
      userData: {
        tasks: {
          pending: tasks.filter((t) => t.status !== "completed").length,
          overdue: tasks.filter(
            (t) =>
              t.status !== "completed" &&
              t.dueDate &&
              new Date(t.dueDate) < new Date(),
          ).length,
          todayDue: tasks.filter((t) => t.dueDate?.split("T")[0] === today)
            .length,
        },
        habits: {
          completed: habits.filter((h) =>
            h.completions?.some((c) => c.date === today && c.completed),
          ).length,
          total: habits.length,
          streaksAtRisk: habits
            .filter(
              (h) =>
                h.streak >= 7 &&
                !h.completions?.some((c) => c.date === today && c.completed),
            )
            .map((h) => h.name),
        },
        finance: {
          spent: expenses,
          budget: 500, // Default, could come from settings
          remaining: balance,
        },
        timeLogged: timeEntries
          .filter((t) => t.date.split("T")[0] === today)
          .reduce((s, t) => s + t.duration, 0),
        recentActivity: [],
        mood: journalEntries[0]?.mood || 5,
      },
    };
  }, [
    messages,
    pathname,
    tasks,
    habits,
    transactions,
    timeEntries,
    journalEntries,
    getFinanceStats,
  ]);

  // Send message to AI
  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const context = buildContext();
      const response = await conversationalAI.chat(text, context);

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.message,
        timestamp: new Date().toLocaleTimeString(),
        actions: response.actions,
        suggestions: response.suggestions,
      };

      setMessages((prev) => [...prev, assistantMessage]);

      // Execute any actions
      if (response.actions && response.actions.length > 0) {
        for (const action of response.actions) {
          await executeAction(action);
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm having trouble connecting right now. Please try again.",
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Execute AI actions
  const executeAction = async (action: {
    type: string;
    data: Record<string, unknown>;
  }) => {
    switch (action.type) {
      case "create_task":
        addTask({
          title: action.data.title as string,
          description: (action.data.description as string) || "",
          domain:
            (action.data.domain as "work" | "study" | "personal" | "health") ||
            "work",
          priority:
            (action.data.priority as "low" | "medium" | "high") || "medium",
          dueDate: (action.data.dueDate as string) || "",
          status: "todo",
        });
        toast.success(`Task created: ${action.data.title}`);
        break;

      case "complete_habit":
        const today = new Date().toISOString().split("T")[0];
        completeHabit(action.data.habitId as string, today);
        toast.success("Habit marked as complete!");
        break;

      case "add_expense":
        addTransaction({
          type: "expense",
          amount: action.data.amount as number,
          category:
            (action.data.category as
              | "food"
              | "transport"
              | "entertainment"
              | "health"
              | "learning"
              | "utilities"
              | "other") || "other",
          description: (action.data.description as string) || "",
          date: new Date().toISOString(),
        });
        toast.success(`Expense recorded: $${action.data.amount}`);
        break;
    }
  };

  // Handle quick action
  const handleQuickAction = (action: string) => {
    switch (action) {
      case "show_today":
        sendMessage("Show me my schedule and priorities for today");
        break;
      case "analyze_patterns":
        sendMessage(
          "Analyze my patterns and tell me what's affecting my productivity",
        );
        break;
      case "suggestions":
        sendMessage(
          "What should I focus on right now to improve my life score?",
        );
        break;
    }
  };

  // Handle suggestion click
  const handleSuggestion = (suggestion: { text: string; action: string }) => {
    sendMessage(suggestion.text);
  };

  // Voice input (if supported)
  const toggleVoiceInput = () => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      toast.error("Voice input not supported in this browser");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const text = event.results[0][0].transcript;
      setInput(text);
      sendMessage(text);
    };
    recognition.onerror = () => {
      setIsListening(false);
      toast.error("Voice recognition failed");
    };

    recognition.start();
  };

  // Minimized floating button
  if (!isOpen || isMinimized) {
    return (
      <motion.button
        className={cn(
          "fixed z-50 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center",
          "bg-primary text-primary-foreground shadow-lg",
          "hover:scale-105 transition-transform",
          "bottom-4 right-4 sm:bottom-6 sm:right-6",
        )}
        onClick={() => {
          setIsOpen(true);
          setIsMinimized(false);
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
      >
        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
        {messages.length > 0 && (
          <motion.div
            className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-red-500 text-white text-[10px] sm:text-xs flex items-center justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
          >
            {messages.length}
          </motion.div>
        )}
      </motion.button>
    );
  }

  return (
    <motion.div
      className={cn(
        "fixed z-50 flex flex-col overflow-hidden",
        "bg-background border shadow-2xl",
        // Mobile: full screen with safe areas
        "inset-0 rounded-none sm:rounded-2xl",
        // Desktop: fixed size and position
        "sm:inset-auto sm:bottom-4 sm:right-4 md:bottom-6 md:right-6",
        "sm:w-[360px] sm:h-[500px] md:w-[400px] md:h-[560px]",
        "sm:max-h-[calc(100vh-2rem)] md:max-h-[calc(100vh-3rem)]",
      )}
      initial={{ scale: 0.95, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.95, opacity: 0, y: 20 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 border-b bg-gradient-to-r from-primary/10 to-transparent flex-shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm sm:text-base">Cortexia AI</h3>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Your life assistant
            </p>
          </div>
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9"
            onClick={() => setIsMinimized(true)}
          >
            <Minus className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9"
            onClick={() => setIsOpen(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3 sm:p-4" ref={scrollRef}>
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-6 sm:py-8">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-3 sm:mb-4">
              <Bot className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
            </div>
            <h4 className="font-semibold mb-2 text-sm sm:text-base">
              Hi! I'm Cortexia
            </h4>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6 max-w-[260px] sm:max-w-[280px] px-2">
              Your AI life assistant. I can help you manage tasks, analyze
              patterns, and optimize your productivity.
            </p>
            <div className="flex flex-col gap-2 w-full max-w-[260px] sm:max-w-[280px]">
              {QUICK_ACTIONS.map((action) => (
                <Button
                  key={action.action}
                  variant="outline"
                  className="justify-start gap-2 text-sm"
                  onClick={() => handleQuickAction(action.action)}
                >
                  <action.icon className="w-4 h-4" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-3 sm:space-y-4">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                className={cn(
                  "flex gap-2 sm:gap-3",
                  message.role === "user" ? "justify-end" : "justify-start",
                )}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {message.role === "assistant" && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/20 flex-shrink-0 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] sm:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2 sm:py-2.5",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted",
                  )}
                >
                  <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">
                    {message.content}
                  </p>
                  <span className="text-[9px] sm:text-[10px] opacity-70 mt-1 block">
                    {message.timestamp}
                  </span>

                  {/* Suggestions */}
                  {message.suggestions && message.suggestions.length > 0 && (
                    <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border/50 space-y-1.5 sm:space-y-2">
                      {message.suggestions.map((suggestion, i) => (
                        <Button
                          key={i}
                          variant="secondary"
                          size="sm"
                          className="w-full justify-start text-[10px] sm:text-xs h-7 sm:h-8"
                          onClick={() => handleSuggestion(suggestion)}
                        >
                          <Lightbulb className="w-3 h-3 mr-1.5 sm:mr-2 flex-shrink-0" />
                          <span className="truncate">{suggestion.text}</span>
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Actions executed */}
                  {message.actions && message.actions.length > 0 && (
                    <div className="mt-2 flex items-center gap-1 text-[10px] sm:text-xs text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3 h-3" />
                      {message.actions.length} action
                      {message.actions.length > 1 ? "s" : ""} executed
                    </div>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-secondary flex-shrink-0 flex items-center justify-center">
                    <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </div>
                )}
              </motion.div>
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <motion.div
                className="flex gap-2 sm:gap-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-primary/20 flex-shrink-0 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl px-3 sm:px-4 py-2 sm:py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                    <span className="text-xs sm:text-sm text-muted-foreground">
                      Thinking...
                    </span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* Quick Actions (when there are messages) */}
      {messages.length > 0 && (
        <div className="px-3 sm:px-4 py-2 border-t flex gap-1.5 sm:gap-2 overflow-x-auto flex-shrink-0 scrollbar-none">
          {QUICK_ACTIONS.map((action) => (
            <Button
              key={action.action}
              variant="outline"
              size="sm"
              className="flex-shrink-0 gap-1 sm:gap-1.5 text-[10px] sm:text-xs h-7 sm:h-8 px-2 sm:px-3"
              onClick={() => handleQuickAction(action.action)}
            >
              <action.icon className="w-3 h-3" />
              <span className="hidden xs:inline">{action.label}</span>
            </Button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 sm:p-4 border-t flex-shrink-0 bg-background">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="flex gap-1.5 sm:gap-2"
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            className="flex-1 h-9 sm:h-10 text-sm"
            disabled={isLoading}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            className={cn(
              "h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0",
              isListening && "text-red-500 border-red-500",
            )}
            onClick={toggleVoiceInput}
          >
            {isListening ? (
              <MicOff className="w-4 h-4" />
            ) : (
              <Mic className="w-4 h-4" />
            )}
          </Button>
          <Button
            type="submit"
            size="icon"
            className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0"
            disabled={!input.trim() || isLoading}
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
