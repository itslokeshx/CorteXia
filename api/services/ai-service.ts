import Groq from "groq-sdk";

let groq: Groq | null = null;

// Initialize Groq only if API key is available
if (process.env.GROQ_API_KEY) {
  groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

// Helper to call Groq API
async function callGroq(
  prompt: string,
  maxTokens: number = 500,
): Promise<string | null> {
  if (!groq) return null;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.1-70b-versatile",
      temperature: 0.7,
      max_tokens: maxTokens,
    });
    return completion.choices[0]?.message?.content || null;
  } catch (error) {
    console.error("Groq API error:", error);
    return null;
  }
}

/**
 * Calculate AI priority score for a task
 */
export async function calculateTaskPriority(task: {
  title: string;
  description?: string;
  dueDate?: string | null;
  category?: string;
}): Promise<{ score: number; reasoning: string }> {
  const prompt = `
Analyze this task and assign a priority score from 0-100 where:
- 90-100: Critical, blocking everything else
- 70-89: High priority, urgent
- 40-69: Medium priority, important
- 20-39: Low priority, nice to have
- 0-19: Optional, can wait

Task details:
- Title: ${task.title}
${task.description ? `- Description: ${task.description}` : ""}
${task.dueDate ? `- Due date: ${task.dueDate}` : ""}
${task.category ? `- Category: ${task.category}` : ""}

Respond in JSON format only:
{"score": <number 0-100>, "reasoning": "<brief explanation in 1-2 sentences>"}
  `.trim();

  const response = await callGroq(prompt, 150);

  if (response) {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          score: Math.min(100, Math.max(0, parsed.score)),
          reasoning: parsed.reasoning,
        };
      }
    } catch (error) {
      console.error("AI priority parsing error:", error);
    }
  }

  // Fallback to rule-based scoring
  return {
    score: task.dueDate ? 70 : 50,
    reasoning: "Using rule-based priority calculation",
  };
}

/**
 * Generate life score explanation
 */
export async function generateLifeScoreExplanation(data: {
  score: number;
  tasks: { pending: number; completed: number };
  habits: { done: number; total: number };
  budget: { spent: number; limit: number };
  goals: { onTrack: number; total: number };
}): Promise<string> {
  const prompt = `
Generate a concise life status explanation (max 60 words) based on these metrics:

Overall Score: ${data.score}/100
Tasks: ${data.tasks.completed} done, ${data.tasks.pending} pending
Habits: ${data.habits.done}/${data.habits.total} completed today
Budget: $${data.budget.spent}/$${data.budget.limit} this week
Goals: ${data.goals.onTrack}/${data.goals.total} on track

Format: Use bullet points (•) to list 2-3 key observations. Be specific and actionable. Keep it positive when possible.

Example: "Strong habit momentum • 3 urgent tasks need attention • Budget at 75% (good control)"

Your explanation (no extra text, just the bullet points):
  `.trim();

  const response = await callGroq(prompt, 100);

  if (response) {
    return response.trim();
  }

  // Fallback
  const insights: string[] = [];
  if (data.tasks.pending > 5)
    insights.push(`${data.tasks.pending} pending tasks need attention`);
  if (data.habits.done < data.habits.total / 2)
    insights.push("Habit completion below 50%");
  if (data.budget.spent > data.budget.limit * 0.8)
    insights.push("Budget at 80%+ utilization");
  if (data.goals.onTrack >= data.goals.total / 2)
    insights.push(`${data.goals.onTrack}/${data.goals.total} goals on track`);

  return insights.length > 0
    ? `• ${insights.join(" • ")}`
    : "Keep up the good work!";
}

/**
 * Generate weekly synthesis report
 */
export async function generateWeeklySynthesis(data: {
  tasks: any[];
  habits: any[];
  timeLogs: any[];
  transactions: any[];
  goals: any[];
  journalEntries: any[];
}): Promise<string> {
  const taskCompleted = data.tasks.filter(
    (t: any) => t.status === "completed",
  ).length;
  const habitsDone = data.habits.filter((h: any) => h.completed).length;
  const totalSpent = data.transactions.reduce(
    (sum: number, t: any) =>
      t.type === "expense" ? sum + Math.abs(t.amount) : sum,
    0,
  );
  const totalTimeMinutes = data.timeLogs.reduce(
    (sum: number, t: any) => sum + (t.durationMinutes || 0),
    0,
  );

  const prompt = `
Generate a comprehensive weekly synthesis report (300-500 words) based on this user's data:

TASKS:
- Completed: ${taskCompleted}
- Pending: ${data.tasks.filter((t: any) => t.status !== "completed").length}

HABITS:
- Total check-ins: ${data.habits.length}

TIME DISTRIBUTION:
- Total logged: ${totalTimeMinutes} minutes

SPENDING:
- Total: $${totalSpent.toFixed(2)}

GOALS:
- Active goals: ${data.goals.filter((g: any) => g.status === "active").length}

JOURNAL:
- Entries: ${data.journalEntries.length}
- Average mood: ${data.journalEntries.length > 0 ? (data.journalEntries.reduce((sum: number, e: any) => sum + (e.moodScore || 5), 0) / data.journalEntries.length).toFixed(1) : "N/A"}

Format the report with:
1. **Executive Summary**: 2-3 sentences on overall week
2. **Key Wins**: 3-4 specific achievements
3. **Patterns Detected**: 2-3 behavioral patterns noticed
4. **Next Week Focus**: 2-3 recommendations

Use markdown formatting. Be specific, insightful, and actionable.
  `.trim();

  const response = await callGroq(prompt, 800);

  if (response) {
    return response;
  }

  // Fallback
  return `## Weekly Summary

### Overview
This week you completed **${taskCompleted} tasks** and logged **${Math.round(totalTimeMinutes / 60)} hours** of focused work.

### Key Highlights
- **Tasks:** ${taskCompleted} completed out of ${data.tasks.length} total
- **Habits:** ${habitsDone} habits tracked
- **Spending:** $${totalSpent.toFixed(2)} in expenses
- **Goals:** ${data.goals.filter((g: any) => g.status === "active").length} active goals

### Recommendations
1. Focus on completing remaining tasks
2. Maintain habit consistency
3. Review budget allocations

*AI-powered insights available with Groq API configured.*`;
}

/**
 * Parse Quick Add natural language input
 */
export async function parseQuickAddInput(input: string): Promise<{
  type: "task" | "expense" | "habit" | "time" | "study" | "journal";
  data: any;
}> {
  // Simple rule-based parsing as fallback
  const lowerInput = input.toLowerCase();

  // Expense patterns
  if (lowerInput.match(/spent|\$|paid|bought|cost/)) {
    const amountMatch = input.match(/\$?(\d+(?:\.\d{2})?)/);
    const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

    let category = "other";
    if (
      lowerInput.includes("food") ||
      lowerInput.includes("lunch") ||
      lowerInput.includes("dinner") ||
      lowerInput.includes("coffee")
    ) {
      category = "food";
    } else if (
      lowerInput.includes("uber") ||
      lowerInput.includes("taxi") ||
      lowerInput.includes("transport") ||
      lowerInput.includes("gas")
    ) {
      category = "transport";
    } else if (
      lowerInput.includes("movie") ||
      lowerInput.includes("netflix") ||
      lowerInput.includes("game")
    ) {
      category = "entertainment";
    }

    return {
      type: "expense",
      data: { amount, category, description: input, type: "expense" },
    };
  }

  // Time patterns
  if (lowerInput.match(/worked|studied|spent.*hours?|for \d+h/)) {
    const durationMatch = input.match(/(\d+)\s*(?:hours?|h|minutes?|min|m)/i);
    const duration = durationMatch ? parseInt(durationMatch[1]) : 30;
    const isHours = durationMatch && durationMatch[0].match(/hours?|h/i);

    return {
      type: "time",
      data: {
        activity: input,
        duration: isHours ? duration * 60 : duration,
        category: lowerInput.includes("study") ? "study" : "work",
      },
    };
  }

  // Study patterns
  if (lowerInput.match(/studied|learned|read.*chapter|practicing/)) {
    const durationMatch = input.match(/(\d+)\s*(?:minutes?|min|m|hours?|h)/i);
    const duration = durationMatch ? parseInt(durationMatch[1]) : 30;
    const isHours = durationMatch && durationMatch[0].match(/hours?|h/i);

    return {
      type: "study",
      data: {
        subject:
          input.replace(/studied|learned|for \d+.*$/gi, "").trim() || "General",
        duration: isHours ? duration * 60 : duration,
      },
    };
  }

  // Habit patterns
  if (
    lowerInput.match(/did|completed|finished|went to gym|meditated|exercised/)
  ) {
    return {
      type: "habit",
      data: { habitName: input, completed: true },
    };
  }

  // Journal patterns
  if (lowerInput.match(/feeling|mood|today was|grateful|stressed|happy|sad/)) {
    return {
      type: "journal",
      data: {
        content: input,
        mood:
          lowerInput.includes("happy") || lowerInput.includes("great")
            ? "happy"
            : "neutral",
      },
    };
  }

  // Default to task
  return {
    type: "task",
    data: { title: input },
  };
}

/**
 * Generate morning briefing
 */
export async function generateMorningBriefing(data: {
  pendingTasks: any[];
  todayHabits: any[];
  upcomingDeadlines: any[];
  yesterdayMood?: number;
}): Promise<string> {
  const urgent = data.pendingTasks.filter(
    (t: any) => t.priority === "high" || t.priority === "urgent",
  );

  const prompt = `
Generate a brief, motivational morning briefing (2-3 sentences) based on:
- ${data.pendingTasks.length} pending tasks (${urgent.length} high priority)
- ${data.todayHabits.length} habits to complete today
- ${data.upcomingDeadlines.length} upcoming deadlines this week
${data.yesterdayMood ? `- Yesterday's mood: ${data.yesterdayMood}/10` : ""}

Be encouraging but actionable. Start with "Good morning!"
  `.trim();

  const response = await callGroq(prompt, 100);

  if (response) {
    return response.trim();
  }

  // Fallback
  return `Good morning! You have ${data.pendingTasks.length} tasks today${urgent.length > 0 ? ` (${urgent.length} urgent)` : ""}. ${data.todayHabits.length} habits to track. Let's make it a great day!`;
}

/**
 * Ask AI general question about user's data
 */
export async function askAI(question: string, context: any): Promise<string> {
  const prompt = `
You are an AI life coach assistant for CorteXia, a personal life management app. 
The user has asked: "${question}"

Here's their current data context:
- Tasks: ${context.tasks?.length || 0} total (${context.tasks?.filter((t: any) => t.status === "completed").length || 0} completed)
- Habits: ${context.habits?.length || 0} tracked
- Goals: ${context.goals?.length || 0} active
- Recent mood trend: ${context.avgMood || "N/A"}/10

Provide a helpful, actionable response based on their question. Keep it concise (2-4 sentences unless they ask for detail).
  `.trim();

  const response = await callGroq(prompt, 300);

  if (response) {
    return response.trim();
  }

  return "AI assistant is currently unavailable. Please check your Groq API key configuration.";
}

// Helper function
export function getMostCommon(arr: any[]): string {
  if (!arr.length) return "N/A";
  const counts = arr.reduce((acc: Record<string, number>, val: any) => {
    if (val) {
      acc[val] = (acc[val] || 0) + 1;
    }
    return acc;
  }, {});
  const entries = Object.entries(counts);
  if (!entries.length) return "N/A";
  return entries.reduce((a, b) => (a[1] > b[1] ? a : b))[0];
}
