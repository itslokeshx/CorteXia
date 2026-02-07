'use client';

import { useState, useCallback } from 'react';

export interface Milestone {
  id: string;
  title: string;
  targetDate: string;
  completed: boolean;
  completedDate?: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'career' | 'health' | 'learning' | 'finance' | 'personal';
  priority: 'high' | 'medium' | 'low';
  targetDate: string;
  progress: number; // 0-100
  status: 'active' | 'paused' | 'completed';
  milestones: Milestone[];
  createdAt: string;
  completedAt?: string;
}

const initialGoals: Goal[] = [
  {
    id: 'g1',
    title: 'Learn Advanced React',
    description: 'Master React 19 features, hooks, and performance optimization',
    category: 'learning',
    priority: 'high',
    targetDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    progress: 45,
    status: 'active',
    milestones: [
      { id: 'm1', title: 'Complete hooks course', targetDate: new Date(Date.now() + 20 * 86400000).toISOString().split('T')[0], completed: true, completedDate: new Date().toISOString() },
      { id: 'm2', title: 'Build 3 projects', targetDate: new Date(Date.now() + 50 * 86400000).toISOString().split('T')[0], completed: false },
      { id: 'm3', title: 'Read official docs', targetDate: new Date(Date.now() + 35 * 86400000).toISOString().split('T')[0], completed: false },
    ],
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
  {
    id: 'g2',
    title: 'Run a 5K in under 25 minutes',
    description: 'Improve running speed and endurance',
    category: 'health',
    priority: 'high',
    targetDate: new Date(Date.now() + 120 * 86400000).toISOString().split('T')[0],
    progress: 60,
    status: 'active',
    milestones: [
      { id: 'm4', title: 'Run 5K in 30 minutes', targetDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0], completed: true, completedDate: new Date().toISOString() },
      { id: 'm5', title: 'Run 5K in 27 minutes', targetDate: new Date(Date.now() + 75 * 86400000).toISOString().split('T')[0], completed: false },
      { id: 'm6', title: 'Run 5K in 25 minutes', targetDate: new Date(Date.now() + 120 * 86400000).toISOString().split('T')[0], completed: false },
    ],
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'g3',
    title: 'Save $10,000',
    description: 'Build emergency fund and start investing',
    category: 'finance',
    priority: 'high',
    targetDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0],
    progress: 35,
    status: 'active',
    milestones: [
      { id: 'm7', title: 'Save $2,500', targetDate: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0], completed: true, completedDate: new Date().toISOString() },
      { id: 'm8', title: 'Save $5,000', targetDate: new Date(Date.now() + 200 * 86400000).toISOString().split('T')[0], completed: false },
      { id: 'm9', title: 'Save $10,000', targetDate: new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0], completed: false },
    ],
    createdAt: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    id: 'g4',
    title: 'Get Promoted',
    description: 'Demonstrate leadership and technical expertise',
    category: 'career',
    priority: 'medium',
    targetDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
    progress: 40,
    status: 'active',
    milestones: [
      { id: 'm10', title: 'Lead a project', targetDate: new Date(Date.now() + 60 * 86400000).toISOString().split('T')[0], completed: false },
      { id: 'm11', title: 'Complete leadership training', targetDate: new Date(Date.now() + 120 * 86400000).toISOString().split('T')[0], completed: false },
      { id: 'm12', title: 'Present to leadership', targetDate: new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0], completed: false },
    ],
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
];

export function useGoals() {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);

  const addGoal = useCallback((goal: Omit<Goal, 'id' | 'createdAt'>) => {
    const newGoal: Goal = {
      ...goal,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    setGoals((prev) => [newGoal, ...prev]);
    return newGoal;
  }, []);

  const updateGoal = useCallback((id: string, updates: Partial<Goal>) => {
    setGoals((prev) =>
      prev.map((goal) => (goal.id === id ? { ...goal, ...updates } : goal))
    );
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setGoals((prev) => prev.filter((goal) => goal.id !== id));
  }, []);

  const toggleMilestone = useCallback((goalId: string, milestoneId: string) => {
    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id === goalId) {
          const milestones = goal.milestones.map((m) =>
            m.id === milestoneId
              ? {
                  ...m,
                  completed: !m.completed,
                  completedDate: !m.completed ? new Date().toISOString() : undefined,
                }
              : m
          );
          const completedMilestones = milestones.filter((m) => m.completed).length;
          const progress = Math.round((completedMilestones / milestones.length) * 100);
          return { ...goal, milestones, progress };
        }
        return goal;
      })
    );
  }, []);

  const getGoalsByCategory = useCallback(
    (category: string) => goals.filter((g) => g.category === category),
    [goals]
  );

  const getGoalStats = useCallback(() => {
    const active = goals.filter((g) => g.status === 'active').length;
    const completed = goals.filter((g) => g.status === 'completed').length;
    const avgProgress = goals.length > 0
      ? Math.round(goals.reduce((sum, g) => sum + g.progress, 0) / goals.length)
      : 0;
    const highPriority = goals.filter((g) => g.priority === 'high' && g.status === 'active').length;
    
    return { active, completed, avgProgress, highPriority, total: goals.length };
  }, [goals]);

  return {
    goals,
    addGoal,
    updateGoal,
    deleteGoal,
    toggleMilestone,
    getGoalsByCategory,
    getGoalStats,
  };
}
