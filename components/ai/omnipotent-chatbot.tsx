"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Brain,
  Target,
  ListTodo,
  Wallet,
  BookOpen,
  Timer,
  Zap,
  TrendingUp,
  Calendar,
  Plus,
  Trash2,
  Edit,
  Search,
  Activity,
  ChevronDown,
  ChevronUp,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/context/app-context";
import {
  format,
  parseISO,
  isToday,
  isTomorrow,
  addDays,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
} from "date-fns";
import type {
  Task,
  Habit,
  Goal,
  Transaction,
  JournalEntry,
  TimeEntry,
} from "@/lib/types";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
  actions?: AIAction[];
  status?: "pending" | "success" | "error";
}

interface AIAction {
  type: "create" | "update" | "delete" | "query";
  entity: "task" | "habit" | "goal" | "transaction" | "journal" | "time_entry";
  data?: Record<string, unknown>;
  result?: string;
  status: "pending" | "success" | "error";
}

// Command patterns for intent detection
const INTENT_PATTERNS = {
  CREATE_TASK: /^(add|create|new|make).*task/i,
  CREATE_HABIT: /^(add|create|new|make|start).*habit/i,
  CREATE_GOAL: /^(add|create|new|make|set).*goal/i,
  ADD_EXPENSE: /^(add|log|record).*expense|spent|paid|bought/i,
  ADD_INCOME: /^(add|log|record).*income|received|earned|got paid/i,
  CREATE_JOURNAL: /^(add|create|write|new).*journal|entry|note|log/i,
  LOG_TIME: /^(log|track|record).*time|hours|minutes/i,
  QUERY_TASKS: /^(show|list|what|get|display|find).*tasks?|todo/i,
  QUERY_HABITS: /^(show|list|what|get|display|find).*habits?|streak/i,
  QUERY_GOALS: /^(show|list|what|get|display|find).*goals?|progress/i,
  QUERY_FINANCE:
    /^(show|what|get|how much).*balance|spending|expenses?|income|money|budget|spent/i,
  QUERY_SUMMARY: /^(how am i|what.*status|summary|overview|report|dashboard)/i,
  COMPLETE_TASK: /^(complete|finish|done|check off|mark done).*task/i,
  COMPLETE_HABIT: /^(complete|done|check|mark).*habit/i,
  DELETE: /^(delete|remove|cancel|clear)/i,
  UPDATE: /^(update|edit|change|modify|rename)/i,
  GREETING: /^(hi|hello|hey|good morning|good afternoon|good evening)/i,
  HELP: /^(help|what can you do|commands|features)/i,
  MOTIVATION: /^(motivate|inspire|encourage|i need motivation)/i,
  ANALYSIS: /^(analyze|assess|evaluate|how.*doing)/i,
};

// Parse user input to extract structured data
function parseTaskFromText(text: string): Partial<Task> {
  const result: Partial<Task> = {
    status: "pending",
    priority: "medium",
  };

  // Extract title (remove command words)
  let title = text
    .replace(/^(add|create|new|make|a?)\s*(task)?:?\s*/i, "")
    .trim();

  // Parse priority
  if (/urgent|critical|asap|important/i.test(text)) {
    result.priority = "high";
    title = title
      .replace(/\s*(urgent|critical|asap|important)\s*/i, " ")
      .trim();
  } else if (/low priority|not urgent|whenever/i.test(text)) {
    result.priority = "low";
    title = title
      .replace(/\s*(low priority|not urgent|whenever)\s*/i, " ")
      .trim();
  }

  // Parse due date
  if (/today/i.test(text)) {
    result.dueDate = format(new Date(), "yyyy-MM-dd");
    title = title.replace(/\s*(due\s*)?(today|by today)\s*/i, " ").trim();
  } else if (/tomorrow/i.test(text)) {
    result.dueDate = format(addDays(new Date(), 1), "yyyy-MM-dd");
    title = title.replace(/\s*(due\s*)?(tomorrow|by tomorrow)\s*/i, " ").trim();
  } else if (/next week/i.test(text)) {
    result.dueDate = format(addDays(new Date(), 7), "yyyy-MM-dd");
    title = title
      .replace(/\s*(due\s*)?(next week|by next week)\s*/i, " ")
      .trim();
  }

  // Parse category
  const categoryMatch =
    text.match(/category[:\s]+(\w+)/i) || text.match(/in\s+(\w+)\s+category/i);
  if (categoryMatch) {
    result.category = categoryMatch[1].toLowerCase();
    title = title
      .replace(
        new RegExp(
          `\\s*category[:\\s]+${categoryMatch[1]}|in\\s+${categoryMatch[1]}\\s+category\\s*`,
          "i",
        ),
        " ",
      )
      .trim();
  }

  result.title = title || "New Task";
  return result;
}

function parseHabitFromText(text: string): Partial<Habit> {
  const result: Partial<Habit> = {
    frequency: "daily",
    color: "#10b981",
    targetDays: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"],
    completions: [],
  };

  // Extract name
  let name = text
    .replace(/^(add|create|new|make|start|a?)\s*(habit)?:?\s*/i, "")
    .trim();

  // Parse frequency
  if (/weekly/i.test(text)) {
    result.frequency = "weekly";
    name = name.replace(/\s*weekly\s*/i, " ").trim();
  } else if (/daily/i.test(text)) {
    result.frequency = "daily";
    name = name.replace(/\s*daily\s*/i, " ").trim();
  }

  result.name = name || "New Habit";
  return result;
}

function parseGoalFromText(text: string): Partial<Goal> {
  const result: Partial<Goal> = {
    status: "not-started",
    progress: 0,
    milestones: [],
  };

  // Extract title
  let title = text
    .replace(/^(add|create|new|make|set|a?)\s*(goal)?:?\s*/i, "")
    .trim();

  // Parse category
  if (/fitness|health|exercise|workout/i.test(text)) {
    result.category = "health";
  } else if (/career|work|job|professional/i.test(text)) {
    result.category = "career";
  } else if (/learn|study|education|skill/i.test(text)) {
    result.category = "learning";
  } else if (/finance|money|saving|invest/i.test(text)) {
    result.category = "finance";
  } else if (/relationship|friend|family|social/i.test(text)) {
    result.category = "relationships";
  }

  // Parse deadline
  if (/this month/i.test(text)) {
    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1, 0);
    result.deadline = format(endOfMonth, "yyyy-MM-dd");
    title = title.replace(/\s*(by\s*)?this month\s*/i, " ").trim();
  } else if (/this year|by year end/i.test(text)) {
    result.deadline = format(
      new Date(new Date().getFullYear(), 11, 31),
      "yyyy-MM-dd",
    );
    title = title.replace(/\s*(by\s*)?(this year|year end)\s*/i, " ").trim();
  }

  result.title = title || "New Goal";
  return result;
}

function parseExpenseFromText(
  text: string,
): Partial<Transaction> & { description?: string } {
  const result: Partial<Transaction> & { description?: string } = {
    type: "expense",
    date: format(new Date(), "yyyy-MM-dd"),
  };

  // Extract amount
  const amountMatch = text.match(/\$?(\d+(?:\.\d{2})?)/);
  if (amountMatch) {
    result.amount = parseFloat(amountMatch[1]);
  }

  // Extract category from keywords
  if (
    /food|groceries|restaurant|eating|lunch|dinner|breakfast|coffee/i.test(text)
  ) {
    result.category = "food";
  } else if (/transport|uber|lyft|gas|fuel|bus|train/i.test(text)) {
    result.category = "transport";
  } else if (/entertainment|movie|game|concert|fun/i.test(text)) {
    result.category = "entertainment";
  } else if (/shopping|clothes|amazon|bought/i.test(text)) {
    result.category = "shopping";
  } else if (/bill|utility|rent|electricity|water|internet/i.test(text)) {
    result.category = "bills";
  } else if (/health|doctor|medicine|pharmacy|gym/i.test(text)) {
    result.category = "health";
  } else {
    result.category = "other";
  }

  // Extract description
  let description = text
    .replace(/^(add|log|record|spent|paid|bought)\s*/i, "")
    .trim();
  description = description
    .replace(/\$?\d+(?:\.\d{2})?\s*(on|for)?\s*/i, "")
    .trim();
  result.description = description || `${result.category} expense`;

  return result;
}

export function OmnipotentChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
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
    addJournalEntry,
    completeTask,
    completeHabit,
    deleteTask,
    deleteHabit,
    deleteGoal,
    getHabitStreak,
    getFinanceStats,
    getGoalStats,
  } = useApp();

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  // Get context summary for AI
  const getContextSummary = useCallback(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const todayTasks = tasks.filter(
      (t) => t.dueDate === today && t.status !== "completed",
    );
    const completedToday = tasks.filter(
      (t) => t.completedAt && t.completedAt.startsWith(today),
    ).length;
    const todayHabits = habits.filter(
      (h) => !h.completions.find((c) => c.date === today && c.completed),
    );
    const financeStats = getFinanceStats();
    const goalStats = getGoalStats();

    return {
      date: format(new Date(), "EEEE, MMMM d"),
      tasks: {
        total: tasks.length,
        pending: tasks.filter((t) => t.status === "pending").length,
        todayPending: todayTasks.length,
        completedToday,
        overdue: tasks.filter(
          (t) => t.dueDate && t.dueDate < today && t.status !== "completed",
        ).length,
      },
      habits: {
        total: habits.length,
        pendingToday: todayHabits.length,
        topStreaks: habits.slice(0, 3).map((h) => ({
          name: h.name,
          streak: getHabitStreak(h.id),
        })),
      },
      goals: goalStats,
      finance: {
        balance: financeStats.balance,
        thisMonthExpenses: financeStats.expenses,
        thisMonthIncome: financeStats.income,
      },
      journalEntries: journalEntries.length,
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

  // Process user message and generate response
  const processMessage = useCallback(
    async (userMessage: string) => {
      const context = getContextSummary();
      const actions: AIAction[] = [];
      let response = "";

      // Detect intent
      if (INTENT_PATTERNS.GREETING.test(userMessage)) {
        const greeting =
          new Date().getHours() < 12
            ? "Good morning"
            : new Date().getHours() < 17
              ? "Good afternoon"
              : "Good evening";
        response = `${greeting}! 👋 I'm your AI assistant. You have ${context.tasks.todayPending} tasks and ${context.habits.pendingToday} habits pending today. How can I help you?`;
      } else if (INTENT_PATTERNS.HELP.test(userMessage)) {
        response = `I can help you with:\n\n**Tasks** 📋\n• "Add task: [title]" - Create a new task\n• "Show my tasks" - List pending tasks\n• "Complete task [name]" - Mark as done\n\n**Habits** 💪\n• "Create habit: [name]" - Start tracking\n• "Show my habits" - View all habits\n• "Check off [habit]" - Log completion\n\n**Goals** 🎯\n• "Set goal: [title]" - Create a goal\n• "Goal progress" - See all goals\n\n**Finance** 💰\n• "Spent $50 on food" - Log expense\n• "How much did I spend?" - Get summary\n\n**Analysis** 📊\n• "How am I doing?" - Full assessment\n• "Analyze my productivity" - Deep dive\n\nJust ask naturally - I understand context! ✨`;
      } else if (INTENT_PATTERNS.CREATE_TASK.test(userMessage)) {
        const taskData = parseTaskFromText(userMessage);
        const newTask = addTask({
          title: taskData.title || "New Task",
          description: "",
          status: "pending",
          priority: taskData.priority || "medium",
          dueDate: taskData.dueDate,
          category: taskData.category || "general",
          tags: [],
        });
        actions.push({
          type: "create",
          entity: "task",
          data: newTask as unknown as Record<string, unknown>,
          status: "success",
          result: `Created task "${newTask.title}"`,
        });
        response = `✅ Created task: **${newTask.title}**${taskData.dueDate ? `\n📅 Due: ${format(parseISO(taskData.dueDate), "EEEE, MMM d")}` : ""}${taskData.priority === "high" ? "\n🔴 High priority" : ""}`;
      } else if (INTENT_PATTERNS.CREATE_HABIT.test(userMessage)) {
        const habitData = parseHabitFromText(userMessage);
        const newHabit = addHabit({
          name: habitData.name || "New Habit",
          description: "",
          frequency: habitData.frequency || "daily",
          targetDays: habitData.targetDays || [
            "mon",
            "tue",
            "wed",
            "thu",
            "fri",
            "sat",
            "sun",
          ],
          color: habitData.color || "#10b981",
          icon: "target",
        });
        actions.push({
          type: "create",
          entity: "habit",
          data: newHabit as unknown as Record<string, unknown>,
          status: "success",
          result: `Created habit "${newHabit.name}"`,
        });
        response = `💪 Created habit: **${newHabit.name}**\n📆 Frequency: ${habitData.frequency}\nStart building your streak today! 🔥`;
      } else if (INTENT_PATTERNS.CREATE_GOAL.test(userMessage)) {
        const goalData = parseGoalFromText(userMessage);
        const newGoal = addGoal({
          title: goalData.title || "New Goal",
          description: "",
          category: goalData.category || "personal",
          status: "not-started",
          progress: 0,
          deadline: goalData.deadline,
          milestones: [],
        });
        actions.push({
          type: "create",
          entity: "goal",
          data: newGoal as unknown as Record<string, unknown>,
          status: "success",
          result: `Created goal "${newGoal.title}"`,
        });
        response = `🎯 Created goal: **${newGoal.title}**${goalData.deadline ? `\n📅 Deadline: ${format(parseISO(goalData.deadline), "MMMM d, yyyy")}` : ""}\n\nBreak it down into milestones to track progress!`;
      } else if (INTENT_PATTERNS.ADD_EXPENSE.test(userMessage)) {
        const expenseData = parseExpenseFromText(userMessage);
        if (!expenseData.amount) {
          response =
            '💡 Please include an amount. For example: "Spent $25 on lunch"';
        } else {
          const newTransaction = addTransaction({
            description: expenseData.description || "Expense",
            amount: expenseData.amount,
            type: "expense",
            category: expenseData.category || "other",
            date: expenseData.date || format(new Date(), "yyyy-MM-dd"),
          });
          actions.push({
            type: "create",
            entity: "transaction",
            data: newTransaction as unknown as Record<string, unknown>,
            status: "success",
            result: `Logged expense of $${expenseData.amount}`,
          });
          response = `💸 Logged expense: **$${expenseData.amount}**\n📁 Category: ${expenseData.category}\n💳 Current balance: $${(context.finance.balance - expenseData.amount).toFixed(2)}`;
        }
      } else if (INTENT_PATTERNS.QUERY_TASKS.test(userMessage)) {
        const today = format(new Date(), "yyyy-MM-dd");
        const pendingTasks = tasks
          .filter((t) => t.status !== "completed")
          .slice(0, 8);
        const todayTasks = pendingTasks.filter((t) => t.dueDate === today);
        const overdueTasks = pendingTasks.filter(
          (t) => t.dueDate && t.dueDate < today,
        );
        const upcomingTasks = pendingTasks.filter(
          (t) => t.dueDate && t.dueDate > today,
        );

        if (pendingTasks.length === 0) {
          response = "🎉 You're all caught up! No pending tasks.";
        } else {
          let taskList = `📋 **Your Tasks** (${pendingTasks.length} pending)\n\n`;
          if (overdueTasks.length > 0) {
            taskList += `⚠️ **Overdue (${overdueTasks.length})**\n${overdueTasks.map((t) => `• ${t.title}`).join("\n")}\n\n`;
          }
          if (todayTasks.length > 0) {
            taskList += `📌 **Today (${todayTasks.length})**\n${todayTasks.map((t) => `• ${t.title}`).join("\n")}\n\n`;
          }
          if (upcomingTasks.length > 0) {
            taskList += `📅 **Upcoming**\n${upcomingTasks
              .slice(0, 5)
              .map(
                (t) =>
                  `• ${t.title}${t.dueDate ? ` (${format(parseISO(t.dueDate), "MMM d")})` : ""}`,
              )
              .join("\n")}`;
          }
          response = taskList;
        }
        actions.push({
          type: "query",
          entity: "task",
          status: "success",
          result: `Found ${pendingTasks.length} tasks`,
        });
      } else if (INTENT_PATTERNS.QUERY_HABITS.test(userMessage)) {
        if (habits.length === 0) {
          response =
            'You don\'t have any habits yet. Try "Create habit: Exercise daily" to get started!';
        } else {
          const today = format(new Date(), "yyyy-MM-dd");
          const habitList = habits
            .map((h) => {
              const streak = getHabitStreak(h.id);
              const completedToday = h.completions.find(
                (c) => c.date === today && c.completed,
              );
              return `${completedToday ? "✅" : "⬜"} **${h.name}** - ${streak} day streak 🔥`;
            })
            .join("\n");
          response = `💪 **Your Habits**\n\n${habitList}`;
        }
        actions.push({
          type: "query",
          entity: "habit",
          status: "success",
          result: `Found ${habits.length} habits`,
        });
      } else if (INTENT_PATTERNS.QUERY_GOALS.test(userMessage)) {
        if (goals.length === 0) {
          response =
            'No goals set yet. Try "Set goal: Learn Spanish this year" to create one!';
        } else {
          const goalList = goals
            .slice(0, 5)
            .map((g) => {
              const progressBar =
                "█".repeat(Math.floor(g.progress / 10)) +
                "░".repeat(10 - Math.floor(g.progress / 10));
              return `🎯 **${g.title}**\n   [${progressBar}] ${g.progress}%`;
            })
            .join("\n\n");
          response = `**Your Goals**\n\n${goalList}\n\n${context.goals.completed} of ${context.goals.total} goals completed!`;
        }
        actions.push({
          type: "query",
          entity: "goal",
          status: "success",
          result: `Found ${goals.length} goals`,
        });
      } else if (INTENT_PATTERNS.QUERY_FINANCE.test(userMessage)) {
        const { income, expenses, balance } = context.finance;
        response = `💰 **Financial Summary**\n\n💵 Balance: **$${balance.toFixed(2)}**\n\n📈 This Month:\n• Income: +$${income.toFixed(2)}\n• Expenses: -$${expenses.toFixed(2)}\n• Net: ${income - expenses >= 0 ? "+" : ""}$${(income - expenses).toFixed(2)}\n\n${balance < 0 ? "⚠️ You're in the negative. Consider reviewing expenses." : balance < 100 ? "💡 Balance is low. Watch your spending!" : "✅ Looking good! Keep it up."}`;
        actions.push({
          type: "query",
          entity: "transaction",
          status: "success",
        });
      } else if (
        INTENT_PATTERNS.QUERY_SUMMARY.test(userMessage) ||
        INTENT_PATTERNS.ANALYSIS.test(userMessage)
      ) {
        const {
          tasks: taskStats,
          habits: habitStats,
          goals: goalStats,
          finance,
        } = context;

        // Calculate productivity score
        const taskScore =
          taskStats.total > 0
            ? (taskStats.completedToday /
                Math.max(
                  taskStats.todayPending + taskStats.completedToday,
                  1,
                )) *
              100
            : 50;
        const habitScore =
          habitStats.total > 0
            ? ((habitStats.total - habitStats.pendingToday) /
                habitStats.total) *
              100
            : 50;
        const goalScore = goalStats.total > 0 ? goalStats.avgProgress : 50;
        const overallScore = Math.round(
          (taskScore + habitScore + goalScore) / 3,
        );

        const scoreEmoji =
          overallScore >= 80
            ? "🔥"
            : overallScore >= 60
              ? "💪"
              : overallScore >= 40
                ? "📈"
                : "🌱";

        response = `${scoreEmoji} **Your Life Dashboard**\n\n**Today's Progress**\n• Tasks: ${taskStats.completedToday} done, ${taskStats.todayPending} pending\n• Habits: ${habitStats.total - habitStats.pendingToday}/${habitStats.total} completed\n• Overdue tasks: ${taskStats.overdue}\n\n**Goals** (${goalStats.completed}/${goalStats.total} achieved)\nAverage progress: ${goalStats.avgProgress}%\n\n**Finances**\nBalance: $${finance.balance.toFixed(2)}\n\n**Overall Score: ${overallScore}/100** ${scoreEmoji}\n\n${overallScore >= 70 ? "You're crushing it! Keep the momentum going. 🚀" : overallScore >= 50 ? "Good progress! A few more tasks will boost your score. 💫" : "Room for improvement. Start with one small task! 🌱"}`;
        actions.push({ type: "query", entity: "task", status: "success" });
      } else if (INTENT_PATTERNS.COMPLETE_TASK.test(userMessage)) {
        const taskName = userMessage
          .replace(
            /^(complete|finish|done|check off|mark done)\s*(task)?:?\s*/i,
            "",
          )
          .trim()
          .toLowerCase();
        const matchingTask = tasks.find(
          (t) =>
            t.status !== "completed" &&
            (t.title.toLowerCase().includes(taskName) ||
              t.title.toLowerCase() === taskName),
        );
        if (matchingTask) {
          completeTask(matchingTask.id);
          response = `✅ Completed: **${matchingTask.title}**\n\nGreat job! ${context.tasks.todayPending - 1} tasks remaining today.`;
          actions.push({
            type: "update",
            entity: "task",
            status: "success",
            result: `Completed "${matchingTask.title}"`,
          });
        } else {
          response = `I couldn't find a task matching "${taskName}". Try "Show my tasks" to see your pending tasks.`;
        }
      } else if (INTENT_PATTERNS.COMPLETE_HABIT.test(userMessage)) {
        const habitName = userMessage
          .replace(/^(complete|done|check|mark)\s*(habit)?:?\s*/i, "")
          .trim()
          .toLowerCase();
        const today = format(new Date(), "yyyy-MM-dd");
        const matchingHabit = habits.find(
          (h) =>
            h.name.toLowerCase().includes(habitName) ||
            h.name.toLowerCase() === habitName,
        );
        if (matchingHabit) {
          completeHabit(matchingHabit.id, today);
          const newStreak = getHabitStreak(matchingHabit.id) + 1;
          response = `💪 Logged: **${matchingHabit.name}**\n\n🔥 ${newStreak} day streak! Keep it up!`;
          actions.push({
            type: "update",
            entity: "habit",
            status: "success",
            result: `Logged "${matchingHabit.name}"`,
          });
        } else {
          response = `I couldn't find a habit matching "${habitName}". Try "Show my habits" to see them all.`;
        }
      } else if (INTENT_PATTERNS.MOTIVATION.test(userMessage)) {
        const quotes = [
          "The only way to do great work is to love what you do. – Steve Jobs",
          "Success is not final, failure is not fatal: it is the courage to continue that counts. – Winston Churchill",
          "Believe you can and you're halfway there. – Theodore Roosevelt",
          "The future belongs to those who believe in the beauty of their dreams. – Eleanor Roosevelt",
          "It does not matter how slowly you go as long as you do not stop. – Confucius",
          "Your limitation—it's only your imagination.",
          "Push yourself, because no one else is going to do it for you.",
          "Great things never come from comfort zones.",
          "Dream it. Wish it. Do it.",
          "The harder you work for something, the greater you'll feel when you achieve it.",
        ];
        const quote = quotes[Math.floor(Math.random() * quotes.length)];
        response = `✨ **${quote}**\n\nYou've got this! You have ${context.tasks.completedToday} tasks done today already. ${context.tasks.todayPending > 0 ? `Just ${context.tasks.todayPending} more to go!` : "You're all caught up! 🎉"}`;
      } else {
        // Default helpful response
        response = `I'm not sure I understood that. Here are some things I can help with:\n\n• "Add task: [title]" to create a task\n• "Show my tasks" to see what's pending\n• "How am I doing?" for a progress summary\n• "Spent $X on Y" to log expenses\n• "Help" to see all commands\n\nOr just ask me naturally - I'm getting smarter! 🧠`;
      }

      return { response, actions };
    },
    [
      tasks,
      habits,
      goals,
      transactions,
      addTask,
      addHabit,
      addGoal,
      addTransaction,
      completeTask,
      completeHabit,
      getContextSummary,
      getHabitStreak,
    ],
  );

  // Handle send message
  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);

    // Add thinking indicator
    const thinkingId = `thinking-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      {
        id: thinkingId,
        role: "assistant",
        content: "Thinking...",
        timestamp: new Date().toISOString(),
        status: "pending",
      },
    ]);

    // Process with slight delay for UX
    await new Promise((resolve) => setTimeout(resolve, 500));

    const { response, actions } = await processMessage(input.trim());

    // Replace thinking with actual response
    setMessages((prev) =>
      prev.map((m) =>
        m.id === thinkingId
          ? { ...m, content: response, actions, status: "success" }
          : m,
      ),
    );

    setIsProcessing(false);
  };

  // Keyboard shortcut to open/close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + K to toggle
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
        setIsMinimized(false);
      }
      // Escape to close
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  return (
    <>
      {/* Floating Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            className="fixed bottom-6 right-6 z-50"
          >
            <Button
              onClick={() => setIsOpen(true)}
              className="h-14 w-14 rounded-full shadow-2xl bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white border-0"
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              >
                <Sparkles className="h-6 w-6" />
              </motion.div>
            </Button>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full"
            >
              AI
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
              height: isMinimized ? "auto" : 500,
            }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 dark:border-neutral-800 z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200 dark:border-neutral-800 bg-gradient-to-r from-violet-500/10 to-purple-500/10">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                  <Brain className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">CorteXia AI</h3>
                  <p className="text-xs text-muted-foreground">
                    Your omnipotent assistant
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsMinimized(!isMinimized)}
                >
                  {isMinimized ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages */}
            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.length === 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-center py-8"
                    >
                      <div className="h-16 w-16 mx-auto rounded-full bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center mb-4">
                        <Sparkles className="h-8 w-8 text-violet-500" />
                      </div>
                      <h4 className="font-semibold mb-2">
                        How can I help you?
                      </h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        I can manage your tasks, habits, goals, and more!
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {[
                          {
                            icon: ListTodo,
                            label: "Add task",
                            action: "Add task: ",
                          },
                          {
                            icon: Target,
                            label: "Show goals",
                            action: "Show my goals",
                          },
                          {
                            icon: Activity,
                            label: "My status",
                            action: "How am I doing?",
                          },
                          {
                            icon: Wallet,
                            label: "Finances",
                            action: "Show my balance",
                          },
                        ].map(({ icon: Icon, label, action }) => (
                          <Button
                            key={label}
                            variant="outline"
                            className="h-auto py-2 text-xs justify-start gap-2"
                            onClick={() => {
                              setInput(action);
                              inputRef.current?.focus();
                            }}
                          >
                            <Icon className="h-3 w-3" />
                            {label}
                          </Button>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                          message.role === "user"
                            ? "bg-violet-500 text-white"
                            : "bg-neutral-100 dark:bg-neutral-800"
                        }`}
                      >
                        {message.status === "pending" ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Thinking...</span>
                          </div>
                        ) : (
                          <div className="text-sm whitespace-pre-wrap">
                            {message.content}
                          </div>
                        )}

                        {/* Show action badges */}
                        {message.actions && message.actions.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-neutral-200 dark:border-neutral-700">
                            {message.actions.map((action, i) => (
                              <span
                                key={i}
                                className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                                  action.status === "success"
                                    ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                                    : action.status === "error"
                                      ? "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                                      : "bg-neutral-200 dark:bg-neutral-700"
                                }`}
                              >
                                {action.status === "success" && (
                                  <CheckCircle2 className="h-3 w-3" />
                                )}
                                {action.status === "error" && (
                                  <AlertTriangle className="h-3 w-3" />
                                )}
                                {action.type} {action.entity}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-neutral-200 dark:border-neutral-800">
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && !e.shiftKey && handleSend()
                      }
                      placeholder="Ask anything... (⌘K)"
                      className="flex-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 placeholder:text-muted-foreground"
                    />
                    <Button
                      onClick={handleSend}
                      disabled={!input.trim() || isProcessing}
                      className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white rounded-xl"
                    >
                      {isProcessing ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center mt-2">
                    Press ⌘K to toggle • Type "help" for commands
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
