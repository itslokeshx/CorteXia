// ═══════════════════════════════════════════════════════════════════════
// CORTEXIA UNIFIED DATA MODEL
// Deep entity relationships where everything connects
// ═══════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════
// CORE ENTITY: GOAL (The Root of Everything)
// ═══════════════════════════════════════════════════════════════════════

export interface Goal {
  id: string;
  title: string;
  description: string;
  category:
    | "education"
    | "career"
    | "health"
    | "finance"
    | "personal"
    | "family";
  priority: "low" | "medium" | "high" | "critical";

  // Hierarchy
  parentGoalId?: string;
  subGoalIds: string[];

  // Timeline
  startDate: string;
  targetDate: string;

  // Progress
  progress: number; // 0-100
  status: "not_started" | "in_progress" | "completed" | "paused" | "abandoned";

  // RELATIONSHIPS (THE KEY TO INTEGRATION)
  linkedHabitIds: string[];
  linkedTaskIds: string[];
  linkedTimeLogIds: string[];
  linkedTransactionIds: string[];
  linkedJournalIds: string[];

  // AI-Generated Roadmap
  aiRoadmap?: AIRoadmap;

  // Metrics (calculated)
  metrics: GoalMetrics;

  // Color & Icon
  color?: string;
  icon?: string;

  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface GoalMetrics {
  totalTimeSpent: number; // minutes
  totalMoneySpent: number;
  tasksCompleted: number;
  totalTasks: number;
  habitsConsistency: number; // 0-1
  currentVelocity: number; // progress per week
  daysRemaining: number;
  onTrack: boolean;
}

export interface AIRoadmap {
  milestones: Milestone[];
  estimatedCompletionDate: string;
  requiredHabits: string[];
  requiredTasks: string[];
  weeklyTimeCommitment: number;
  estimatedCost: number;
  weeklyPlan: Record<string, string>;
  resources: AIResource[];
  warnings: string[];
  successCriteria: string[];
  generatedAt: string;
}

export interface AIResource {
  type: "course" | "book" | "tool" | "coach" | "community";
  name: string;
  url?: string;
  estimatedCost: number;
  reason: string;
}

// ═══════════════════════════════════════════════════════════════════════
// MILESTONE (Goal Breakdown)
// ═══════════════════════════════════════════════════════════════════════

export interface Milestone {
  id: string;
  goalId: string;
  title: string;
  description?: string;
  targetDate: string;
  progress: number; // 0-100
  status: "pending" | "in_progress" | "completed";

  // What needs to happen?
  requiredTaskIds: string[];
  requiredHabitIds: string[];
  estimatedHours: number;
  estimatedCost?: number;

  order: number;
  completedAt?: string;
  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════════════
// ENHANCED: HABIT
// ═══════════════════════════════════════════════════════════════════════

export interface Habit {
  id: string;
  name: string;
  description?: string;
  category:
    | "health"
    | "productivity"
    | "learning"
    | "fitness"
    | "mindfulness"
    | "social"
    | "finance";
  color: string;
  icon: string;

  // Schedule
  frequency: "daily" | "weekly" | "custom";
  targetDaysPerWeek?: number;
  customSchedule?: WeekSchedule;
  reminderTime?: string;

  // Streaks (DOPAMINE ENGINE)
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;

  // RELATIONSHIPS
  linkedGoalIds: string[];
  linkedTaskIds: string[];

  // Completion History
  completions: HabitCompletion[];

  // Analytics
  analytics: HabitAnalytics;

  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WeekSchedule {
  monday: boolean;
  tuesday: boolean;
  wednesday: boolean;
  thursday: boolean;
  friday: boolean;
  saturday: boolean;
  sunday: boolean;
}

export interface HabitCompletion {
  date: string;
  completed: boolean;
  timeSpent?: number; // minutes
  quality?: 1 | 2 | 3 | 4 | 5;
  notes?: string;
  mood?: number; // 1-10
  timeOfDay?: string;
}

export interface HabitAnalytics {
  completionRate: number; // 0-1
  averageQuality: number;
  bestTimeOfDay?: string;
  bestDayOfWeek?: string;
  correlations: HabitCorrelation[];
}

export interface HabitCorrelation {
  entityType: "task" | "mood" | "energy" | "productivity";
  entityId?: string;
  correlation: number; // -1 to 1
  description: string;
}

// ═══════════════════════════════════════════════════════════════════════
// ENHANCED: TASK (Now Connects to Goals and Time Blocks)
// ═══════════════════════════════════════════════════════════════════════

export interface Task {
  id: string;
  title: string;
  description?: string;

  // Hierarchy (SUBTASKS)
  parentTaskId?: string;
  subTaskIds: string[];

  // Classification
  domain: "work" | "study" | "personal" | "health" | "finance" | "social";
  priority: "low" | "medium" | "high" | "critical";

  // Timeline
  createdAt: string;
  dueDate?: string;
  scheduledDate?: string;
  scheduledTime?: string;
  completedAt?: string;

  // Time Management
  timeEstimate?: number; // minutes
  timeSpent: number; // actual minutes
  timeBlockId?: string;

  // Status
  status: "todo" | "in_progress" | "waiting" | "completed" | "cancelled";

  // RELATIONSHIPS (THE INTEGRATION KEY)
  linkedGoalIds: string[];
  linkedHabitIds: string[];
  linkedTimeLogIds: string[];
  linkedTransactionIds: string[];

  // Dependencies
  dependsOnIds: string[];
  blocksIds: string[];

  // AI Scoring
  aiPriorityScore?: number; // 0-10
  aiPriorityReason?: string;
  aiSuggestedTime?: AISuggestedTime;

  // Tags & Notes
  tags: string[];
  completionNotes?: string;

  // Recurrence
  recurring?: TaskRecurrence;
}

export interface AISuggestedTime {
  date: string;
  timeOfDay: "morning" | "afternoon" | "evening" | "night";
  reason: string;
}

export interface TaskRecurrence {
  frequency: "daily" | "weekly" | "monthly" | "custom";
  interval: number;
  endDate?: string;
  daysOfWeek?: number[]; // 0-6
}

// ═══════════════════════════════════════════════════════════════════════
// NEW: TIME BLOCK (Visual Daily Schedule)
// ═══════════════════════════════════════════════════════════════════════

export interface TimeBlock {
  id: string;
  date: string;
  startTime: string; // "09:00"
  endTime: string; // "11:00"
  duration: number; // minutes

  // What's in this block?
  type: "task" | "habit" | "meeting" | "break" | "free" | "focus" | "routine";
  linkedTaskId?: string;
  linkedHabitId?: string;
  linkedGoalId?: string;

  title: string;
  description?: string;
  color?: string;

  // Tracking
  status: "planned" | "in_progress" | "completed" | "skipped" | "partial";
  actualStartTime?: string;
  actualEndTime?: string;
  actualDuration?: number;

  // Quality
  focusQuality?: 1 | 2 | 3 | 4 | 5;
  interruptions?: number;
  energyBefore?: number; // 1-10
  energyAfter?: number;

  // AI
  aiGenerated: boolean;
  aiReason?: string;

  // Recurring
  recurring?: boolean;
  recurringPattern?: string;

  createdAt: string;
  updatedAt?: string;
}

// ═══════════════════════════════════════════════════════════════════════
// ENHANCED: TIME LOG (Actual Tracking)
// ═══════════════════════════════════════════════════════════════════════

export interface TimeLog {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // minutes

  // What was done?
  activity: string;
  category:
    | "work"
    | "study"
    | "health"
    | "personal"
    | "social"
    | "waste"
    | "sleep"
    | "commute";

  // RELATIONSHIPS
  linkedTaskId?: string;
  linkedHabitId?: string;
  linkedGoalId?: string;
  linkedTimeBlockId?: string;

  // Quality
  focusQuality: "deep" | "moderate" | "shallow" | "distracted";
  interruptions: number;
  productivityRating?: number; // 1-5

  // Context
  location?: string;
  tool?: string;
  notes?: string;

  // Pomodoros
  pomodorosCompleted?: number;

  // Energy & Mood
  energyLevel?: number; // 1-10
  moodLevel?: number; // 1-10

  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════════════
// ENHANCED: FINANCE TRANSACTION
// ═══════════════════════════════════════════════════════════════════════

export interface Transaction {
  id: string;
  date: string;

  // Money
  amount: number;
  type: "income" | "expense";
  category:
    | "food"
    | "transport"
    | "entertainment"
    | "health"
    | "education"
    | "utilities"
    | "savings"
    | "investment"
    | "salary"
    | "freelance"
    | "gift"
    | "subscription"
    | "housing"
    | "other";
  subcategory?: string;
  description: string;

  // RELATIONSHIPS (KEY!)
  linkedGoalId?: string;
  linkedTaskId?: string;
  linkedHabitId?: string;

  // Tags
  tags: string[];
  isRecurring: boolean;
  recurringId?: string;

  // Planning
  budgetCategory?: string;
  isPlanned: boolean;

  // Context (AI uses this)
  mood?: number; // 1-10
  triggeredBy?: "stress" | "celebration" | "planned" | "impulse" | "necessity";

  // Payment
  paymentMethod?: "cash" | "card" | "transfer" | "crypto" | "other";
  merchantName?: string;

  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════════════
// ENHANCED: JOURNAL ENTRY
// ═══════════════════════════════════════════════════════════════════════

export interface JournalEntry {
  id: string;
  date: string;

  // Content
  title?: string;
  content: string;

  // Mood & Energy
  mood: number; // 1-10
  energy: number; // 1-10
  focus: number; // 1-10
  stress: number; // 1-10

  // RELATIONSHIPS (IMPORTANT!)
  linkedGoalIds: string[];
  linkedTaskIds: string[];
  linkedHabitIds: string[];

  // Tags
  tags: string[];

  // AI Analysis
  aiSentiment?: "positive" | "neutral" | "negative" | "mixed";
  aiThemes?: string[];
  aiSummary?: string;
  aiInsights?: string[];
  aiKeywords?: string[];

  // Gratitude
  gratitudeList?: string[];

  // Wins & Challenges
  wins?: string[];
  challenges?: string[];
  learnings?: string[];

  // Tomorrow's intentions
  tomorrowIntentions?: string[];

  createdAt: string;
  updatedAt?: string;
}

// ═══════════════════════════════════════════════════════════════════════
// STUDY SESSION (Enhanced)
// ═══════════════════════════════════════════════════════════════════════

export interface StudySession {
  id: string;
  subject: string;
  topic?: string;

  // Time
  duration: number; // minutes
  startTime: string;
  endTime: string;
  date: string;

  // Method
  pomodoros: number;
  technique?:
    | "pomodoro"
    | "deep_work"
    | "spaced_repetition"
    | "active_recall"
    | "other";

  // Quality
  difficulty: "easy" | "medium" | "hard" | "extreme";
  focusQuality: "deep" | "moderate" | "shallow";
  comprehension?: number; // 1-10
  retention?: number; // 1-10

  // RELATIONSHIPS
  linkedGoalId?: string;
  linkedTaskId?: string;
  linkedTimeBlockId?: string;

  // Notes
  notes?: string;
  keyTakeaways?: string[];
  questionsRaised?: string[];

  // Resources
  resourcesUsed?: string[];

  createdAt: string;
}

// ═══════════════════════════════════════════════════════════════════════
// DAY SUMMARY (Complete Daily View)
// ═══════════════════════════════════════════════════════════════════════

export interface DaySummary {
  date: string;

  // What happened?
  timeBlocks: TimeBlock[];
  timeLogs: TimeLog[];
  tasksCompleted: Task[];
  tasksPlanned: Task[];
  habitsCompleted: string[]; // habit IDs
  habitsPlanned: string[];
  transactions: Transaction[];
  journalEntry?: JournalEntry;
  studySessions: StudySession[];

  // Stats
  stats: DayStats;

  // AI Analysis
  aiSummary?: string;
  aiHighlights?: string[];
  aiConcerns?: string[];
  aiSuggestions?: string[];

  // Scores
  productivityScore: number; // 0-100
  wellbeingScore: number; // 0-100
  lifeScore: number; // 0-100

  // Comparisons
  vsYesterday?: {
    productivityChange: number;
    wellbeingChange: number;
  };
  vsWeekAvg?: {
    productivityChange: number;
    wellbeingChange: number;
  };
}

export interface DayStats {
  totalTimeLogged: number; // minutes
  deepWorkTime: number;
  shallowWorkTime: number;
  breakTime: number;
  wastedTime: number;

  tasksCompleted: number;
  tasksPlanned: number;
  taskCompletionRate: number;

  habitsCompleted: number;
  habitsPlanned: number;
  habitCompletionRate: number;

  moneySpent: number;
  moneyEarned: number;
  netCashFlow: number;

  studyMinutes: number;
  pomodorosCompleted: number;

  avgMood: number;
  avgEnergy: number;
  avgFocus: number;
}

// ═══════════════════════════════════════════════════════════════════════
// LIFE STATE (Enhanced)
// ═══════════════════════════════════════════════════════════════════════

export interface LifeState {
  status:
    | "momentum"
    | "on-track"
    | "drifting"
    | "overloaded"
    | "burnout"
    | "recovery";

  // Scores (0-100)
  momentum: number;
  stress: number;
  productivity: number;
  wellbeing: number;
  focus: number;
  energy: number;

  // Life Score (weighted average)
  lifeScore: number;

  // Trends
  trend: "improving" | "stable" | "declining";
  trendPercentage: number;

  // Domain scores
  domainScores: {
    work: number;
    health: number;
    relationships: number;
    finances: number;
    personal: number;
    learning: number;
  };

  // Contributing factors
  factors: LifeFactor[];

  // AI insights
  aiExplanation?: string;
  aiRecommendations?: string[];

  lastUpdated: string;
}

export interface LifeFactor {
  name: string;
  icon: string;
  score: number;
  impact: "positive" | "neutral" | "negative";
  description: string;
}

// ═══════════════════════════════════════════════════════════════════════
// AI INSIGHT
// ═══════════════════════════════════════════════════════════════════════

export interface AIInsight {
  id: string;
  type:
    | "pattern"
    | "recommendation"
    | "warning"
    | "achievement"
    | "opportunity"
    | "correlation";
  title: string;
  content: string;

  // Context
  domain?: string;
  severity: "info" | "success" | "warning" | "critical";
  actionable: boolean;

  // Related entities
  relatedGoalIds?: string[];
  relatedTaskIds?: string[];
  relatedHabitIds?: string[];

  // Actions
  suggestedActions?: AIAction[];

  // Meta
  confidence?: number; // 0-1
  dataPoints?: number;

  dismissed: boolean;
  createdAt: string;
  expiresAt?: string;
}

export interface AIAction {
  type:
    | "create_task"
    | "create_habit"
    | "create_goal"
    | "create_time_block"
    | "update_task"
    | "update_habit"
    | "complete_task"
    | "complete_habit"
    | "link_entities"
    | "schedule"
    | "remind"
    | "reflect";
  label: string;
  data?: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════════════
// USER SETTINGS (Enhanced)
// ═══════════════════════════════════════════════════════════════════════

export interface UserSettings {
  // Appearance
  theme: "light" | "dark" | "system";
  accentColor: string;
  sidebarCollapsed: boolean;

  // Notifications
  notifications: {
    enabled: boolean;
    tasks: boolean;
    habits: boolean;
    insights: boolean;
    dailyBriefing: boolean;
    weeklyReport: boolean;
    goalReminders: boolean;
    streakReminders: boolean;
  };

  // Privacy
  privacy: {
    dataCollection: boolean;
    aiAnalysis: boolean;
    shareProgress: boolean;
  };

  // Preferences
  preferences: {
    startOfWeek: "monday" | "sunday";
    timeFormat: "12h" | "24h";
    dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
    language: string;
    currency: string;
    defaultTaskDomain: string;
    defaultHabitCategory: string;
    pomodoroLength: number;
    shortBreakLength: number;
    longBreakLength: number;
  };

  // Goals
  workHoursPerWeek: number;
  dailyFocusGoal: number; // minutes
  monthlyBudget: number;
  sleepGoal: number; // hours

  // Integrations
  integrations: {
    googleCalendar?: boolean;
    notion?: boolean;
    todoist?: boolean;
  };
}

// ═══════════════════════════════════════════════════════════════════════
// UTILITY TYPES
// ═══════════════════════════════════════════════════════════════════════

export type EntityType =
  | "goal"
  | "task"
  | "habit"
  | "timeBlock"
  | "timeLog"
  | "transaction"
  | "journal"
  | "studySession";

export interface EntityLink {
  fromType: EntityType;
  fromId: string;
  toType: EntityType;
  toId: string;
  relationship: string;
  createdAt: string;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ═══════════════════════════════════════════════════════════════════════
// AI CONVERSATION TYPES
// ═══════════════════════════════════════════════════════════════════════

export interface AIConversationMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;

  // Actions taken
  actions?: AIAction[];
  actionResults?: AIActionResult[];

  // Insights generated
  insights?: AIInsight[];

  // Context used
  contextUsed?: string[];
}

export interface AIActionResult {
  action: AIAction;
  success: boolean;
  entityId?: string;
  error?: string;
}

export interface AICoachResponse {
  message: string;
  actions: AIAction[];
  insights: AIInsight[];
  followUpQuestions?: string[];
  contextualSuggestions?: string[];
}
