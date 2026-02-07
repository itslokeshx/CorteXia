'use client';

import { useState, useCallback } from 'react';

export interface Task {
  id: string;
  title: string;
  description?: string;
  domain: 'work' | 'health' | 'study' | 'personal' | 'finance';
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  completed: boolean;
  timeSpent?: number; // in minutes
  subtasks?: { id: string; title: string; completed: boolean }[];
  createdAt: string;
  completedAt?: string;
}

const initialTasks: Task[] = [
  {
    id: '1',
    title: 'Finish quarterly report',
    domain: 'work',
    priority: 'high',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    completed: false,
    timeSpent: 120,
    subtasks: [
      { id: 's1', title: 'Gather data', completed: true },
      { id: 's2', title: 'Create visualizations', completed: false },
      { id: 's3', title: 'Write analysis', completed: false },
    ],
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Morning workout',
    domain: 'health',
    priority: 'high',
    dueDate: new Date().toISOString().split('T')[0],
    completed: true,
    timeSpent: 45,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    completedAt: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Review React patterns',
    domain: 'study',
    priority: 'medium',
    dueDate: new Date(Date.now() + 172800000).toISOString().split('T')[0],
    completed: false,
    timeSpent: 30,
    createdAt: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Pay bills',
    domain: 'finance',
    priority: 'high',
    dueDate: new Date(Date.now() + 259200000).toISOString().split('T')[0],
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '5',
    title: 'Call mom',
    domain: 'personal',
    priority: 'low',
    dueDate: new Date(Date.now() + 432000000).toISOString().split('T')[0],
    completed: false,
    createdAt: new Date().toISOString(),
  },
];

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  const addTask = useCallback(
    (task: Omit<Task, 'id' | 'createdAt'>) => {
      const newTask: Task = {
        ...task,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };
      setTasks((prev) => [newTask, ...prev]);
      return newTask;
    },
    []
  );

  const updateTask = useCallback((id: string, updates: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) => (task.id === id ? { ...task, ...updates } : task))
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
  }, []);

  const toggleTask = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id
          ? {
              ...task,
              completed: !task.completed,
              completedAt: !task.completed ? new Date().toISOString() : undefined,
            }
          : task
      )
    );
  }, []);

  const getTasksByDomain = useCallback(
    (domain: string) => tasks.filter((t) => t.domain === domain),
    [tasks]
  );

  const getTaskStats = useCallback(() => {
    const completed = tasks.filter((t) => t.completed).length;
    const highPriority = tasks.filter((t) => t.priority === 'high' && !t.completed).length;
    const totalTimeSpent = tasks.reduce((acc, t) => acc + (t.timeSpent || 0), 0);
    return { completed, highPriority, totalTimeSpent, total: tasks.length };
  }, [tasks]);

  return {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    toggleTask,
    getTasksByDomain,
    getTaskStats,
  };
}
