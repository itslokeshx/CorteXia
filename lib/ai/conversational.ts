"use client";

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
  currentTime: string;
  fullData: {
    tasks: any[];
    habits: any[];
    goals: any[];
    transactions: any[];
    timeEntries: any[];
    studySessions: any[];
    journalEntries: any[];
  };
  stats: {
    tasks: {
      total: number;
      pending: number;
      completed: number;
      overdue: number;
      todayDue: number;
      highPriority: number;
    };
    habits: { total: number; completedToday: number; streaksAtRisk: any[] };
    goals: any;
    finance: {
      income: number;
      expenses: number;
      balance: number;
      byCategory: Record<string, number>;
    };
    time: {
      todayMinutes: number;
      weeklyByCategory: Record<string, number>;
      weeklyTotal: number;
    };
    study: { totalSessions: number; totalHours: number; subjects: string[] };
    journal: {
      totalEntries: number;
      avgMood: number | null;
      avgEnergy: number | null;
    };
  };
  availableActions: string[];
}

interface ConversationResponse {
  message: string;
  actions?: AIAction[];
  suggestions?: { text: string; action: string; reason?: string }[];
  followUp?: string;
}

// Enhanced system prompt with full capabilities
const ENHANCED_SYSTEM_PROMPT = `You are Cortexia, an AI life coach and powerful personal assistant for the CorteXia life management app.

PERSONALITY:
- Warm, supportive, and proactive
- Data-driven but conversational
- Action-oriented - you DO things, not just suggest

YOUR CAPABILITIES (you can execute these actions):
1. TASKS: create_task, update_task, delete_task, complete_task
2. HABITS: create_habit, update_habit, delete_habit, complete_habit  
3. GOALS: create_goal, update_goal, delete_goal, complete_milestone, add_tasks_to_goal
4. FINANCE: add_expense, add_income, delete_transaction
5. TIME: log_time, delete_time_entry
6. STUDY: log_study, delete_study_session
7. JOURNAL: create_journal, update_journal, delete_journal
8. NAVIGATION: navigate (to any page)

IMPORTANT GUIDELINES:
- When user asks to create/add/log something, ALWAYS include the action in your response
- Parse natural language intelligently (e.g., "add buy groceries to my tasks" → create_task)
- When creating goals with tasks, use add_tasks_to_goal to link them
- Provide specific data references when possible
- Be proactive - suggest related actions
- Keep responses concise but helpful

RESPONSE FORMAT (always return valid JSON):
{
  "message": "Your friendly response to the user",
  "actions": [
    { "type": "action_type", "data": { ...action_data } }
  ],
  "suggestions": [
    { "text": "Follow-up suggestion", "action": "action_type", "reason": "why this helps" }
  ]
}

ACTION DATA SCHEMAS:
- create_task: { title, description?, domain?, priority?, dueDate?, tags? }
- create_habit: { name, category?, frequency?, description? }
- create_goal: { title, description?, category?, priority?, targetDate?, milestones? }
- add_tasks_to_goal: { goalId, tasks: [{ title, description?, priority? }] }
- add_expense: { amount, category?, description?, date? }
- add_income: { amount, description?, date? }
- log_time: { task, category?, duration (in minutes), focusQuality?, notes? }
- log_study: { subject, duration (in minutes), topic?, difficulty? }
- create_journal: { title?, content, mood? (1-10), energy? (1-10), tags? }
- complete_task: { taskId }
- complete_habit: { habitId }
- navigate: { path }`;

class ConversationalAI {
  async chat(
    userMessage: string,
    context: ConversationContext,
  ): Promise<ConversationResponse> {
    // Build comprehensive prompt with all context
    const contextSummary = this.buildContextSummary(context);

    const prompt = `${ENHANCED_SYSTEM_PROMPT}

=== CURRENT USER DATA ===
${contextSummary}

=== CONVERSATION HISTORY ===
${this.formatHistory(context.history)}

=== USER MESSAGE ===
"${userMessage}"

Remember: 
- Always return valid JSON
- Include actions array when the user wants to create/modify/delete anything
- Be helpful and proactive`;

    try {
      const response = await fetch(`${API_URL}/api/ai/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: prompt,
          context: { type: "enhanced_conversation", data: context },
          systemPrompt: ENHANCED_SYSTEM_PROMPT,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get AI response");
      }

      const data = await response.json();

      // Try to parse as JSON, fallback to plain text
      try {
        // Clean up potential markdown code blocks
        let responseText = data.response;
        if (responseText.includes("```json")) {
          responseText = responseText
            .replace(/```json\n?/g, "")
            .replace(/```\n?/g, "");
        }
        if (responseText.includes("```")) {
          responseText = responseText.replace(/```\n?/g, "");
        }

        const parsed = JSON.parse(responseText.trim());
        return parsed;
      } catch {
        // If not JSON, return as plain message
        return { message: data.response };
      }
    } catch (error) {
      console.error("Conversation error:", error);

      // Enhanced fallback with local parsing
      return this.handleLocally(userMessage, context);
    }
  }

  // Local fallback when API fails
  private handleLocally(
    input: string,
    context: ConversationContext,
  ): ConversationResponse {
    const lowerInput = input.toLowerCase();
    const actions: AIAction[] = [];
    let message = "";

    // Parse intent and create appropriate actions

    // === TASK CREATION ===
    if (
      lowerInput.match(/create|add|new|make/i) &&
      lowerInput.match(/task|todo/i)
    ) {
      const titleMatch =
        input.match(/(?:task|todo)[:\s]+["']?([^"'\n]+)["']?/i) ||
        input.match(/["']([^"']+)["']/);
      const title = titleMatch
        ? titleMatch[1]
        : input.replace(/create|add|new|make|task|todo/gi, "").trim();

      if (title) {
        actions.push({
          type: "create_task",
          data: {
            title,
            priority:
              lowerInput.includes("urgent") || lowerInput.includes("important")
                ? "high"
                : "medium",
            domain: this.inferDomain(lowerInput),
          },
        });
        message = `I've created the task "${title}" for you!`;
      }
    }

    // === EXPENSE LOGGING ===
    else if (lowerInput.match(/spent|paid|bought|expense|\$/)) {
      const amountMatch = input.match(/\$?(\d+(?:\.\d{2})?)/);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

      if (amount > 0) {
        const category = this.inferExpenseCategory(lowerInput);
        const description = input
          .replace(/spent|paid|bought|\$\d+/gi, "")
          .trim();

        actions.push({
          type: "add_expense",
          data: { amount, category, description },
        });
        message = `Got it! I've logged a $${amount} expense for ${category}.`;
      }
    }

    // === GOAL CREATION ===
    else if (
      lowerInput.match(/create|add|new|set/i) &&
      lowerInput.match(/goal/i)
    ) {
      const titleMatch =
        input.match(/goal[:\s]+["']?([^"'\n]+)["']?/i) ||
        input.match(/["']([^"']+)["']/);
      const title = titleMatch
        ? titleMatch[1]
        : input.replace(/create|add|new|set|goal/gi, "").trim();

      if (title) {
        actions.push({
          type: "create_goal",
          data: {
            title,
            category: this.inferGoalCategory(lowerInput),
            priority: "medium",
          },
        });
        message = `Great! I've created the goal "${title}". Would you like to add some tasks to help achieve it?`;
      }
    }

    // === HABIT CREATION ===
    else if (
      lowerInput.match(/create|add|new|start/i) &&
      lowerInput.match(/habit/i)
    ) {
      const nameMatch =
        input.match(/habit[:\s]+["']?([^"'\n]+)["']?/i) ||
        input.match(/["']([^"']+)["']/);
      const name = nameMatch
        ? nameMatch[1]
        : input.replace(/create|add|new|start|habit/gi, "").trim();

      if (name) {
        actions.push({
          type: "create_habit",
          data: { name, frequency: "daily", category: "productivity" },
        });
        message = `I've created the habit "${name}". I'll remind you to complete it daily!`;
      }
    }

    // === JOURNAL ENTRY ===
    else if (lowerInput.match(/journal|feeling|felt|mood|diary/i)) {
      const content = input.replace(/create|add|journal|entry/gi, "").trim();
      const mood = this.inferMood(lowerInput);

      actions.push({
        type: "create_journal",
        data: { content, mood, energy: mood },
      });
      message = `I've saved your journal entry. ${mood >= 7 ? "Glad you're feeling good!" : mood <= 4 ? "I hope things get better soon. 💙" : "Thanks for sharing!"}`;
    }

    // === STUDY SESSION ===
    else if (lowerInput.match(/studied|study|learning|practiced/i)) {
      const durationMatch = input.match(/(\d+)\s*(?:minutes?|min|m|hours?|h)/i);
      let duration = durationMatch ? parseInt(durationMatch[1]) : 30;
      if (durationMatch?.[0]?.match(/hours?|h/i)) duration *= 60;

      const subjectMatch = input.match(
        /(?:studied?|learning|practiced?)\s+(\w+)/i,
      );
      const subject = subjectMatch ? subjectMatch[1] : "General";

      actions.push({
        type: "log_study",
        data: { subject, duration },
      });
      message = `Nice! I've logged ${duration} minutes of studying ${subject}. Keep up the great work! 📚`;
    }

    // === TIME LOGGING ===
    else if (
      lowerInput.match(/worked|spent time|logged|tracked/i) &&
      lowerInput.match(/\d+/)
    ) {
      const durationMatch = input.match(/(\d+)\s*(?:minutes?|min|m|hours?|h)/i);
      let duration = durationMatch ? parseInt(durationMatch[1]) : 30;
      if (durationMatch?.[0]?.match(/hours?|h/i)) duration *= 60;

      const task = input
        .replace(
          /worked|spent|time|logged|tracked|on|\d+\s*(?:minutes?|min|m|hours?|h)/gi,
          "",
        )
        .trim();

      actions.push({
        type: "log_time",
        data: { task: task || "Work", duration, category: "work" },
      });
      message = `Logged ${duration} minutes for "${task || "Work"}". Great progress! ⏱️`;
    }

    // === SHOW TODAY ===
    else if (lowerInput.match(/show|what|today|schedule|priorities/i)) {
      const { stats } = context;
      message = `📋 **Today's Overview:**\n\n`;
      message += `• **Tasks:** ${stats.tasks.pending} pending (${stats.tasks.highPriority} high priority)\n`;
      message += `• **Habits:** ${stats.habits.completedToday}/${stats.habits.total} completed\n`;
      message += `• **Time logged:** ${stats.time.todayMinutes} minutes\n`;

      if (stats.tasks.overdue > 0) {
        message += `\n⚠️ You have ${stats.tasks.overdue} overdue tasks!`;
      }
      if (stats.habits.streaksAtRisk.length > 0) {
        message += `\n🔥 Streaks at risk: ${stats.habits.streaksAtRisk.map((h: any) => h.name).join(", ")}`;
      }
    }

    // === DEFAULT RESPONSE ===
    else {
      message =
        "I can help you with:\n• Creating tasks, habits, goals\n• Logging expenses, time, and study sessions\n• Writing journal entries\n• Showing your daily overview\n\nJust tell me what you'd like to do!";
    }

    return {
      message,
      actions: actions.length > 0 ? actions : undefined,
      suggestions: this.generateSuggestions(context),
    };
  }

  private buildContextSummary(context: ConversationContext): string {
    const { stats, fullData } = context;

    let summary = `Current Page: ${context.currentPage}
Current Time: ${context.currentTime}

📊 STATS OVERVIEW:
- Tasks: ${stats.tasks.total} total, ${stats.tasks.pending} pending, ${stats.tasks.overdue} overdue, ${stats.tasks.highPriority} high priority
- Habits: ${stats.habits.total} total, ${stats.habits.completedToday} completed today
- Goals: ${stats.goals.total} total, ${stats.goals.completed} completed, ${stats.goals.inProgress} in progress
- Finance: $${stats.finance.income} income, $${stats.finance.expenses} expenses, $${stats.finance.balance} balance
- Time: ${stats.time.todayMinutes}min today, ${stats.time.weeklyTotal}min this week
- Study: ${stats.study.totalHours.toFixed(1)}h total, subjects: ${stats.study.subjects.slice(0, 5).join(", ")}
- Journal: ${stats.journal.totalEntries} entries, avg mood: ${stats.journal.avgMood || "N/A"}`;

    // Add recent items for context
    if (fullData.tasks.length > 0) {
      summary += `\n\n📝 RECENT TASKS (pending):`;
      fullData.tasks
        .filter((t) => t.status !== "completed")
        .slice(0, 5)
        .forEach((t) => {
          summary += `\n- [${t.id}] "${t.title}" (${t.priority} priority${t.dueDate ? `, due: ${t.dueDate}` : ""})`;
        });
    }

    if (fullData.goals.length > 0) {
      summary += `\n\n🎯 ACTIVE GOALS:`;
      fullData.goals
        .filter((g) => g.status === "active")
        .slice(0, 5)
        .forEach((g) => {
          summary += `\n- [${g.id}] "${g.title}" (${g.progress}% complete, target: ${g.targetDate})`;
        });
    }

    if (fullData.habits.length > 0) {
      summary += `\n\n✨ HABITS:`;
      fullData.habits.slice(0, 5).forEach((h) => {
        summary += `\n- [${h.id}] "${h.name}" (streak: ${h.streak}${h.completedToday ? " ✓" : ""})`;
      });
    }

    return summary;
  }

  private formatHistory(history: Message[]): string {
    if (!history || history.length === 0) return "No previous conversation";

    return history
      .slice(-5)
      .map((m) => `${m.role === "user" ? "User" : "Cortexia"}: ${m.content}`)
      .join("\n");
  }

  private inferDomain(text: string): string {
    if (text.match(/work|meeting|project|report|email|client/)) return "work";
    if (text.match(/study|learn|read|course|class|exam/)) return "study";
    if (text.match(/health|gym|exercise|doctor|medicine/)) return "health";
    if (text.match(/money|budget|pay|bill|finance/)) return "finance";
    return "personal";
  }

  private inferExpenseCategory(text: string): string {
    if (text.match(/food|lunch|dinner|coffee|breakfast|grocery|restaurant/))
      return "food";
    if (text.match(/uber|taxi|transport|gas|fuel|bus|train|flight/))
      return "transport";
    if (text.match(/movie|netflix|game|entertainment|concert|show/))
      return "entertainment";
    if (text.match(/doctor|medicine|pharmacy|health|gym/)) return "health";
    if (text.match(/book|course|class|learn|tuition/)) return "learning";
    if (text.match(/electric|water|internet|phone|utility|bill/))
      return "utilities";
    return "other";
  }

  private inferGoalCategory(text: string): string {
    if (text.match(/health|fitness|weight|exercise|run|gym/)) return "health";
    if (text.match(/career|job|promotion|work|professional/)) return "career";
    if (text.match(/money|save|invest|financial|budget/)) return "financial";
    if (text.match(/learn|study|course|skill|education/)) return "education";
    if (text.match(/family|relationship|friend/)) return "family";
    return "personal";
  }

  private inferMood(text: string): number {
    if (text.match(/amazing|fantastic|excellent|perfect|great/)) return 9;
    if (text.match(/good|happy|nice|wonderful|excited/)) return 8;
    if (text.match(/okay|fine|alright|decent/)) return 6;
    if (text.match(/tired|exhausted|drained/)) return 4;
    if (text.match(/sad|bad|upset|frustrated|angry/)) return 3;
    if (text.match(/terrible|awful|horrible|depressed/)) return 2;
    return 5;
  }

  private generateSuggestions(
    context: ConversationContext,
  ): Array<{ text: string; action: string; reason?: string }> {
    const suggestions: Array<{
      text: string;
      action: string;
      reason?: string;
    }> = [];
    const { stats } = context;

    if (stats.tasks.overdue > 0) {
      suggestions.push({
        text: "Show my overdue tasks",
        action: "show_overdue",
        reason: `You have ${stats.tasks.overdue} overdue tasks`,
      });
    }

    if (stats.habits.completedToday < stats.habits.total) {
      suggestions.push({
        text: "What habits should I do today?",
        action: "show_habits",
        reason: `${stats.habits.total - stats.habits.completedToday} habits remaining`,
      });
    }

    if (stats.time.todayMinutes < 60) {
      suggestions.push({
        text: "Log my work time",
        action: "log_time",
        reason: "Low time logged today",
      });
    }

    return suggestions.slice(0, 3);
  }

  clearHistory(): void {
    // No-op for stateless implementation
  }
}

export const conversationalAI = new ConversationalAI();
export type { Message, AIAction, ConversationContext, ConversationResponse };
