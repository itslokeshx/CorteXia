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

// ═══════════════════════════════════════════════════════════════
// SERVER-SIDE MEMORY EXTRACTION
// Extract name/facts from user message so memory works even
// if frontend state hasn't hydrated yet
// ═══════════════════════════════════════════════════════════════

function extractMemoryFromMessage(
  userMessage: string,
  existingMemory: any,
): { userName?: string; facts?: string[] } {
  const result: { userName?: string; facts?: string[] } = {};

  // Name detection — multiple patterns
  const namePatterns = [
    /(?:my name is|i'?m|call me|i am|this is)\s+([A-Z][a-z]{1,20})/i,
    /(?:hey,?\s+)?(?:i'?m|it'?s)\s+([A-Z][a-z]{1,20})(?:\s+here)?/i,
    /(?:name'?s)\s+([A-Z][a-z]{1,20})/i,
  ];
  for (const pat of namePatterns) {
    const m = userMessage.match(pat);
    if (m) {
      result.userName =
        m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
      break;
    }
  }

  // Fact extraction
  const facts: string[] = [];
  const factPatterns = [
    /i (?:work|am working) (?:at|for|in)\s+(.+?)(?:\.|,|!|$)/i,
    /i(?:'m| am) a\s+(.+?)(?:\.|,|!|$)/i,
    /i (?:study|am studying)\s+(.+?)(?:\.|,|!|$)/i,
    /i (?:live|am living) (?:in|at)\s+(.+?)(?:\.|,|!|$)/i,
    /i (?:like|love|enjoy)\s+(.+?)(?:\.|,|!|$)/i,
    /my (?:goal|aim|target) is\s+(.+?)(?:\.|,|!|$)/i,
  ];
  for (const pat of factPatterns) {
    const m = userMessage.match(pat);
    if (m && m[1].length < 80) facts.push(m[1].trim());
  }
  if (facts.length) result.facts = facts;

  return result;
}

// ═══════════════════════════════════════════════════════════════
// TOKEN-EFFICIENT CONTEXT BUILDER
// ═══════════════════════════════════════════════════════════════

function buildSystemPrompt(userData: any, memory: any): string {
  const now = new Date();
  const day = now.toLocaleDateString("en-US", { weekday: "short" });
  const date = now.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const time = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const today = now.toISOString().split("T")[0];

  // Memory block — PROMINENT so LLM sees it clearly
  let mem = "";
  if (memory) {
    const parts: string[] = [];
    if (memory.userName) parts.push("User's name is: " + memory.userName);
    if (memory.facts?.length)
      parts.push("Known facts: " + memory.facts.join("; "));
    if (memory.lastTopic) parts.push("Last topic: " + memory.lastTopic);
    if (memory.conversationCount)
      parts.push("Previous conversations: " + memory.conversationCount);
    if (memory.preferredTheme)
      parts.push("Preferred theme: " + memory.preferredTheme);
    if (parts.length)
      mem =
        "\n\n*** USER MEMORY (use this!) ***\n" + parts.join("\n") + "\n***";
  }

  // Compressed data blocks
  let data = "";

  if (userData?.tasks?.length) {
    const t = userData.tasks;
    const pending = t.filter(
      (x: any) => x.status !== "completed" && x.status !== "done",
    );
    const done = t.length - pending.length;
    const overdue = pending.filter(
      (x: any) => x.dueDate && new Date(x.dueDate) < now,
    );
    const todayDue = pending.filter((x: any) => x.dueDate?.startsWith(today));
    const high = pending.filter((x: any) => x.priority === "high");
    data += "\n[TASKS] " + pending.length + " pending, " + done + " done";
    if (overdue.length) data += ", " + overdue.length + " overdue";
    if (todayDue.length) data += ", " + todayDue.length + " due today";
    if (high.length) data += ", " + high.length + " high-pri";
    if (pending.length > 0) {
      data +=
        "\n  " +
        pending
          .slice(0, 12)
          .map(
            (x: any) =>
              "\u2022 " +
              x.title +
              (x.priority === "high" ? " \u26A1" : "") +
              (x.dueDate ? " (" + x.dueDate.slice(5) + ")" : ""),
          )
          .join("\n  ");
    }
  }

  if (userData?.habits?.length) {
    const h = userData.habits;
    const doneToday = h.filter((x: any) => x.completedToday).length;
    data += "\n[HABITS] " + doneToday + "/" + h.length + " done today";
    const streaks = h
      .filter((x: any) => x.streak > 0)
      .sort((a: any, b: any) => b.streak - a.streak);
    if (streaks.length) {
      data +=
        " | Streaks: " +
        streaks
          .slice(0, 6)
          .map(
            (x: any) =>
              x.name +
              "(" +
              x.streak +
              "d" +
              (x.completedToday ? "\u2713" : "") +
              ")",
          )
          .join(", ");
    }
    const notDone = h.filter((x: any) => !x.completedToday);
    if (notDone.length) {
      data +=
        "\n  Remaining: " +
        notDone
          .slice(0, 8)
          .map((x: any) => x.name)
          .join(", ");
    }
  }

  if (userData?.goals?.length) {
    const g = userData.goals;
    data += "\n[GOALS] " + g.length + " active";
    data +=
      "\n  " +
      g
        .slice(0, 6)
        .map((x: any) => "\u2022 " + x.title + " (" + (x.progress || 0) + "%)")
        .join("\n  ");
  }

  if (userData?.transactions?.length) {
    const tx = userData.transactions;
    const spent = tx
      .filter((x: any) => x.type === "expense")
      .reduce((s: number, x: any) => s + (x.amount || 0), 0);
    const earned = tx
      .filter((x: any) => x.type === "income")
      .reduce((s: number, x: any) => s + (x.amount || 0), 0);
    data += "\n[FINANCE] Recent: $" + spent.toFixed(0) + " spent";
    if (earned) data += ", $" + earned.toFixed(0) + " earned";
    const cats: Record<string, number> = {};
    tx.filter((x: any) => x.type === "expense").forEach((x: any) => {
      cats[x.category] = (cats[x.category] || 0) + x.amount;
    });
    const topCats = Object.entries(cats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
    if (topCats.length) {
      data +=
        " | Top: " +
        topCats
          .map(([c, a]) => c + "($" + (a as number).toFixed(0) + ")")
          .join(", ");
    }
  }

  if (userData?.journalEntries?.length) {
    const j = userData.journalEntries;
    const latest = j[0];
    data += "\n[JOURNAL] " + j.length + " entries";
    if (latest) {
      data +=
        " | Latest(" +
        (latest.date?.slice(5) || "?") +
        "): mood=" +
        (latest.mood || "?") +
        "/10, energy=" +
        (latest.energy || "?") +
        "/10";
    }
    if (j.length >= 3) {
      const avgMood =
        j.slice(0, 5).reduce((s: number, x: any) => s + (x.mood || 5), 0) /
        Math.min(j.length, 5);
      data += ", avg mood=" + avgMood.toFixed(1);
    }
  }

  return `You are CorteXia — an intelligent, warm AI life mentor and personal assistant.
Now: ${day} ${date}, ${time}
${mem}
${data ? "\n── USER DATA ──" + data + "\n" : ""}
You MUST respond with a JSON object. No markdown, no code fences, no extra text.

The JSON object MUST have these fields:
{
  "message": "Your friendly reply to the user. If you know their name from MEMORY above, USE IT! e.g. 'Hey [Name]! ...'",
  "actions": [],
  "suggestions": [{"text": "label", "action": "type", "reason": "why"}]
}

ACTIONS — when user asks to create/add/do something, put actions in the "actions" array:
• create_task: {"type":"create_task","data":{"title":"string","priority":"low|medium|high","domain":"work|study|personal|health|finance","dueDate":"YYYY-MM-DD","description":"string"}}
• complete_task: {"type":"complete_task","data":{"taskId":"id"}}
• create_habit: {"type":"create_habit","data":{"name":"string","frequency":"daily|weekly","category":"health|productivity|learning|mindfulness|fitness|other","description":"string"}}
• complete_habit: {"type":"complete_habit","data":{"habitId":"id"}}
• create_goal: {"type":"create_goal","data":{"title":"string","category":"string","targetDate":"YYYY-MM-DD","description":"string"}}
• add_expense: {"type":"add_expense","data":{"amount":0.00,"category":"string","description":"string"}}
• add_income: {"type":"add_income","data":{"amount":0.00,"description":"string"}}
• log_time: {"type":"log_time","data":{"task":"string","duration":30,"category":"string"}}
• log_study: {"type":"log_study","data":{"subject":"string","duration":45,"topic":"string"}}
• create_journal: {"type":"create_journal","data":{"content":"string","mood":7,"energy":6}}
• navigate: {"type":"navigate","data":{"path":"/tasks"}}  — VALID PAGES: /tasks, /habits, /goals, /finance, /journal, /day-planner, /time-tracker, /study, /insights, /settings, /ai-coach, /timeline
• set_theme: {"type":"set_theme","data":{"theme":"dark|light"}}
• display_data: {"type":"display_data","data":{"dataType":"tasks|habits|goals|finance|analysis","items":[]}} — Use this to show lists inline.

NOTE on navigate: NEVER use "navigate" unless user explicitly asks to "go to" or "open" a page. If user asks "show me my day", "what's on my schedule", "list my tasks", etc. -> USE "display_data". Do NOT navigate.

EXAMPLE — user says "create a task to buy milk":
{"message":"Done! I've created a task to buy milk for you.","actions":[{"type":"create_task","data":{"title":"Buy milk","priority":"medium","domain":"personal"}}],"suggestions":[{"text":"Add more tasks","action":"create_task","reason":"Batch your errands"}]}

EXAMPLE — user says "my name is Alex":
{"message":"Hey Alex! Great to meet you! I'll remember your name. How can I help you today?","actions":[],"suggestions":[{"text":"Show my tasks","action":"navigate","reason":"See what's on your plate"}]}

RULES:
• If the user's name is in MEMORY above, ALWAYS greet them by name.
• When user asks to create/add something, you MUST include the action in "actions". Don't just say you did it.
• "suggestions": always include 1-3 relevant follow-ups.
• Keep message under 150 words unless user asks for detail.
• Be proactive: mention overdue tasks, streak risks, mood dips.
• You CAN answer general questions (science, coding, advice, etc.).
• NEVER say "I don't have access to your data" — you DO, it's in USER DATA above.
• Return ONLY the JSON object. No text before or after.`;
}

// Normalize an action: ensure it has {type, data} structure
function normalizeAction(
  action: any,
): { type: string; data: Record<string, any> } | null {
  if (!action || typeof action !== "object") return null;
  const type = action.type;
  if (!type || typeof type !== "string") return null;

  // If action already has a `data` object, use it
  if (action.data && typeof action.data === "object") {
    return { type, data: action.data };
  }

  // Otherwise, everything except `type` IS the data (flat format from LLM)
  const { type: _, ...rest } = action;
  return { type, data: rest };
}

// Parse LLM JSON response with robust fallbacks
function parseAIResponse(raw: string): {
  message: string;
  actions: any[];
  suggestions: any[];
} {
  let parsed: any = null;

  // Try direct parse first
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Strip markdown fences and any text before/after JSON
    let cleaned = raw
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/gi, "")
      .trim();

    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Try to extract the first complete JSON object
      const startIdx = cleaned.indexOf("{");
      const endIdx = cleaned.lastIndexOf("}");
      if (startIdx !== -1 && endIdx > startIdx) {
        try {
          parsed = JSON.parse(cleaned.substring(startIdx, endIdx + 1));
        } catch {
          console.error(
            "[AI] Failed to parse JSON from response:",
            raw.substring(0, 200),
          );
        }
      }
    }
  }

  if (!parsed) {
    return { message: raw, actions: [], suggestions: [] };
  }

  // Normalize actions to always have {type, data} structure
  const rawActions = Array.isArray(parsed.actions) ? parsed.actions : [];
  const actions = rawActions.map(normalizeAction).filter(Boolean);

  return {
    message: parsed.message || raw,
    actions,
    suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
  };
}

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { message, conversationHistory, userData, memory } = req.body;

    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    // Server-side memory extraction — catches name/facts even if
    // frontend memory state hasn't hydrated yet
    const memoryUpdate = extractMemoryFromMessage(message, memory);
    const effectiveMemory = {
      ...(memory || {}),
      // If we just extracted a name from this message, include it
      // so the LLM can use it in its response
      ...(memoryUpdate.userName ? { userName: memoryUpdate.userName } : {}),
    };
    if (memoryUpdate.facts?.length && effectiveMemory.facts) {
      effectiveMemory.facts = [
        ...new Set([...effectiveMemory.facts, ...memoryUpdate.facts]),
      ];
    }

    console.log(
      "[AI] Request:",
      message.substring(0, 80),
      "| Memory name:",
      effectiveMemory.userName || "(none)",
      "| Facts:",
      effectiveMemory.facts?.length || 0,
    );

    const systemPrompt = buildSystemPrompt(userData, effectiveMemory);
    const groqMessages: { role: string; content: string }[] = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history — wrap assistant messages in JSON context
    if (conversationHistory?.length) {
      for (const msg of conversationHistory) {
        if (msg.role === "user") {
          groqMessages.push({ role: "user", content: msg.content });
        } else {
          // Wrap assistant's plain text message in the expected JSON format
          // so LLM sees consistent history
          groqMessages.push({
            role: "assistant",
            content: JSON.stringify({
              message: msg.content,
              actions: [],
              suggestions: [],
            }),
          });
        }
      }
    }

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
              Authorization: "Bearer " + apiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: groqMessages,
              temperature: 0.7,
              max_tokens: 2048,
              response_format: { type: "json_object" },
            }),
          },
        );

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          console.error(
            "[AI] Groq API error:",
            response.status,
            (error as any).error?.message,
          );
          if (response.status === 429) continue;
          throw new Error(
            (error as any).error?.message ||
            "Groq API error: " + response.status,
          );
        }

        const data = (await response.json()) as any;
        const rawReply =
          data.choices?.[0]?.message?.content ||
          '{"message":"I apologize, I could not generate a response.","actions":[],"suggestions":[]}';

        console.log("[AI] Raw LLM response:", rawReply.substring(0, 300));

        const parsed = parseAIResponse(rawReply);

        console.log(
          "[AI] Parsed — message length:",
          parsed.message.length,
          "| actions:",
          parsed.actions.length,
          parsed.actions.map((a: any) => a.type).join(","),
          "| suggestions:",
          parsed.suggestions.length,
        );

        // Include memory updates extracted server-side so frontend can merge
        const result: any = {
          message: parsed.message,
          actions: parsed.actions,
          suggestions: parsed.suggestions,
        };
        if (memoryUpdate.userName || memoryUpdate.facts?.length) {
          result.updatedMemory = memoryUpdate;
        }

        res.json(result);
        return;
      } catch (err: any) {
        lastError = err;
        console.error("[AI] Attempt", attempt + 1, "failed:", err.message);
        continue;
      }
    }

    throw lastError || new Error("All API keys exhausted");
  } catch (error: any) {
    console.error("[AI] Chat error:", error.message);
    res.status(500).json({ error: error.message || "AI service unavailable" });
  }
});

export default router;
