"use client";

import {
  CORTEXIA_SYSTEM_PROMPT,
  CONVERSATION_SYSTEM_PROMPT,
  MORNING_BRIEFING_PROMPT,
  NATURAL_LANGUAGE_PARSER_PROMPT,
} from "./prompts/system-prompts";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  actions?: AIAction[];
}

interface AIAction {
  type: string;
  data: Record<string, unknown>;
}

interface ConversationContext {
  history: Message[];
  currentPage: string;
  userData: UserDataSnapshot;
}

interface UserDataSnapshot {
  tasks: { pending: number; overdue: number; todayDue: number };
  habits: { completed: number; total: number; streaksAtRisk: string[] };
  finance: { spent: number; budget: number; remaining: number };
  timeLogged: number;
  recentActivity: string[];
  mood: number;
}

interface ConversationResponse {
  message: string;
  actions?: AIAction[];
  suggestions?: { text: string; action: string; reason?: string }[];
  followUp?: string;
}

class ConversationalAI {
  private conversationHistory: Message[] = [];

  async chat(
    userMessage: string,
    context: ConversationContext,
  ): Promise<ConversationResponse> {
    // Build the prompt with context
    const dataSnapshot = this.formatDataSnapshot(context.userData);

    const prompt = CONVERSATION_SYSTEM_PROMPT.replace(
      "{{history}}",
      this.formatHistory(context.history),
    )
      .replace("{{dataSnapshot}}", dataSnapshot)
      .replace("{{currentPage}}", context.currentPage)
      .replace("{{currentTime}}", new Date().toLocaleString())
      .replace(
        "{{recentActivity}}",
        context.userData.recentActivity.slice(0, 5).join(", "),
      )
      .replace("{{message}}", userMessage);

    try {
      const response = await fetch(`${API_URL}/api/ai/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: prompt,
          context: { type: "conversation", data: context },
          systemPrompt: CORTEXIA_SYSTEM_PROMPT,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();

      // Try to parse as JSON, fallback to plain text
      try {
        const parsed = JSON.parse(data.response);
        return parsed;
      } catch {
        return { message: data.response };
      }
    } catch (error) {
      console.error("Conversation error:", error);
      return {
        message: "I'm having trouble connecting right now. Please try again.",
      };
    }
  }

  async generateMorningBriefing(userData: Record<string, unknown>): Promise<{
    greeting: string;
    criticalPath: { item: string; deadline: string; aiReason: string }[];
    habitAlerts: { habit: string; streak: number; message: string }[];
    energyPrediction: { level: number; reason: string };
    motivation: string;
  }> {
    const prompt = MORNING_BRIEFING_PROMPT.replace(
      "{{userData}}",
      JSON.stringify(userData, null, 2),
    );

    try {
      const response = await fetch(`${API_URL}/api/ai/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: prompt,
          context: { type: "morning_briefing", data: userData },
        }),
      });

      const data = await response.json();
      return JSON.parse(data.response);
    } catch (error) {
      console.error("Morning briefing error:", error);
      return {
        greeting: "Good morning! Let's make today count.",
        criticalPath: [],
        habitAlerts: [],
        energyPrediction: { level: 7, reason: "Based on your usual patterns" },
        motivation: "Every day is a new opportunity to grow.",
      };
    }
  }

  async parseNaturalLanguage(
    input: string,
    context: {
      recentTasks: string[];
      activeHabits: string[];
      timezone: string;
    },
  ): Promise<{
    type: string;
    confidence: number;
    data: Record<string, unknown>;
    suggestions?: { field: string; value: string; reason: string }[];
  }> {
    const prompt = NATURAL_LANGUAGE_PARSER_PROMPT.replace("{{input}}", input)
      .replace("{{currentTime}}", new Date().toISOString())
      .replace("{{timezone}}", context.timezone)
      .replace("{{recentTasks}}", context.recentTasks.join(", "))
      .replace("{{activeHabits}}", context.activeHabits.join(", "))
      .replace(
        "{{expenseCategories}}",
        "food, transport, entertainment, health, learning, utilities",
      );

    try {
      const response = await fetch(`${API_URL}/api/ai/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: prompt,
          context: { type: "parse", input },
        }),
      });

      const data = await response.json();
      return JSON.parse(data.response);
    } catch (error) {
      console.error("Parse error:", error);
      // Fallback to local parsing
      return this.localParse(input);
    }
  }

  private localParse(input: string): {
    type: string;
    confidence: number;
    data: Record<string, unknown>;
  } {
    const lowerInput = input.toLowerCase();

    // Expense patterns
    if (lowerInput.match(/spent|\$|paid|bought|cost/)) {
      const amountMatch = input.match(/\$?(\d+(?:\.\d{2})?)/);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

      let category = "other";
      if (lowerInput.match(/food|lunch|dinner|coffee|breakfast|grocery/))
        category = "food";
      else if (lowerInput.match(/uber|taxi|transport|gas|fuel|bus|train/))
        category = "transport";
      else if (lowerInput.match(/movie|netflix|game|entertainment/))
        category = "entertainment";

      return {
        type: "expense",
        confidence: 0.85,
        data: { amount, category, description: input, type: "expense" },
      };
    }

    // Task patterns
    if (
      lowerInput.match(/finish|complete|do|submit|send|write|create|build|fix/)
    ) {
      let deadline = "";
      if (lowerInput.includes("tomorrow")) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        deadline = tomorrow.toISOString().split("T")[0];
      } else if (lowerInput.includes("friday")) {
        deadline = this.getNextDayOfWeek(5);
      } else if (lowerInput.match(/by (\w+)/)) {
        const match = lowerInput.match(/by (\w+)/);
        if (match) deadline = this.parseDateWord(match[1]);
      }

      return {
        type: "task",
        confidence: 0.8,
        data: {
          title: input.replace(/by \w+/gi, "").trim(),
          dueDate: deadline,
          priority: lowerInput.includes("urgent") ? "high" : "medium",
        },
      };
    }

    // Study patterns
    if (lowerInput.match(/studied|learning|read|practicing|study/)) {
      const durationMatch = input.match(/(\d+)\s*(?:minutes?|min|m|hours?|h)/i);
      const duration = durationMatch ? parseInt(durationMatch[1]) : 30;
      const isHours = durationMatch?.[0]?.match(/hours?|h/i);

      const subjectMatch = input.match(/studied?\s+(\w+)/i);
      const subject = subjectMatch ? subjectMatch[1] : "General";

      return {
        type: "study_session",
        confidence: 0.8,
        data: {
          subject,
          duration: isHours ? duration * 60 : duration,
        },
      };
    }

    // Habit completion
    if (
      lowerInput.match(/did|completed|finished|went to gym|meditated|exercised/)
    ) {
      return {
        type: "habit_completion",
        confidence: 0.75,
        data: { name: input, completed: true },
      };
    }

    // Journal
    if (lowerInput.match(/feeling|felt|today was|mood/)) {
      let mood = 5;
      if (lowerInput.match(/great|amazing|wonderful|fantastic|productive/))
        mood = 8;
      else if (lowerInput.match(/good|nice|okay/)) mood = 7;
      else if (lowerInput.match(/bad|terrible|awful|stressed|anxious/))
        mood = 3;
      else if (lowerInput.match(/tired|exhausted/)) mood = 4;

      return {
        type: "journal",
        confidence: 0.7,
        data: { content: input, mood },
      };
    }

    // Default to task
    return {
      type: "task",
      confidence: 0.5,
      data: { title: input },
    };
  }

  private getNextDayOfWeek(dayOfWeek: number): string {
    const today = new Date();
    const resultDate = new Date(today);
    resultDate.setDate(
      today.getDate() + ((dayOfWeek - today.getDay() + 7) % 7 || 7),
    );
    return resultDate.toISOString().split("T")[0];
  }

  private parseDateWord(word: string): string {
    const days: Record<string, number> = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };

    if (days[word.toLowerCase()] !== undefined) {
      return this.getNextDayOfWeek(days[word.toLowerCase()]);
    }

    return "";
  }

  private formatHistory(history: Message[]): string {
    return history
      .slice(-10)
      .map((m) => `${m.role}: ${m.content}`)
      .join("\n");
  }

  private formatDataSnapshot(data: UserDataSnapshot): string {
    return `
- Tasks: ${data.tasks.pending} pending, ${data.tasks.overdue} overdue, ${data.tasks.todayDue} due today
- Habits: ${data.habits.completed}/${data.habits.total} completed today
- Streaks at risk: ${data.habits.streaksAtRisk.join(", ") || "None"}
- Budget: $${data.finance.remaining} remaining of $${data.finance.budget}
- Time logged today: ${data.timeLogged}min
- Current mood: ${data.mood}/10
    `.trim();
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  getHistory(): Message[] {
    return [...this.conversationHistory];
  }
}

export const conversationalAI = new ConversationalAI();
export type { Message, AIAction, ConversationContext, ConversationResponse };
