import { Router, Response } from "express";
import { AuthRequest, authMiddleware } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

const GROQ_API_KEYS = [
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
  process.env.GROQ_API_KEY_4,
  process.env.GROQ_API_KEY_5,
].filter(Boolean) as string[];

let currentKeyIndex = 0;

function getNextKey(): string {
  if (GROQ_API_KEYS.length === 0) {
    throw new Error("No GROQ API keys configured");
  }
  const key = GROQ_API_KEYS[currentKeyIndex % GROQ_API_KEYS.length];
  currentKeyIndex++;
  return key;
}

// ─── Build a rich system prompt from user data & memory ───
function buildSystemPrompt(userData: any, memory: any): string {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  let contextBlock = "";

  // Tasks summary
  if (userData?.tasks?.length) {
    const pending = userData.tasks.filter(
      (t: any) => t.status !== "completed" && t.status !== "done",
    );
    const completed = userData.tasks.filter(
      (t: any) => t.status === "completed" || t.status === "done",
    );
    contextBlock += `\n📋 TASKS: ${pending.length} pending, ${completed.length} completed.`;
    if (pending.length > 0) {
      contextBlock += `\n  Pending: ${pending
        .slice(0, 8)
        .map((t: any) => `"${t.title}" (${t.priority || "normal"})`)
        .join(", ")}`;
    }
  }

  // Habits summary
  if (userData?.habits?.length) {
    const doneToday = userData.habits.filter((h: any) => h.completedToday);
    contextBlock += `\n🔄 HABITS: ${doneToday.length}/${userData.habits.length} completed today.`;
    const topStreaks = userData.habits
      .filter((h: any) => h.streak > 0)
      .sort((a: any, b: any) => b.streak - a.streak)
      .slice(0, 5);
    if (topStreaks.length) {
      contextBlock += `\n  Streaks: ${topStreaks.map((h: any) => `${h.name} (${h.streak}d)`).join(", ")}`;
    }
  }

  // Goals summary
  if (userData?.goals?.length) {
    contextBlock += `\n🎯 GOALS: ${userData.goals.length} active.`;
    contextBlock += `\n  ${userData.goals
      .slice(0, 5)
      .map((g: any) => `"${g.title}" ${g.progress || 0}%`)
      .join(", ")}`;
  }

  // Finance summary
  if (userData?.transactions?.length) {
    const totalSpent = userData.transactions
      .filter((t: any) => t.type === "expense")
      .reduce((s: number, t: any) => s + (t.amount || 0), 0);
    contextBlock += `\n💰 RECENT SPENDING: $${totalSpent.toFixed(0)} across ${userData.transactions.length} transactions.`;
  }

  // Journal/mood summary
  if (userData?.journalEntries?.length) {
    const latest = userData.journalEntries[0];
    contextBlock += `\n📓 LATEST JOURNAL: mood=${latest.mood || "?"}, energy=${latest.energy || "?"} (${latest.date})`;
  }

  // Memory context
  let memoryBlock = "";
  if (memory) {
    if (memory.userName) memoryBlock += `\nUser's name: ${memory.userName}`;
    if (memory.lastTopic)
      memoryBlock += `\nLast topic discussed: ${memory.lastTopic}`;
    if (memory.conversationCount)
      memoryBlock += `\nConversation count: ${memory.conversationCount}`;
    if (memory.facts?.length) {
      memoryBlock += `\nKnown facts about user: ${memory.facts.join("; ")}`;
    }
    if (memory.preferredTheme)
      memoryBlock += `\nPreferred theme: ${memory.preferredTheme}`;
  }

  return `You are CorteXia — an intelligent, warm AI life coach and personal assistant.
You live inside the CorteXia app which helps users manage tasks, habits, goals, finances, time tracking, journaling, and study sessions.

Current time: ${timeStr}, ${dateStr}
${memoryBlock ? `\n── USER MEMORY ──${memoryBlock}` : ""}
${contextBlock ? `\n── USER DATA SNAPSHOT ──${contextBlock}` : ""}

RESPONSE FORMAT:
You MUST respond with valid JSON (no markdown, no code fences). Use this exact schema:
{
  "message": "Your conversational response text here",
  "actions": [],
  "suggestions": [
    { "text": "Suggestion label", "action": "action_type", "reason": "Why this helps" }
  ]
}

RULES:
- "message" is your main reply. Be conversational, helpful, empathetic, and concise. Use emoji sparingly.
- "actions" is an array of things to execute (create_task, complete_task, create_habit, etc). Leave empty [] if no action needed.
- "suggestions" is an array of 1-3 follow-up suggestions the user might want. Each has "text", "action", and "reason".
- If the user says their name, REMEMBER it and greet them by name.
- Reference their actual data when relevant (tasks, habits, streaks, goals).
- If asked about something outside the app scope, still answer naturally as a knowledgeable assistant.
- Keep responses under 200 words unless the user asks for detail.
- NEVER say you can't access their data — you CAN see it in the snapshot above.`;
}

// ─── Parse the LLM response into structured JSON ───
function parseAIResponse(raw: string): {
  message: string;
  actions: any[];
  suggestions: any[];
} {
  // Try to extract JSON from the response
  try {
    // Direct JSON parse
    const parsed = JSON.parse(raw);
    return {
      message: parsed.message || raw,
      actions: parsed.actions || [],
      suggestions: parsed.suggestions || [],
    };
  } catch {
    // Try to find JSON block in the response
    const jsonMatch = raw.match(/\{[\s\S]*"message"[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          message: parsed.message || raw,
          actions: parsed.actions || [],
          suggestions: parsed.suggestions || [],
        };
      } catch {
        // Fall through
      }
    }
    // Return as plain message
    return { message: raw, actions: [], suggestions: [] };
  }
}

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { message, conversationHistory, userData, memory } = req.body;

    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    // Build the messages array for Groq
    const systemPrompt = buildSystemPrompt(userData, memory);
    const groqMessages: { role: string; content: string }[] = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history
    if (conversationHistory?.length) {
      for (const msg of conversationHistory) {
        groqMessages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        });
      }
    }

    // Add current user message
    groqMessages.push({ role: "user", content: message });

    let lastError: Error | null = null;
    for (let attempt = 0; attempt < GROQ_API_KEYS.length; attempt++) {
      const apiKey = getNextKey();
      try {
        const response = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: groqMessages,
              temperature: 0.7,
              max_tokens: 2048,
            }),
          },
        );

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          if (response.status === 429) {
            // Rate limited, try next key
            continue;
          }
          throw new Error(
            (error as any).error?.message ||
              `Groq API error: ${response.status}`,
          );
        }

        const data = (await response.json()) as any;
        const rawReply =
          data.choices?.[0]?.message?.content ||
          "I apologize, I could not generate a response.";

        // Parse the structured response
        const parsed = parseAIResponse(rawReply);
        res.json(parsed);
        return;
      } catch (err: any) {
        lastError = err;
        continue;
      }
    }

    throw lastError || new Error("All API keys exhausted");
  } catch (error: any) {
    console.error("AI chat error:", error);
    res.status(500).json({ error: error.message || "AI service unavailable" });
  }
});

export default router;
