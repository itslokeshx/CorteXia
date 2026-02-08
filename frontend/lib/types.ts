// Task types
export interface Task {
  id: string;
  title: string;
  description?: string;
  domain:
    | "work"
    | "health"
    | "study"
    | "personal"
    | "finance"
    | "focus"
    | "leisure";
  priority: "low" | "medium" | "high" | "critical";
  status: "todo" | "in-progress" | "completed" | "blocked";
  dueDate?: string;
  dueTime?: string; // HH:mm format
  scheduledFor?: "today" | "tomorrow" | "week" | "month" | "year";
  timeEstimate?: number; // in minutes
  timeSpent?: number; // in minutes
  completedAt?: string;
  createdAt: string;
  subtasks?: Subtask[];
  tags?: string[];
  // New fields for deep integration
  linkedGoalId?: string;
  timeBlockId?: string;
  recurrence?: TaskRecurrence;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
}

export interface TaskRecurrence {
  frequency: "daily" | "weekly" | "monthly";
  daysOfWeek?: number[]; // 0-6, Sunday-Saturday
  endDate?: string;
}

// Time Block types (for Day Planner)
export interface TimeBlock {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  duration: number; // in minutes
  title: string;
  type:
    | "task"
    | "habit"
    | "meeting"
    | "break"
    | "deep_work"
    | "shallow_work"
    | "personal";
  status: "planned" | "in_progress" | "completed" | "skipped";
  linkedTaskId?: string;
  linkedHabitId?: string;
  linkedGoalId?: string;
  color?: string;
  aiGenerated?: boolean;
  aiReason?: string;
  notes?: string;
  createdAt: string;
}

// Habit types
export interface Habit {
  id: string;
  name: string;
  category:
    | "health"
    | "productivity"
    | "learning"
    | "fitness"
    | "mindfulness"
    | "social";
  frequency: "daily" | "weekly" | "custom";
  customDays?: {
    monday: boolean;
    tuesday: boolean;
    wednesday: boolean;
    thursday: boolean;
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  description?: string;
  color?: string;
  streak: number;
  longestStreak: number;
  active: boolean;
  targetDaysPerWeek?: number;
  createdAt: string;
  completions: HabitCompletion[];
  // New fields
  linkedGoalIds?: string[];
  targetTime?: string; // Preferred time to complete HH:mm
  duration?: number; // in minutes
}

export interface HabitCompletion {
  date: string;
  completed: boolean;
  note?: string;
}

// Finance types
export interface Transaction {
  id: string;
  category:
    | "food"
    | "transport"
    | "entertainment"
    | "health"
    | "learning"
    | "utilities"
    | "salary"
    | "shopping"
    | "subscription"
    | "other";
  amount: number;
  description: string;
  date: string;
  type: "income" | "expense";
  createdAt: string;
  // New fields
  linkedGoalId?: string;
  recurring?: boolean;
  vendor?: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  spent: number;
  period: "weekly" | "monthly";
  createdAt: string;
}

// Time tracking types
export interface TimeEntry {
  id: string;
  task: string;
  category: "work" | "study" | "health" | "personal";
  duration: number; // in minutes
  date: string;
  focusQuality: "deep" | "moderate" | "shallow";
  interruptions: number;
  notes?: string;
  createdAt: string;
}

// Goal types - Hierarchical structure
export interface Goal {
  id: string;
  title: string;
  description: string;
  category:
    | "personal"
    | "health"
    | "career"
    | "financial"
    | "education"
    | "family"
    | "creative";
  priority: "low" | "medium" | "high";
  targetDate: string;
  progress: number; // 0-100
  status:
    | "active"
    | "completed"
    | "paused"
    | "abandoned"
    | "at_risk"
    | "failing";
  milestones: Milestone[];
  createdAt: string;
  completedAt?: string;
  // Hierarchical structure
  level: "life" | "yearly" | "quarterly" | "monthly" | "weekly";
  parentGoalId?: string;
  childGoalIds?: string[];
  // Linked items
  linkedHabitIds?: string[];
  linkedTaskIds?: string[];
  // AI generated roadmap
  aiRoadmap?: AIRoadmap;
}

export interface Milestone {
  id: string;
  title: string;
  targetDate: string;
  completed: boolean;
  completedAt?: string;
}

export interface AIRoadmap {
  quarterlyMilestones: QuarterlyMilestone[];
  monthlyGoals: MonthlyGoal[];
  weeklyTargets: WeeklyTarget[];
  requiredHabits: { name: string; frequency: string; timeOfDay: string }[];
  tasksToCreate: {
    title: string;
    deadline: string;
    estimatedTime: number;
    priority: string;
  }[];
  weeklyTimeCommitment: number;
  obstacles: string[];
  successProbability: number;
  generatedAt: string;
}

export interface QuarterlyMilestone {
  quarter: string;
  title: string;
  targets: string[];
  estimatedHours: number;
}

export interface MonthlyGoal {
  month: string;
  title: string;
  targets: string[];
}

export interface WeeklyTarget {
  week: number;
  title: string;
  tasks: string[];
}

// Study types
export interface StudySession {
  id: string;
  subject: string;
  duration: number; // in minutes
  pomodoros: number;
  difficulty: "easy" | "medium" | "hard";
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
  stress?: number; // 1-10
  tags?: string[];
  aiSummary?: string;
  createdAt: string;
  // New fields
  linkedGoalIds?: string[];
  linkedHabitIds?: string[];
  linkedTaskIds?: string[];
  gratitudeList?: string[];
  aiSentiment?: "positive" | "neutral" | "negative";
  aiThemes?: string[];
  aiInsights?: string;
}

// Coach Session types (AI Mental Health Support)
export interface CoachSession {
  id: string;
  startedAt: string;
  endedAt?: string;
  messages: CoachMessage[];
  moodBefore?: number;
  moodAfter?: number;
  sessionType:
    | "check-in"
    | "stress"
    | "planning"
    | "celebration"
    | "venting"
    | "general";
  aiSummary?: string;
  actionsTaken?: string[];
}

export interface CoachMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  suggestions?: { text: string; type: "prompt" | "action" }[];
  dataReferences?: { type: string; text: string }[];
  actions?: AIAction[];
}

export interface AIAction {
  type:
    | "create_task"
    | "create_habit"
    | "create_goal"
    | "create_expense"
    | "create_journal"
    | "create_time_block"
    | "update_task"
    | "complete_habit"
    | "delete";
  data: any;
  status: "pending" | "completed" | "failed";
  description: string;
}

// User State for AI Coach
export interface UserState {
  mood: { value: number; trend: "up" | "down" | "stable" };
  energy: { value: number; trend: "up" | "down" | "stable" };
  stress: { value: number; trend: "up" | "down" | "stable" };
  sleep: { avgHours: number; debt: number };
  tasks: { pending: number; overdue: number; completedToday: number };
  habits: { atRisk: number; streaksActive: number };
  goals: { onTrack: number; struggling: number };
  budget: { percentUsed: number; daysRemaining: number };
}

// Timer/Pomodoro types
export interface PomodoroSession {
  id: string;
  startTime: string;
  endTime?: string;
  duration: number; // planned duration in minutes
  actualDuration?: number;
  type: "work" | "short_break" | "long_break";
  linkedTaskId?: string;
  linkedGoalId?: string;
  completed: boolean;
  interruptions: number;
  focusQuality?: "deep" | "moderate" | "shallow";
  notes?: string;
}

export interface TimerSettings {
  workDuration: number; // in minutes
  shortBreakDuration: number;
  longBreakDuration: number;
  pomodorosBeforeLongBreak: number;
  autoStartBreaks: boolean;
  autoStartPomodoros: boolean;
  soundEnabled: boolean;
  notificationsEnabled: boolean;
}

// Life state types
export interface LifeState {
  status: "momentum" | "on-track" | "drifting" | "overloaded" | "burnout";
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
  type: "pattern" | "recommendation" | "warning" | "achievement" | "synthesis";
  title: string;
  content: string;
  domain?: string;
  severity: "info" | "success" | "warning" | "critical";
  actionable: boolean;
  relatedData?: Record<string, any>;
  createdAt: string;
}

// Settings types
export interface UserSettings {
  theme: "light" | "dark" | "system";
  sidebarCollapsed?: boolean;
  notifications: {
    enabled: boolean;
    tasks: boolean;
    habits: boolean;
    insights: boolean;
    dailySummaryTime?: string; // HH:mm
    streakWarnings: boolean;
  };
  privacy: {
    dataCollection: boolean;
    aiAnalysis: boolean;
  };
  preferences: {
    startOfWeek: "monday" | "sunday";
    timeFormat: "12h" | "24h";
    language: string;
    compactMode: boolean;
  };
  timer: TimerSettings;
  ai: {
    personality: "formal" | "casual" | "coach";
    insightFrequency: "high" | "medium" | "low";
    morningBriefing: boolean;
    weeklySynthesisDay: number; // 0-6, Sunday-Saturday
  };
  budgets: {
    monthlyLimit: number;
    categoryLimits: Record<string, number>;
  };
  userName?: string;
  // Cloud-persisted data (no localStorage)
  aiMemory?: {
    userName?: string;
    preferences: Record<string, string>;
    facts: string[];
    conversationCount: number;
    lastTopic?: string;
    lastInteraction?: string;
  };
  plannerBlocks?: Record<string, unknown>[];
  timeBlocks?: Record<string, unknown>[];
}
