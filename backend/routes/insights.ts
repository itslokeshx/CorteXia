import { Hono } from "hono";
import { subDays, format } from "date-fns";
import {
  generateWeeklySynthesis,
  generateLifeScoreExplanation,
  generateMorningBriefing,
} from "../services/ai-service";

const insightsRouter = new Hono();

// Mock data for calculations
const getMockData = () => ({
  tasks: [
    { id: 1, status: "completed", priority: "high", category: "work" },
    { id: 2, status: "pending", priority: "medium", category: "personal" },
    { id: 3, status: "in-progress", priority: "high", category: "work" },
    { id: 4, status: "completed", priority: "low", category: "health" },
    { id: 5, status: "pending", priority: "urgent", category: "work" },
  ],
  habits: [
    { id: 1, name: "Gym", streak: 12, completed: true },
    { id: 2, name: "Reading", streak: 5, completed: true },
    { id: 3, name: "Meditation", streak: 3, completed: false },
    { id: 4, name: "Water", streak: 8, completed: true },
  ],
  timeLogs: [
    { category: "work", durationMinutes: 240, focusQuality: "deep" },
    { category: "study", durationMinutes: 90, focusQuality: "moderate" },
    { category: "personal", durationMinutes: 60, focusQuality: "shallow" },
  ],
  transactions: [
    { type: "expense", amount: 45, category: "food" },
    { type: "expense", amount: 120, category: "transport" },
    { type: "income", amount: 5000, category: "salary" },
  ],
  goals: [
    { id: 1, progress: 35, status: "active" },
    { id: 2, progress: 70, status: "active" },
    { id: 3, progress: 100, status: "completed" },
  ],
  journalEntries: [
    { moodScore: 8, energy: 7, stress: 3 },
    { moodScore: 6, energy: 5, stress: 5 },
    { moodScore: 9, energy: 8, stress: 2 },
  ],
});

// GET /api/insights/life-score - Calculate current life score
insightsRouter.get("/life-score", async (c) => {
  try {
    const userId = 1;
    const data = getMockData();

    // Calculate individual scores
    const taskScore = calculateTaskScore(data.tasks);
    const habitScore = calculateHabitScore(data.habits);
    const timeScore = calculateTimeEfficiency(data.timeLogs);
    const financeScore = calculateBudgetHealth(data.transactions);
    const goalScore = calculateGoalProgress(data.goals);

    // Weighted average
    const totalScore = Math.round(
      taskScore * 0.25 +
        habitScore * 0.25 +
        timeScore * 0.2 +
        financeScore * 0.15 +
        goalScore * 0.15,
    );

    // Determine life state
    const state = getLifeState(totalScore);

    // Generate AI explanation
    const explanation = await generateLifeScoreExplanation({
      score: totalScore,
      tasks: {
        pending: data.tasks.filter((t) => t.status === "pending").length,
        completed: data.tasks.filter((t) => t.status === "completed").length,
      },
      habits: {
        done: data.habits.filter((h) => h.completed).length,
        total: data.habits.length,
      },
      budget: {
        spent: data.transactions
          .filter((t) => t.type === "expense")
          .reduce((sum, t) => sum + t.amount, 0),
        limit: 1000,
      },
      goals: {
        onTrack: data.goals.filter((g) => g.progress >= 50).length,
        total: data.goals.length,
      },
    });

    return c.json({
      score: totalScore,
      state,
      explanation,
      breakdown: {
        tasks: taskScore,
        habits: habitScore,
        time: timeScore,
        finance: financeScore,
        goals: goalScore,
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error calculating life score:", error);
    return c.json({ error: "Failed to calculate life score" }, 500);
  }
});

// GET /api/insights/weekly-synthesis - Generate weekly report
insightsRouter.get("/weekly-synthesis", async (c) => {
  try {
    const data = getMockData();
    const weekAgo = subDays(new Date(), 7);

    // Generate synthesis with AI
    const synthesis = await generateWeeklySynthesis({
      tasks: data.tasks,
      habits: data.habits,
      timeLogs: data.timeLogs,
      transactions: data.transactions,
      goals: data.goals,
      journalEntries: data.journalEntries,
    });

    return c.json({
      synthesis,
      period: {
        start: format(weekAgo, "yyyy-MM-dd"),
        end: format(new Date(), "yyyy-MM-dd"),
      },
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating synthesis:", error);
    return c.json({ error: "Failed to generate synthesis" }, 500);
  }
});

// GET /api/insights/morning-briefing - Get morning briefing
insightsRouter.get("/morning-briefing", async (c) => {
  try {
    const data = getMockData();

    const briefing = await generateMorningBriefing({
      pendingTasks: data.tasks.filter((t) => t.status === "pending"),
      todayHabits: data.habits,
      upcomingDeadlines: data.tasks.filter(
        (t) => t.priority === "urgent" || t.priority === "high",
      ),
      yesterdayMood: data.journalEntries[0]?.moodScore,
    });

    return c.json({
      briefing,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating morning briefing:", error);
    return c.json({ error: "Failed to generate morning briefing" }, 500);
  }
});

// GET /api/insights/patterns - Get detected patterns
insightsRouter.get("/patterns", async (c) => {
  try {
    // Return mock patterns for now
    const patterns = [
      {
        id: "1",
        type: "correlation",
        title: "Gym → Better Mood",
        description:
          "Your mood scores are 30% higher on days you complete your gym habit",
        confidence: 0.87,
        domain: "health",
      },
      {
        id: "2",
        type: "trend",
        title: "Productivity Peak",
        description:
          "You're most productive between 9-11 AM. Consider scheduling deep work during this time.",
        confidence: 0.82,
        domain: "productivity",
      },
      {
        id: "3",
        type: "warning",
        title: "Weekend Spending",
        description:
          "Your weekend spending is 2.5x higher than weekdays. Consider setting a weekend budget.",
        confidence: 0.91,
        domain: "finance",
      },
    ];

    return c.json({ patterns });
  } catch (error) {
    console.error("Error fetching patterns:", error);
    return c.json({ error: "Failed to fetch patterns" }, 500);
  }
});

// GET /api/insights/recommendations - Get AI recommendations
insightsRouter.get("/recommendations", async (c) => {
  try {
    const recommendations = [
      {
        id: "1",
        priority: "high",
        title: "Complete Q1 proposal",
        reason: "Due in 2 days and marked as high priority",
        action: "task",
        actionId: "1",
      },
      {
        id: "2",
        priority: "medium",
        title: "Don't break your reading streak!",
        reason:
          "You're on a 5-day streak. Reading before bed improves sleep quality.",
        action: "habit",
        actionId: "3",
      },
      {
        id: "3",
        priority: "low",
        title: "Review food budget",
        reason: "Food spending is 20% higher than last month",
        action: "finance",
      },
    ];

    return c.json({ recommendations });
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return c.json({ error: "Failed to fetch recommendations" }, 500);
  }
});

// Helper functions for score calculation
function calculateTaskScore(tasks: any[]): number {
  if (!tasks.length) return 70;

  const completed = tasks.filter((t) => t.status === "completed").length;
  const overdue = tasks.filter(
    (t) =>
      t.dueDate && new Date(t.dueDate) < new Date() && t.status !== "completed",
  ).length;

  const completionRate = completed / tasks.length;
  const overduePenalty = Math.min(overdue * 10, 40);

  return Math.max(0, Math.round(completionRate * 100 - overduePenalty));
}

function calculateHabitScore(habits: any[]): number {
  if (!habits.length) return 70;

  const completedToday = habits.filter((h) => h.completed).length;
  const completionRate = completedToday / habits.length;

  // Bonus for streaks
  const avgStreak =
    habits.reduce((sum, h) => sum + (h.streak || 0), 0) / habits.length;
  const streakBonus = Math.min(avgStreak * 2, 20);

  return Math.min(100, Math.round(completionRate * 80 + streakBonus));
}

function calculateTimeEfficiency(timeLogs: any[]): number {
  if (!timeLogs.length) return 70;

  const totalMinutes = timeLogs.reduce(
    (sum, t) => sum + (t.durationMinutes || 0),
    0,
  );
  const deepMinutes = timeLogs
    .filter((t) => t.focusQuality === "deep")
    .reduce((sum, t) => sum + (t.durationMinutes || 0), 0);

  if (totalMinutes === 0) return 70;
  const productivityRate = deepMinutes / totalMinutes;
  return Math.round(50 + productivityRate * 50);
}

function calculateBudgetHealth(transactions: any[]): number {
  if (!transactions.length) return 80;

  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  if (income === 0) {
    // No income tracked, just check if expenses are reasonable
    return expenses < 500 ? 80 : expenses < 1000 ? 60 : 40;
  }

  const savingsRate = (income - expenses) / income;
  if (savingsRate >= 0.3) return 100;
  if (savingsRate >= 0.2) return 85;
  if (savingsRate >= 0.1) return 70;
  if (savingsRate >= 0) return 55;
  return Math.max(0, 40 + savingsRate * 100);
}

function calculateGoalProgress(goals: any[]): number {
  if (!goals.length) return 70;

  const activeGoals = goals.filter((g) => g.status === "active");
  if (!activeGoals.length) return 80; // All goals completed!

  const avgProgress =
    activeGoals.reduce((sum, g) => sum + (g.progress || 0), 0) /
    activeGoals.length;
  return Math.round(avgProgress);
}

function getLifeState(score: number): string {
  if (score >= 85) return "HIGH_MOMENTUM";
  if (score >= 70) return "ON_TRACK";
  if (score >= 50) return "STRATEGIC_PAUSE";
  if (score >= 30) return "DRIFTING";
  return "BURNOUT_RISK";
}

export default insightsRouter;
