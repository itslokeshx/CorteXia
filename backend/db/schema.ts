import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  boolean,
  real,
  jsonb,
  uuid,
  varchar,
  date,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// USERS TABLE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uuid: uuid("uuid").defaultRandom().unique().notNull(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  name: text("name").notNull(),
  avatarUrl: text("avatar_url"),
  timezone: varchar("timezone", { length: 50 }).default("UTC"),
  preferences: jsonb("preferences").$type<{
    theme: "light" | "dark" | "auto";
    weekStartsOn: 0 | 1; // 0=Sunday, 1=Monday
    currency: string;
    dateFormat: string;
    timeFormat: "12h" | "24h";
  }>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TASKS TABLE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const tasks = pgTable(
  "tasks",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    title: text("title").notNull(),
    description: text("description"),
    status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, in-progress, completed, cancelled
    priority: varchar("priority", { length: 20 }).default("medium").notNull(), // low, medium, high, urgent
    aiPriorityScore: real("ai_priority_score"), // 0-100, calculated by Gemini
    aiReasoning: text("ai_reasoning"), // Why AI gave this score
    category: varchar("category", { length: 50 }), // work, personal, health, etc.
    domain: varchar("domain", { length: 50 }).default("work"), // work, health, study, personal, finance
    dueDate: timestamp("due_date"),
    completedAt: timestamp("completed_at"),
    estimatedMinutes: integer("estimated_minutes"),
    actualMinutes: integer("actual_minutes"),
    tags: jsonb("tags").$type<string[]>().default([]),
    isRecurring: boolean("is_recurring").default(false),
    recurringPattern: varchar("recurring_pattern", { length: 50 }), // daily, weekly, monthly
    parentTaskId: integer("parent_task_id"),
    order: integer("order").default(0), // For manual sorting
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("tasks_user_id_idx").on(table.userId),
    statusIdx: index("tasks_status_idx").on(table.status),
    dueDateIdx: index("tasks_due_date_idx").on(table.dueDate),
  }),
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HABITS TABLE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const habits = pgTable(
  "habits",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    name: text("name").notNull(),
    description: text("description"),
    icon: varchar("icon", { length: 50 }).default("circle"), // lucide icon name
    color: varchar("color", { length: 20 }).default("#3B82F6"),
    category: varchar("category", { length: 50 }).default("health"), // health, productivity, learning, fitness, mindfulness, social
    frequency: varchar("frequency", { length: 20 }).default("daily").notNull(), // daily, weekly, custom
    targetDaysPerWeek: integer("target_days_per_week").default(7), // For weekly habits
    targetCount: integer("target_count").default(1), // e.g., 8 glasses of water
    unit: varchar("unit", { length: 50 }), // glasses, pages, minutes, etc.
    reminderTime: varchar("reminder_time", { length: 10 }), // HH:MM format
    streak: integer("streak").default(0),
    longestStreak: integer("longest_streak").default(0),
    isActive: boolean("is_active").default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("habits_user_id_idx").on(table.userId),
  }),
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HABIT LOGS TABLE (Daily check-ins)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const habitLogs = pgTable(
  "habit_logs",
  {
    id: serial("id").primaryKey(),
    habitId: integer("habit_id")
      .references(() => habits.id, { onDelete: "cascade" })
      .notNull(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    date: date("date").notNull(), // YYYY-MM-DD
    completed: boolean("completed").default(false).notNull(),
    count: integer("count").default(1), // For countable habits (8/8 glasses)
    quality: integer("quality"), // 1-5 stars
    notes: text("notes"),
    photoUrl: text("photo_url"), // For visual tracking
    checkedInAt: timestamp("checked_in_at").defaultNow().notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    habitIdDateIdx: index("habit_logs_habit_id_date_idx").on(
      table.habitId,
      table.date,
    ),
    userIdIdx: index("habit_logs_user_id_idx").on(table.userId),
  }),
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TIME LOGS TABLE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const timeLogs = pgTable(
  "time_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    activity: text("activity").notNull(),
    category: varchar("category", { length: 50 }).notNull(), // work, study, exercise, leisure, etc.
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time"),
    durationMinutes: integer("duration_minutes"),
    isActive: boolean("is_active").default(false), // True if currently running
    focusQuality: varchar("focus_quality", { length: 20 }), // deep, moderate, shallow
    interruptions: integer("interruptions").default(0),
    notes: text("notes"),
    taskId: integer("task_id").references(() => tasks.id), // Link to task if applicable
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("time_logs_user_id_idx").on(table.userId),
    startTimeIdx: index("time_logs_start_time_idx").on(table.startTime),
    categoryIdx: index("time_logs_category_idx").on(table.category),
  }),
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TRANSACTIONS TABLE (Finance)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const transactions = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    type: varchar("type", { length: 20 }).notNull(), // expense, income
    amount: real("amount").notNull(),
    currency: varchar("currency", { length: 10 }).default("USD"),
    category: varchar("category", { length: 50 }).notNull(), // food, transport, entertainment, etc.
    description: text("description"),
    date: timestamp("date").notNull(),
    merchant: text("merchant"),
    paymentMethod: varchar("payment_method", { length: 50 }), // cash, card, digital
    isRecurring: boolean("is_recurring").default(false),
    tags: jsonb("tags").$type<string[]>().default([]),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("transactions_user_id_idx").on(table.userId),
    dateIdx: index("transactions_date_idx").on(table.date),
    categoryIdx: index("transactions_category_idx").on(table.category),
  }),
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// STUDY SESSIONS TABLE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const studySessions = pgTable(
  "study_sessions",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    subject: text("subject").notNull(),
    topic: text("topic"),
    durationMinutes: integer("duration_minutes").notNull(),
    pomodoros: integer("pomodoros").default(0),
    difficulty: varchar("difficulty", { length: 20 }).default("medium"), // easy, medium, hard
    startTime: timestamp("start_time").notNull(),
    endTime: timestamp("end_time"),
    focusQuality: integer("focus_quality"), // 1-5
    comprehensionLevel: integer("comprehension_level"), // 1-5
    notes: text("notes"),
    resources: jsonb("resources").$type<string[]>(), // URLs, book names, etc.
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("study_sessions_user_id_idx").on(table.userId),
    subjectIdx: index("study_sessions_subject_idx").on(table.subject),
    startTimeIdx: index("study_sessions_start_time_idx").on(table.startTime),
  }),
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// GOALS TABLE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const goals = pgTable(
  "goals",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    title: text("title").notNull(),
    description: text("description"),
    category: varchar("category", { length: 50 }), // career, health, finance, personal, education, family
    type: varchar("type", { length: 20 }).default("outcome"), // outcome, habit, milestone
    status: varchar("status", { length: 20 }).default("active").notNull(), // active, completed, abandoned, on-hold
    timeframe: varchar("timeframe", { length: 20 }), // short-term, medium-term, long-term
    startDate: timestamp("start_date"),
    targetDate: timestamp("target_date"),
    completedAt: timestamp("completed_at"),
    progress: real("progress").default(0), // 0-100 percentage
    milestones: jsonb("milestones").$type<
      Array<{
        id: string;
        title: string;
        completed: boolean;
        completedAt?: string;
        targetDate?: string;
      }>
    >(),
    parentGoalId: integer("parent_goal_id"), // For goal hierarchy
    priority: varchar("priority", { length: 20 }).default("medium"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("goals_user_id_idx").on(table.userId),
    statusIdx: index("goals_status_idx").on(table.status),
  }),
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// JOURNAL ENTRIES TABLE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const journalEntries = pgTable(
  "journal_entries",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    date: timestamp("date").notNull(),
    title: text("title"),
    mood: varchar("mood", { length: 50 }), // happy, sad, anxious, energized, etc.
    moodScore: integer("mood_score"), // 1-10
    energy: integer("energy"), // 1-10
    stress: integer("stress"), // 1-10
    focus: integer("focus"), // 1-10
    content: text("content").notNull(),
    tags: jsonb("tags").$type<string[]>().default([]),
    gratitude: jsonb("gratitude").$type<string[]>(), // 3 things grateful for
    wins: jsonb("wins").$type<string[]>(), // Daily wins
    improvements: jsonb("improvements").$type<string[]>(), // What could be better
    aiInsights: text("ai_insights"), // Gemini-generated reflection
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("journal_entries_user_id_idx").on(table.userId),
    dateIdx: index("journal_entries_date_idx").on(table.date),
  }),
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// SCREEN TIME LOGS TABLE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const screenTimeLogs = pgTable(
  "screen_time_logs",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    date: date("date").notNull(),
    category: varchar("category", { length: 50 }).notNull(), // social, entertainment, productive, etc.
    app: text("app"),
    durationMinutes: integer("duration_minutes").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdDateIdx: index("screen_time_logs_user_id_date_idx").on(
      table.userId,
      table.date,
    ),
  }),
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// AI INSIGHTS TABLE (Cached AI-generated insights)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const aiInsights = pgTable(
  "ai_insights",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    type: varchar("type", { length: 50 }).notNull(), // weekly-synthesis, morning-briefing, pattern-detection, etc.
    title: text("title").notNull(),
    content: text("content").notNull(),
    data: jsonb("data"), // Structured data used to generate insight
    priority: varchar("priority", { length: 20 }).default("normal"), // low, normal, high, urgent
    severity: varchar("severity", { length: 20 }).default("info"), // info, success, warning, critical
    domain: varchar("domain", { length: 50 }), // tasks, habits, finance, etc.
    actionable: boolean("actionable").default(false),
    isRead: boolean("is_read").default(false),
    isStarred: boolean("is_starred").default(false),
    validUntil: timestamp("valid_until"), // Some insights expire
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("ai_insights_user_id_idx").on(table.userId),
    typeIdx: index("ai_insights_type_idx").on(table.type),
  }),
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// BUDGETS TABLE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const budgets = pgTable(
  "budgets",
  {
    id: serial("id").primaryKey(),
    userId: integer("user_id")
      .references(() => users.id)
      .notNull(),
    category: varchar("category", { length: 50 }).notNull(),
    limit: real("limit").notNull(),
    period: varchar("period", { length: 20 }).default("monthly"), // weekly, monthly
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    userIdIdx: index("budgets_user_id_idx").on(table.userId),
  }),
);

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// RELATIONS (for Drizzle queries)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
  habits: many(habits),
  habitLogs: many(habitLogs),
  timeLogs: many(timeLogs),
  transactions: many(transactions),
  studySessions: many(studySessions),
  goals: many(goals),
  journalEntries: many(journalEntries),
  screenTimeLogs: many(screenTimeLogs),
  aiInsights: many(aiInsights),
  budgets: many(budgets),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
}));

export const habitsRelations = relations(habits, ({ one, many }) => ({
  user: one(users, {
    fields: [habits.userId],
    references: [users.id],
  }),
  logs: many(habitLogs),
}));

export const habitLogsRelations = relations(habitLogs, ({ one }) => ({
  habit: one(habits, {
    fields: [habitLogs.habitId],
    references: [habits.id],
  }),
  user: one(users, {
    fields: [habitLogs.userId],
    references: [users.id],
  }),
}));

export const goalsRelations = relations(goals, ({ one }) => ({
  user: one(users, {
    fields: [goals.userId],
    references: [users.id],
  }),
}));

export const timeLogsRelations = relations(timeLogs, ({ one }) => ({
  user: one(users, {
    fields: [timeLogs.userId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [timeLogs.taskId],
    references: [tasks.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
}));

export const studySessionsRelations = relations(studySessions, ({ one }) => ({
  user: one(users, {
    fields: [studySessions.userId],
    references: [users.id],
  }),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one }) => ({
  user: one(users, {
    fields: [journalEntries.userId],
    references: [users.id],
  }),
}));

export const aiInsightsRelations = relations(aiInsights, ({ one }) => ({
  user: one(users, {
    fields: [aiInsights.userId],
    references: [users.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  user: one(users, {
    fields: [budgets.userId],
    references: [users.id],
  }),
}));
