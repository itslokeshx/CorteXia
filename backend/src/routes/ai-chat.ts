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
// TOKEN-EFFICIENT CONTEXT BUILDER
// Compresses all user data into a dense but complete snapshot
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

  // Memory block
  let mem = "";
  if (memory) {
    const parts: string[] = [];
    if (memory.userName) parts.push("Name: " + memory.userName);
    if (memory.facts?.length) parts.push("Known: " + memory.facts.join("; "));
    if (memory.lastTopic) parts.push("Last topic: " + memory.lastTopic);
    if (memory.conversationCount)
      parts.push("Chats: " + memory.conversationCount);
    if (memory.preferredTheme) parts.push("Theme: " + memory.preferredTheme);
    if (parts.length) mem = "\n[MEMORY] " + parts.join(" | ");
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

  return (
    "You are CorteXia — an intelligent, warm AI life mentor and personal assistant.\n" +
    "Now: " +
    day +
    " " +
    date +
    ", " +
    time +
    "\n" +
    (mem ? mem + "\n" : "") +
    (data ? "\n── USER DATA ──" + data + "\n" : "") +
    "\n══ RESPONSE FORMAT ══\n" +
    "You MUST return ONLY valid JSON (no markdown fences, no text outside JSON):\n" +
    "{\n" +
    '  "message": "Your conversational reply here",\n' +
    '  "actions": [\n' +
    '    {"type": "action_name", "data": { ...parameters }}\n' +
    "  ],\n" +
    '  "suggestions": [\n' +
    '    {"text": "Button label", "action": "action_type", "reason": "Why"}\n' +
    "  ]\n" +
    "}\n\n" +
    "══ ACTION SCHEMAS ══\n" +
    'IMPORTANT: Every action MUST have "type" and "data" fields. The "data" object contains the parameters.\n' +
    'When user asks you to create/add something, you MUST include the action in "actions" array.\n\n' +
    "Available actions with their data schemas:\n" +
    '• create_task:    {"type":"create_task","data":{"title":"Task name","priority":"medium","dueDate":"2026-02-09","domain":"personal","description":"optional"}}\n' +
    '• complete_task:  {"type":"complete_task","data":{"taskId":"id"}}\n' +
    '• create_habit:   {"type":"create_habit","data":{"name":"Habit name","frequency":"daily","category":"health","description":"optional"}}\n' +
    '• complete_habit: {"type":"complete_habit","data":{"habitId":"id"}}\n' +
    '• create_goal:    {"type":"create_goal","data":{"title":"Goal name","category":"personal","targetDate":"2026-12-31","description":"optional"}}\n' +
    '• add_expense:    {"type":"add_expense","data":{"amount":25.50,"category":"food","description":"Lunch"}}\n' +
    '• add_income:     {"type":"add_income","data":{"amount":5000,"description":"Salary"}}\n' +
    '• log_time:       {"type":"log_time","data":{"task":"Task name","duration":30,"category":"work"}}\n' +
    '• log_study:      {"type":"log_study","data":{"subject":"Math","duration":45,"topic":"Calculus"}}\n' +
    '• create_journal: {"type":"create_journal","data":{"content":"Journal text","mood":7,"energy":6}}\n' +
    '• navigate:       {"type":"navigate","data":{"path":"/tasks"}}\n' +
    '• set_theme:      {"type":"set_theme","data":{"theme":"dark"}}\n\n' +
    "══ RULES ══\n" +
    "• ALWAYS use the user's name in replies if known from [MEMORY]. Be personal and warm.\n" +
    "• Reference SPECIFIC data: actual task names, habit streaks, goal %, spending amounts, mood scores.\n" +
    '• When user says to create/add something → PUT the action in "actions" array. Don\'t just say you did it.\n' +
    '• "suggestions": 1-3 relevant follow-ups. Always include at least one.\n' +
    "• Keep replies concise (under 150 words) unless user asks for detail.\n" +
    "• Be proactive: notice overdue tasks, streak risks, mood dips, spending spikes.\n" +
    "• You CAN answer general questions (science, coding, advice, etc.) — be a knowledgeable assistant.\n" +
    "• NEVER say \"I don't have access to your data\" — you DO, it's shown above in USER DATA.\n" +
    "• NEVER wrap response in markdown code blocks. Return raw JSON only."
  );
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

// Parse LLM JSON response with fallbacks
function parseAIResponse(raw: string): {
  message: string;
  actions: any[];
  suggestions: any[];
} {
  let parsed: any = null;

  // Try direct parse
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Strip markdown fences
    const cleaned = raw
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/gi, "")
      .trim();
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // Try to extract JSON object
      const jsonMatch = cleaned.match(/\{[\s\S]*"message"[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          // Give up on JSON
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

    const systemPrompt = buildSystemPrompt(userData, memory);
    const groqMessages: { role: string; content: string }[] = [
      { role: "system", content: systemPrompt },
    ];

    if (conversationHistory?.length) {
      for (const msg of conversationHistory) {
        groqMessages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        });
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
              max_tokens: 1024,
            }),
          },
        );

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
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
