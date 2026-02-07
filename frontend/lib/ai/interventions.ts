"use client";

import { BURNOUT_DETECTOR_PROMPT } from "./prompts/system-prompts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

type InterventionSeverity = "critical" | "warning" | "info";
type InterventionType = "burnout" | "budget" | "streak" | "focus" | "pattern";

interface InterventionAction {
  text: string;
  action: string;
  priority: "critical" | "high" | "medium" | "low";
}

interface Intervention {
  id: string;
  type: InterventionType;
  severity: InterventionSeverity;
  title: string;
  message: string;
  explanation: string;
  actions: InterventionAction[];
  createdAt: string;
  dismissed: boolean;
  evidence?: Record<string, unknown>;
}

interface UserData {
  tasks: Array<{
    status: string;
    completedAt?: string;
    dueDate?: string;
    title: string;
  }>;
  habits: Array<{
    id: string;
    name: string;
    streak: number;
    completions: { date: string; completed: boolean }[];
  }>;
  timeEntries: Array<{ date: string; duration: number; category: string }>;
  transactions: Array<{
    date: string;
    amount: number;
    type: string;
    category: string;
  }>;
  journalEntries: Array<{
    date: string;
    mood: number;
    energy: number;
    content: string;
  }>;
  settings?: { weeklyBudget?: number };
}

class InterventionEngine {
  private interventions: Intervention[] = [];

  /**
   * Run all intervention checks and return any triggered interventions
   */
  async checkAllInterventions(userData: UserData): Promise<Intervention[]> {
    const newInterventions: Intervention[] = [];

    // Run checks in parallel
    const [burnout, budget, streaks, focus] = await Promise.all([
      this.checkBurnout(userData),
      this.checkBudget(userData),
      this.checkStreaks(userData),
      this.checkFocus(userData),
    ]);

    if (burnout) newInterventions.push(burnout);
    if (budget) newInterventions.push(budget);
    if (streaks.length > 0) newInterventions.push(...streaks);
    if (focus) newInterventions.push(focus);

    this.interventions = [
      ...newInterventions,
      ...this.interventions.filter((i) => !i.dismissed),
    ].slice(0, 10);
    return newInterventions;
  }

  /**
   * Check for burnout risk signals
   */
  async checkBurnout(userData: UserData): Promise<Intervention | null> {
    const last7Days = this.getLast7Days();

    // Calculate work hours
    const workHours =
      userData.timeEntries
        .filter(
          (t) =>
            last7Days.includes(t.date.split("T")[0]) && t.category === "work",
        )
        .reduce((sum, t) => sum + t.duration, 0) / 60;

    // Calculate sleep quality from journal
    const recentJournals = userData.journalEntries.filter((j) =>
      last7Days.includes(j.date.split("T")[0]),
    );
    const avgEnergy =
      recentJournals.length > 0
        ? recentJournals.reduce((s, j) => s + j.energy, 0) /
          recentJournals.length
        : 5;

    const avgMood =
      recentJournals.length > 0
        ? recentJournals.reduce((s, j) => s + j.mood, 0) / recentJournals.length
        : 5;

    // Check for exercise
    const exerciseHabits = userData.habits.filter((h) =>
      h.name.toLowerCase().match(/gym|exercise|workout|run|yoga/),
    );
    const exerciseDays = exerciseHabits.flatMap((h) =>
      h.completions.filter((c) => c.completed && last7Days.includes(c.date)),
    ).length;

    // Check for stress mentions
    const stressMentions = recentJournals.filter((j) =>
      j.content
        ?.toLowerCase()
        .match(/stress|overwhelm|exhausted|burned|tired|anxious/),
    ).length;

    // Calculate burnout risk score
    const signals = {
      workHours: Math.min(1, workHours / 60), // Normalized to 60h/week max
      lowEnergy: avgEnergy < 5 ? (5 - avgEnergy) / 5 : 0,
      lowMood: avgMood < 5 ? (5 - avgMood) / 5 : 0,
      noExercise: exerciseDays < 3 ? (3 - exerciseDays) / 3 : 0,
      stressMentions: Math.min(1, stressMentions / 5),
    };

    const riskScore =
      signals.workHours * 0.3 +
      signals.lowEnergy * 0.2 +
      signals.lowMood * 0.2 +
      signals.noExercise * 0.15 +
      signals.stressMentions * 0.15;

    if (riskScore < 0.5) return null;

    const severity: InterventionSeverity =
      riskScore > 0.75 ? "critical" : riskScore > 0.6 ? "warning" : "info";

    return {
      id: `burnout-${Date.now()}`,
      type: "burnout",
      severity,
      title:
        severity === "critical"
          ? "⚠️ BURNOUT RISK DETECTED"
          : "🔔 High Stress Warning",
      message: `Your burnout risk score is ${(riskScore * 100).toFixed(0)}%`,
      explanation: this.generateBurnoutExplanation(
        signals,
        workHours,
        avgEnergy,
        exerciseDays,
      ),
      actions: this.generateBurnoutActions(signals),
      createdAt: new Date().toISOString(),
      dismissed: false,
      evidence: signals,
    };
  }

  /**
   * Check for budget overspending
   */
  async checkBudget(userData: UserData): Promise<Intervention | null> {
    const weeklyBudget = userData.settings?.weeklyBudget || 500;
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday
    const daysIntoWeek = dayOfWeek === 0 ? 7 : dayOfWeek;

    // Get this week's spending
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - daysIntoWeek + 1);

    const weekSpending = userData.transactions
      .filter((t) => {
        const tDate = new Date(t.date);
        return t.type === "expense" && tDate >= weekStart && tDate <= today;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate projected spending
    const projectedSpending = (weekSpending / daysIntoWeek) * 7;
    const percentOfBudget = (weekSpending / weeklyBudget) * 100;
    const expectedPercent = (daysIntoWeek / 7) * 100;

    // Check if overspending
    if (percentOfBudget <= expectedPercent + 10) return null;

    const severity: InterventionSeverity =
      percentOfBudget > 90
        ? "critical"
        : percentOfBudget > 70
          ? "warning"
          : "info";

    // Find top spending categories
    const categorySpending: Record<string, number> = {};
    userData.transactions
      .filter((t) => {
        const tDate = new Date(t.date);
        return t.type === "expense" && tDate >= weekStart;
      })
      .forEach((t) => {
        categorySpending[t.category] =
          (categorySpending[t.category] || 0) + t.amount;
      });

    const topCategory = Object.entries(categorySpending).sort(
      (a, b) => b[1] - a[1],
    )[0];

    return {
      id: `budget-${Date.now()}`,
      type: "budget",
      severity,
      title: "💸 Budget Alert",
      message: `You've spent $${weekSpending.toFixed(0)} (${percentOfBudget.toFixed(0)}%) with ${7 - daysIntoWeek} days left`,
      explanation: `At this pace, you'll spend $${projectedSpending.toFixed(0)} this week vs your $${weeklyBudget} budget. ${topCategory ? `Top category: ${topCategory[0]} ($${topCategory[1].toFixed(0)})` : ""}`,
      actions: [
        {
          text: "Review transactions",
          action: "navigate:/finance",
          priority: "high",
        },
        { text: "Cut 2 purchases", action: "suggest_cuts", priority: "medium" },
        {
          text: "Adjust weekly budget",
          action: "edit_budget",
          priority: "low",
        },
      ],
      createdAt: new Date().toISOString(),
      dismissed: false,
      evidence: {
        weekSpending,
        weeklyBudget,
        projectedSpending,
        categorySpending,
      },
    };
  }

  /**
   * Check for habits with streaks at risk
   */
  async checkStreaks(userData: UserData): Promise<Intervention[]> {
    const today = new Date().toISOString().split("T")[0];
    const currentHour = new Date().getHours();
    const interventions: Intervention[] = [];

    // Only alert after 6pm
    if (currentHour < 18) return [];

    for (const habit of userData.habits) {
      if (habit.streak < 5) continue; // Only alert for significant streaks

      const completedToday = habit.completions.some(
        (c) => c.date === today && c.completed,
      );

      if (!completedToday) {
        interventions.push({
          id: `streak-${habit.id}-${Date.now()}`,
          type: "streak",
          severity: habit.streak >= 14 ? "critical" : "warning",
          title: `🔥 ${habit.streak}-Day Streak at Risk!`,
          message: `Your "${habit.name}" streak will break at midnight!`,
          explanation: `You've built a ${habit.streak}-day streak with "${habit.name}". Don't let it reset now!`,
          actions: [
            {
              text: "Mark as done",
              action: `complete_habit:${habit.id}`,
              priority: "critical",
            },
            {
              text: "Remind me in 1 hour",
              action: `remind:${habit.id}:1h`,
              priority: "medium",
            },
            {
              text: "Skip today (break streak)",
              action: `skip:${habit.id}`,
              priority: "low",
            },
          ],
          createdAt: new Date().toISOString(),
          dismissed: false,
          evidence: {
            habitId: habit.id,
            streak: habit.streak,
            lastCompleted: habit.completions[0]?.date,
          },
        });
      }
    }

    return interventions;
  }

  /**
   * Check for focus/distraction patterns
   */
  async checkFocus(userData: UserData): Promise<Intervention | null> {
    const today = new Date().toISOString().split("T")[0];

    const todayEntries = userData.timeEntries.filter(
      (t) => t.date.split("T")[0] === today,
    );
    const totalToday = todayEntries.reduce((s, t) => s + t.duration, 0);
    const deepFocusToday = todayEntries
      .filter((t) => t.category === "work" || t.category === "study")
      .reduce((s, t) => s + t.duration, 0);

    // Check if it's work hours but low deep focus
    const currentHour = new Date().getHours();
    if (currentHour < 10 || currentHour > 18) return null;

    const expectedFocus = (currentHour - 9) * 30; // Expect 30min/hour of focus

    if (deepFocusToday >= expectedFocus * 0.7) return null;

    // Check for pending high-priority tasks
    const overdueTasks = userData.tasks.filter((t) => {
      if (t.status === "completed") return false;
      if (!t.dueDate) return false;
      return new Date(t.dueDate) <= new Date();
    });

    if (overdueTasks.length === 0) return null;

    return {
      id: `focus-${Date.now()}`,
      type: "focus",
      severity: overdueTasks.length > 3 ? "warning" : "info",
      title: "🎯 Focus Check",
      message: `${deepFocusToday}min logged, ${overdueTasks.length} tasks pending`,
      explanation: `It's ${currentHour}:00 and you've logged ${deepFocusToday}min of focused work, but have ${overdueTasks.length} overdue task${overdueTasks.length > 1 ? "s" : ""}. Time to focus!`,
      actions: [
        {
          text: "Start 25min focus session",
          action: "start_pomodoro",
          priority: "high",
        },
        {
          text: `Work on: ${overdueTasks[0]?.title.slice(0, 30)}...`,
          action: `focus_task:${overdueTasks[0]?.title}`,
          priority: "high",
        },
        {
          text: "Block distractions",
          action: "block_distractions",
          priority: "medium",
        },
      ],
      createdAt: new Date().toISOString(),
      dismissed: false,
      evidence: {
        deepFocusToday,
        expectedFocus,
        overdueCount: overdueTasks.length,
      },
    };
  }

  /**
   * Dismiss an intervention
   */
  dismissIntervention(id: string): void {
    const intervention = this.interventions.find((i) => i.id === id);
    if (intervention) {
      intervention.dismissed = true;
    }
  }

  /**
   * Get active interventions
   */
  getActiveInterventions(): Intervention[] {
    return this.interventions.filter((i) => !i.dismissed);
  }

  private getLast7Days(): string[] {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    });
  }

  private generateBurnoutExplanation(
    signals: Record<string, number>,
    workHours: number,
    avgEnergy: number,
    exerciseDays: number,
  ): string {
    const parts: string[] = [];

    if (signals.workHours > 0.7) {
      parts.push(`${workHours.toFixed(0)}h worked this week (high)`);
    }
    if (signals.lowEnergy > 0.3) {
      parts.push(`Energy averaging ${avgEnergy.toFixed(1)}/10`);
    }
    if (signals.noExercise > 0.5) {
      parts.push(`Only ${exerciseDays} exercise days`);
    }
    if (signals.stressMentions > 0.3) {
      parts.push("Multiple stress mentions in journal");
    }

    return parts.join(" • ");
  }

  private generateBurnoutActions(
    signals: Record<string, number>,
  ): InterventionAction[] {
    const actions: InterventionAction[] = [];

    if (signals.workHours > 0.6) {
      actions.push({
        text: "Set hard stop at 6pm today",
        action: "set_work_boundary",
        priority: "critical",
      });
    }

    if (signals.noExercise > 0.4) {
      actions.push({
        text: "Schedule a walk for today",
        action: "schedule_exercise",
        priority: "high",
      });
    }

    if (signals.lowEnergy > 0.4) {
      actions.push({
        text: "Take a 20min break now",
        action: "start_break_timer",
        priority: "high",
      });
    }

    actions.push({
      text: "Talk to Cortexia about workload",
      action: "open_chat:burnout",
      priority: "medium",
    });

    return actions;
  }
}

export const interventionEngine = new InterventionEngine();
export type {
  Intervention,
  InterventionAction,
  InterventionType,
  InterventionSeverity,
};
