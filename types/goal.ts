export interface Milestone {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  category: 'career' | 'health' | 'learning' | 'finance' | 'personal';
  priority: 'high' | 'medium' | 'low';
  progress: number; // 0-100
  status: 'active' | 'completed' | 'on-hold' | 'abandoned';
  targetDate: string; // ISO date string
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
  milestones: Milestone[];
  color?: string;
}
