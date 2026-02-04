// ═══════════════════════════════════════════════════════════════════════
// ENTITY RELATIONSHIP UTILITIES
// Functions for linking, querying, and managing cross-entity relationships
// ═══════════════════════════════════════════════════════════════════════

import type {
  Goal,
  Task,
  Habit,
  TimeBlock,
  TimeLog,
  Transaction,
  JournalEntry,
  DaySummary,
  DayStats,
  GoalMetrics,
  LifeState,
  LifeFactor,
} from "./types/unified";

// ═══════════════════════════════════════════════════════════════════════
// GOAL UTILITIES
// ═══════════════════════════════════════════════════════════════════════

export const calculateGoalMetrics = (
  goal: Goal,
  tasks: Task[],
  habits: Habit[],
  timeLogs: TimeLog[],
  transactions: Transaction[],
): GoalMetrics => {
  const linkedTasks = tasks.filter((t) => goal.linkedTaskIds.includes(t.id));
  const linkedHabits = habits.filter((h) => goal.linkedHabitIds.includes(h.id));
  const linkedTimeLogs = timeLogs.filter((t) =>
    goal.linkedTimeLogIds.includes(t.id),
  );
  const linkedTransactions = transactions.filter((t) =>
    goal.linkedTransactionIds.includes(t.id),
  );

  const tasksCompleted = linkedTasks.filter(
    (t) => t.status === "completed",
  ).length;
  const totalTasks = linkedTasks.length;

  const totalTimeSpent = linkedTimeLogs.reduce(
    (sum, log) => sum + log.duration,
    0,
  );
  const totalMoneySpent = linkedTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  // Calculate habit consistency
  const habitConsistencies = linkedHabits.map((h) => {
    if (h.completions.length === 0) return 0;
    const completed = h.completions.filter((c) => c.completed).length;
    return completed / h.completions.length;
  });
  const habitsConsistency =
    habitConsistencies.length > 0
      ? habitConsistencies.reduce((a, b) => a + b, 0) /
        habitConsistencies.length
      : 0;

  // Calculate velocity (progress per week)
  const daysSinceStart = Math.max(
    1,
    Math.floor(
      (Date.now() - new Date(goal.startDate).getTime()) / (1000 * 60 * 60 * 24),
    ),
  );
  const weeksElapsed = Math.max(1, daysSinceStart / 7);
  const currentVelocity = goal.progress / weeksElapsed;

  // Days remaining
  const daysRemaining = Math.max(
    0,
    Math.floor(
      (new Date(goal.targetDate).getTime() - Date.now()) /
        (1000 * 60 * 60 * 24),
    ),
  );

  // On track calculation
  const expectedProgress =
    (daysSinceStart /
      Math.max(
        1,
        Math.floor(
          (new Date(goal.targetDate).getTime() -
            new Date(goal.startDate).getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      )) *
    100;
  const onTrack = goal.progress >= expectedProgress * 0.9;

  return {
    totalTimeSpent,
    totalMoneySpent,
    tasksCompleted,
    totalTasks,
    habitsConsistency,
    currentVelocity,
    daysRemaining,
    onTrack,
  };
};

export const calculateGoalProgress = (
  goal: Goal,
  tasks: Task[],
  habits: Habit[],
): number => {
  const weights = {
    taskCompletion: 0.4,
    habitConsistency: 0.3,
    milestones: 0.3,
  };

  const linkedTasks = tasks.filter((t) => goal.linkedTaskIds.includes(t.id));
  const linkedHabits = habits.filter((h) => goal.linkedHabitIds.includes(h.id));

  // Task completion rate
  const taskCompletion =
    linkedTasks.length > 0
      ? linkedTasks.filter((t) => t.status === "completed").length /
        linkedTasks.length
      : 0;

  // Habit consistency (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const habitConsistency =
    linkedHabits.length > 0
      ? linkedHabits.reduce((sum, h) => {
          const recentCompletions = h.completions.filter(
            (c) => new Date(c.date) >= thirtyDaysAgo && c.completed,
          );
          return sum + recentCompletions.length / 30;
        }, 0) / linkedHabits.length
      : 0;

  // Milestone progress (from AI roadmap if exists)
  const milestoneProgress = goal.aiRoadmap?.milestones
    ? goal.aiRoadmap.milestones.filter((m) => m.status === "completed").length /
      goal.aiRoadmap.milestones.length
    : goal.progress / 100;

  return Math.round(
    (taskCompletion * weights.taskCompletion +
      habitConsistency * weights.habitConsistency +
      milestoneProgress * weights.milestones) *
      100,
  );
};

// ═══════════════════════════════════════════════════════════════════════
// TASK UTILITIES
// ═══════════════════════════════════════════════════════════════════════

export const calculateTaskPriority = (
  task: Task,
  goals: Goal[],
  habits: Habit[],
): number => {
  let score = 0;

  // Base priority score
  const priorityScores = { low: 1, medium: 3, high: 5, critical: 8 };
  score += priorityScores[task.priority] || 3;

  // Due date urgency
  if (task.dueDate) {
    const daysUntilDue = Math.floor(
      (new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
    );
    if (daysUntilDue < 0)
      score += 5; // Overdue
    else if (daysUntilDue === 0)
      score += 4; // Due today
    else if (daysUntilDue <= 2)
      score += 3; // Due soon
    else if (daysUntilDue <= 7) score += 1;
  }

  // Goal linkage
  const linkedGoals = goals.filter((g) => task.linkedGoalIds.includes(g.id));
  linkedGoals.forEach((goal) => {
    if (goal.priority === "critical") score += 2;
    else if (goal.priority === "high") score += 1;
  });

  // Dependencies (tasks blocking other tasks)
  score += task.blocksIds.length * 0.5;

  return Math.min(10, score);
};

export const getTasksForDate = (tasks: Task[], date: string): Task[] => {
  return tasks.filter((t) => {
    if (t.scheduledDate === date) return true;
    if (t.dueDate === date) return true;
    return false;
  });
};

export const getOverdueTasks = (tasks: Task[]): Task[] => {
  const today = new Date().toISOString().split("T")[0];
  return tasks.filter(
    (t) =>
      t.status !== "completed" &&
      t.status !== "cancelled" &&
      t.dueDate &&
      t.dueDate < today,
  );
};

// ═══════════════════════════════════════════════════════════════════════
// HABIT UTILITIES
// ═══════════════════════════════════════════════════════════════════════

export const calculateStreak = (habit: Habit): number => {
  if (habit.completions.length === 0) return 0;

  const sortedCompletions = [...habit.completions]
    .filter((c) => c.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (sortedCompletions.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sortedCompletions.length; i++) {
    const completionDate = new Date(sortedCompletions[i].date);
    completionDate.setHours(0, 0, 0, 0);

    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);

    if (completionDate.getTime() === expectedDate.getTime()) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

export const getHabitCompletionRate = (
  habit: Habit,
  days: number = 30,
): number => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const recentCompletions = habit.completions.filter(
    (c) => new Date(c.date) >= startDate,
  );

  if (recentCompletions.length === 0) return 0;

  const completed = recentCompletions.filter((c) => c.completed).length;
  return completed / days;
};

export const getHabitsForDate = (habits: Habit[], date: string): Habit[] => {
  const dayOfWeek = new Date(date)
    .toLocaleDateString("en-US", { weekday: "long" })
    .toLowerCase() as keyof Habit["customSchedule"];

  return habits.filter((h) => {
    if (!h.active) return false;
    if (h.frequency === "daily") return true;
    if (h.frequency === "custom" && h.customSchedule) {
      return h.customSchedule[dayOfWeek];
    }
    return true;
  });
};

// ═══════════════════════════════════════════════════════════════════════
// TIME UTILITIES
// ═══════════════════════════════════════════════════════════════════════

export const getTimeBlocksForDate = (
  timeBlocks: TimeBlock[],
  date: string,
): TimeBlock[] => {
  return timeBlocks
    .filter((tb) => tb.date === date)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
};

export const getTimeLogsForDate = (
  timeLogs: TimeLog[],
  date: string,
): TimeLog[] => {
  return timeLogs
    .filter((tl) => tl.date === date)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
};

export const calculateDailyTimeStats = (
  timeLogs: TimeLog[],
): {
  total: number;
  byCategory: Record<string, number>;
  byQuality: Record<string, number>;
} => {
  const byCategory: Record<string, number> = {};
  const byQuality: Record<string, number> = {};
  let total = 0;

  timeLogs.forEach((log) => {
    total += log.duration;
    byCategory[log.category] = (byCategory[log.category] || 0) + log.duration;
    byQuality[log.focusQuality] =
      (byQuality[log.focusQuality] || 0) + log.duration;
  });

  return { total, byCategory, byQuality };
};

// ═══════════════════════════════════════════════════════════════════════
// DAY SUMMARY UTILITIES
// ═══════════════════════════════════════════════════════════════════════

export const calculateDayStats = (
  date: string,
  tasks: Task[],
  habits: Habit[],
  timeLogs: TimeLog[],
  transactions: Transaction[],
  journalEntry?: JournalEntry,
): DayStats => {
  const dayTimeLogs = getTimeLogsForDate(timeLogs, date);
  const dayTasks = getTasksForDate(tasks, date);
  const dayHabits = getHabitsForDate(habits, date);
  const dayTransactions = transactions.filter((t) => t.date === date);

  const totalTimeLogged = dayTimeLogs.reduce(
    (sum, log) => sum + log.duration,
    0,
  );
  const deepWorkTime = dayTimeLogs
    .filter((log) => log.focusQuality === "deep")
    .reduce((sum, log) => sum + log.duration, 0);
  const shallowWorkTime = dayTimeLogs
    .filter(
      (log) =>
        log.focusQuality === "shallow" || log.focusQuality === "moderate",
    )
    .reduce((sum, log) => sum + log.duration, 0);
  const wastedTime = dayTimeLogs
    .filter((log) => log.category === "waste")
    .reduce((sum, log) => sum + log.duration, 0);

  const tasksCompleted = dayTasks.filter(
    (t) => t.status === "completed",
  ).length;
  const tasksPlanned = dayTasks.length;

  const habitsCompleted = dayHabits.filter((h) =>
    h.completions.some((c) => c.date === date && c.completed),
  ).length;
  const habitsPlanned = dayHabits.length;

  const moneySpent = dayTransactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const moneyEarned = dayTransactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  return {
    totalTimeLogged,
    deepWorkTime,
    shallowWorkTime,
    breakTime: 0, // Calculate from breaks
    wastedTime,
    tasksCompleted,
    tasksPlanned,
    taskCompletionRate: tasksPlanned > 0 ? tasksCompleted / tasksPlanned : 0,
    habitsCompleted,
    habitsPlanned,
    habitCompletionRate:
      habitsPlanned > 0 ? habitsCompleted / habitsPlanned : 0,
    moneySpent,
    moneyEarned,
    netCashFlow: moneyEarned - moneySpent,
    studyMinutes: dayTimeLogs
      .filter((log) => log.category === "study")
      .reduce((sum, log) => sum + log.duration, 0),
    pomodorosCompleted: dayTimeLogs.reduce(
      (sum, log) => sum + (log.pomodorosCompleted || 0),
      0,
    ),
    avgMood: journalEntry?.mood || 5,
    avgEnergy: journalEntry?.energy || 5,
    avgFocus: journalEntry?.focus || 5,
  };
};

export const calculateDaySummary = (
  date: string,
  tasks: Task[],
  habits: Habit[],
  timeBlocks: TimeBlock[],
  timeLogs: TimeLog[],
  transactions: Transaction[],
  journalEntries: JournalEntry[],
  studySessions: any[],
): DaySummary => {
  const dayTimeBlocks = getTimeBlocksForDate(timeBlocks, date);
  const dayTimeLogs = getTimeLogsForDate(timeLogs, date);
  const dayTasks = tasks.filter(
    (t) =>
      t.scheduledDate === date ||
      (t.completedAt && t.completedAt.startsWith(date)),
  );
  const dayTransactions = transactions.filter((t) => t.date === date);
  const journalEntry = journalEntries.find((j) => j.date === date);
  const dayStudySessions = studySessions.filter((s) => s.date === date);

  const stats = calculateDayStats(
    date,
    tasks,
    habits,
    timeLogs,
    transactions,
    journalEntry,
  );

  // Calculate scores
  const productivityScore = Math.round(
    stats.taskCompletionRate * 40 +
      stats.habitCompletionRate * 30 +
      Math.min(stats.deepWorkTime / 240, 1) * 30, // 4 hours max
  );

  const wellbeingScore = Math.round(
    (stats.avgMood / 10) * 40 +
      (stats.avgEnergy / 10) * 30 +
      stats.habitCompletionRate * 30,
  );

  const lifeScore = Math.round((productivityScore + wellbeingScore) / 2);

  return {
    date,
    timeBlocks: dayTimeBlocks,
    timeLogs: dayTimeLogs,
    tasksCompleted: dayTasks.filter((t) => t.status === "completed"),
    tasksPlanned: dayTasks,
    habitsCompleted: habits
      .filter((h) => h.completions.some((c) => c.date === date && c.completed))
      .map((h) => h.id),
    habitsPlanned: getHabitsForDate(habits, date).map((h) => h.id),
    transactions: dayTransactions,
    journalEntry,
    studySessions: dayStudySessions,
    stats,
    productivityScore,
    wellbeingScore,
    lifeScore,
  };
};

// ═══════════════════════════════════════════════════════════════════════
// LIFE STATE UTILITIES
// ═══════════════════════════════════════════════════════════════════════

export const calculateLifeState = (
  tasks: Task[],
  habits: Habit[],
  goals: Goal[],
  journalEntries: JournalEntry[],
  timeLogs: TimeLog[],
): LifeState => {
  const today = new Date().toISOString().split("T")[0];
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split("T")[0];
  });

  // Task metrics
  const recentTasks = tasks.filter(
    (t) => t.completedAt && last7Days.includes(t.completedAt.split("T")[0]),
  );
  const taskCompletionRate =
    tasks.length > 0
      ? recentTasks.length /
        Math.max(
          tasks.filter((t) => last7Days.includes(t.createdAt.split("T")[0]))
            .length,
          1,
        )
      : 0.5;

  // Habit metrics
  const habitCompletionRate =
    habits.length > 0
      ? habits.reduce((sum, h) => {
          const recentCompletions = h.completions.filter(
            (c) => last7Days.includes(c.date) && c.completed,
          );
          return sum + recentCompletions.length / 7;
        }, 0) / habits.length
      : 0.5;

  // Journal metrics
  const recentJournals = journalEntries.filter((j) =>
    last7Days.includes(j.date),
  );
  const avgMood =
    recentJournals.length > 0
      ? recentJournals.reduce((sum, j) => sum + j.mood, 0) /
        recentJournals.length
      : 5;
  const avgEnergy =
    recentJournals.length > 0
      ? recentJournals.reduce((sum, j) => sum + j.energy, 0) /
        recentJournals.length
      : 5;
  const avgStress =
    recentJournals.length > 0
      ? recentJournals.reduce((sum, j) => sum + j.stress, 0) /
        recentJournals.length
      : 5;

  // Goal metrics
  const activeGoals = goals.filter((g) => g.status === "in_progress");
  const goalProgress =
    activeGoals.length > 0
      ? activeGoals.reduce((sum, g) => sum + g.progress, 0) / activeGoals.length
      : 50;

  // Time metrics
  const recentTimeLogs = timeLogs.filter((t) => last7Days.includes(t.date));
  const deepWorkRatio =
    recentTimeLogs.length > 0
      ? recentTimeLogs.filter((t) => t.focusQuality === "deep").length /
        recentTimeLogs.length
      : 0.3;

  // Calculate scores
  const productivity = Math.round(
    (taskCompletionRate * 0.4 +
      habitCompletionRate * 0.3 +
      deepWorkRatio * 0.3) *
      100,
  );
  const wellbeing = Math.round(
    ((avgMood / 10) * 0.4 +
      (avgEnergy / 10) * 0.3 +
      (1 - avgStress / 10) * 0.3) *
      100,
  );
  const momentum = Math.round(
    productivity * 0.5 + wellbeing * 0.3 + goalProgress * 0.2,
  );
  const focus = Math.round(deepWorkRatio * 100);
  const stress = Math.round(avgStress * 10);
  const energy = Math.round(avgEnergy * 10);
  const lifeScore = Math.round(
    momentum * 0.3 +
      productivity * 0.25 +
      wellbeing * 0.25 +
      focus * 0.1 +
      (100 - stress) * 0.1,
  );

  // Determine status
  let status: LifeState["status"] = "on-track";
  if (lifeScore >= 75 && stress < 40) status = "momentum";
  else if (lifeScore >= 50) status = "on-track";
  else if (lifeScore >= 35) status = "drifting";
  else if (stress > 70) status = "burnout";
  else status = "overloaded";

  // Calculate factors
  const factors: LifeFactor[] = [
    {
      name: "Tasks",
      icon: "✓",
      score: Math.round(taskCompletionRate * 100),
      impact:
        taskCompletionRate > 0.7
          ? "positive"
          : taskCompletionRate > 0.4
            ? "neutral"
            : "negative",
      description: `${Math.round(taskCompletionRate * 100)}% completion rate`,
    },
    {
      name: "Habits",
      icon: "🔥",
      score: Math.round(habitCompletionRate * 100),
      impact:
        habitCompletionRate > 0.7
          ? "positive"
          : habitCompletionRate > 0.4
            ? "neutral"
            : "negative",
      description: `${Math.round(habitCompletionRate * 100)}% consistency`,
    },
    {
      name: "Mood",
      icon: "😊",
      score: Math.round(avgMood * 10),
      impact: avgMood > 7 ? "positive" : avgMood > 4 ? "neutral" : "negative",
      description: `Average mood: ${avgMood.toFixed(1)}/10`,
    },
    {
      name: "Energy",
      icon: "⚡",
      score: Math.round(avgEnergy * 10),
      impact:
        avgEnergy > 7 ? "positive" : avgEnergy > 4 ? "neutral" : "negative",
      description: `Average energy: ${avgEnergy.toFixed(1)}/10`,
    },
  ];

  return {
    status,
    momentum,
    stress,
    productivity,
    wellbeing,
    focus,
    energy,
    lifeScore,
    trend: "stable",
    trendPercentage: 0,
    domainScores: {
      work: productivity,
      health: wellbeing,
      relationships: 50,
      finances: 50,
      personal: momentum,
      learning: focus,
    },
    factors,
    lastUpdated: new Date().toISOString(),
  };
};

// ═══════════════════════════════════════════════════════════════════════
// LINKING UTILITIES
// ═══════════════════════════════════════════════════════════════════════

export const linkTaskToGoal = (
  task: Task,
  goalId: string,
  tasks: Task[],
  goals: Goal[],
): { updatedTask: Task; updatedGoal: Goal | null } => {
  const goal = goals.find((g) => g.id === goalId);
  if (!goal) return { updatedTask: task, updatedGoal: null };

  const updatedTask: Task = {
    ...task,
    linkedGoalIds: [...new Set([...task.linkedGoalIds, goalId])],
  };

  const updatedGoal: Goal = {
    ...goal,
    linkedTaskIds: [...new Set([...goal.linkedTaskIds, task.id])],
  };

  return { updatedTask, updatedGoal };
};

export const linkHabitToGoal = (
  habit: Habit,
  goalId: string,
  habits: Habit[],
  goals: Goal[],
): { updatedHabit: Habit; updatedGoal: Goal | null } => {
  const goal = goals.find((g) => g.id === goalId);
  if (!goal) return { updatedHabit: habit, updatedGoal: null };

  const updatedHabit: Habit = {
    ...habit,
    linkedGoalIds: [...new Set([...habit.linkedGoalIds, goalId])],
  };

  const updatedGoal: Goal = {
    ...goal,
    linkedHabitIds: [...new Set([...goal.linkedHabitIds, habit.id])],
  };

  return { updatedHabit, updatedGoal };
};

export const getLinkedEntities = (
  entityType: "goal" | "task" | "habit",
  entityId: string,
  data: {
    goals: Goal[];
    tasks: Task[];
    habits: Habit[];
    timeLogs: TimeLog[];
    transactions: Transaction[];
    journalEntries: JournalEntry[];
  },
) => {
  const result = {
    goals: [] as Goal[],
    tasks: [] as Task[],
    habits: [] as Habit[],
    timeLogs: [] as TimeLog[],
    transactions: [] as Transaction[],
    journalEntries: [] as JournalEntry[],
  };

  if (entityType === "goal") {
    const goal = data.goals.find((g) => g.id === entityId);
    if (goal) {
      result.tasks = data.tasks.filter((t) =>
        goal.linkedTaskIds.includes(t.id),
      );
      result.habits = data.habits.filter((h) =>
        goal.linkedHabitIds.includes(h.id),
      );
      result.timeLogs = data.timeLogs.filter((t) =>
        goal.linkedTimeLogIds.includes(t.id),
      );
      result.transactions = data.transactions.filter((t) =>
        goal.linkedTransactionIds.includes(t.id),
      );
      result.journalEntries = data.journalEntries.filter((j) =>
        goal.linkedJournalIds.includes(j.id),
      );
    }
  } else if (entityType === "task") {
    const task = data.tasks.find((t) => t.id === entityId);
    if (task) {
      result.goals = data.goals.filter((g) =>
        task.linkedGoalIds.includes(g.id),
      );
      result.habits = data.habits.filter((h) =>
        task.linkedHabitIds.includes(h.id),
      );
      result.timeLogs = data.timeLogs.filter((t) =>
        task.linkedTimeLogIds.includes(t.id),
      );
    }
  } else if (entityType === "habit") {
    const habit = data.habits.find((h) => h.id === entityId);
    if (habit) {
      result.goals = data.goals.filter((g) =>
        habit.linkedGoalIds.includes(g.id),
      );
      result.tasks = data.tasks.filter((t) =>
        habit.linkedTaskIds.includes(t.id),
      );
    }
  }

  return result;
};

// ═══════════════════════════════════════════════════════════════════════
// DATE UTILITIES
// ═══════════════════════════════════════════════════════════════════════

export const formatDate = (date: string | Date): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
};

export const getDateRange = (start: Date, end: Date): string[] => {
  const dates: string[] = [];
  const current = new Date(start);

  while (current <= end) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
};

export const getWeekDates = (date: Date = new Date()): string[] => {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);

  const end = new Date(start);
  end.setDate(end.getDate() + 6);

  return getDateRange(start, end);
};

export const getMonthDates = (date: Date = new Date()): string[] => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);

  return getDateRange(start, end);
};
