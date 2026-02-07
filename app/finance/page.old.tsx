"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  format,
  subDays,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  parseISO,
  isWithinInterval,
} from "date-fns";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  Plus,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Target,
  Lightbulb,
  Calendar,
  CreditCard,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  BarChart3,
  Link2,
} from "lucide-react";
import { useApp } from "@/lib/context/app-context";
import { cn } from "@/lib/utils";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// Category configurations with colors and icons
const CATEGORY_CONFIG: Record<
  string,
  { color: string; emoji: string; budget?: number }
> = {
  food: { color: "#F59E0B", emoji: "🍔", budget: 500 },
  transport: { color: "#3B82F6", emoji: "🚗", budget: 200 },
  entertainment: { color: "#8B5CF6", emoji: "🎬", budget: 150 },
  health: { color: "#EF4444", emoji: "💊", budget: 100 },
  learning: { color: "#06B6D4", emoji: "📚", budget: 100 },
  utilities: { color: "#EC4899", emoji: "💡", budget: 300 },
  shopping: { color: "#F97316", emoji: "🛍️", budget: 200 },
  subscriptions: { color: "#6366F1", emoji: "📱", budget: 100 },
  salary: { color: "#10B981", emoji: "💵" },
  freelance: { color: "#22C55E", emoji: "💼" },
  investment: { color: "#14B8A6", emoji: "📈" },
  other: { color: "#9CA3AF", emoji: "📌" },
};

// AI-generated insights based on spending patterns
function generateAIInsights(transactions: any[], goals: any[]) {
  const insights: {
    type: "warning" | "success" | "tip" | "info";
    message: string;
    icon: any;
  }[] = [];

  const thisMonth = transactions.filter((t) => {
    const date = parseISO(t.date);
    return isWithinInterval(date, {
      start: startOfMonth(new Date()),
      end: new Date(),
    });
  });

  const expenses = thisMonth.filter((t) => t.type === "expense");
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
  const income = thisMonth
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  // Spending ratio insight
  if (income > 0 && totalExpenses / income > 0.8) {
    insights.push({
      type: "warning",
      message: `You've spent ${Math.round((totalExpenses / income) * 100)}% of your income this month. Consider reducing expenses.`,
      icon: AlertTriangle,
    });
  } else if (income > 0 && totalExpenses / income < 0.5) {
    insights.push({
      type: "success",
      message: `Great job! You're saving ${Math.round((1 - totalExpenses / income) * 100)}% of your income.`,
      icon: CheckCircle2,
    });
  }

  // Category-specific insights
  const categorySpending: Record<string, number> = {};
  expenses.forEach((t) => {
    categorySpending[t.category] =
      (categorySpending[t.category] || 0) + t.amount;
  });

  Object.entries(categorySpending).forEach(([category, amount]) => {
    const config = CATEGORY_CONFIG[category];
    if (config?.budget && amount > config.budget) {
      insights.push({
        type: "warning",
        message: `${config.emoji} ${category} spending ($${amount.toFixed(0)}) exceeds budget ($${config.budget})`,
        icon: AlertTriangle,
      });
    }
  });

  // Goal-linked insights
  const financialGoals = goals.filter(
    (g) => g.category === "financial" && g.status === "active",
  );
  if (financialGoals.length > 0 && income > totalExpenses) {
    const savings = income - totalExpenses;
    insights.push({
      type: "tip",
      message: `You have $${savings.toFixed(0)} available to put towards your financial goals this month.`,
      icon: Lightbulb,
    });
  }

  if (insights.length === 0) {
    insights.push({
      type: "info",
      message:
        "Track more transactions to get personalized insights about your spending habits.",
      icon: Lightbulb,
    });
  }

  return insights.slice(0, 3);
}

export default function FinancePage() {
  const {
    transactions,
    goals,
    addTransaction,
    deleteTransaction,
    getFinanceStats,
    getExpensesByCategory,
  } = useApp();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<
    "overview" | "transactions" | "budgets"
  >("overview");
  const [dateRange, setDateRange] = useState<"week" | "month" | "year">(
    "month",
  );

  const [formData, setFormData] = useState({
    type: "expense" as "income" | "expense",
    category: "food",
    amount: "",
    description: "",
    date: format(new Date(), "yyyy-MM-dd"),
    linkedGoalId: "",
  });

  const stats = getFinanceStats();
  const expensesByCategory = getExpensesByCategory();

  // Filter transactions by date range
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (dateRange) {
      case "week":
        startDate = subDays(now, 7);
        break;
      case "month":
        startDate = startOfMonth(now);
        break;
      case "year":
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
    }

    return transactions.filter((t) => {
      const date = parseISO(t.date);
      return date >= startDate && date <= now;
    });
  }, [transactions, dateRange]);

  // Category chart data
  const categoryData = useMemo(() => {
    const filtered = filteredTransactions.filter((t) => t.type === "expense");
    const byCategory: Record<string, number> = {};
    filtered.forEach((t) => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    });

    return Object.entries(byCategory)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: CATEGORY_CONFIG[name]?.color || "#9CA3AF",
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  // Daily spending trend data
  const trendData = useMemo(() => {
    const days = dateRange === "week" ? 7 : dateRange === "month" ? 30 : 365;
    const dates = eachDayOfInterval({
      start: subDays(new Date(), days - 1),
      end: new Date(),
    });

    return dates.map((date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      const dayTransactions = transactions.filter((t) => t.date === dateStr);
      const income = dayTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);
      const expenses = dayTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        date: format(date, dateRange === "year" ? "MMM" : "MMM d"),
        income,
        expenses,
      };
    });
  }, [transactions, dateRange]);

  // Budget tracking
  const budgetData = useMemo(() => {
    const thisMonthExpenses = filteredTransactions.filter(
      (t) => t.type === "expense",
    );
    const byCategory: Record<string, number> = {};
    thisMonthExpenses.forEach((t) => {
      byCategory[t.category] = (byCategory[t.category] || 0) + t.amount;
    });

    return Object.entries(CATEGORY_CONFIG)
      .filter(([_, config]) => config.budget)
      .map(([category, config]) => ({
        category,
        emoji: config.emoji,
        spent: byCategory[category] || 0,
        budget: config.budget!,
        percentage: Math.min(
          100,
          Math.round(((byCategory[category] || 0) / config.budget!) * 100),
        ),
        color: config.color,
      }));
  }, [filteredTransactions]);

  // AI Insights
  const aiInsights = useMemo(
    () => generateAIInsights(transactions, goals),
    [transactions, goals],
  );

  // Financial goals
  const financialGoals = goals.filter((g) => g.category === "financial");

  const handleSubmit = () => {
    if (!formData.description.trim() || !formData.amount) return;

    addTransaction({
      ...formData,
      amount: parseFloat(formData.amount),
      linkedGoalId: formData.linkedGoalId || undefined,
    });

    setFormData({
      type: "expense",
      category: "food",
      amount: "",
      description: "",
      date: format(new Date(), "yyyy-MM-dd"),
      linkedGoalId: "",
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
              <DollarSign className="h-6 w-6 text-green-500" />
              Finance
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Track income, expenses, and achieve your financial goals
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Date Range Filter */}
            <Select
              value={dateRange}
              onValueChange={(v) => setDateRange(v as any)}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white border-0">
                  <Plus className="h-4 w-4" />
                  Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Transaction</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  {/* Transaction Type Toggle */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          type: "expense",
                          category: "food",
                        })
                      }
                      className={cn(
                        "p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all",
                        formData.type === "expense"
                          ? "border-red-500 bg-red-50 dark:bg-red-950/30 text-red-600"
                          : "border-neutral-200 dark:border-neutral-700",
                      )}
                    >
                      <ArrowUpRight className="h-4 w-4" />
                      Expense
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({
                          ...formData,
                          type: "income",
                          category: "salary",
                        })
                      }
                      className={cn(
                        "p-3 rounded-lg border-2 flex items-center justify-center gap-2 transition-all",
                        formData.type === "income"
                          ? "border-green-500 bg-green-50 dark:bg-green-950/30 text-green-600"
                          : "border-neutral-200 dark:border-neutral-700",
                      )}
                    >
                      <ArrowDownLeft className="h-4 w-4" />
                      Income
                    </button>
                  </div>

                  {/* Category */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Category
                    </label>
                    <Select
                      value={formData.category}
                      onValueChange={(v) =>
                        setFormData({ ...formData, category: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORY_CONFIG)
                          .filter(([key]) => {
                            if (formData.type === "income") {
                              return [
                                "salary",
                                "freelance",
                                "investment",
                                "other",
                              ].includes(key);
                            }
                            return ![
                              "salary",
                              "freelance",
                              "investment",
                            ].includes(key);
                          })
                          .map(([key, { emoji }]) => (
                            <SelectItem key={key} value={key}>
                              {emoji}{" "}
                              {key.charAt(0).toUpperCase() + key.slice(1)}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Amount
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData({ ...formData, amount: e.target.value })
                        }
                        className="pl-9 text-lg"
                        step="0.01"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Description
                    </label>
                    <Input
                      placeholder="What was this for?"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* Date */}
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-muted-foreground">
                      Date
                    </label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                    />
                  </div>

                  {/* Link to Financial Goal */}
                  {financialGoals.length > 0 && formData.type === "expense" && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                        <Link2 className="h-3 w-3" />
                        Link to Goal
                      </label>
                      <Select
                        value={formData.linkedGoalId || "none"}
                        onValueChange={(v) =>
                          setFormData({
                            ...formData,
                            linkedGoalId: v === "none" ? "" : v,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Optional" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No linked goal</SelectItem>
                          {financialGoals.map((goal) => (
                            <SelectItem key={goal.id} value={goal.id}>
                              🎯 {goal.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <Button onClick={handleSubmit} className="w-full">
                    Add Transaction
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </motion.div>

        {/* AI Insights Strip */}
        <motion.div
          variants={itemVariants}
          className="flex gap-3 overflow-x-auto pb-2"
        >
          {aiInsights.map((insight, i) => {
            const Icon = insight.icon;
            return (
              <div
                key={i}
                className={cn(
                  "flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-sm",
                  insight.type === "warning" &&
                    "bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800",
                  insight.type === "success" &&
                    "bg-green-50 dark:bg-green-950/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800",
                  insight.type === "tip" &&
                    "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800",
                  insight.type === "info" &&
                    "bg-neutral-50 dark:bg-neutral-900 text-neutral-700 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800",
                )}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{insight.message}</span>
              </div>
            );
          })}
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          variants={itemVariants}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3"
        >
          <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-1">
              <ArrowDownLeft className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-semibold text-green-600 dark:text-green-400">
              ${stats.income.toFixed(0)}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">
              Income
            </div>
          </div>
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-1">
              <ArrowUpRight className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-2xl font-semibold text-red-600 dark:text-red-400">
              ${stats.expenses.toFixed(0)}
            </div>
            <div className="text-xs text-red-600 dark:text-red-400">
              Expenses
            </div>
          </div>
          <div
            className={cn(
              "p-4 rounded-xl border",
              stats.balance >= 0
                ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800"
                : "bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800",
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              <Wallet
                className="h-4 w-4"
                style={{ color: stats.balance >= 0 ? "#10B981" : "#F97316" }}
              />
            </div>
            <div
              className={cn(
                "text-2xl font-semibold",
                stats.balance >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-orange-600 dark:text-orange-400",
              )}
            >
              ${Math.abs(stats.balance).toFixed(0)}
            </div>
            <div
              className={cn(
                "text-xs",
                stats.balance >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-orange-600 dark:text-orange-400",
              )}
            >
              {stats.balance >= 0 ? "Balance" : "Deficit"}
            </div>
          </div>
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-1">
              <PiggyBank className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
              {stats.income > 0
                ? Math.round(
                    ((stats.income - stats.expenses) / stats.income) * 100,
                  )
                : 0}
              %
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              Savings Rate
            </div>
          </div>
        </motion.div>

        {/* View Toggle */}
        <motion.div variants={itemVariants} className="flex gap-2">
          {["overview", "transactions", "budgets"].map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode as any)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                viewMode === mode
                  ? "bg-green-500 text-white"
                  : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700",
              )}
            >
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </motion.div>

        {/* Content based on view */}
        <AnimatePresence mode="wait">
          {viewMode === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid md:grid-cols-2 gap-6"
            >
              {/* Spending Trend */}
              <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  Spending Trend
                </h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient
                          id="incomeGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#22c55e"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#22c55e"
                            stopOpacity={0}
                          />
                        </linearGradient>
                        <linearGradient
                          id="expenseGrad"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="#ef4444"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="#ef4444"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(value: number) => `$${value.toFixed(2)}`}
                      />
                      <Area
                        type="monotone"
                        dataKey="income"
                        stroke="#22c55e"
                        fill="url(#incomeGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="expenses"
                        stroke="#ef4444"
                        fill="url(#expenseGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <h3 className="font-medium mb-4 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  Spending by Category
                </h3>
                {categoryData.length > 0 ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: number) => `$${value.toFixed(2)}`}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                    No expense data to display
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {categoryData.slice(0, 5).map((cat) => (
                    <div
                      key={cat.name}
                      className="flex items-center gap-1.5 text-xs"
                    >
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span>{cat.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {viewMode === "transactions" && (
            <motion.div
              key="transactions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-2"
            >
              {filteredTransactions.length === 0 ? (
                <div className="text-center py-12 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-dashed border-neutral-200 dark:border-neutral-800">
                  <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No transactions in this period
                  </p>
                </div>
              ) : (
                filteredTransactions.map((transaction) => {
                  const categoryConfig = CATEGORY_CONFIG[
                    transaction.category
                  ] || { emoji: "📌", color: "#9CA3AF" };
                  return (
                    <motion.div
                      key={transaction.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-3 p-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 transition-colors"
                    >
                      <div
                        className="h-10 w-10 rounded-full flex items-center justify-center text-lg"
                        style={{ backgroundColor: `${categoryConfig.color}20` }}
                      >
                        {categoryConfig.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {transaction.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <span className="capitalize">
                            {transaction.category}
                          </span>
                          <span>•</span>
                          <span>
                            {format(parseISO(transaction.date), "MMM d")}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            "font-semibold",
                            transaction.type === "income"
                              ? "text-green-500"
                              : "text-red-500",
                          )}
                        >
                          {transaction.type === "income" ? "+" : "-"}$
                          {transaction.amount.toFixed(2)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                          onClick={() => deleteTransaction(transaction.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}

          {viewMode === "budgets" && (
            <motion.div
              key="budgets"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {budgetData.map((budget) => (
                <div
                  key={budget.category}
                  className="p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{budget.emoji}</span>
                      <span className="font-medium capitalize">
                        {budget.category}
                      </span>
                    </div>
                    <div className="text-sm">
                      <span
                        className={cn(
                          "font-semibold",
                          budget.percentage >= 100
                            ? "text-red-500"
                            : budget.percentage >= 80
                              ? "text-amber-500"
                              : "text-green-500",
                        )}
                      >
                        ${budget.spent.toFixed(0)}
                      </span>
                      <span className="text-muted-foreground">
                        {" "}
                        / ${budget.budget}
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <Progress
                      value={budget.percentage}
                      className={cn(
                        "h-2",
                        budget.percentage >= 100 && "[&>div]:bg-red-500",
                        budget.percentage >= 80 &&
                          budget.percentage < 100 &&
                          "[&>div]:bg-amber-500",
                      )}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-1 text-xs text-muted-foreground">
                    <span>{budget.percentage}% used</span>
                    <span>
                      ${Math.max(0, budget.budget - budget.spent).toFixed(0)}{" "}
                      remaining
                    </span>
                  </div>
                </div>
              ))}

              {budgetData.length === 0 && (
                <div className="text-center py-12 rounded-xl bg-neutral-50 dark:bg-neutral-900 border border-dashed border-neutral-200 dark:border-neutral-800">
                  <PiggyBank className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No budgets configured</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AppLayout>
  );
}
