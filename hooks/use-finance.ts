'use client';

import { useState, useCallback } from 'react';

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
  tags?: string[];
  createdAt: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  period: 'monthly' | 'yearly';
}

const initialTransactions: Transaction[] = [
  {
    id: 't1',
    type: 'income',
    category: 'salary',
    amount: 5000,
    description: 'Monthly salary',
    date: new Date(Date.now() - 5 * 86400000).toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  },
  {
    id: 't2',
    type: 'expense',
    category: 'food',
    amount: 125.50,
    description: 'Groceries',
    date: new Date().toISOString().split('T')[0],
    tags: ['groceries', 'weekly'],
    createdAt: new Date().toISOString(),
  },
  {
    id: 't3',
    type: 'expense',
    category: 'utilities',
    amount: 150,
    description: 'Electricity bill',
    date: new Date(Date.now() - 3 * 86400000).toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  },
  {
    id: 't4',
    type: 'expense',
    category: 'entertainment',
    amount: 45.99,
    description: 'Movie tickets',
    date: new Date(Date.now() - 1 * 86400000).toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  },
  {
    id: 't5',
    type: 'expense',
    category: 'health',
    amount: 89,
    description: 'Gym membership',
    date: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  },
  {
    id: 't6',
    type: 'expense',
    category: 'transport',
    amount: 2.50,
    description: 'Uber ride',
    date: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),
  },
  {
    id: 't7',
    type: 'expense',
    category: 'food',
    amount: 35.75,
    description: 'Restaurant dinner',
    date: new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0],
    tags: ['dining'],
    createdAt: new Date().toISOString(),
  },
];

const initialBudgets: Budget[] = [
  { id: 'b1', category: 'food', limit: 400, spent: 161.25, period: 'monthly' },
  { id: 'b2', category: 'entertainment', limit: 150, spent: 45.99, period: 'monthly' },
  { id: 'b3', category: 'transport', limit: 200, spent: 2.50, period: 'monthly' },
  { id: 'b4', category: 'utilities', limit: 300, spent: 150, period: 'monthly' },
  { id: 'b5', category: 'health', limit: 200, spent: 89, period: 'monthly' },
];

export function useFinance() {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [budgets, setBudgets] = useState<Budget[]>(initialBudgets);

  const addTransaction = useCallback((transaction: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTransaction: Transaction = {
      ...transaction,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => [newTransaction, ...prev]);
    return newTransaction;
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const updateBudget = useCallback((id: string, updates: Partial<Budget>) => {
    setBudgets((prev) =>
      prev.map((budget) => (budget.id === id ? { ...budget, ...updates } : budget))
    );
  }, []);

  const getFinanceStats = useCallback(() => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const monthlyTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const income = monthlyTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthlyTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = income - expenses;

    return { income, expenses, balance };
  }, [transactions]);

  const getExpensesByCategory = useCallback(() => {
    const categories: Record<string, number> = {};
    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
      });
    return categories;
  }, [transactions]);

  const getBudgetStatus = useCallback(() => {
    return budgets.map((b) => ({
      ...b,
      percentage: (b.spent / b.limit) * 100,
      remaining: b.limit - b.spent,
      overBudget: b.spent > b.limit,
    }));
  }, [budgets]);

  return {
    transactions,
    budgets,
    addTransaction,
    deleteTransaction,
    updateBudget,
    getFinanceStats,
    getExpensesByCategory,
    getBudgetStatus,
  };
}
