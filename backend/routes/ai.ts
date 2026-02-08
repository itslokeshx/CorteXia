import { Hono } from "hono";
import { parseQuickAddInput, askAI } from "../services/ai-service";
import { groqClient } from "../services/groq-client";
import {
  buildUserContext,
  buildCompactSystemPrompt,
} from "../services/deep-context";

const aiRouter = new Hono();

// ═══════════════════════════════════════════════════════════════
// TOKEN BUDGET TRACKER — keeps daily totals per key
// ═══════════════════════════════════════════════════════════════
interface DailyUsage {
  date: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  requestCount: number;
}

const dailyUsage: DailyUsage = {
  date: new Date().toISOString().split("T")[0],
  promptTokens: 0,
  completionTokens: 0,
  totalTokens: 0,
  requestCount: 0,
};

// Free-tier daily budget (~14,400 tokens/day with 5 keys ≈ 72k tokens)
// Be conservative: aim for 50k/day to avoid hitting walls
const DAILY_TOKEN_BUDGET = 50_000;

function trackUsage(usage: {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}) {
  const today = new Date().toISOString().split("T")[0];
  if (dailyUsage.date !== today) {
    // Reset for new day
    dailyUsage.date = today;
    dailyUsage.promptTokens = 0;
    dailyUsage.completionTokens = 0;
    dailyUsage.totalTokens = 0;
    dailyUsage.requestCount = 0;
  }
  dailyUsage.promptTokens += usage.promptTokens;
  dailyUsage.completionTokens += usage.completionTokens;
  dailyUsage.totalTokens += usage.totalTokens;
  dailyUsage.requestCount += 1;
}

function isOverBudget(): boolean {
  const today = new Date().toISOString().split("T")[0];
  if (dailyUsage.date !== today) return false;
  return dailyUsage.totalTokens >= DAILY_TOKEN_BUDGET;
}

// ═══════════════════════════════════════════════════════════════
// INTENT DETECTION — decides how many tokens to spend
// ═══════════════════════════════════════════════════════════════
type MessageIntent =
  | "greeting"
  | "simple_question"
  | "action_request"
  | "deep_conversation";

const ACTION_KEYWORDS =
  /\b(add|create|new|make|log|record|delete|remove|complete|finish|mark done|track|set|start|spent|paid|bought|earned)\b/i;
const GREETING_KEYWORDS =
  /^(hi|hello|hey|good morning|good afternoon|good evening|yo|sup|what'?s up)\b/i;

function detectIntent(message: string): MessageIntent {
  const m = message.trim();
  if (GREETING_KEYWORDS.test(m) && m.split(/\s+/).length <= 6)
    return "greeting";
  if (ACTION_KEYWORDS.test(m)) return "action_request";
  if (m.split(/\s+/).length <= 12) return "simple_question";
  return "deep_conversation";
}

// ═══════════════════════════════════════════════════════════════
// POST /api/ai/chat — Token-efficient deep context AI chat
// ═══════════════════════════════════════════════════════════════
aiRouter.post("/chat", async (c) => {
  try {
    const body = await c.req.json();
    const { message, conversationHistory = [], userData } = body;

    if (!message) {
      return c.json({ error: "Message is required" }, 400);
    }

    // Budget gate — if over daily budget, use local fallback
    if (isOverBudget()) {
      return c.json({
        message: generateLocalResponse(message),
        actions: [],
        suggestions: [],
        source: "budget-fallback",
        tokenBudget: {
          used: dailyUsage.totalTokens,
          limit: DAILY_TOKEN_BUDGET,
        },
      });
    }

    // Check if Groq is configured
    if (!groqClient.isConfigured()) {
      return c.json({
        message: generateLocalResponse(message),
        actions: [],
        suggestions: [],
        source: "local-fallback",
      });
    }

    // Detect intent to calibrate token spend
    const intent = detectIntent(message);

    // Build compact system prompt (only includes action schema when needed)
    let systemPrompt: string;
    if (userData) {
      const userContext = buildUserContext(userData);
      systemPrompt = buildCompactSystemPrompt(userContext, {
        includeActions: intent === "action_request",
      });
    } else {
      systemPrompt = getMinimalSystemPrompt(intent === "action_request");
    }

    // Trim conversation history based on intent
    const historyLimit =
      intent === "greeting" ? 1 : intent === "simple_question" ? 3 : 5;
    const trimmedHistory = conversationHistory
      .slice(-historyLimit)
      .map((msg: any) => ({
        role: msg.role as "user" | "assistant",
        // Truncate old assistant messages to save tokens
        content:
          msg.role === "assistant" && msg.content.length > 200
            ? msg.content.substring(0, 200) + "…"
            : msg.content,
      }));

    // Build message array for Groq
    const messages = [
      { role: "system" as const, content: systemPrompt },
      ...trimmedHistory,
      { role: "user" as const, content: message },
    ];

    // Calibrate maxTokens based on intent
    const maxTokens =
      intent === "greeting"
        ? 150
        : intent === "simple_question"
          ? 400
          : intent === "action_request"
            ? 600
            : 800;

    // Call Groq with automatic key rotation
    const result = await groqClient.chat(messages, {
      temperature: 0.7,
      maxTokens,
    });

    // Track usage
    trackUsage(result.usage);

    // Parse the AI response
    const parsed = parseAIResponse(result.content);

    return c.json({
      ...parsed,
      usage: result.usage,
      keyUsed: result.keyUsed,
      tokenBudget: {
        used: dailyUsage.totalTokens,
        limit: DAILY_TOKEN_BUDGET,
        remaining: DAILY_TOKEN_BUDGET - dailyUsage.totalTokens,
        requests: dailyUsage.requestCount,
      },
    });
  } catch (error: any) {
    console.error("AI Chat API Error:", error);

    if (error.message?.includes("rate-limited")) {
      return c.json({
        message:
          "I'm experiencing high demand right now. Let me give you a quick response while my full capabilities recover.",
        actions: [],
        suggestions: [],
        source: "rate-limited-fallback",
        error: "rate_limited",
      });
    }

    return c.json(
      {
        message:
          "I had trouble processing that. Could you try again in a moment?",
        actions: [],
        suggestions: [],
        source: "error-fallback",
        error: error.message,
      },
      500,
    );
  }
});

// GET /api/ai/chat/status — Key status + token budget (debug/admin)
aiRouter.get("/chat/status", async (c) => {
  return c.json({
    status: groqClient.getStatus(),
    model: "llama-3.3-70b-versatile",
    tokenBudget: {
      ...dailyUsage,
      limit: DAILY_TOKEN_BUDGET,
      remaining: Math.max(0, DAILY_TOKEN_BUDGET - dailyUsage.totalTokens),
    },
  });
});

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function parseAIResponse(content: string): {
  message: string;
  actions: any[];
  suggestions: any[];
} {
  try {
    let cleaned = content.trim();

    // Strip markdown code fences
    if (cleaned.startsWith("```json")) {
      cleaned = cleaned.slice(7);
    }
    if (cleaned.startsWith("```")) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith("```")) {
      cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    // 1) Try parsing the entire response as JSON
    try {
      const parsed = JSON.parse(cleaned);
      return {
        message: parsed.message || content,
        actions: Array.isArray(parsed.actions) ? parsed.actions : [],
        suggestions: Array.isArray(parsed.suggestions)
          ? parsed.suggestions
          : [],
      };
    } catch {
      // not pure JSON — fall through
    }

    // 2) The model sometimes returns plain text followed by a JSON block.
    //    Find the first top-level '{' and try to extract a JSON object from it.
    const jsonStart = cleaned.indexOf("{");
    if (jsonStart !== -1) {
      // Walk forward to find the matching closing '}'
      let depth = 0;
      let jsonEnd = -1;
      for (let i = jsonStart; i < cleaned.length; i++) {
        if (cleaned[i] === "{") depth++;
        else if (cleaned[i] === "}") {
          depth--;
          if (depth === 0) {
            jsonEnd = i;
            break;
          }
        }
      }

      if (jsonEnd !== -1) {
        const jsonStr = cleaned.substring(jsonStart, jsonEnd + 1);
        try {
          const parsed = JSON.parse(jsonStr);
          // Use the message field from JSON; it's the canonical response
          return {
            message:
              parsed.message ||
              cleaned.substring(0, jsonStart).trim() ||
              content,
            actions: Array.isArray(parsed.actions) ? parsed.actions : [],
            suggestions: Array.isArray(parsed.suggestions)
              ? parsed.suggestions
              : [],
          };
        } catch {
          // JSON block wasn't valid, use the text before it
        }
      }

      // There's a '{' but we couldn't parse valid JSON from it —
      // strip everything from the first '{' onward so raw JSON
      // fragments don't leak into the chat message.
      const textBeforeJson = cleaned.substring(0, jsonStart).trim();
      if (textBeforeJson.length > 0) {
        return {
          message: textBeforeJson,
          actions: [],
          suggestions: [],
        };
      }
    }

    // 3) No JSON at all — return the raw text
    return {
      message: cleaned,
      actions: [],
      suggestions: [],
    };
  } catch {
    return {
      message: content,
      actions: [],
      suggestions: [],
    };
  }
}

function getMinimalSystemPrompt(includeActions = false): string {
  let prompt = `You are Cortexia, a concise AI life assistant. Answer any question directly. Be warm and brief (2-4 sentences).`;
  if (includeActions) {
    prompt += `\nWhen user asks to create/modify items, append JSON: {"actions":[{"type":"<action>","data":{...}}]}
Actions: create_task(title), create_habit(name), create_goal(title), add_expense(amount,category?), add_income(amount), log_time(task,duration), create_journal(content), complete_task(taskId), complete_habit(habitId)`;
  }
  return prompt;
}

function generateLocalResponse(message: string): string {
  const lower = message.toLowerCase();

  if (
    lower.includes("hello") ||
    lower.includes("hi") ||
    lower.includes("hey")
  ) {
    return "Hey! 👋 I'm Cortexia, your AI life assistant. I can help you manage tasks, habits, goals, and more — or just chat about anything. What's on your mind?";
  }

  if (lower.includes("how are you")) {
    return "I'm running great! Ready to help you with whatever you need — whether it's organizing your day, tracking a habit, or just having a conversation. What would you like to do?";
  }

  if (lower.includes("task") || lower.includes("todo")) {
    return "I can help with tasks! Try saying something like 'Add a task to review the project by Friday' and I'll create it for you.";
  }

  if (lower.includes("habit")) {
    return "I can help track habits! Try 'Create a habit for daily meditation' or ask me about your current streaks.";
  }

  return "I'd love to help with that! However, my AI capabilities need API keys to be configured. Once set up, I can answer any question and help manage your entire life through CorteXia. For now, you can still use all the app features manually!";
}

// ═══════════════════════════════════════════════════════════════
// EXISTING ROUTES
// ═══════════════════════════════════════════════════════════════

// POST /api/ai/parse - Parse natural language input
aiRouter.post("/parse", async (c) => {
  try {
    const { input } = await c.req.json();

    if (!input || typeof input !== "string") {
      return c.json({ error: "Input is required" }, 400);
    }

    const result = await parseQuickAddInput(input);
    return c.json(result);
  } catch (error) {
    console.error("Error parsing input:", error);
    return c.json({ error: "Failed to parse input" }, 500);
  }
});

// POST /api/ai/ask - Ask AI a question
aiRouter.post("/ask", async (c) => {
  try {
    const { question, context } = await c.req.json();

    if (!question || typeof question !== "string") {
      return c.json({ error: "Question is required" }, 400);
    }

    const response = await askAI(question, context || {});
    return c.json({ response });
  } catch (error) {
    console.error("Error asking AI:", error);
    return c.json({ error: "Failed to get AI response" }, 500);
  }
});

// POST /api/ai/prioritize - Get AI task prioritization
aiRouter.post("/prioritize", async (c) => {
  try {
    const { tasks } = await c.req.json();

    if (!tasks || !Array.isArray(tasks)) {
      return c.json({ error: "Tasks array is required" }, 400);
    }

    // Simple prioritization logic (can be enhanced with actual AI)
    const prioritized = tasks.map((task: any) => {
      let score = 50;

      // Due date urgency
      if (task.dueDate) {
        const daysUntilDue = Math.ceil(
          (new Date(task.dueDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        );
        if (daysUntilDue < 0)
          score += 30; // Overdue
        else if (daysUntilDue === 0)
          score += 25; // Due today
        else if (daysUntilDue <= 2)
          score += 20; // Due soon
        else if (daysUntilDue <= 7) score += 10; // This week
      }

      // Priority level
      if (task.priority === "urgent") score += 25;
      else if (task.priority === "high") score += 15;
      else if (task.priority === "low") score -= 10;

      // Category importance (work typically higher)
      if (task.domain === "work") score += 5;
      if (task.domain === "health") score += 3;

      return {
        ...task,
        aiScore: Math.min(100, Math.max(0, score)),
      };
    });

    // Sort by AI score
    prioritized.sort((a: any, b: any) => b.aiScore - a.aiScore);

    return c.json({ tasks: prioritized });
  } catch (error) {
    console.error("Error prioritizing tasks:", error);
    return c.json({ error: "Failed to prioritize tasks" }, 500);
  }
});

// GET /api/ai/suggestions - Get AI suggestions based on context
aiRouter.get("/suggestions", async (c) => {
  try {
    const context = c.req.query("context") || "general";
    const time = new Date().getHours();

    let suggestions: string[] = [];

    // Time-based suggestions
    if (time >= 5 && time < 9) {
      suggestions.push("Start with your most important task");
      suggestions.push("Complete morning habits");
      suggestions.push("Review today's schedule");
    } else if (time >= 9 && time < 12) {
      suggestions.push("Focus on deep work - it's your peak productivity time");
      suggestions.push("Avoid checking email for the next hour");
    } else if (time >= 12 && time < 14) {
      suggestions.push("Take a proper lunch break");
      suggestions.push("Log your morning accomplishments");
    } else if (time >= 14 && time < 17) {
      suggestions.push("Schedule meetings and collaborative work");
      suggestions.push("Review progress on urgent tasks");
    } else if (time >= 17 && time < 20) {
      suggestions.push("Wind down work tasks");
      suggestions.push("Complete evening habits");
      suggestions.push("Plan tomorrow's priorities");
    } else {
      suggestions.push("Reflect on today's wins");
      suggestions.push("Write a journal entry");
      suggestions.push("Prepare for restful sleep");
    }

    return c.json({ suggestions, context, time });
  } catch (error) {
    console.error("Error getting suggestions:", error);
    return c.json({ error: "Failed to get suggestions" }, 500);
  }
});

export default aiRouter;
