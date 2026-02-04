// Task types
export interface Task {
  id: string;
  title: string;
  description?: string;
  domain: 'work' | 'health' | 'study' | 'personal' | 'finance';
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'completed';
  dueDate?: string;
  timeEstimate?: number; // in minutes
  timeSpent?: number; // in minutes
  completedAt?: string;
  createdAt: string;
  subtasks?: Subtask[];
  tags?: string[];
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}

// Habit types
export interface Habit {
  id: string;
  name: string;
  category: 'health' | 'productivity' | 'learning' | 'fitness' | 'mindfulness' | 'social';
  frequency: 'daily' | 'weekly' | 'monthly';
  description?: string;
  color?: string;
  streak: number;
  longestStreak: number;
  active: boolean;
  targetDaysPerWeek?: number;
  createdAt: string;
  completions: HabitCompletion[];
}

export interface HabitCompletion {
  date: string;
  completed: boolean;
  note?: string;
}

// Finance types
export interface Transaction {
  id: string;
  category: 'food' | 'transport' | 'entertainment' | 'health' | 'learning' | 'utilities' | 'salary' | 'other';
  amount: number;
  description: string;
  date: string;
  type: 'income' | 'expense';
  createdAt: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  period: 'weekly' | 'monthly';
  createdAt: string;
}

// Time tracking types
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

// Goal types
export interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'personal' | 'health' | 'career' | 'financial' | 'education' | 'family';
  priority: 'low' | 'medium' | 'high';
  targetDate: string;
  progress: number; // 0-100
  status: 'active' | 'completed' | 'paused' | 'abandoned';
  milestones: Milestone[];
  createdAt: string;
  completedAt?: string;
}

export interface Milestone {
  id: string;
  title: string;
  targetDate: string;
  completed: boolean;
  completedAt?: string;
}

// Study types
export interface StudySession {
  id: string;
  subject: string;
  duration: number; // in minutes
  pomodoros: number;
  difficulty: 'easy' | 'medium' | 'hard';
  topic?: string;
  notes?: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

// Journal types
export interface JournalEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  mood: number; // 1-10
  energy: number; // 1-10
  focus: number; // 1-10
  tags?: string[];
  aiSummary?: string;
  createdAt: string;
}

// Life state types
export interface LifeState {
  status: 'momentum' | 'on-track' | 'drifting' | 'overloaded' | 'burnout';
  momentum: number; // 0-100
  stress: number; // 0-100
  productivity: number; // 0-100
  wellbeing: number; // 0-100
  focus: number; // 0-100
  lastUpdated: string;
}

// AI Insight types
export interface AIInsight {
  id: string;
  type: 'pattern' | 'recommendation' | 'warning' | 'achievement' | 'synthesis';
  title: string;
  content: string;
  domain?: string;
  severity: 'info' | 'success' | 'warning' | 'critical';
  actionable: boolean;
  relatedData?: Record<string, any>;
  createdAt: string;
}

// Settings types
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    enabled: boolean;
    tasks: boolean;
    habits: boolean;
    insights: boolean;
  };
  privacy: {
    dataCollection: boolean;
    aiAnalysis: boolean;
  };
  preferences: {
    startOfWeek: 'monday' | 'sunday';
    timeFormat: '12h' | '24h';
    language: string;
  };
}
