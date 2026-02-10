"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { DollarSign, TrendingDown, ArrowRight } from "lucide-react";
import { format } from "date-fns";
import type { Transaction } from "@/lib/types";

interface WidgetTodayExpenseProps {
    transactions: Transaction[];
    today: string;
}

export function WidgetTodayExpense({
    transactions,
    today,
}: WidgetTodayExpenseProps) {
    const todayExpenses = useMemo(() => {
        return transactions.filter(
            (t) => t.type === "expense" && t.date === today,
        );
    }, [transactions, today]);

    const totalExpense = useMemo(() => {
        return todayExpenses.reduce((sum, t) => sum + t.amount, 0);
    }, [todayExpenses]);

    const categoryBreakdown = useMemo(() => {
        const breakdown: Record<string, number> = {};
        todayExpenses.forEach((t) => {
            breakdown[t.category] = (breakdown[t.category] || 0) + t.amount;
        });
        return Object.entries(breakdown)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3);
    }, [todayExpenses]);

    const categoryIcons: Record<string, string> = {
        food: "🍔",
        transport: "🚗",
        entertainment: "🎬",
        health: "💊",
        learning: "📚",
        utilities: "💡",
        shopping: "🛍️",
        subscription: "📱",
        other: "💰",
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="h-full flex flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-4 sm:p-5 hover:shadow-sm transition-shadow"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
                        Today's Expenses
                    </h3>
                </div>
                <Link
                    href="/finance"
                    className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors flex items-center gap-1"
                >
                    View all
                    <ArrowRight className="w-3 h-3" />
                </Link>
            </div>

            {/* Total */}
            <div className="mb-4">
                <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-[var(--color-text-primary)]">
                        ${totalExpense.toFixed(2)}
                    </span>
                    <span className="text-xs text-[var(--color-text-tertiary)]">
                        {todayExpenses.length} transaction{todayExpenses.length !== 1 ? "s" : ""}
                    </span>
                </div>
            </div>

            {/* Category Breakdown */}
            <div className="flex-1 space-y-2">
                {categoryBreakdown.length > 0 ? (
                    <>
                        <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">
                            Top Categories
                        </p>
                        {categoryBreakdown.map(([category, amount]) => (
                            <div
                                key={category}
                                className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-[var(--color-bg-primary)] transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-base">
                                        {categoryIcons[category] || "💰"}
                                    </span>
                                    <span className="text-xs text-[var(--color-text-primary)] capitalize">
                                        {category}
                                    </span>
                                </div>
                                <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                                    ${amount.toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center py-6">
                        <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                            <DollarSign className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                        </div>
                        <p className="text-xs text-[var(--color-text-tertiary)]">
                            No expenses today
                        </p>
                        <p className="text-[10px] text-[var(--color-text-tertiary)] mt-1">
                            Great job saving!
                        </p>
                    </div>
                )}
            </div>

            {/* Footer - Quick Add */}
            <Link
                href="/finance"
                className="mt-3 pt-3 border-t border-[var(--color-border)] text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors text-center"
            >
                + Add expense
            </Link>
        </motion.div>
    );
}
