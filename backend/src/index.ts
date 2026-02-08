import "dotenv/config";
import express from "express";
import cors from "cors";
import { connectDB } from "./config/database";

// Route imports
import authRoutes from "./routes/auth";
import taskRoutes from "./routes/tasks";
import habitRoutes from "./routes/habits";
import habitCompletionRoutes from "./routes/habit-completions";
import goalRoutes from "./routes/goals";
import expenseRoutes from "./routes/expenses";
import timeEntryRoutes from "./routes/time-entries";
import timeBlockRoutes from "./routes/time-blocks";
import journalRoutes from "./routes/journal";
import studySessionRoutes from "./routes/study-sessions";
import settingsRoutes from "./routes/settings";
import aiChatRoutes from "./routes/ai-chat";
import userDataRoutes from "./routes/user-data";
import deleteAllDataRoutes from "./routes/delete-all-data";

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" }));

// ─── Health check ───
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ─── Routes ───
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/habits", habitRoutes);
app.use("/api/habit-completions", habitCompletionRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/time-entries", timeEntryRoutes);
app.use("/api/time-blocks", timeBlockRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/study-sessions", studySessionRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/ai/chat", aiChatRoutes);
app.use("/api/user-data", userDataRoutes);
app.use("/api/delete-all-data", deleteAllDataRoutes);

// ─── Start ───
async function start() {
  try {
    await connectDB();
    console.log("✅ Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`🚀 CorteXia Backend running on port ${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

start();
