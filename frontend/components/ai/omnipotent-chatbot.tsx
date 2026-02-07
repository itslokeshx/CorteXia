"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  Loader2,
  Brain,
  Target,
  ListTodo,
  Wallet,
  BookOpen,
  Timer,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/context/app-context";
import { format, addDays } from "date-fns";
import type { Task, Habit, Goal, Transaction } from "@/lib/types";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

// Intent patterns
const INTENTS = {
  CREATE_TASK: /^(add|create|new|make)\s+(a\s+)?task/i,
  CREATE_HABIT: /^(add|create|new|make|start)\s+(a\s+)?habit/i,
  CREATE_GOAL: /^(add|create|new|make|set)\s+(a\s+)?goal/i,
  ADD_EXPENSE: /^(add|log|record)\s+(an?\s+)?expense|spent|paid|bought/i,
  ADD_INCOME: /^(add|log|record)\s+(an?\s+)?income|received|earned|got paid/i,
  QUERY_TASKS: /^(show|list|what|get|display|find).*(tasks?|todo)/i,
  QUERY_HABITS: /^(show|list|what|get|display|find).*(habits?|streak)/i,
  QUERY_GOALS: /^(show|list|what|get|display|find).*(goals?|progress)/i,
  QUERY_FINANCE:
    /^(show|what|get|how much).*(balance|spending|expenses?|income|money|budget|spent)/i,
  QUERY_SUMMARY: /^(how am i|what.*status|summary|overview|report|dashboard)/i,
  COMPLETE_TASK: /^(complete|finish|done|check off|mark done)\s/i,
  COMPLETE_HABIT: /^(complete|done|check|mark)\s.*habit/i,
  GREETING: /^(hi|hello|hey|good morning|good afternoon|good evening)/i,
  HELP: /^(help|what can you do|commands|features)/i,
  MOTIVATION: /^(motivate|inspire|encourage|i need motivation)/i,
};

function parseTaskFromText(text: string): Partial<Task> {
  let title = text
    .replace(/^(add|create|new|make|a)\s*(task)?:?\s*/i, "")
    .trim();
  const priority: Task["priority"] = /urgent|critical|asap|important/i.test(
    text,
  )
    ? "high"
    : /low priority/i.test(text)
      ? "low"
      : "medium";
  title = title
    .replace(/\s*(urgent|critical|asap|important|low priority)\s*/gi, " ")
    .trim();

  let dueDate: string | undefined;
  if (/today/i.test(text)) {
    dueDate = format(new Date(), "yyyy-MM-dd");
    title = title.replace(/\s*(due\s*)?(today|by today)\s*/i, " ").trim();
  } else if (/tomorrow/i.test(text)) {
    dueDate = format(addDays(new Date(), 1), "yyyy-MM-dd");
    title = title.replace(/\s*(due\s*)?(tomorrow)\s*/i, " ").trim();
  } else if (/next week/i.test(text)) {
    dueDate = format(addDays(new Date(), 7), "yyyy-MM-dd");
    title = title.replace(/\s*(due\s*)?(next week)\s*/i, " ").trim();
  }

  return { title: title || "New Task", status: "todo", priority, dueDate };
}

function parseExpenseFromText(text: string): Partial<Transaction> {
  const amountMatch = text.match(/\$?(\d+(?:\.\d{2})?)/);
  const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;
  let category: Transaction["category"] = "other";
  if (/food|groceries|restaurant|lunch|dinner|coffee/i.test(text))
    category = "food";
  else if (/transport|uber|gas|bus|train/i.test(text)) category = "transport";
  else if (/entertainment|movie|game|concert/i.test(text))
    category = "entertainment";
  else if (/shopping|clothes|amazon/i.test(text)) category = "shopping";
  else if (/health|doctor|medicine|gym/i.test(text)) category = "health";
  else if (/bill|utility|rent|electricity|internet/i.test(text))
    category = "utilities";

  let description = text
    .replace(/^(add|log|record|spent|paid|bought)\s*/i, "")
    .trim();
  description = description
    .replace(/\$?\d+(?:\.\d{2})?\s*(on|for)?\s*/i, "")
    .trim();

  return {
    amount,
    category,
    type: "expense",
    description: description || `${category} expense`,
    date: format(new Date(), "yyyy-MM-dd"),
  };
}

const SUGGESTIONS = [
  { icon: ListTodo, text: "Show my tasks for today", color: "text-blue-500" },
  {
    icon: Target,
    text: "How am I doing on my goals?",
    color: "text-purple-500",
  },
  {
    icon: Wallet,
    text: "What did I spend this month?",
    color: "text-green-500",
  },
  {
    icon: Brain,
    text: "Give me a productivity report",
    color: "text-amber-500",
  },
];

const MOTIVATIONS = [
  "Every step forward counts. You're building something amazing. 🌟",
  "Progress, not perfection. You're doing better than you think! 💪",
  "The fact that you're here, tracking your life, shows incredible self-awareness. Keep going! 🚀",
  "Small daily improvements lead to stunning results. You've got this! ✨",
  "Your future self will thank you for the effort you're putting in today. 🎯",
];

export function OmnipotentChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    tasks,
    habits,
    goals,
    transactions,
    journalEntries,
    timeEntries,
    addTask,
    addHabit,
    addGoal,
    addTransaction,
    completeTask,
    completeHabit,
    getHabitStreak,
    getFinanceStats,
    getGoalStats,
  } = useApp();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const getContextSummary = useCallback(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const todayTasks = tasks.filter(
      (t) => t.dueDate === today && t.status !== "completed",
    );
    const completedToday = tasks.filter(
      (t) => t.completedAt && t.completedAt.startsWith(today),
    ).length;
    const todayHabits = habits.filter(
      (h) =>
        h.active && !h.completions.find((c) => c.date === today && c.completed),
    );
    const financeStats = getFinanceStats();
    const goalStats = getGoalStats();

    return {
      date: format(new Date(), "EEEE, MMMM d"),
      tasks: {
        total: tasks.length,
        pending: tasks.filter((t) => t.status === "todo").length,
        todayPending: todayTasks.length,
        completedToday,
        overdue: tasks.filter(
          (t) => t.dueDate && t.dueDate < today && t.status !== "completed",
        ).length,
      },
      habits: {
        total: habits.length,
        pendingToday: todayHabits.length,
        topStreaks: habits
          .slice(0, 3)
          .map((h) => ({ name: h.name, streak: getHabitStreak(h.id) })),
      },
      goals: goalStats,
      finance: financeStats,
      journalCount: journalEntries.length,
      recentMood: journalEntries[0]?.mood,
    };
  }, [
    tasks,
    habits,
    goals,
    transactions,
    journalEntries,
    getFinanceStats,
    getGoalStats,
    getHabitStreak,
  ]);

  const processMessage = useCallback(
    async (userMessage: string) => {
      const ctx = getContextSummary();
      let response = "";

      if (INTENTS.GREETING.test(userMessage)) {
        const g =
          new Date().getHours() < 12
            ? "Good morning"
            : new Date().getHours() < 17
              ? "Good afternoon"
              : "Good evening";
        response = `${g}! 👋 You have **${ctx.tasks.todayPending} tasks** and **${ctx.habits.pendingToday} habits** pending today. How can I help?`;
      } else if (INTENTS.HELP.test(userMessage)) {
        response = `Here's what I can do:\n\n📋 **Tasks** — "Add task: [title]", "Show my tasks", "Complete task [name]"\n💪 **Habits** — "Create habit: [name]", "Show habits"\n🎯 **Goals** — "Set goal: [title]", "Goal progress"\n💰 **Finance** — "Spent $50 on food", "What did I spend?"\n📊 **Analysis** — "How am I doing?", "Summary"\n\nJust type naturally! ✨`;
      } else if (INTENTS.CREATE_TASK.test(userMessage)) {
        const data = parseTaskFromText(userMessage);
        const t = addTask({
          title: data.title || "New Task",
          description: "",
          status: "todo",
          priority: data.priority || "medium",
          domain: "personal",
          dueDate: data.dueDate,
        });
        response = `✅ Created task: **${t.title}**${data.dueDate ? ` (due ${format(new Date(data.dueDate), "MMM d")})` : ""}${data.priority === "high" ? " ⚡ High priority" : ""}`;
      } else if (INTENTS.CREATE_HABIT.test(userMessage)) {
        const name =
          userMessage
            .replace(/^(add|create|new|make|start)\s*(a\s+)?habit:?\s*/i, "")
            .trim() || "New Habit";
        const h = addHabit({
          name,
          frequency: "daily",
          category: "productivity",
          streak: 0,
          longestStreak: 0,
          active: true,
          color: "#10b981",
        });
        response = `✅ Created daily habit: **${h.name}**\nYour streak starts today! 🔥`;
      } else if (INTENTS.CREATE_GOAL.test(userMessage)) {
        const title =
          userMessage
            .replace(/^(add|create|new|make|set)\s*(a\s+)?goal:?\s*/i, "")
            .trim() || "New Goal";
        const g = addGoal({
          title,
          description: "",
          category: "personal",
          priority: "medium",
          targetDate: format(addDays(new Date(), 90), "yyyy-MM-dd"),
          progress: 0,
          status: "active",
          milestones: [],
          level: "quarterly",
        });
        response = `🎯 Created goal: **${g.title}**\nTarget: ${format(new Date(g.targetDate), "MMM d, yyyy")}`;
      } else if (INTENTS.ADD_EXPENSE.test(userMessage)) {
        const data = parseExpenseFromText(userMessage);
        if (data.amount && data.amount > 0) {
          addTransaction({
            amount: -data.amount,
            category: data.category || "other",
            type: "expense",
            description: data.description || "Expense",
            date: data.date || format(new Date(), "yyyy-MM-dd"),
          });
          response = `💰 Logged expense: **$${data.amount.toFixed(2)}** for ${data.description}`;
        } else {
          response = `I couldn't detect the amount. Try: "Spent $25 on lunch"`;
        }
      } else if (INTENTS.QUERY_TASKS.test(userMessage)) {
        const pending = tasks
          .filter((t) => t.status !== "completed")
          .slice(0, 8);
        if (pending.length === 0) {
          response = "🎉 No pending tasks! You're all caught up!";
        } else {
          response = `📋 **Pending Tasks** (${pending.length}):\n\n${pending.map((t, i) => `${i + 1}. ${t.priority === "high" ? "⚡ " : ""}**${t.title}**${t.dueDate ? ` — due ${format(new Date(t.dueDate), "MMM d")}` : ""}`).join("\n")}`;
        }
      } else if (INTENTS.QUERY_HABITS.test(userMessage)) {
        if (habits.length === 0) {
          response =
            'No habits tracked yet. Try: "Create habit: Meditate daily"';
        } else {
          response = `💪 **Your Habits** (${habits.length}):\n\n${habits.map((h) => `• **${h.name}** — 🔥 ${getHabitStreak(h.id)} day streak`).join("\n")}`;
        }
      } else if (INTENTS.QUERY_GOALS.test(userMessage)) {
        const active = goals.filter((g) => g.status === "active");
        if (active.length === 0) {
          response = 'No active goals. Set one: "Create goal: Run a marathon"';
        } else {
          response = `🎯 **Active Goals** (${active.length}):\n\n${active.map((g) => `• **${g.title}** — ${g.progress}% complete`).join("\n")}`;
        }
      } else if (INTENTS.QUERY_FINANCE.test(userMessage)) {
        const f = ctx.finance;
        response = `💰 **Financial Overview:**\n\n• Income: **$${f.income.toFixed(2)}**\n• Expenses: **$${f.expenses.toFixed(2)}**\n• Balance: **$${f.balance.toFixed(2)}**`;
      } else if (INTENTS.COMPLETE_TASK.test(userMessage)) {
        const search = userMessage
          .replace(
            /^(complete|finish|done|check off|mark done)\s*(task)?\s*/i,
            "",
          )
          .trim()
          .toLowerCase();
        const task = tasks.find(
          (t) =>
            t.title.toLowerCase().includes(search) && t.status !== "completed",
        );
        if (task) {
          completeTask(task.id);
          response = `✅ Completed: **${task.title}**! Great work! 🎉`;
        } else {
          response = `Couldn't find a pending task matching "${search}". Try "Show my tasks" to see what's pending.`;
        }
      } else if (INTENTS.COMPLETE_HABIT.test(userMessage)) {
        const search = userMessage
          .replace(/^(complete|done|check|mark)\s*/i, "")
          .replace(/\s*habit\s*/i, "")
          .trim()
          .toLowerCase();
        const habit = habits.find((h) => h.name.toLowerCase().includes(search));
        if (habit) {
          completeHabit(habit.id, format(new Date(), "yyyy-MM-dd"));
          response = `✅ Checked off: **${habit.name}**! 🔥 Streak growing!`;
        } else {
          response = `Couldn't find a habit matching "${search}".`;
        }
      } else if (INTENTS.MOTIVATION.test(userMessage)) {
        response = MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)];
      } else if (INTENTS.QUERY_SUMMARY.test(userMessage)) {
        response =
          `📊 **Your Day — ${ctx.date}**\n\n` +
          `📋 Tasks: ${ctx.tasks.completedToday} completed, ${ctx.tasks.todayPending} pending${ctx.tasks.overdue > 0 ? `, ⚠️ ${ctx.tasks.overdue} overdue` : ""}\n` +
          `💪 Habits: ${ctx.habits.total - ctx.habits.pendingToday}/${ctx.habits.total} completed\n` +
          `🎯 Goals: ${ctx.goals.completed}/${ctx.goals.total} completed, avg ${ctx.goals.avgProgress.toFixed(0)}% progress\n` +
          `💰 Balance: $${ctx.finance.balance.toFixed(2)}\n` +
          `📓 Journal entries: ${ctx.journalCount}\n\n` +
          (ctx.tasks.overdue > 0
            ? "⚠️ You have overdue tasks. Let's tackle those first!\n"
            : "") +
          (ctx.habits.pendingToday > 0
            ? `💡 ${ctx.habits.pendingToday} habits still pending today.\n`
            : "✨ All habits done! Amazing discipline!\n");
      } else {
        response = `I'm not sure how to help with that. Try:\n• "Add task: ..." to create a task\n• "How am I doing?" for a summary\n• "Help" to see all commands`;
      }

      return response;
    },
    [
      getContextSummary,
      tasks,
      habits,
      goals,
      addTask,
      addHabit,
      addGoal,
      addTransaction,
      completeTask,
      completeHabit,
      getHabitStreak,
    ],
  );

  const handleSend = useCallback(async () => {
    if (!input.trim() || isProcessing) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsProcessing(true);

    await new Promise((r) => setTimeout(r, 400 + Math.random() * 600));

    const responseText = await processMessage(userMsg.content);
    const aiMsg: Message = {
      id: (Date.now() + 1).toString(),
      role: "assistant",
      content: responseText,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, aiMsg]);
    setIsProcessing(false);
  }, [input, isProcessing, processMessage]);

  return (
    <>
      {/* FAB */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg shadow-purple-500/25 flex items-center justify-center"
          >
            <MessageCircle className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] h-[540px] bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] bg-gradient-to-r from-purple-500/5 to-violet-500/5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                    CorteXia AI
                  </p>
                  <p className="text-[10px] text-[var(--color-text-tertiary)]">
                    Your intelligent assistant
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors"
              >
                <X className="w-4 h-4 text-[var(--color-text-tertiary)]" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500/10 to-violet-500/10 flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
                      How can I help?
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      I can manage your tasks, habits, goals, finances, and
                      more.
                    </p>
                  </div>
                  <div className="w-full space-y-1.5 mt-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s.text}
                        onClick={() => {
                          setInput(s.text);
                          setTimeout(() => {
                            setInput(s.text);
                            handleSend();
                          }, 50);
                        }}
                        className="w-full flex items-center gap-2.5 p-2.5 rounded-xl text-left hover:bg-[var(--color-bg-secondary)] transition-colors group"
                      >
                        <s.icon
                          className={`w-4 h-4 ${s.color} flex-shrink-0`}
                        />
                        <span className="text-xs text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">
                          {s.text}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-br-md"
                        : "bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] border border-[var(--color-border)] rounded-bl-md"
                    }`}
                  >
                    <div
                      className="whitespace-pre-wrap text-[13px]"
                      dangerouslySetInnerHTML={{
                        __html: msg.content
                          .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                          .replace(/\n/g, "<br/>"),
                      }}
                    />
                  </div>
                </motion.div>
              ))}

              {isProcessing && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-2xl rounded-bl-md px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <div
                        className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-[var(--color-border)]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500/50 transition-all"
                  disabled={isProcessing}
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!input.trim() || isProcessing}
                  className="h-10 w-10 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 text-white flex-shrink-0"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
