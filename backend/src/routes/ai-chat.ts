import { Router, Response } from "express";
import { AuthRequest, authMiddleware } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

const GROQ_API_KEYS = [
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
  process.env.GROQ_API_KEY_4,
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

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { messages, context, systemPrompt } = req.body;

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
              messages: [
                {
                  role: "system",
                  content:
                    systemPrompt ||
                    "You are CorteXia, an AI life coach assistant. Be helpful, empathetic, and actionable.",
                },
                ...(messages || []),
              ],
              temperature: 0.7,
              max_tokens: 2048,
            }),
          },
        );

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          if (response.status === 429) {
            continue;
          }
          throw new Error(
            (error as any).error?.message ||
              `Groq API error: ${response.status}`,
          );
        }

        const data = (await response.json()) as any;
        const reply =
          data.choices?.[0]?.message?.content ||
          "I apologize, I could not generate a response.";

        res.json({ response: reply });
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
