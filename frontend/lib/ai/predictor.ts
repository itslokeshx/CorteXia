"use client";

import {
  ENERGY_FORECAST_PROMPT,
  WEEKLY_SYNTHESIS_PROMPT,
} from "./prompts/system-prompts";

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

interface EnergyForecast {
  predictedEnergy: number;
  confidence: number;
  peakHours: string[];
  lowHours: string[];
  factors: { factor: string; impact: number; confidence: number }[];
  recommendations: string[];
}

interface WeekPrediction {
  taskCompletion: number;
  habitConsistency: number;
  lifeScore: number;
  confidence: number;
  explanation: string;
}

interface GoalPrediction {
  goalId: string;
  probability: number;
  verdict: "On Track" | "At Risk" | "Failing";
  requiredDailyProgress: number;
  currentDailyProgress: number;
  recommendation?: string;
}

interface UserData {
  tasks: Array<{ status: string; completedAt?: string; dueDate?: string }>;
  habits: Array<{ completions: { date: string; completed: boolean }[] }>;
  timeEntries: Array<{ date: string; duration: number; focusQuality: string }>;
  journalEntries: Array<{ date: string; mood: number; energy: number }>;
  goals: Array<{
    id: string;
    title: string;
    progress: number;
    targetDate: string;
  }>;
}

class Predictor {
  /**
   * Predict tomorrow's energy level
   */
  async predictTomorrowEnergy(userData: UserData): Promise<EnergyForecast> {
    const todayData = this.getTodayData(userData);
    const historicalData = this.getHistoricalPatterns(userData);

    try {
      const prompt = ENERGY_FORECAST_PROMPT.replace(
        "{{todayData}}",
        JSON.stringify(todayData, null, 2),
      )
        .replace("{{historicalData}}", JSON.stringify(historicalData, null, 2))
        .replace("{{tomorrowSchedule}}", "[]"); // Would integrate with calendar

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
    } catch {
      return this.localEnergyForecast(userData);
    }
  }

  /**
   * Predict next week's outcomes
   */
  async forecastNextWeek(userData: UserData): Promise<WeekPrediction> {
    const last4Weeks = this.getLast4WeeksData(userData);

    try {
      const prompt = `
Predict next week's outcomes based on historical patterns.

LAST 4 WEEKS DATA:
${JSON.stringify(last4Weeks, null, 2)}

Return JSON:
{
  "taskCompletion": 75,
  "habitConsistency": 82,
  "lifeScore": 70,
  "confidence": 0.8,
  "explanation": "Based on improving trend..."
}`;

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
    } catch {
      return this.localWeekForecast(userData);
    }
  }

  /**
   * Predict goal completion probability
   */
  predictGoalCompletion(
    goal: { id: string; progress: number; targetDate: string },
    userData: UserData,
  ): GoalPrediction {
    const today = new Date();
    const targetDate = new Date(goal.targetDate);
    const daysRemaining = Math.max(
      1,
      Math.ceil(
        (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      ),
    );

    const progressNeeded = 100 - goal.progress;
    const requiredDailyProgress = progressNeeded / daysRemaining;

    // Calculate actual velocity from recent data
    const recentProgress = this.calculateRecentVelocity(userData);
    const currentDailyProgress = recentProgress;

    const probability = Math.min(
      1,
      currentDailyProgress / Math.max(0.1, requiredDailyProgress),
    );

    let verdict: "On Track" | "At Risk" | "Failing";
    let recommendation: string | undefined;

    if (probability > 0.7) {
      verdict = "On Track";
    } else if (probability > 0.4) {
      verdict = "At Risk";
      recommendation = `Increase daily effort by ${((1 - probability) * 100).toFixed(0)}% to meet target`;
    } else {
      verdict = "Failing";
      recommendation = `Consider extending deadline or reducing scope. Current pace won't meet target.`;
    }

    return {
      goalId: goal.id,
      probability,
      verdict,
      requiredDailyProgress,
      currentDailyProgress,
      recommendation,
    };
  }

  /**
   * Predict burnout risk score
   */
  calculateBurnoutRisk(userData: UserData): {
    score: number;
    level: "Low" | "Moderate" | "High" | "Critical";
    signals: { signal: string; value: number; concern: boolean }[];
    recommendations: string[];
  } {
    const last7Days = this.getLast7Days();

    // Calculate signals
    const workHours =
      userData.timeEntries
        .filter((t) => last7Days.includes(t.date.split("T")[0]))
        .reduce((s, t) => s + t.duration, 0) / 60;

    const recentJournals = userData.journalEntries.filter((j) =>
      last7Days.includes(j.date.split("T")[0]),
    );

    const avgMood =
      recentJournals.length > 0
        ? recentJournals.reduce((s, j) => s + j.mood, 0) / recentJournals.length
        : 5;

    const avgEnergy =
      recentJournals.length > 0
        ? recentJournals.reduce((s, j) => s + j.energy, 0) /
          recentJournals.length
        : 5;

    const signals = [
      { signal: "Work Hours", value: workHours, concern: workHours > 50 },
      { signal: "Avg Mood", value: avgMood, concern: avgMood < 5 },
      { signal: "Avg Energy", value: avgEnergy, concern: avgEnergy < 5 },
    ];

    // Calculate risk score
    let score = 0;
    if (workHours > 60) score += 0.3;
    else if (workHours > 50) score += 0.2;
    else if (workHours > 45) score += 0.1;

    if (avgMood < 4) score += 0.25;
    else if (avgMood < 5) score += 0.15;

    if (avgEnergy < 4) score += 0.25;
    else if (avgEnergy < 5) score += 0.15;

    const level =
      score > 0.6
        ? "Critical"
        : score > 0.4
          ? "High"
          : score > 0.2
            ? "Moderate"
            : "Low";

    const recommendations: string[] = [];
    if (workHours > 50)
      recommendations.push("Reduce work hours to under 50/week");
    if (avgMood < 5)
      recommendations.push("Schedule activities that boost mood");
    if (avgEnergy < 5) recommendations.push("Prioritize sleep and exercise");

    return { score, level, signals, recommendations };
  }

  /**
   * Local energy forecast without AI
   */
  private localEnergyForecast(userData: UserData): EnergyForecast {
    const recentJournals = userData.journalEntries.slice(0, 7);
    const avgEnergy =
      recentJournals.length > 0
        ? recentJournals.reduce((s, j) => s + j.energy, 0) /
          recentJournals.length
        : 5;

    // Find peak hours from historical data
    const hourlyEnergy: Record<number, { total: number; count: number }> = {};
    for (const entry of userData.timeEntries) {
      if (entry.focusQuality === "deep") {
        const hour = new Date(entry.date).getHours();
        if (!hourlyEnergy[hour]) hourlyEnergy[hour] = { total: 0, count: 0 };
        hourlyEnergy[hour].total += entry.duration;
        hourlyEnergy[hour].count++;
      }
    }

    const sortedHours = Object.entries(hourlyEnergy)
      .map(([hour, data]) => ({
        hour: parseInt(hour),
        avg: data.total / data.count,
      }))
      .sort((a, b) => b.avg - a.avg);

    return {
      predictedEnergy: Math.min(10, avgEnergy + 0.5), // Slight optimism
      confidence: 0.7,
      peakHours: sortedHours
        .slice(0, 2)
        .map((h) => `${h.hour}:00-${h.hour + 2}:00`),
      lowHours: ["13:00-14:00", "17:00-18:00"], // Common low points
      factors: [
        {
          factor: "Historical average",
          impact: avgEnergy - 5,
          confidence: 0.8,
        },
        { factor: "Day of week pattern", impact: 0.5, confidence: 0.6 },
      ],
      recommendations: [
        "Schedule important work during peak hours",
        "Take a walk after lunch to combat afternoon dip",
      ],
    };
  }

  /**
   * Local week forecast without AI
   */
  private localWeekForecast(userData: UserData): WeekPrediction {
    // Calculate recent completion rates
    const recentTasks = userData.tasks.filter((t) => {
      if (!t.completedAt) return false;
      const completedDate = new Date(t.completedAt);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      return completedDate > twoWeeksAgo;
    });

    const completedTasks = recentTasks.filter(
      (t) => t.status === "completed",
    ).length;
    const taskCompletion =
      recentTasks.length > 0
        ? Math.round((completedTasks / recentTasks.length) * 100)
        : 70;

    // Calculate habit consistency
    const last7Days = this.getLast7Days();
    let habitTotal = 0;
    let habitCompleted = 0;

    for (const habit of userData.habits) {
      for (const day of last7Days) {
        const completion = habit.completions.find((c) => c.date === day);
        if (completion) {
          habitTotal++;
          if (completion.completed) habitCompleted++;
        }
      }
    }

    const habitConsistency =
      habitTotal > 0 ? Math.round((habitCompleted / habitTotal) * 100) : 70;

    // Estimate life score
    const lifeScore = Math.round(
      taskCompletion * 0.4 + habitConsistency * 0.4 + 70 * 0.2,
    );

    return {
      taskCompletion,
      habitConsistency,
      lifeScore,
      confidence: 0.7,
      explanation: `Based on ${recentTasks.length} tasks and ${userData.habits.length} habits from the past 2 weeks.`,
    };
  }

  private getTodayData(userData: UserData): Record<string, unknown> {
    const today = new Date().toISOString().split("T")[0];

    const todayJournal = userData.journalEntries.find(
      (j) => j.date.split("T")[0] === today,
    );
    const todayTime = userData.timeEntries
      .filter((t) => t.date.split("T")[0] === today)
      .reduce((s, t) => s + t.duration, 0);

    return {
      mood: todayJournal?.mood || null,
      energy: todayJournal?.energy || null,
      timeLogged: todayTime,
    };
  }

  private getHistoricalPatterns(userData: UserData): Record<string, unknown> {
    const patterns: Record<number, { mood: number[]; energy: number[] }> = {};

    for (const entry of userData.journalEntries) {
      const dayOfWeek = new Date(entry.date).getDay();
      if (!patterns[dayOfWeek]) patterns[dayOfWeek] = { mood: [], energy: [] };
      patterns[dayOfWeek].mood.push(entry.mood);
      patterns[dayOfWeek].energy.push(entry.energy);
    }

    return Object.fromEntries(
      Object.entries(patterns).map(([day, data]) => [
        day,
        {
          avgMood: data.mood.reduce((a, b) => a + b, 0) / data.mood.length,
          avgEnergy:
            data.energy.reduce((a, b) => a + b, 0) / data.energy.length,
        },
      ]),
    );
  }

  private getLast4WeeksData(userData: UserData): Record<string, unknown> {
    const weeks: Record<
      string,
      {
        taskCompletion: number;
        habitCompletion: number;
        avgMood: number;
        workHours: number;
      }
    > = {};

    for (let w = 0; w < 4; w++) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - (w + 1) * 7);
      const weekEnd = new Date();
      weekEnd.setDate(weekEnd.getDate() - w * 7);

      const weekKey = `week_${w + 1}`;

      // Tasks
      const weekTasks = userData.tasks.filter((t) => {
        if (!t.completedAt) return false;
        const date = new Date(t.completedAt);
        return date >= weekStart && date < weekEnd;
      });
      const completedWeekTasks = weekTasks.filter(
        (t) => t.status === "completed",
      ).length;

      // Journals
      const weekJournals = userData.journalEntries.filter((j) => {
        const date = new Date(j.date);
        return date >= weekStart && date < weekEnd;
      });

      // Time
      const weekTime =
        userData.timeEntries
          .filter((t) => {
            const date = new Date(t.date);
            return date >= weekStart && date < weekEnd;
          })
          .reduce((s, t) => s + t.duration, 0) / 60;

      weeks[weekKey] = {
        taskCompletion:
          weekTasks.length > 0
            ? (completedWeekTasks / weekTasks.length) * 100
            : 0,
        habitCompletion: 0, // Would need more calculation
        avgMood:
          weekJournals.length > 0
            ? weekJournals.reduce((s, j) => s + j.mood, 0) / weekJournals.length
            : 5,
        workHours: weekTime,
      };
    }

    return weeks;
  }

  private calculateRecentVelocity(userData: UserData): number {
    // Calculate average daily progress based on task completion
    const last7Days = this.getLast7Days();
    const recentCompletions = userData.tasks.filter((t) => {
      if (!t.completedAt) return false;
      return last7Days.includes(t.completedAt.split("T")[0]);
    }).length;

    return recentCompletions / 7; // Tasks per day as proxy for velocity
  }

  private getLast7Days(): string[] {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    });
  }
}

export const predictor = new Predictor();
export type { EnergyForecast, WeekPrediction, GoalPrediction };
