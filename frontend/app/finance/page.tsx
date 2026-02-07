"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { useApp } from "@/lib/context/app-context";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import {
  Plus,
  DollarSign,
  TrendingUp,
  PiggyBank,
  ShoppingCart,
  Heart,
  Utensils,
  BookOpen,
  Tv,
  Zap,
  CreditCard,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Must match Transaction.category from lib/types.ts
const CATEGORIES: Record<
  string,
  { label: string; icon: typeof DollarSign; color: string }
> = {
  food: {
    label: "Food",
    icon: Utensils,
    color: "text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-300",
  },
  transport: {
    label: "Transport",
    icon: CreditCard,
    color: "text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-300",
  },
  entertainment: {
    label: "Entertainment",
    icon: Tv,
    color: "text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-300",
  },
  health: {
    label: "Health",
    icon: Heart,
    color: "text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-300",
  },
  learning: {
    label: "Learning",
    icon: BookOpen,
    color: "text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-300",
  },
  utilities: {
    label: "Utilities",
    icon: Zap,
    color: "text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-300",
  },
  salary: {
    label: "Salary",
    icon: TrendingUp,
    color: "text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-300",
  },
  shopping: {
    label: "Shopping",
    icon: ShoppingCart,
    color: "text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-300",
  },
  subscription: {
    label: "Subscription",
    icon: CreditCard,
    color: "text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-300",
  },
  other: {
    label: "Other",
    icon: DollarSign,
    color: "text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-300",
  },
};

export default function FinancePage() {
  const { transactions, addTransaction, deleteTransaction, goals } = useApp();
  const [createOpen, setCreateOpen] = useState(false);
  const [view, setView] = useState("this-month");
  const [newTx, setNewTx] = useState({
    description: "",
    amount: "",
    category: "food",
    type: "expense" as "income" | "expense",
  });

  const handleCreate = () => {
    const amount = parseFloat(newTx.amount);
    if (!newTx.description.trim() || isNaN(amount) || amount <= 0) return;
    addTransaction({
      description: newTx.description,
      amount: newTx.type === "expense" ? -Math.abs(amount) : Math.abs(amount),
      category: newTx.category as
        | "food"
        | "transport"
        | "entertainment"
        | "health"
        | "learning"
        | "utilities"
        | "salary"
        | "shopping"
        | "subscription"
        | "other",
      type: newTx.type,
      date: format(new Date(), "yyyy-MM-dd"),
    });
    setNewTx({
      description: "",
      amount: "",
      category: "food",
      type: "expense",
    });
    setCreateOpen(false);
  };

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    return (transactions || [])
      .filter((t) => {
        const d = new Date(t.date);
        if (view === "today") return t.date === format(now, "yyyy-MM-dd");
        if (view === "this-week") return d >= subDays(now, 7);
        if (view === "this-month")
          return d >= startOfMonth(now) && d <= endOfMonth(now);
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, view]);

  const stats = useMemo(() => {
    const income = filteredTransactions
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    const expenses = filteredTransactions
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    const net = income - expenses;

    const categoryBreakdown: Record<string, number> = {};
    filteredTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const cat = t.category || "other";
        categoryBreakdown[cat] =
          (categoryBreakdown[cat] || 0) + Math.abs(t.amount);
      });

    return { income, expenses, net, categoryBreakdown };
  }, [filteredTransactions]);

  const financialGoals = useMemo(() => {
    return (goals || []).filter(
      (g) => g.category === "financial" && g.status !== "completed",
    );
  }, [goals]);

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 pb-12"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Expenses
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] mt-1">
              Track your spending, grow your wealth
            </p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 rounded-xl bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900 shadow-sm">
                <Plus className="w-4 h-4" /> Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Transaction</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <Input
                  placeholder="Description"
                  value={newTx.description}
                  onChange={(e) =>
                    setNewTx({ ...newTx, description: e.target.value })
                  }
                  autoFocus
                />
                <Input
                  type="number"
                  placeholder="Amount"
                  value={newTx.amount}
                  onChange={(e) =>
                    setNewTx({ ...newTx, amount: e.target.value })
                  }
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                      Type
                    </label>
                    <Select
                      value={newTx.type}
                      onValueChange={(v) =>
                        setNewTx({ ...newTx, type: v as "income" | "expense" })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 block">
                      Category
                    </label>
                    <Select
                      value={newTx.category}
                      onValueChange={(v) => setNewTx({ ...newTx, category: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(CATEGORIES).map(([key, val]) => (
                          <SelectItem key={key} value={key}>
                            {val.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!newTx.description.trim() || !newTx.amount}
                  className="bg-gray-900 hover:bg-gray-800 dark:bg-gray-100 dark:hover:bg-gray-200 text-white dark:text-gray-900"
                >
                  Add
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* View Tabs */}
        <Tabs value={view} onValueChange={setView}>
          <TabsList className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)]">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="this-week">This Week</TabsTrigger>
            <TabsTrigger value="this-month">This Month</TabsTrigger>
            <TabsTrigger value="all">All Time</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
              <span className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)] font-medium">
                Income
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              ${stats.income.toFixed(2)}
            </p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <ArrowDownRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
              <span className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)] font-medium">
                Expenses
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              ${stats.expenses.toFixed(2)}
            </p>
          </div>
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <PiggyBank className="w-4 h-4 text-gray-600 dark:text-gray-400" />
              </div>
              <span className="text-xs uppercase tracking-wider text-[var(--color-text-tertiary)] font-medium">
                Net
              </span>
            </div>
            <p
              className={cn(
                "text-2xl font-bold text-gray-900 dark:text-gray-100",
              )}
            >
              ${stats.net.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Category Breakdown */}
        {Object.keys(stats.categoryBreakdown).length > 0 && (
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5">
            <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-4">
              Spending by Category
            </h3>
            <div className="space-y-3">
              {Object.entries(stats.categoryBreakdown)
                .sort(([, a], [, b]) => b - a)
                .map(([cat, amount]) => {
                  const catInfo = CATEGORIES[cat] || CATEGORIES.other;
                  const pct =
                    stats.expenses > 0 ? (amount / stats.expenses) * 100 : 0;
                  return (
                    <div key={cat} className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                          catInfo.color,
                        )}
                      >
                        <catInfo.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-[var(--color-text-primary)]">
                            {catInfo.label}
                          </span>
                          <span className="text-sm font-medium text-[var(--color-text-primary)]">
                            ${amount.toFixed(2)}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--color-border)] overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="h-full rounded-full bg-gray-900 dark:bg-gray-100"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* Financial Goals */}
        {financialGoals.length > 0 && (
          <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-5">
            <h3 className="text-sm font-medium text-[var(--color-text-secondary)] mb-4">
              Financial Goals
            </h3>
            <div className="space-y-3">
              {financialGoals.map((goal) => (
                <div key={goal.id} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {goal.title}
                    </p>
                    <Progress
                      value={goal.progress || 0}
                      className="h-1.5 mt-1"
                    />
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {goal.progress || 0}%
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Transaction List */}
        <div>
          <h2 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">
            Transactions
          </h2>
          <div className="space-y-2">
            <AnimatePresence>
              {filteredTransactions.map((tx) => {
                const catInfo =
                  CATEGORIES[tx.category || "other"] || CATEGORIES.other;
                const isIncome = tx.type === "income";
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center gap-3 p-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl group"
                  >
                    <div
                      className={cn(
                        "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
                        catInfo.color,
                      )}
                    >
                      <catInfo.icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] break-words line-clamp-1">
                        {tx.description}
                      </p>
                      <p className="text-xs text-[var(--color-text-tertiary)]">
                        {format(new Date(tx.date), "MMM d")} · {catInfo.label}
                      </p>
                    </div>
                    <span
                      className={cn(
                        "text-sm font-semibold tabular-nums text-gray-900 dark:text-gray-100",
                      )}
                    >
                      {isIncome ? "+" : "-"}${Math.abs(tx.amount).toFixed(2)}
                    </span>
                    <button
                      onClick={() => deleteTransaction(tx.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-[var(--color-bg-tertiary)] transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
                    </button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {filteredTransactions.length === 0 && (
              <div className="text-center py-12 text-[var(--color-text-tertiary)]">
                <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">
                  No transactions yet. Add your first one above.
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AppLayout>
  );
}
