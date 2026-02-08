"use client";

import { PATTERN_DETECTION_PROMPT } from "./prompts/system-prompts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function getAuthHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("cortexia_token")
      : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return headers;
}

interface Correlation {
  from: string;
  to: string;
  correlation: number;
  type: "positive" | "negative";
  confidence: number;
  evidence: string;
  impact: string;
  recommendation?: string;
}

interface CascadeChain {
  chain: string[];
  frequency: number;
  totalImpact: string;
}

interface PatternInsight {
  type: "pattern" | "warning" | "opportunity";
  title: string;
  description: string;
  actionable: boolean;
  suggestedAction?: string;
}

interface PatternAnalysis {
  correlations: Correlation[];
  cascadeChains: CascadeChain[];
  insights: PatternInsight[];
}

interface UserData {
  tasks: Array<{ status: string; completedAt?: string; domain: string }>;
  habits: Array<{
    completions: { date: string; completed: boolean }[];
    name: string;
  }>;
  timeEntries: Array<{
    date: string;
    duration: number;
    category: string;
    focusQuality: string;
  }>;
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
  studySessions: Array<{ date: string; duration: number; subject: string }>;
}

class PatternDetector {
  /**
   * Detect cross-domain patterns using AI
   */
  async detectPatterns(userData: UserData): Promise<PatternAnalysis> {
    const prompt = PATTERN_DETECTION_PROMPT.replace(
      "{{userData}}",
      JSON.stringify(this.prepareDataForAnalysis(userData), null, 2),
    );

    try {
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({
          message: prompt,
          conversationHistory: [],
          userData: {},
        }),
      });

      const data = await response.json();
      return JSON.parse(data.response);
    } catch (error) {
      console.error("Pattern detection error:", error);
      // Return local analysis as fallback
      return this.localPatternAnalysis(userData);
    }
  }

  /**
   * Local pattern analysis without AI
   */
  private localPatternAnalysis(userData: UserData): PatternAnalysis {
    const correlations: Correlation[] = [];
    const cascadeChains: CascadeChain[] = [];
    const insights: PatternInsight[] = [];

    // Analyze habit-productivity correlation
    const habitProductivityCorr =
      this.calculateHabitProductivityCorrelation(userData);
    if (Math.abs(habitProductivityCorr) > 0.5) {
      correlations.push({
        from: "habits_completed",
        to: "task_completion",
        correlation: habitProductivityCorr,
        type: habitProductivityCorr > 0 ? "positive" : "negative",
        confidence: 0.75,
        evidence: `Correlation of ${(habitProductivityCorr * 100).toFixed(0)}% between habit completion and task success`,
        impact:
          habitProductivityCorr > 0
            ? "Days with completed habits show higher task completion"
            : "Habit completion inversely affects productivity",
      });
    }

    // Analyze exercise-mood correlation
    const exerciseMoodCorr = this.calculateExerciseMoodCorrelation(userData);
    if (Math.abs(exerciseMoodCorr) > 0.4) {
      correlations.push({
        from: "exercise",
        to: "mood",
        correlation: exerciseMoodCorr,
        type: exerciseMoodCorr > 0 ? "positive" : "negative",
        confidence: 0.8,
        evidence: `Exercise days show ${exerciseMoodCorr > 0 ? "higher" : "lower"} mood scores`,
        impact: "Exercise significantly impacts daily wellbeing",
        recommendation:
          exerciseMoodCorr > 0 ? "Prioritize morning exercise" : undefined,
      });
    }

    // Analyze spending-stress correlation
    const spendingStressCorr =
      this.calculateSpendingStressCorrelation(userData);
    if (Math.abs(spendingStressCorr) > 0.5) {
      correlations.push({
        from: "stress_level",
        to: "spending",
        correlation: spendingStressCorr,
        type: spendingStressCorr > 0 ? "positive" : "negative",
        confidence: 0.7,
        evidence: `${spendingStressCorr > 0 ? "Higher" : "Lower"} spending on stressed days`,
        impact: "Emotional spending pattern detected",
        recommendation: "Track triggers before impulse purchases",
      });
    }

    // Analyze deep focus patterns
    const focusPatterns = this.analyzeFocusPatterns(userData);
    if (focusPatterns.peakHours.length > 0) {
      insights.push({
        type: "pattern",
        title: "Peak Focus Windows",
        description: `Your deep focus quality peaks during ${focusPatterns.peakHours.join(", ")}`,
        actionable: true,
        suggestedAction: "Schedule important tasks during these hours",
      });
    }

    // Detect cascade chains
    const sleepProductivityChain = this.detectSleepProductivityChain(userData);
    if (sleepProductivityChain.frequency > 3) {
      cascadeChains.push(sleepProductivityChain);

      insights.push({
        type: "warning",
        title: "Sleep-Productivity Cascade",
        description: `Poor sleep leads to ${sleepProductivityChain.chain.slice(1).join(" → ")} - detected ${sleepProductivityChain.frequency} times`,
        actionable: true,
        suggestedAction: "Set a consistent sleep schedule",
      });
    }

    return { correlations, cascadeChains, insights };
  }

  private calculateHabitProductivityCorrelation(userData: UserData): number {
    // Simplified correlation calculation
    const dailyData = this.groupByDate(userData);

    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumX2 = 0,
      sumY2 = 0,
      n = 0;

    for (const [, data] of Object.entries(dailyData)) {
      const habitsCompleted =
        data.habitsCompleted / Math.max(data.habitsTotal, 1);
      const tasksCompleted = data.tasksCompleted / Math.max(data.tasksTotal, 1);

      sumX += habitsCompleted;
      sumY += tasksCompleted;
      sumXY += habitsCompleted * tasksCompleted;
      sumX2 += habitsCompleted * habitsCompleted;
      sumY2 += tasksCompleted * tasksCompleted;
      n++;
    }

    if (n < 5) return 0;

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt(
      (n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY),
    );

    return denominator === 0 ? 0 : numerator / denominator;
  }

  private calculateExerciseMoodCorrelation(userData: UserData): number {
    const exerciseHabits = userData.habits.filter((h) =>
      h.name.toLowerCase().match(/gym|exercise|workout|run|yoga/),
    );

    if (exerciseHabits.length === 0 || userData.journalEntries.length < 5)
      return 0;

    const dailyData: Record<string, { exercised: boolean; mood: number }> = {};

    // Map exercise days
    for (const habit of exerciseHabits) {
      for (const completion of habit.completions || []) {
        if (completion.completed) {
          dailyData[completion.date] = {
            ...dailyData[completion.date],
            exercised: true,
            mood: 0,
          };
        }
      }
    }

    // Map mood
    for (const entry of userData.journalEntries) {
      const date = entry.date.split("T")[0];
      if (dailyData[date]) {
        dailyData[date].mood = entry.mood;
      } else {
        dailyData[date] = { exercised: false, mood: entry.mood };
      }
    }

    // Calculate correlation
    const exerciseMoods = Object.values(dailyData).filter(
      (d) => d.exercised && d.mood > 0,
    );
    const noExerciseMoods = Object.values(dailyData).filter(
      (d) => !d.exercised && d.mood > 0,
    );

    if (exerciseMoods.length < 3 || noExerciseMoods.length < 3) return 0;

    const avgExerciseMood =
      exerciseMoods.reduce((s, d) => s + d.mood, 0) / exerciseMoods.length;
    const avgNoExerciseMood =
      noExerciseMoods.reduce((s, d) => s + d.mood, 0) / noExerciseMoods.length;

    // Return normalized difference as pseudo-correlation
    return Math.min(1, Math.max(-1, (avgExerciseMood - avgNoExerciseMood) / 5));
  }

  private calculateSpendingStressCorrelation(userData: UserData): number {
    const stressedDays = userData.journalEntries
      .filter((j) => j.mood < 4 || j.content?.toLowerCase().includes("stress"))
      .map((j) => j.date.split("T")[0]);

    if (stressedDays.length < 3) return 0;

    const stressedDaySpending = userData.transactions
      .filter(
        (t) =>
          t.type === "expense" && stressedDays.includes(t.date.split("T")[0]),
      )
      .reduce((s, t) => s + t.amount, 0);

    const normalDaySpending = userData.transactions
      .filter(
        (t) =>
          t.type === "expense" && !stressedDays.includes(t.date.split("T")[0]),
      )
      .reduce((s, t) => s + t.amount, 0);

    const stressedAvg = stressedDaySpending / Math.max(stressedDays.length, 1);
    const normalDays = 30 - stressedDays.length;
    const normalAvg = normalDaySpending / Math.max(normalDays, 1);

    if (normalAvg === 0) return 0;

    return Math.min(1, Math.max(-1, (stressedAvg - normalAvg) / normalAvg));
  }

  private analyzeFocusPatterns(userData: UserData): {
    peakHours: string[];
    lowHours: string[];
  } {
    const hourlyFocus: Record<number, { total: number; count: number }> = {};

    for (const entry of userData.timeEntries) {
      if (entry.focusQuality === "deep") {
        const hour = new Date(entry.date).getHours();
        if (!hourlyFocus[hour]) hourlyFocus[hour] = { total: 0, count: 0 };
        hourlyFocus[hour].total += entry.duration;
        hourlyFocus[hour].count++;
      }
    }

    const hourlyAvg = Object.entries(hourlyFocus)
      .map(([hour, data]) => ({
        hour: parseInt(hour),
        avg: data.total / data.count,
      }))
      .sort((a, b) => b.avg - a.avg);

    const peakHours = hourlyAvg
      .slice(0, 3)
      .map((h) => `${h.hour}:00-${h.hour + 1}:00`);
    const lowHours = hourlyAvg
      .slice(-3)
      .map((h) => `${h.hour}:00-${h.hour + 1}:00`);

    return { peakHours, lowHours };
  }

  private detectSleepProductivityChain(userData: UserData): CascadeChain {
    // Simplified cascade detection
    let frequency = 0;
    const chain = [
      "Poor Sleep",
      "Low Energy",
      "Skipped Exercise",
      "Low Mood",
      "Task Failure",
    ];

    // Check journal entries for low energy days following poor sleep mentions
    for (let i = 1; i < userData.journalEntries.length; i++) {
      const prev = userData.journalEntries[i - 1];
      const curr = userData.journalEntries[i];

      if (
        (prev.content?.toLowerCase().includes("tired") || prev.energy < 4) &&
        (curr.mood < 5 || curr.energy < 4)
      ) {
        frequency++;
      }
    }

    return {
      chain,
      frequency,
      totalImpact:
        frequency > 5 ? "Critical - affects multiple life domains" : "Moderate",
    };
  }

  private groupByDate(userData: UserData): Record<
    string,
    {
      habitsCompleted: number;
      habitsTotal: number;
      tasksCompleted: number;
      tasksTotal: number;
    }
  > {
    const result: Record<
      string,
      {
        habitsCompleted: number;
        habitsTotal: number;
        tasksCompleted: number;
        tasksTotal: number;
      }
    > = {};

    // Group habits by date
    for (const habit of userData.habits) {
      for (const completion of habit.completions || []) {
        const date = completion.date;
        if (!result[date]) {
          result[date] = {
            habitsCompleted: 0,
            habitsTotal: 0,
            tasksCompleted: 0,
            tasksTotal: 0,
          };
        }
        result[date].habitsTotal++;
        if (completion.completed) result[date].habitsCompleted++;
      }
    }

    // Group tasks by completion date
    for (const task of userData.tasks) {
      if (task.completedAt) {
        const date = task.completedAt.split("T")[0];
        if (!result[date]) {
          result[date] = {
            habitsCompleted: 0,
            habitsTotal: 0,
            tasksCompleted: 0,
            tasksTotal: 0,
          };
        }
        result[date].tasksTotal++;
        if (task.status === "completed") result[date].tasksCompleted++;
      }
    }

    return result;
  }

  private prepareDataForAnalysis(userData: UserData): Record<string, unknown> {
    // Prepare a summarized version of data for AI analysis
    return {
      summary: {
        totalTasks: userData.tasks.length,
        completedTasks: userData.tasks.filter((t) => t.status === "completed")
          .length,
        totalHabits: userData.habits.length,
        avgHabitCompletion: this.calculateAvgHabitCompletion(userData.habits),
        totalTimeLogged: userData.timeEntries.reduce(
          (s, t) => s + t.duration,
          0,
        ),
        deepFocusPercentage: this.calculateDeepFocusPercentage(
          userData.timeEntries,
        ),
        totalSpending: userData.transactions
          .filter((t) => t.type === "expense")
          .reduce((s, t) => s + t.amount, 0),
        avgMood:
          userData.journalEntries.length > 0
            ? userData.journalEntries.reduce((s, j) => s + j.mood, 0) /
              userData.journalEntries.length
            : 5,
      },
      dailyBreakdown: this.groupByDate(userData),
      recentPatterns: {
        last7DaysHabits: this.getLast7DaysHabits(userData.habits),
        last7DaysMood: this.getLast7DaysMood(userData.journalEntries),
        last7DaysSpending: this.getLast7DaysSpending(userData.transactions),
      },
    };
  }

  private calculateAvgHabitCompletion(habits: UserData["habits"]): number {
    if (habits.length === 0) return 0;

    const totals = habits.reduce(
      (acc, h) => {
        const completions = h.completions || [];
        return {
          completed:
            acc.completed + completions.filter((c) => c.completed).length,
          total: acc.total + completions.length,
        };
      },
      { completed: 0, total: 0 },
    );

    return totals.total > 0 ? (totals.completed / totals.total) * 100 : 0;
  }

  private calculateDeepFocusPercentage(
    timeEntries: UserData["timeEntries"],
  ): number {
    if (timeEntries.length === 0) return 0;
    const deepFocus = timeEntries.filter(
      (t) => t.focusQuality === "deep",
    ).length;
    return (deepFocus / timeEntries.length) * 100;
  }

  private getLast7DaysHabits(
    habits: UserData["habits"],
  ): Record<string, number> {
    const result: Record<string, number> = {};
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    });

    for (const date of last7Days) {
      result[date] = habits.reduce((count, h) => {
        const completion = h.completions?.find(
          (c) => c.date === date && c.completed,
        );
        return count + (completion ? 1 : 0);
      }, 0);
    }

    return result;
  }

  private getLast7DaysMood(
    journals: UserData["journalEntries"],
  ): Record<string, number> {
    const result: Record<string, number> = {};

    for (const entry of journals.slice(0, 7)) {
      const date = entry.date.split("T")[0];
      result[date] = entry.mood;
    }

    return result;
  }

  private getLast7DaysSpending(
    transactions: UserData["transactions"],
  ): Record<string, number> {
    const result: Record<string, number> = {};
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    });

    for (const date of last7Days) {
      result[date] = transactions
        .filter((t) => t.date.split("T")[0] === date && t.type === "expense")
        .reduce((s, t) => s + t.amount, 0);
    }

    return result;
  }
}

export const patternDetector = new PatternDetector();
export type { Correlation, CascadeChain, PatternInsight, PatternAnalysis };
