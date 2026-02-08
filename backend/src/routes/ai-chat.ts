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
    const todayDue = pending.filter((x: any) =>
      x.dueDate?.startsWith(today),
    );
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
    "You are CorteXia \u2014 an intelligent, warm AI life mentor and personal assistant inside the CorteXia productivity app.\n" +
    "Now: " + day + " " + date + ", " + time + mem + "\n" +
    (data ? "\n\u2500\u2500 USER DATA \u2500\u2500" + data + "\n" : "") +
    "\nRESPONSE FORMAT \u2014 You MUST return valid JSON only (no markdown fences):\n" +
    '{"message":"Your reply here","actions":[],"suggestions":[{"text":"Label","action":"type","reason":"Why"}]}\n\n' +
    "RULES:\n" +
    "\u2022 \"message\": Be conversational, personal, concise. Use the user's name if known. Reference their actual data.\n" +
    "\u2022 \"actions\": Array of executable actions (create_task, complete_task, create_habit, complete_habit, create_goal, add_expense, add_income, log_time, log_study, create_journal, navigate, set_theme, etc). Empty [] if none.\n" +
    "\u2022 \"suggestions\": 1-3 smart follow-ups with \"text\", \"action\", \"reason\".\n" +
    "\u2022 ALWAYS greet by name if you know it. REMEMBER everything shared in conversation.\n" +
    "\u2022 Reference real data: task names, habit streaks, goal progress, spending patterns, mood trends.\n" +
    "\u2022 Keep under 150 words unless asked for detail.\n" +
    "\u2022 Be proactive: notice overdue tasks, streak risks, mood dips, spending spikes.\n" +
    "\u2022 You CAN answer questions outside the app \u2014 be a knowledgeable general assistant too.\n" +
    "\u2022 NEVER say \"I don't have access to your data\" \u2014 you DO, it's shown above."
  );
}

// Parse LLM JSON response with fallbacks
function parseAIResponse(raw: string): {
  message: string;
  actions: any[];
  suggestions: any[];
} {
  try {
    const parsed = JSON.parse(raw);
    return {
      message: parsed.message || raw,
      actions: parsed.actions || [],
      suggestions: parsed.suggestions || [],
    };
  } catch {
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
