'use client';

import { useState, useCallback } from 'react';

export interface TimeEntry {
  id: string;
  task: string;
  category: 'work' | 'study' | 'health' | 'personal';
  duration: number; // in minutes
  date: string;
  focusQuality: 'deep' | 'moderate' | 'shallow';
  interruptions: number;
  notes?: string;
  createdAt: string;
}

const initialTimeEntries: TimeEntry[] = [
  {
    id: 'te1',
    task: 'Project development',
    category: 'work',
    duration: 120,
    date: new Date().toISOString().split('T')[0],
    focusQuality: 'deep',
    interruptions: 0,
    notes: 'Good focus session',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'te2',
    task: 'Email and communication',
    category: 'work',
    duration: 45,
    date: new Date().toISOString().split('T')[0],
    focusQuality: 'shallow',
    interruptions: 8,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'te3',
    task: 'React learning',
    category: 'study',
    duration: 90,
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    focusQuality: 'deep',
    interruptions: 2,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'te4',
    task: 'Exercise',
    category: 'health',
    duration: 60,
    date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    focusQuality: 'moderate',
    interruptions: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'te5',
    task: 'Meetings',
    category: 'work',
    duration: 75,
    date: new Date(Date.now() - 172800000).toISOString().split('T')[0],
    focusQuality: 'shallow',
    interruptions: 5,
    createdAt: new Date().toISOString(),
  },
];

export function useTimeTracking() {
  const [entries, setEntries] = useState<TimeEntry[]>(initialTimeEntries);

  const addEntry = useCallback((entry: Omit<TimeEntry, 'id' | 'createdAt'>) => {
    const newEntry: TimeEntry = {
      ...entry,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setEntries((prev) => [newEntry, ...prev]);
    return newEntry;
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setEntries((prev) => prev.filter((entry) => entry.id !== id));
  }, []);

  const getWeeklyStats = useCallback(() => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const weeklyEntries = entries.filter((e) => {
      const date = new Date(e.date);
      return date >= weekStart && date <= weekEnd;
    });

    const byCategory: Record<string, number> = {};
    const byFocusQuality: Record<string, number> = {};
    
    weeklyEntries.forEach((e) => {
      byCategory[e.category] = (byCategory[e.category] || 0) + e.duration;
      byFocusQuality[e.focusQuality] = (byFocusQuality[e.focusQuality] || 0) + e.duration;
    });

    const totalMinutes = weeklyEntries.reduce((sum, e) => sum + e.duration, 0);
    const avgInterruptions = weeklyEntries.length > 0
      ? Math.round(weeklyEntries.reduce((sum, e) => sum + e.interruptions, 0) / weeklyEntries.length)
      : 0;

    return { byCategory, byFocusQuality, totalMinutes, avgInterruptions, dayCount: weeklyEntries.length };
  }, [entries]);

  const getTodayStats = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const todayEntries = entries.filter((e) => e.date === today);
    
    const totalMinutes = todayEntries.reduce((sum, e) => sum + e.duration, 0);
    const deepFocus = todayEntries
      .filter((e) => e.focusQuality === 'deep')
      .reduce((sum, e) => sum + e.duration, 0);
    const totalInterruptions = todayEntries.reduce((sum, e) => sum + e.interruptions, 0);

    return { totalMinutes, deepFocus, totalInterruptions, entries: todayEntries };
  }, [entries]);

  const getFocusQualityBreakdown = useCallback(() => {
    const breakdown: Record<string, { minutes: number; percentage: number }> = {
      deep: { minutes: 0, percentage: 0 },
      moderate: { minutes: 0, percentage: 0 },
      shallow: { minutes: 0, percentage: 0 },
    };

    entries.forEach((e) => {
      breakdown[e.focusQuality].minutes += e.duration;
    });

    const total = Object.values(breakdown).reduce((sum, b) => sum + b.minutes, 0);
    Object.keys(breakdown).forEach((key) => {
      breakdown[key].percentage = total > 0 ? (breakdown[key].minutes / total) * 100 : 0;
    });

    return breakdown;
  }, [entries]);

  return {
    entries,
    addEntry,
    deleteEntry,
    getWeeklyStats,
    getTodayStats,
    getFocusQualityBreakdown,
  };
}
