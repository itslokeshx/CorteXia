"use client";

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
const ENHANCED_SYSTEM_PROMPT = `You are Cortexia, a highly intelligent AI assistant that can answer ANY question AND help manage the user's life through the CorteXia app.

CORE IDENTITY:
- You are a GENERAL-PURPOSE AI assistant first - answer ANY question the user asks (science, history, movies, coding, advice, etc.)
- You are ALSO a life management assistant that can create tasks, track habits, log expenses, etc.
- Be warm, knowledgeable, and conversational
- Give direct, helpful answers without being preachy

HOW TO RESPOND:
1. FIRST: Answer the user's actual question directly and helpfully (if it's a general knowledge question, trivia, advice, etc.)
2. THEN: If relevant, suggest how they might want to track/organize this in the app

EXAMPLE - User asks "What is quantum computing?":
- Answer the question about quantum computing clearly
- Then suggest: "Would you like me to create a study goal for learning quantum computing?"

EXAMPLE - User asks "Who directed Inception?":
- Answer: Christopher Nolan directed Inception (2010)
- Then suggest: "Want me to add 'Watch Inception' to your tasks?"

YOUR APP CAPABILITIES (use when relevant):
- TASKS: create_task, update_task, delete_task, complete_task
- HABITS: create_habit, update_habit, delete_habit, complete_habit  
- GOALS: create_goal, update_goal, delete_goal, complete_milestone
- FINANCE: add_expense, add_income, delete_transaction
- TIME: log_time, delete_time_entry
- STUDY: log_study, delete_study_session
- JOURNAL: create_journal, update_journal, delete_journal
- NAVIGATION: navigate (to any page)

RESPONSE FORMAT (always return valid JSON):
{
  "message": "Your complete response - answer the question FIRST, then any app suggestions",
  "actions": [],
  "suggestions": [
    { "text": "Relevant suggestion", "action": "action_type", "reason": "why" }
  ]
}

IMPORTANT:
- The "message" field should contain your FULL natural response - no JSON in the message
- Only include "actions" if the user explicitly asks to create/add/do something
- Always include helpful "suggestions" that connect the topic to productivity/life management
- Be concise but complete

ACTION DATA SCHEMAS (only when user asks to create something):
- create_task: { title, description?, domain?, priority?, dueDate?, tags? }
- create_habit: { name, category?, frequency?, description? }
- create_goal: { title, description?, category?, priority?, targetDate?, milestones? }
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

CRITICAL INSTRUCTIONS:
1. Return ONLY valid JSON - no text before or after
2. Your "message" field should contain your COMPLETE natural language response
3. Do NOT include any JSON in the message field - that's for the user to read
4. For general questions (trivia, advice, etc.), answer fully in the "message" field
5. Only put actions in "actions" array if user explicitly wants to create/add something
6. Always suggest relevant app features in "suggestions"

Return your response as pure JSON now:`;

    try {
      const response = await fetch(`${API_URL}/api/ai/chat`, {
        method: "POST",
        headers: getAuthHeaders(),
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

    // Parse intent and create appropriate actions with CLEAR responses

    // === TASK CREATION ===
    if (
      lowerInput.match(/create|add|new|make|remind/i) &&
      lowerInput.match(/task|todo/i)
    ) {
      const titleMatch =
        input.match(/(?:task|todo)[:\s]+["']?([^"'\n]+)["']?/i) ||
        input.match(/["']([^"']+)["']/);
      const title = titleMatch
        ? titleMatch[1].trim()
        : input
            .replace(/create|add|new|make|remind|me|to|task|todo|a|an/gi, "")
            .trim();

      if (title) {
        const priority =
          lowerInput.includes("urgent") ||
          lowerInput.includes("important") ||
          lowerInput.includes("critical")
            ? "high"
            : lowerInput.includes("low priority")
              ? "low"
              : "medium";

        const domain = this.inferDomain(lowerInput);

        actions.push({
          type: "create_task",
          data: {
            title,
            priority,
            domain,
            description:
              lowerInput.includes("description") ||
              lowerInput.includes("details")
                ? input.split(/description|details/i)[1]?.trim()
                : undefined,
          },
        });
        message = `✅ **Task Created**\n\n📋 **"${title}"**\n• Priority: ${priority}\n• Category: ${domain}\n\nI've added this to your task list!`;
      }
    }

    // === NOTE/JOURNAL CREATION ===
    else if (
      (lowerInput.match(/note|journal|write/i) &&
        !lowerInput.match(/delete|remove/)) ||
      lowerInput.match(/^(i|i'm|im|feeling|felt)/i)
    ) {
      const content = input
        .replace(
          /^(create|add|make|new|write|a|an)\s+(note|journal|entry)?\s*:?\s*/i,
          "",
        )
        .trim();

      const mood = this.inferMood(lowerInput);
      const moodEmoji =
        mood >= 8
          ? "😄"
          : mood >= 6
            ? "😊"
            : mood >= 4
              ? "😐"
              : mood >= 2
                ? "😟"
                : "😢";

      if (content) {
        actions.push({
          type: "create_journal",
          data: {
            content,
            mood,
            energy: mood,
            tags: ["quick-note", "ai-created"],
          },
        });
        message = `📝 **Journal Entry Saved**\n\n${moodEmoji} Mood detected: ${mood}/10\n\n${content.substring(0, 100)}${content.length > 100 ? "..." : ""}\n\n${mood >= 7 ? "Glad you're feeling good!" : mood <= 4 ? "I hope things get better soon. 💙" : "Thanks for sharing!"}`;
      }
    }

    // === EXPENSE LOGGING ===
    else if (lowerInput.match(/spent|paid|bought|expense|purchase|\$|dollar/)) {
      const amountMatch = input.match(/\$?(\d+(?:\.\d{2})?)/);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

      if (amount > 0) {
        const category = this.inferExpenseCategory(lowerInput);
        const description =
          input
            .replace(
              /spent|paid|bought|expense|purchase|for|on|\$\d+(\.\d{2})?|dollars?/gi,
              "",
            )
            .trim() || `${category} purchase`;

        actions.push({
          type: "add_expense",
          data: { amount, category, description },
        });
        message = `💸 **Expense Logged**\n\n💰 **$${amount.toFixed(2)}**\n• Category: ${category}\n• Description: ${description}\n\nYour expenses have been updated!`;
      }
    }

    // === INCOME LOGGING ===
    else if (lowerInput.match(/earned|received|income|salary|paid me/)) {
      const amountMatch = input.match(/\$?(\d+(?:\.\d{2})?)/);
      const amount = amountMatch ? parseFloat(amountMatch[1]) : 0;

      if (amount > 0) {
        const description =
          input
            .replace(
              /earned|received|income|salary|paid|me|for|on|\$\d+(\.\d{2})?|dollars?/gi,
              "",
            )
            .trim() || "Income";

        actions.push({
          type: "add_income",
          data: { amount, description },
        });
        message = `💰 **Income Recorded**\n\n✨ **$${amount.toFixed(2)}**\n• Source: ${description}\n\nNice! Your balance has been updated.`;
      }
    }

    // === GOAL CREATION ===
    else if (
      lowerInput.match(/create|add|new|set/i) &&
      lowerInput.match(/goal|target|objective/i)
    ) {
      const titleMatch =
        input.match(/goal[:\s]+["']?([^"'\n]+)["']?/i) ||
        input.match(/["']([^"']+)["']/);
      const title = titleMatch
        ? titleMatch[1].trim()
        : input
            .replace(/create|add|new|set|goal|target|objective|a|an/gi, "")
            .trim();

      if (title) {
        const category = this.inferGoalCategory(lowerInput);
        actions.push({
          type: "create_goal",
          data: {
            title,
            category,
            priority: "medium",
          },
        });
        message = `🎯 **Goal Created**\n\n✨ **"${title}"**\n• Category: ${category}\n\nGreat! Your goal has been set. Would you like to add some tasks or milestones to help achieve it?`;
      }
    }

    // === HABIT CREATION ===
    else if (
      lowerInput.match(/create|add|new|start|track/i) &&
      lowerInput.match(/habit|routine/i)
    ) {
      const nameMatch =
        input.match(/habit[:\s]+["']?([^"'\n]+)["']?/i) ||
        input.match(/["']([^"']+)["']/);
      const name = nameMatch
        ? nameMatch[1].trim()
        : input
            .replace(/create|add|new|start|track|habit|routine|a|an/gi, "")
            .trim();

      if (name) {
        const frequency = lowerInput.includes("weekly")
          ? "weekly"
          : lowerInput.includes("monthly")
            ? "monthly"
            : "daily";

        actions.push({
          type: "create_habit",
          data: {
            name,
            frequency,
            category: "productivity",
          },
        });
        message = `🎯 **Habit Created**\n\n✨ **"${name}"**\n• Frequency: ${frequency}\n\nI've added this to your habits! Start building your streak today. 🔥`;
      }
    }

    // === STUDY SESSION ===
    else if (
      lowerInput.match(
        /studied|study|studying|learned|learning|practiced|practice/i,
      )
    ) {
      const durationMatch = input.match(/(\d+)\s*(?:minutes?|min|m|hours?|h)/i);
      let duration = durationMatch ? parseInt(durationMatch[1]) : 30;
      if (durationMatch?.[0]?.match(/hours?|h/i)) duration *= 60;

      const subjectMatch = input.match(
        /(?:studied?|studying|learned?|learning|practiced?|practicing)\s+([a-z0-9]+)/i,
      );
      const subject = subjectMatch ? subjectMatch[1] : "General";
      const topicMatch = input.match(/(?:about|on|regarding)\s+([^.!?\n]+)/i);
      const topic = topicMatch ? topicMatch[1].trim() : undefined;

      actions.push({
        type: "log_study",
        data: {
          subject,
          duration,
          topic,
          difficulty: "medium",
        },
      });
      message = `📚 **Study Session Logged**\n\n⏱️ **${duration} minutes** studying ${subject}\n${topic ? `• Topic: ${topic}\n` : ""}• Pomodoros: ${Math.ceil(duration / 25)}\n\nKeep up the great work! 💪`;
    }

    // === TIME LOGGING ===
    else if (
      (lowerInput.match(/worked|work|spent time|logged|tracked|working/i) &&
        lowerInput.match(/\d+/)) ||
      lowerInput.match(/log\s+(time|work|hours|minutes)/i)
    ) {
      const durationMatch = input.match(/(\d+)\s*(?:minutes?|min|m|hours?|h)/i);
      let duration = durationMatch ? parseInt(durationMatch[1]) : 30;
      if (durationMatch?.[0]?.match(/hours?|h/i)) duration *= 60;

      const task = input
        .replace(
          /worked|work|working|spent|time|logged|tracked|on|\d+\s*(?:minutes?|min|m|hours?|h)|for|a|an/gi,
          "",
        )
        .trim();

      const category = this.inferDomain(lowerInput);
      const focusMatch = lowerInput.match(
        /deep|focus|concentrated|uninterrupted/,
      );
      const focusQuality = focusMatch ? "deep" : "moderate";

      actions.push({
        type: "log_time",
        data: {
          task: task || "Work",
          duration,
          category,
          focusQuality,
        },
      });
      message = `⏱️ **Time Logged**\n\n⏰ **${duration} minutes**\n• Task: "${task || "Work"}"\n• Category: ${category}\n• Focus: ${focusQuality}\n\nGreat progress tracking your time!`;
    }

    // === COMPLETE TASK ===
    else if (
      lowerInput.match(/complete|done|finish|mark as done/i) &&
      lowerInput.match(/task/i)
    ) {
      const taskMatch = input.match(/(?:task|todo)\s+["']?([^"'\n]+)["']?/i);
      const taskTitle = taskMatch ? taskMatch[1].trim() : null;

      if (taskTitle) {
        const task = context.fullData.tasks.find((t) =>
          t.title.toLowerCase().includes(taskTitle.toLowerCase()),
        );

        if (task) {
          actions.push({
            type: "complete_task",
            data: { taskId: task.id },
          });
          message = `✅ **Task Completed**\n\n🎉 "${task.title}" is done!\n\nKeep crushing it!`;
        } else {
          message = `I couldn't find a task matching "${taskTitle}". Try showing your tasks first?`;
        }
      }
    }

    // === COMPLETE HABIT ===
    else if (
      lowerInput.match(/complete|done|did|mark/i) &&
      lowerInput.match(/habit/i)
    ) {
      const habitMatch = input.match(/habit\s+["']?([^"'\n]+)["']?/i);
      const habitName = habitMatch ? habitMatch[1].trim() : null;

      if (habitName) {
        const habit = context.fullData.habits.find((h) =>
          h.name.toLowerCase().includes(habitName.toLowerCase()),
        );

        if (habit) {
          actions.push({
            type: "complete_habit",
            data: { habitId: habit.id },
          });
          message = `✅ **Habit Completed**\n\n🔥 "${habit.name}" done for today!\n• Streak: ${habit.streak + 1} days\n\nKeep building that momentum!`;
        } else {
          message = `I couldn't find a habit matching "${habitName}". Try showing your habits first?`;
        }
      }
    }

    // === SHOW TODAY ===
    else if (
      lowerInput.match(
        /^(show|what('s| is)|my|today|schedule|priorities|overview)/i,
      ) &&
      lowerInput.match(
        /today|schedule|task|habit|overview|priorities|pending|summary/i,
      )
    ) {
      const { stats } = context;
      const pendingTasksList = context.fullData.tasks
        .filter((t) => t.status !== "completed")
        .slice(0, 5);

      message = `📋 **Today's Overview**\n\n`;
      message += `**Tasks**\n`;
      message += `• ${stats.tasks.pending} pending${stats.tasks.highPriority > 0 ? ` (${stats.tasks.highPriority} high priority)` : ""}\n`;
      if (stats.tasks.overdue > 0)
        message += `• ⚠️ ${stats.tasks.overdue} overdue\n`;

      if (pendingTasksList.length > 0) {
        message += `\nTop tasks:\n`;
        pendingTasksList.forEach((t, i) => {
          message += `${i + 1}. ${t.title} ${t.priority === "high" ? "🔴" : ""}\n`;
        });
      }

      message += `\n**Habits**\n`;
      message += `• ${stats.habits.completedToday}/${stats.habits.total} completed today\n`;

      if (stats.habits.streaksAtRisk.length > 0) {
        message += `• 🔥 At risk: ${stats.habits.streaksAtRisk.map((h: any) => h.name).join(", ")}\n`;
      }

      message += `\n**Time Tracked**\n`;
      message += `• ${stats.time.todayMinutes} minutes logged today\n`;

      message += `\n**Finance**\n`;
      message += `• Balance: $${stats.finance.balance.toFixed(2)}\n`;
      message += `• Today's expenses: $${stats.finance.expenses.toFixed(2)}`;
    }

    // === SHOW TASKS ===
    else if (
      lowerInput.match(/show|list|what|display/i) &&
      lowerInput.match(/task|todo/i)
    ) {
      const tasks = context.fullData.tasks.filter(
        (t) => t.status !== "completed",
      );

      if (tasks.length === 0) {
        message = `📋 **No Pending Tasks**\n\nYou're all caught up! 🎉 Want to add a new task?`;
      } else {
        message = `📋 **Your Tasks** (${tasks.length} pending)\n\n`;
        tasks.slice(0, 10).forEach((t, i) => {
          const priorityEmoji =
            t.priority === "high" ? "🔴" : t.priority === "low" ? "🟢" : "🟡";
          message += `${i + 1}. ${priorityEmoji} ${t.title}\n`;
          if (t.dueDate) message += `   Due: ${t.dueDate}\n`;
        });
        if (tasks.length > 10) {
          message += `\n...and ${tasks.length - 10} more`;
        }
      }
    }

    // === SHOW HABITS ===
    else if (
      lowerInput.match(/show|list|what|display/i) &&
      lowerInput.match(/habit/i)
    ) {
      const habits = context.fullData.habits;

      if (habits.length === 0) {
        message = `🎯 **No Habits Yet**\n\nWant to start building some positive habits?`;
      } else {
        message = `🎯 **Your Habits** (${habits.length} total)\n\n`;
        habits.slice(0, 10).forEach((h, i) => {
          const statusEmoji = h.completedToday ? "✅" : "⏸️";
          const streakEmoji = h.streak >= 7 ? "🔥" : "";
          message += `${i + 1}. ${statusEmoji} ${h.name} ${streakEmoji}\n`;
          message += `   Streak: ${h.streak} days\n`;
        });
      }
    }

    // === SHOW GOALS ===
    else if (
      lowerInput.match(/show|list|what|display/i) &&
      lowerInput.match(/goal/i)
    ) {
      const goals = context.fullData.goals.filter((g) => g.status === "active");

      if (goals.length === 0) {
        message = `🎯 **No Active Goals**\n\nReady to set some meaningful goals?`;
      } else {
        message = `🎯 **Your Goals** (${goals.length} active)\n\n`;
        goals.slice(0, 8).forEach((g, i) => {
          const progressBar =
            "█".repeat(Math.floor(g.progress / 10)) +
            "░".repeat(10 - Math.floor(g.progress / 10));
          message += `${i + 1}. ${g.title}\n`;
          message += `   ${progressBar} ${g.progress}%\n`;
          if (g.targetDate) message += `   Target: ${g.targetDate}\n`;
        });
      }
    }

    // === GENERAL QUESTION - Fallback ===
    else {
      message = `I can help you with that! Unfortunately, my full knowledge base is offline right now.\n\n**But I can still help you:**\n\n📋 "Create task: Buy groceries"\n📝 "Note: Had a great meeting today"\n💰 "Spent $45 on lunch"\n🎯 "Create goal: Learn Spanish"\n⏱️ "Worked 2 hours on the project"\n📚 "Studied math for 30 minutes"\n\n**Or ask me to:**\n• "Show today's tasks"\n• "What habits should I do?"\n• "Show my goals"\n\nWhat would you like to do?`;
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
