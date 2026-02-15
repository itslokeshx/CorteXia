import { Router, Response } from "express";
import { AuthRequest, authMiddleware } from "../middleware/auth";
import ChatSession from "../models/ChatSession";

const router = Router();
router.use(authMiddleware);

// Get chat history
router.get("/history", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    // Find the latest session for the user
    let session = await ChatSession.findOne({ userId }).sort({ updatedAt: -1 });

    // If no session exists, create one
    if (!session) {
      session = await ChatSession.create({
        userId,
        messages: []
      });
    }

    res.json(session);
  } catch (error) {
    console.error("[AI] History error:", error);
    res.status(500).json({ error: "Failed to fetch history" });
  }
});

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
    data += "\n[JOURNAL] " + j.length + " recent entries";

    // Include last 3 journal entries with FULL content for deeper insights
    const recentEntries = j.slice(0, 3);
    for (const entry of recentEntries) {
      data += "\n  • " + (entry.date?.slice(5) || "?") +
        " [mood:" + (entry.mood || "?") +
        "/10, energy:" + (entry.energy || "?") + "/10]";

      if (entry.title) {
        data += "\n    Title: " + entry.title;
      }

      if (entry.content) {
        // Include first 200 chars of content for context
        const contentPreview = entry.content.length > 200
          ? entry.content.substring(0, 200) + "..."
          : entry.content;
        data += "\n    Content: " + contentPreview;
      }
    }

    // Add mood trend if enough data
    if (j.length >= 3) {
      const avgMood = j.slice(0, 5).reduce((s: number, x: any) => s + (x.mood || 5), 0) / Math.min(j.length, 5);
      data += "\n  Avg mood (last 5): " + avgMood.toFixed(1) + "/10";
    }
  }

  return `You are CorteXia (Jarvis Mode) — an elite, hyper-intelligent, and proactive AI life architect. You have full access to the user's data and should use it to provide precise, high-leverage insights.
Now: ${day} ${date}, ${time}
${mem}
${data ? "\n── USER DATA ──" + data + "\n" : ""}
You MUST respond with a JSON object. No markdown, no code fences, no extra text.

The JSON object MUST have these fields:
{
  "message": "Your response. Be concise, witty, and extremely helpful. If you know the user's name from MEMORY, USE IT naturally! e.g. 'Hello [Name], ready to dominate the day?'",
  "actions": [],
  "suggestions": [{"text": "label", "action": "type", "reason": "why"}]
}

ACTIONS — when user asks to create/add/do something, put actions in the "actions" array:
• create_task: {"type":"create_task","data":{"title":"string","priority":"low|medium|high","domain":"work|study|personal|health|finance","dueDate":"YYYY-MM-DD","description":"string"}}
• complete_task: {"type":"complete_task","data":{"taskId":"id"}}
• delete_task: {"type":"delete_task","data":{"taskId":"id"}}
• create_habit: {"type":"create_habit","data":{"name":"string","frequency":"daily|weekly","category":"health|productivity|learning|mindfulness|fitness|other","description":"string"}}
• complete_habit: {"type":"complete_habit","data":{"habitId":"id"}}
• delete_habit: {"type":"delete_habit","data":{"habitId":"id"}}
• create_goal: {"type":"create_goal","data":{"title":"string","category":"string","targetDate":"YYYY-MM-DD","description":"string"}}
• add_expense: {"type":"add_expense","data":{"amount":0.00,"category":"string","description":"string"}}
• add_income: {"type":"add_income","data":{"amount":0.00,"description":"string"}}
• delete_transaction: {"type":"delete_transaction","data":{"transactionId":"id"}}
• log_time: {"type":"log_time","data":{"task":"string","duration":30,"category":"string"}}
• delete_time_entry: {"type":"delete_time_entry","data":{"entryId":"id"}}
• log_study: {"type":"log_study","data":{"subject":"string","duration":45,"topic":"string"}}
• delete_study_session: {"type":"delete_study_session","data":{"sessionId":"id"}}
• create_journal: {"type":"create_journal","data":{"content":"string","mood":7,"energy":6}}
• delete_journal: {"type":"delete_journal","data":{"entryId":"id"}}
• clear_completed_tasks: {"type":"clear_completed_tasks","data":{}} — Delete all completed tasks
• clear_all_tasks: {"type":"clear_all_tasks","data":{}} — Delete ALL tasks (use with caution)
• clear_all_habits: {"type":"clear_all_habits","data":{}} — Delete ALL habits (use with caution)
• navigate: {"type":"navigate","data":{"path":"/tasks"}}  — VALID PAGES: /tasks, /habits, /goals, /finance, /journal, /day-planner, /time-tracker, /study, /insights, /settings, /ai-coach, /timeline
• set_theme: {"type":"set_theme","data":{"theme":"dark|light"}}
• display_data: {"type":"display_data","data":{"dataType":"tasks|habits|goals|finance|analysis","items":[]}} — Use this to show lists inline.

NOTE on navigate: NEVER use "navigate" unless user explicitly asks to "go to" or "open" a page. If user asks "show me my day", "what's on my schedule", "list my tasks", etc. -> USE "display_data". Do NOT navigate.

EXAMPLE — user says "create a task to buy milk":
{"message":"Consider it done. I've scheduled 'Buy milk' for you. Anything else, sir?","actions":[{"type":"create_task","data":{"title":"Buy milk","priority":"medium","domain":"personal"}}],"suggestions":[{"text":"Manage tasks","action":"navigate","reason":"View your agenda"}]}

EXAMPLE — user says "my name is Alex":
{"message":"Understood, Alex. I've updated my records. How may I be of service?","actions":[],"suggestions":[{"text":"Review goals","action":"navigate","reason":"Check progress"}]}

EXAMPLE — user says "delete all tasks" or "clear all my tasks":
{"message":"All tasks deleted, sir. Your slate is clean.","actions":[{"type":"clear_all_tasks","data":{}}],"suggestions":[{"text":"Create new task","action":"create_task","reason":"Start fresh"}]}

EXAMPLE — user says "delete all completed tasks" or "clear finished tasks":
{"message":"Completed tasks cleared. You now have X pending tasks.","actions":[{"type":"clear_completed_tasks","data":{}}],"suggestions":[]}

EXAMPLE — user says "create 3 tasks for project launch":
{"message":"Here are 3 tasks for your project launch — review and confirm:","actions":[{"type":"create_task","data":{"title":"Finalize project requirements","priority":"high","domain":"work","dueDate":"${today}","description":"Document all requirements and get stakeholder sign-off","reasoning":"High priority foundation step — everything depends on this"}},{"type":"create_task","data":{"title":"Design system architecture","priority":"high","domain":"work","dueDate":"${new Date(now.getTime() + 2 * 86400000).toISOString().split("T")[0]}","description":"Create architecture diagrams and tech stack decisions","reasoning":"Needs to happen after requirements, 2-day buffer"}},{"type":"create_task","data":{"title":"Set up development environment","priority":"medium","domain":"work","dueDate":"${new Date(now.getTime() + 3 * 86400000).toISOString().split("T")[0]}","description":"Initialize repo, CI/CD, dev tools","reasoning":"Can start once architecture is decided"}}],"suggestions":[{"text":"View tasks","action":"navigate","reason":"Check your task board"}]}

EXAMPLE — user says "delete the buy milk task" (when task exists):
{"message":"Task deleted. Removed 'Buy milk' from your list.","actions":[{"type":"delete_task","data":{"taskId":"<actual_task_id>"}}],"suggestions":[]}

EXAMPLE — user asks about journal (when journal has content):
{"message":"I see from your recent journal that [reference actual content here, not just mood]. Your mood was X/10. [Provide insight based on what they wrote].","actions":[],"suggestions":[]}

CRITICAL RULES FOR BULK CREATION:
• When user says "create N tasks for X" → Generate N SEPARATE create_task actions, each with different titles, staggered dueDate values (spread across days), varied priorities, and a "reasoning" field explaining the scheduling logic
• Each task MUST have a "description" field with actionable detail
• Each task MUST have a "reasoning" field (string) explaining why it was prioritized/scheduled this way
• Stagger due dates logically — dependencies first, independent tasks can overlap
• Look at USER DATA above to avoid scheduling conflicts with existing tasks

CRITICAL RULES FOR DELETE OPERATIONS:
• When user says "delete all tasks" or "clear all tasks" → USE clear_all_tasks, NOT complete_task or create_task
• When user says "delete completed tasks" → USE clear_completed_tasks
• When user says "delete [specific task]" → USE delete_task with the actual taskId
• NEVER use complete_task when user asks to DELETE
• NEVER create tasks when user asks to DELETE

CRITICAL RULES FOR JOURNAL:
• When discussing journal entries, ALWAYS reference the actual CONTENT, not just mood/energy numbers
• Use the Title and Content fields to provide personalized insights
• Don't just say "your mood was X/10" — explain what they wrote about

RULES:
• If the user's name is in MEMORY above, ALWAYS address them by name occasionally, but don't overdo it.
• PROACTIVE: You are Jarvis. Don't just answer; anticipate needs. Mention overdue items or streak risks if relevant.
• Be CONCISE. High-impact communication. No fluff.
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
    const userId = req.userId;

    if (!message) {
      res.status(400).json({ error: "Message is required" });
      return;
    }

    // 1. Save User Message to DB
    let session = await ChatSession.findOne({ userId }).sort({ updatedAt: -1 });
    if (!session) {
      session = await ChatSession.create({ userId, messages: [] });
    }

    const userMsgId = Date.now().toString();
    session.messages.push({
      id: userMsgId,
      role: "user",
      content: message,
      timestamp: new Date(),
    });
    await session.save();

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

    // Add conversation history — USE DB SESSION HISTORY (last 20 messages)
    const recentHistory = session.messages.slice(-20); // Get last 20 messages including the one we just added
    // Filter out the *very* last user message we just added to avoid duplication if we use `session.messages` logic locally
    // Actually, `session.messages` has everything. Groq expects: history + current message.
    // So we iterate `recentHistory` but stopping BEFORE the last one (which is current `message`).

    const historyToUse = recentHistory.slice(0, -1); // Exclude current message

    if (historyToUse.length) {
      for (const msg of historyToUse) {
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

        // 2. Save AI Response to DB
        const aiMsgId = (Date.now() + 1).toString();
        session.messages.push({
          id: aiMsgId,
          role: "assistant",
          content: parsed.message, // Store the clean text message
          timestamp: new Date()
        });
        await session.save();

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
