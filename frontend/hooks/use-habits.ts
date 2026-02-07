'use client';

import { useState, useCallback } from 'react';

export interface Habit {
  id: string;
  name: string;
  description?: string;
  category: 'health' | 'productivity' | 'learning' | 'fitness' | 'mindfulness' | 'social';
  frequency: 'daily' | 'weekly' | 'custom';
  targetDays?: number; // per week for weekly habits
  color: string;
  streak: number;
  longestStreak: number;
  completions: { date: string; completed: boolean }[];
  createdAt: string;
  active: boolean;
}

const initialHabits: Habit[] = [
  {
    id: 'h1',
    name: 'Morning meditation',
    description: '10 minutes of meditation',
    category: 'mindfulness',
    frequency: 'daily',
    color: '#8B5CF6',
    streak: 12,
    longestStreak: 45,
    completions: Array.from({ length: 90 }, (_, i) => ({
      date: new Date(Date.now() - (90 - i) * 86400000).toISOString().split('T')[0],
      completed: Math.random() > 0.2,
    })),
    createdAt: new Date(Date.now() - 100 * 86400000).toISOString(),
    active: true,
  },
  {
    id: 'h2',
    name: 'Exercise',
    description: '30 minutes of physical activity',
    category: 'fitness',
    frequency: 'daily',
    color: '#10B981',
    streak: 5,
    longestStreak: 21,
    completions: Array.from({ length: 90 }, (_, i) => ({
      date: new Date(Date.now() - (90 - i) * 86400000).toISOString().split('T')[0],
      completed: Math.random() > 0.4,
    })),
    createdAt: new Date(Date.now() - 150 * 86400000).toISOString(),
    active: true,
  },
  {
    id: 'h3',
    name: 'Read for 20 minutes',
    description: 'Learning and personal development',
    category: 'learning',
    frequency: 'daily',
    color: '#06B6D4',
    streak: 8,
    longestStreak: 30,
    completions: Array.from({ length: 90 }, (_, i) => ({
      date: new Date(Date.now() - (90 - i) * 86400000).toISOString().split('T')[0],
      completed: Math.random() > 0.35,
    })),
    createdAt: new Date(Date.now() - 120 * 86400000).toISOString(),
    active: true,
  },
  {
    id: 'h4',
    name: 'Journaling',
    description: 'Reflect on the day',
    category: 'mindfulness',
    frequency: 'daily',
    color: '#F59E0B',
    streak: 3,
    longestStreak: 14,
    completions: Array.from({ length: 90 }, (_, i) => ({
      date: new Date(Date.now() - (90 - i) * 86400000).toISOString().split('T')[0],
      completed: Math.random() > 0.5,
    })),
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    active: true,
  },
  {
    id: 'h5',
    name: 'Code review',
    frequency: 'weekly',
    targetDays: 2,
    category: 'productivity',
    color: '#3B82F6',
    streak: 2,
    longestStreak: 8,
    completions: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (30 - i) * 86400000).toISOString().split('T')[0],
      completed: Math.random() > 0.3,
    })),
    createdAt: new Date(Date.now() - 200 * 86400000).toISOString(),
    active: true,
  },
];

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>(initialHabits);

  const addHabit = useCallback(
    (habit: Omit<Habit, 'id' | 'streak' | 'longestStreak' | 'completions' | 'createdAt'>) => {
      const newHabit: Habit = {
        ...habit,
        id: Date.now().toString(),
        streak: 0,
        longestStreak: 0,
        completions: [],
        createdAt: new Date().toISOString(),
      };
      setHabits((prev) => [newHabit, ...prev]);
      return newHabit;
    },
    []
  );

  const updateHabit = useCallback((id: string, updates: Partial<Habit>) => {
    setHabits((prev) =>
      prev.map((habit) => (habit.id === id ? { ...habit, ...updates } : habit))
    );
  }, []);

  const deleteHabit = useCallback((id: string) => {
    setHabits((prev) => prev.filter((habit) => habit.id !== id));
  }, []);

  const toggleHabitCompletion = useCallback(
    (id: string, date: string) => {
      setHabits((prev) =>
        prev.map((habit) => {
          if (habit.id === id) {
            const completions = [...habit.completions];
            const existing = completions.find((c) => c.date === date);
            if (existing) {
              existing.completed = !existing.completed;
            } else {
              completions.push({ date, completed: true });
            }
            return { ...habit, completions };
          }
          return habit;
        })
      );
    },
    []
  );

  const getHabitsByCategory = useCallback(
    (category: string) => habits.filter((h) => h.category === category),
    [habits]
  );

  const getCompletionRate = useCallback(
    (id: string, days: number = 30) => {
      const habit = habits.find((h) => h.id === id);
      if (!habit) return 0;
      const completed = habit.completions
        .slice(-days)
        .filter((c) => c.completed).length;
      return (completed / days) * 100;
    },
    [habits]
  );

  const getHabitStats = useCallback(() => {
    const totalHabits = habits.length;
    const activeStreaks = habits.filter((h) => h.streak > 0).length;
    const avgStreak = habits.length > 0
      ? Math.round(habits.reduce((acc, h) => acc + h.streak, 0) / habits.length)
      : 0;
    const todayCompleted = habits.filter((h) => {
      const today = new Date().toISOString().split('T')[0];
      return h.completions.find((c) => c.date === today && c.completed);
    }).length;
    return { totalHabits, activeStreaks, avgStreak, todayCompleted };
  }, [habits]);

  return {
    habits,
    addHabit,
    updateHabit,
    deleteHabit,
    toggleHabitCompletion,
    getHabitsByCategory,
    getCompletionRate,
    getHabitStats,
  };
}
