import { Hono } from "hono";
import { parseQuickAddInput, askAI } from "../services/ai-service";

const aiRouter = new Hono();

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
