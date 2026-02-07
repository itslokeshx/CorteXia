/**
 * ═══════════════════════════════════════════════════════════════
 * CORTEXIA — GROQ CLIENT WITH 6-KEY FALLBACK (BACKEND)
 *
 * Rotates through up to 6 Groq API keys to handle rate limits.
 * Tracks per-key usage and cooldowns. Auto-failover on 429/500.
 * Uses llama-3.3-70b-versatile by default.
 * ═══════════════════════════════════════════════════════════════
 */

interface KeyState {
  key: string;
  index: number;
  requestCount: number;
  lastUsed: number;
  cooldownUntil: number;
  consecutiveErrors: number;
}

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface GroqResponse {
  id: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const MODEL = "llama-3.3-70b-versatile";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const COOLDOWN_MS = 60_000; // 1 minute cooldown on rate limit
const MAX_RETRIES = 6; // Try all keys before giving up

class GroqClient {
  private keys: KeyState[] = [];
  private currentIndex = 0;
  private initialized = false;

  /** Lazy-load keys on first use (so dotenv has time to populate process.env) */
  private ensureInitialized() {
    if (this.initialized) return;
    this.initialized = true;
    this.loadKeys();
  }

  private loadKeys() {
    const envKeys: string[] = [];

    // Load GROQ_API_KEY_1 through GROQ_API_KEY_6
    for (let i = 1; i <= 6; i++) {
      const key = process.env[`GROQ_API_KEY_${i}`];
      if (key && key.trim()) {
        envKeys.push(key.trim());
      }
    }

    // Fallback to single GROQ_API_KEY
    if (envKeys.length === 0) {
      const singleKey = process.env.GROQ_API_KEY;
      if (singleKey?.trim()) {
        envKeys.push(singleKey.trim());
      }
    }

    this.keys = envKeys.map((key, index) => ({
      key,
      index,
      requestCount: 0,
      lastUsed: 0,
      cooldownUntil: 0,
      consecutiveErrors: 0,
    }));

    if (this.keys.length === 0) {
      console.warn(
        "⚠️ No Groq API keys configured. AI features will use local fallback.",
      );
    } else {
      console.log(`🔑 Loaded ${this.keys.length} Groq API key(s)`);
    }
  }

  /** Check if any keys are available */
  isConfigured(): boolean {
    this.ensureInitialized();
    return this.keys.length > 0;
  }

  /** Get the next available key, skipping cooldowns */
  private getNextKey(): KeyState | null {
    this.ensureInitialized();
    if (this.keys.length === 0) return null;

    const now = Date.now();

    // Try from current index, round-robin
    for (let i = 0; i < this.keys.length; i++) {
      const idx = (this.currentIndex + i) % this.keys.length;
      const key = this.keys[idx];

      if (key.cooldownUntil <= now) {
        this.currentIndex = (idx + 1) % this.keys.length;
        return key;
      }
    }

    // All keys are on cooldown — find the one that recovers soonest
    const soonest = this.keys.reduce((a, b) =>
      a.cooldownUntil < b.cooldownUntil ? a : b,
    );

    if (soonest.cooldownUntil - now < 5000) {
      return soonest;
    }

    return null; // All keys exhausted
  }

  /** Mark a key as rate-limited */
  private cooldownKey(keyState: KeyState, durationMs = COOLDOWN_MS) {
    keyState.cooldownUntil = Date.now() + durationMs;
    keyState.consecutiveErrors++;
    console.warn(
      `🔑 Key #${keyState.index + 1} rate-limited, cooling down for ${durationMs / 1000}s`,
    );
  }

  /** Reset error count on success */
  private markSuccess(keyState: KeyState) {
    keyState.consecutiveErrors = 0;
    keyState.lastUsed = Date.now();
    keyState.requestCount++;
  }

  /**
   * Send a chat completion request to Groq with automatic key rotation.
   */
  async chat(
    messages: GroqMessage[],
    options: {
      temperature?: number;
      maxTokens?: number;
      model?: string;
    } = {},
  ): Promise<{
    content: string;
    usage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
    keyUsed: number;
  }> {
    const { temperature = 0.7, maxTokens = 4096, model = MODEL } = options;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const keyState = this.getNextKey();

      if (!keyState) {
        throw new Error(
          "All Groq API keys are rate-limited. Please wait a moment and try again.",
        );
      }

      try {
        const response = await fetch(GROQ_API_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${keyState.key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages,
            temperature,
            max_tokens: maxTokens,
            stream: false,
          }),
        });

        // Handle rate limit
        if (response.status === 429) {
          const retryAfter = response.headers.get("retry-after");
          const cooldown = retryAfter
            ? parseInt(retryAfter) * 1000
            : COOLDOWN_MS;
          this.cooldownKey(keyState, cooldown);
          lastError = new Error(`Rate limited on key #${keyState.index + 1}`);
          continue;
        }

        // Handle server errors
        if (response.status >= 500) {
          this.cooldownKey(keyState, 10_000);
          lastError = new Error(`Groq server error: ${response.status}`);
          continue;
        }

        // Handle other errors
        if (!response.ok) {
          const errorBody = await response.text();
          lastError = new Error(
            `Groq API error ${response.status}: ${errorBody}`,
          );
          if (response.status === 401 || response.status === 403) {
            this.cooldownKey(keyState, 300_000); // 5 min cooldown for bad keys
          }
          continue;
        }

        const data = (await response.json()) as GroqResponse;
        this.markSuccess(keyState);

        const content = data.choices?.[0]?.message?.content || "";

        return {
          content,
          usage: {
            promptTokens: data.usage?.prompt_tokens || 0,
            completionTokens: data.usage?.completion_tokens || 0,
            totalTokens: data.usage?.total_tokens || 0,
          },
          keyUsed: keyState.index + 1,
        };
      } catch (err) {
        this.cooldownKey(keyState, 5000);
        lastError = err instanceof Error ? err : new Error(String(err));
        continue;
      }
    }

    throw (
      lastError ||
      new Error("Failed to get response from Groq after all retries")
    );
  }

  /** Get status of all keys for debugging */
  getStatus(): {
    totalKeys: number;
    availableKeys: number;
    keys: {
      index: number;
      available: boolean;
      requestCount: number;
      cooldownRemaining: number;
    }[];
  } {
    const now = Date.now();
    return {
      totalKeys: this.keys.length,
      availableKeys: this.keys.filter((k) => k.cooldownUntil <= now).length,
      keys: this.keys.map((k) => ({
        index: k.index + 1,
        available: k.cooldownUntil <= now,
        requestCount: k.requestCount,
        cooldownRemaining: Math.max(
          0,
          Math.round((k.cooldownUntil - now) / 1000),
        ),
      })),
    };
  }
}

// Singleton instance
export const groqClient = new GroqClient();
