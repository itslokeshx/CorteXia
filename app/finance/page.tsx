"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { Badge } from "@/components/ui/badge";
import {
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Plus,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useApp } from "@/lib/context/app-context";
import { cn } from "@/lib/utils";

const CATEGORY_COLORS: Record<string, string> = {
  food: "#F59E0B",
  transport: "#3B82F6",
  entertainment: "#8B5CF6",
  health: "#EF4444",
  learning: "#06B6D4",
  utilities: "#EC4899",
  salary: "#10B981",
};

export default function FinancePage() {
  const {
    transactions,
    addTransaction,
    deleteTransaction,
    getFinanceStats,
    getExpensesByCategory,
    getBudgetStatus,
  } = useApp();
  const [open, setOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<"income" | "expense">(
    "expense",
  );
  const [newTransaction, setNewTransaction] = useState({
    type: "expense" as const,
    category: "food",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
  });

  const stats = getFinanceStats();
  const expensesByCategory = getExpensesByCategory();
  const budgetStatus = getBudgetStatus("food");

  const categoryData = Object.entries(expensesByCategory).map(
    ([category, amount]) => ({
      name: category.charAt(0).toUpperCase() + category.slice(1),
      value: amount,
      color: CATEGORY_COLORS[category] || "#9CA3AF",
    }),
  );

  const handleAddTransaction = () => {
    if (newTransaction.description.trim() && newTransaction.amount) {
      addTransaction({
        ...newTransaction,
        amount: parseFloat(newTransaction.amount),
      });
      setNewTransaction({
        type: transactionType,
        category: "food",
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
      });
      setOpen(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6 pb-24">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Finance</h1>
            <p className="text-muted-foreground text-sm md:text-base mt-1">
              Track income, expenses, and manage your budget
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Transaction
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-4 sm:mx-auto">
              <DialogHeader>
                <DialogTitle>Add Transaction</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Select
                  value={transactionType}
                  onValueChange={(v) => {
                    setTransactionType(v as any);
                    setNewTransaction({ ...newTransaction, type: v as any });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>

                {transactionType === "expense" && (
                  <Select
                    value={newTransaction.category}
                    onValueChange={(v) =>
                      setNewTransaction({ ...newTransaction, category: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="transport">Transport</SelectItem>
                      <SelectItem value="entertainment">
                        Entertainment
                      </SelectItem>
                      <SelectItem value="health">Health</SelectItem>
                      <SelectItem value="learning">Learning</SelectItem>
                      <SelectItem value="utilities">Utilities</SelectItem>
                    </SelectContent>
                  </Select>
                )}

                <Input
                  type="number"
                  placeholder="Amount"
                  value={newTransaction.amount}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      amount: e.target.value,
                    })
                  }
                  step="0.01"
                />
                <Input
                  placeholder="Description"
                  value={newTransaction.description}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      description: e.target.value,
                    })
                  }
                />
                <Input
                  type="date"
                  value={newTransaction.date}
                  onChange={(e) =>
                    setNewTransaction({
                      ...newTransaction,
                      date: e.target.value,
                    })
                  }
                />
                <Button onClick={handleAddTransaction} className="w-full">
                  Add Transaction
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-4 md:pt-6 px-4 md:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Income
                  </p>
                  <div className="text-xl md:text-3xl font-bold text-emerald-500">
                    ${stats.income.toFixed(2)}
                  </div>
                </div>
                <ArrowDownLeft className="h-6 w-6 md:h-8 md:w-8 text-emerald-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4 md:pt-6 px-4 md:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Expenses
                  </p>
                  <div className="text-xl md:text-3xl font-bold text-red-500">
                    ${stats.expenses.toFixed(2)}
                  </div>
                </div>
                <ArrowUpRight className="h-6 w-6 md:h-8 md:w-8 text-red-500 opacity-20" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4 md:pt-6 px-4 md:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Balance
                  </p>
                  <div
                    className={cn(
                      "text-xl md:text-3xl font-bold",
                      stats.balance >= 0 ? "text-emerald-500" : "text-red-500",
                    )}
                  >
                    ${stats.balance.toFixed(2)}
                  </div>
                </div>
                <DollarSign className="h-6 w-6 md:h-8 md:w-8 opacity-20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        {categoryData.length > 0 && (
          <Card className="border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base md:text-lg">
                Spending by Category
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full h-48 md:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) =>
                        `${name}: $${value.toFixed(0)}`
                      }
                      outerRadius={60}
                      fill="#8884d8"
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
            </CardContent>
          </Card>
        )}

        {/* Recent Transactions */}
        <Card className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base md:text-lg">
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <p className="text-muted-foreground text-center py-6 md:py-8 text-sm">
                No transactions yet.
              </p>
            ) : (
              <div className="space-y-2">
                {transactions.slice(0, 10).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-2.5 md:p-3 rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm md:text-base truncate">
                        {transaction.description}
                      </p>
                      <p className="text-[10px] md:text-xs text-muted-foreground capitalize">
                        {transaction.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                      <span
                        className={cn(
                          "font-semibold text-sm md:text-base",
                          transaction.type === "income"
                            ? "text-emerald-500"
                            : "text-red-500",
                        )}
                      >
                        {transaction.type === "income" ? "+" : "-"}$
                        {transaction.amount.toFixed(2)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTransaction(transaction.id)}
                        className="h-7 w-7 md:h-8 md:w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
