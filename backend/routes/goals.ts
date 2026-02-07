import { Hono } from "hono";
import { z } from "zod";
import { db, schema } from "../db/client";
import { eq, and, desc } from "drizzle-orm";

const goalsRouter = new Hono();

const createGoalSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  category: z
    .enum(["personal", "health", "career", "financial", "education", "family"])
    .default("personal"),
  type: z.enum(["outcome", "habit", "milestone"]).default("outcome"),
  timeframe: z.enum(["short-term", "medium-term", "long-term"]).optional(),
  targetDate: z.string().optional(),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  milestones: z
    .array(
      z.object({
        id: z.string(),
        title: z.string(),
        completed: z.boolean().default(false),
        targetDate: z.string().optional(),
      }),
    )
    .default([]),
});

const updateGoalSchema = createGoalSchema.partial().extend({
  status: z.enum(["active", "completed", "abandoned", "on-hold"]).optional(),
  progress: z.number().min(0).max(100).optional(),
});

// Mock data
let mockGoals: any[] = [
  {
    id: 1,
    userId: 1,
    title: "Launch Side Project",
    description: "Build and deploy my SaaS idea",
    category: "career",
    type: "outcome",
    status: "active",
    timeframe: "medium-term",
    targetDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    progress: 35,
    priority: "high",
    milestones: [
      {
        id: "1",
        title: "Complete MVP",
        completed: true,
        completedAt: new Date().toISOString(),
      },
      { id: "2", title: "Get 10 beta users", completed: false },
      { id: "3", title: "Launch on Product Hunt", completed: false },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    userId: 1,
    title: "Run 5K",
    description: "Complete a 5K run in under 30 minutes",
    category: "health",
    type: "outcome",
    status: "active",
    timeframe: "short-term",
    targetDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
    progress: 20,
    priority: "medium",
    milestones: [
      { id: "1", title: "Run 1K without stopping", completed: true },
      { id: "2", title: "Run 2K without stopping", completed: false },
      { id: "3", title: "Run 3K in 20 minutes", completed: false },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    userId: 1,
    title: "Learn Machine Learning",
    description: "Complete a comprehensive ML course and build 3 projects",
    category: "education",
    type: "outcome",
    status: "active",
    timeframe: "medium-term",
    targetDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
    progress: 45,
    priority: "high",
    milestones: [
      { id: "1", title: "Complete Python basics", completed: true },
      { id: "2", title: "Learn NumPy & Pandas", completed: true },
      { id: "3", title: "Build first ML model", completed: false },
      { id: "4", title: "Complete neural networks module", completed: false },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
let mockGoalIdCounter = 4;

// GET /api/goals - Get all goals
goalsRouter.get("/", async (c) => {
  try {
    const userId = 1;
    const status = c.req.query("status");
    const category = c.req.query("category");

    if (!db) {
      let filtered = [...mockGoals];
      if (status) filtered = filtered.filter((g) => g.status === status);
      if (category) filtered = filtered.filter((g) => g.category === category);
      return c.json({ goals: filtered });
    }

    let goals = await db
      .select()
      .from(schema.goals)
      .where(eq(schema.goals.userId, userId))
      .orderBy(desc(schema.goals.createdAt));

    if (status) goals = goals.filter((g) => g.status === status);
    if (category) goals = goals.filter((g) => g.category === category);

    return c.json({ goals });
  } catch (error) {
    console.error("Error fetching goals:", error);
    return c.json({ error: "Failed to fetch goals" }, 500);
  }
});

// POST /api/goals - Create goal
goalsRouter.post("/", async (c) => {
  try {
    const userId = 1;
    const body = await c.req.json();
    const validated = createGoalSchema.parse(body);

    if (!db) {
      const newGoal = {
        id: mockGoalIdCounter++,
        userId,
        ...validated,
        status: "active",
        progress: 0,
        targetDate: validated.targetDate || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockGoals.unshift(newGoal);
      return c.json({ goal: newGoal }, 201);
    }

    const newGoal = await db
      .insert(schema.goals)
      .values({
        userId,
        ...validated,
        targetDate: validated.targetDate
          ? new Date(validated.targetDate)
          : null,
      })
      .returning();

    return c.json({ goal: newGoal[0] }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation error", details: error.errors }, 400);
    }
    console.error("Error creating goal:", error);
    return c.json({ error: "Failed to create goal" }, 500);
  }
});

// GET /api/goals/:id - Get single goal
goalsRouter.get("/:id", async (c) => {
  try {
    const goalId = parseInt(c.req.param("id"));
    const userId = 1;

    if (!db) {
      const goal = mockGoals.find((g) => g.id === goalId);
      if (!goal) return c.json({ error: "Goal not found" }, 404);
      return c.json({ goal });
    }

    const goal = await db
      .select()
      .from(schema.goals)
      .where(and(eq(schema.goals.id, goalId), eq(schema.goals.userId, userId)))
      .limit(1);

    if (!goal.length) {
      return c.json({ error: "Goal not found" }, 404);
    }

    return c.json({ goal: goal[0] });
  } catch (error) {
    console.error("Error fetching goal:", error);
    return c.json({ error: "Failed to fetch goal" }, 500);
  }
});

// PATCH /api/goals/:id - Update goal
goalsRouter.patch("/:id", async (c) => {
  try {
    const goalId = parseInt(c.req.param("id"));
    const userId = 1;
    const body = await c.req.json();
    const validated = updateGoalSchema.parse(body);

    if (!db) {
      const index = mockGoals.findIndex((g) => g.id === goalId);
      if (index === -1) return c.json({ error: "Goal not found" }, 404);
      mockGoals[index] = {
        ...mockGoals[index],
        ...validated,
        updatedAt: new Date().toISOString(),
        completedAt:
          validated.status === "completed"
            ? new Date().toISOString()
            : mockGoals[index].completedAt,
      };
      return c.json({ goal: mockGoals[index] });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
      completedAt: validated.status === "completed" ? new Date() : undefined,
    };
    if (validated.title) updateData.title = validated.title;
    if (validated.description !== undefined)
      updateData.description = validated.description;
    if (validated.status) updateData.status = validated.status;
    if (validated.category) updateData.category = validated.category;
    if (validated.targetDate)
      updateData.targetDate = new Date(validated.targetDate);
    if (validated.progress !== undefined)
      updateData.progress = validated.progress;
    if (validated.milestones) updateData.milestones = validated.milestones;

    const updated = await db
      .update(schema.goals)
      .set(updateData)
      .where(and(eq(schema.goals.id, goalId), eq(schema.goals.userId, userId)))
      .returning();

    if (!updated.length) {
      return c.json({ error: "Goal not found" }, 404);
    }

    return c.json({ goal: updated[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation error", details: error.errors }, 400);
    }
    console.error("Error updating goal:", error);
    return c.json({ error: "Failed to update goal" }, 500);
  }
});

// DELETE /api/goals/:id - Delete goal
goalsRouter.delete("/:id", async (c) => {
  try {
    const goalId = parseInt(c.req.param("id"));
    const userId = 1;

    if (!db) {
      const index = mockGoals.findIndex((g) => g.id === goalId);
      if (index === -1) return c.json({ error: "Goal not found" }, 404);
      mockGoals.splice(index, 1);
      return c.json({ message: "Goal deleted successfully" });
    }

    const deleted = await db
      .delete(schema.goals)
      .where(and(eq(schema.goals.id, goalId), eq(schema.goals.userId, userId)))
      .returning();

    if (!deleted.length) {
      return c.json({ error: "Goal not found" }, 404);
    }

    return c.json({ message: "Goal deleted successfully" });
  } catch (error) {
    console.error("Error deleting goal:", error);
    return c.json({ error: "Failed to delete goal" }, 500);
  }
});

// POST /api/goals/:id/milestones/:milestoneId/complete - Complete milestone
goalsRouter.post("/:id/milestones/:milestoneId/complete", async (c) => {
  try {
    const goalId = parseInt(c.req.param("id"));
    const milestoneId = c.req.param("milestoneId");
    const userId = 1;

    if (!db) {
      const goal = mockGoals.find((g) => g.id === goalId);
      if (!goal) return c.json({ error: "Goal not found" }, 404);

      const milestones = goal.milestones || [];
      const milestoneIndex = milestones.findIndex(
        (m: any) => m.id === milestoneId,
      );
      if (milestoneIndex === -1)
        return c.json({ error: "Milestone not found" }, 404);

      milestones[milestoneIndex].completed =
        !milestones[milestoneIndex].completed;
      milestones[milestoneIndex].completedAt = milestones[milestoneIndex]
        .completed
        ? new Date().toISOString()
        : undefined;

      // Update progress
      const completedCount = milestones.filter((m: any) => m.completed).length;
      goal.progress = Math.round((completedCount / milestones.length) * 100);
      goal.updatedAt = new Date().toISOString();

      return c.json({ goal });
    }

    return c.json({ error: "Not implemented" }, 501);
  } catch (error) {
    console.error("Error completing milestone:", error);
    return c.json({ error: "Failed to complete milestone" }, 500);
  }
});

// GET /api/goals/stats - Get goal statistics
goalsRouter.get("/stats/summary", async (c) => {
  try {
    const userId = 1;

    if (!db) {
      const total = mockGoals.length;
      const completed = mockGoals.filter(
        (g) => g.status === "completed",
      ).length;
      const inProgress = mockGoals.filter((g) => g.status === "active").length;
      const avgProgress =
        mockGoals.length > 0
          ? Math.round(
              mockGoals.reduce((sum, g) => sum + (g.progress || 0), 0) /
                mockGoals.length,
            )
          : 0;

      return c.json({
        total,
        completed,
        inProgress,
        avgProgress,
      });
    }

    return c.json({
      total: 0,
      completed: 0,
      inProgress: 0,
      avgProgress: 0,
    });
  } catch (error) {
    console.error("Error fetching goal stats:", error);
    return c.json({ error: "Failed to fetch goal stats" }, 500);
  }
});

export default goalsRouter;
