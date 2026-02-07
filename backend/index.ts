import { config } from "dotenv";
import { existsSync } from "fs";
import { join } from "path";

// Load .env — check both cwd/.env and cwd/backend/.env (for workspace root)
const cwd = process.cwd();
const localEnv = join(cwd, ".env");
const backendEnv = join(cwd, "backend", ".env");

if (existsSync(localEnv)) {
  config({ path: localEnv });
} else if (existsSync(backendEnv)) {
  config({ path: backendEnv });
} else {
  config(); // default dotenv behavior
}

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { serve } from "@hono/node-server";

// Routes
import tasksRouter from "./routes/tasks";
import habitsRouter from "./routes/habits";
import timeRouter from "./routes/time";
import financeRouter from "./routes/finance";
import studyRouter from "./routes/study";
import goalsRouter from "./routes/goals";
import journalRouter from "./routes/journal";
import insightsRouter from "./routes/insights";
import aiRouter from "./routes/ai";
import usersRouter from "./routes/users";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://cortexia.vercel.app",
    ],
    credentials: true,
  }),
);

// Health check
app.get("/health", (c) =>
  c.json({ status: "ok", timestamp: new Date().toISOString() }),
);

// Mount routes
app.route("/api/users", usersRouter);
app.route("/api/tasks", tasksRouter);
app.route("/api/habits", habitsRouter);
app.route("/api/time", timeRouter);
app.route("/api/finance", financeRouter);
app.route("/api/study", studyRouter);
app.route("/api/goals", goalsRouter);
app.route("/api/journal", journalRouter);
app.route("/api/insights", insightsRouter);
app.route("/api/ai", aiRouter);

// 404 handler
app.notFound((c) => c.json({ error: "Not Found" }, 404));

// Error handler
app.onError((err, c) => {
  console.error("Server error:", err);
  return c.json({ error: err.message || "Internal Server Error" }, 500);
});

const port = parseInt(process.env.PORT || "3001");

console.log(`🚀 CorteXia API running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
