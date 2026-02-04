import { Hono } from "hono";
import { z } from "zod";
import { db, schema } from "../db/client";
import { eq, desc, and, gte, lte } from "drizzle-orm";
import { calculateTaskPriority } from "../services/ai-service";

const tasksRouter = new Hono();

// Validation schema
const createTaskSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).default("medium"),
  category: z.string().optional(),
  domain: z
    .enum([
      "work",
      "health",
      "study",
      "personal",
      "finance",
      "focus",
      "leisure",
    ])
    .default("work"),
  dueDate: z.string().datetime().optional().nullable(),
  estimatedMinutes: z.number().optional(),
  tags: z.array(z.string()).default([]),
  parentTaskId: z.number().optional(),
});

const updateTaskSchema = createTaskSchema.partial().extend({
  status: z
    .enum(["pending", "in-progress", "completed", "cancelled"])
    .optional(),
});

// In-memory storage for development (fallback when no DB)
let mockTasks: any[] = [
  {
    id: 1,
    userId: 1,
    title: "Complete project proposal",
    description: "Write and submit Q1 project proposal",
    status: "in-progress",
    priority: "high",
    domain: "work",
    category: "work",
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    estimatedMinutes: 120,
    tags: ["important", "q1"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    userId: 1,
    title: "Call dentist",
    description: "Schedule 6-month checkup",
    status: "pending",
    priority: "medium",
    domain: "health",
    category: "health",
    tags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 3,
    userId: 1,
    title: "Review pull requests",
    description: "Code review for team members",
    status: "pending",
    priority: "high",
    domain: "work",
    category: "work",
    tags: ["code-review"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];
let mockTaskIdCounter = 4;

// GET /api/tasks - Get all tasks for user
tasksRouter.get("/", async (c) => {
  try {
    const userId = 1; // TODO: Get from auth
    const status = c.req.query("status");
    const category = c.req.query("category");
    const domain = c.req.query("domain");

    if (!db) {
      // Mock mode
      let filtered = [...mockTasks];
      if (status) filtered = filtered.filter((t) => t.status === status);
      if (category) filtered = filtered.filter((t) => t.category === category);
      if (domain) filtered = filtered.filter((t) => t.domain === domain);
      return c.json({ tasks: filtered });
    }

    // Real DB query
    let allTasks = await db
      .select()
      .from(schema.tasks)
      .where(eq(schema.tasks.userId, userId))
      .orderBy(desc(schema.tasks.createdAt));

    if (status) {
      allTasks = allTasks.filter((t) => t.status === status);
    }
    if (category) {
      allTasks = allTasks.filter((t) => t.category === category);
    }
    if (domain) {
      allTasks = allTasks.filter((t) => t.domain === domain);
    }

    return c.json({ tasks: allTasks });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return c.json({ error: "Failed to fetch tasks" }, 500);
  }
});

// GET /api/tasks/:id - Get single task
tasksRouter.get("/:id", async (c) => {
  try {
    const taskId = parseInt(c.req.param("id"));
    const userId = 1;

    if (!db) {
      const task = mockTasks.find((t) => t.id === taskId);
      if (!task) return c.json({ error: "Task not found" }, 404);
      return c.json({ task });
    }

    const task = await db
      .select()
      .from(schema.tasks)
      .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.userId, userId)))
      .limit(1);

    if (!task.length) {
      return c.json({ error: "Task not found" }, 404);
    }

    return c.json({ task: task[0] });
  } catch (error) {
    console.error("Error fetching task:", error);
    return c.json({ error: "Failed to fetch task" }, 500);
  }
});

// POST /api/tasks - Create new task
tasksRouter.post("/", async (c) => {
  try {
    const userId = 1;
    const body = await c.req.json();

    // Validate input
    const validated = createTaskSchema.parse(body);

    // Calculate AI priority (optional)
    let aiPriorityScore = null;
    let aiReasoning = null;

    if (process.env.GEMINI_API_KEY) {
      try {
        const priorityResult = await calculateTaskPriority({
          title: validated.title,
          description: validated.description,
          dueDate: validated.dueDate,
          category: validated.category,
        });
        aiPriorityScore = priorityResult.score;
        aiReasoning = priorityResult.reasoning;
      } catch (aiError) {
        console.warn("AI priority calculation failed:", aiError);
      }
    }

    if (!db) {
      // Mock mode
      const newTask = {
        id: mockTaskIdCounter++,
        userId,
        ...validated,
        status: "pending",
        aiPriorityScore,
        aiReasoning,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockTasks.unshift(newTask);
      return c.json({ task: newTask }, 201);
    }

    // Insert task
    const newTask = await db
      .insert(schema.tasks)
      .values({
        userId,
        ...validated,
        status: "pending",
        dueDate: validated.dueDate ? new Date(validated.dueDate) : null,
        aiPriorityScore,
        aiReasoning,
      })
      .returning();

    return c.json({ task: newTask[0] }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation error", details: error.errors }, 400);
    }
    console.error("Error creating task:", error);
    return c.json({ error: "Failed to create task" }, 500);
  }
});

// PATCH /api/tasks/:id - Update task
tasksRouter.patch("/:id", async (c) => {
  try {
    const taskId = parseInt(c.req.param("id"));
    const userId = 1;
    const body = await c.req.json();

    const validated = updateTaskSchema.parse(body);

    if (!db) {
      // Mock mode
      const index = mockTasks.findIndex((t) => t.id === taskId);
      if (index === -1) return c.json({ error: "Task not found" }, 404);
      mockTasks[index] = {
        ...mockTasks[index],
        ...validated,
        updatedAt: new Date().toISOString(),
        completedAt:
          validated.status === "completed"
            ? new Date().toISOString()
            : mockTasks[index].completedAt,
      };
      return c.json({ task: mockTasks[index] });
    }

    // Check task exists
    const existing = await db
      .select()
      .from(schema.tasks)
      .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.userId, userId)))
      .limit(1);

    if (!existing.length) {
      return c.json({ error: "Task not found" }, 404);
    }

    // Update task
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
      completedAt: validated.status === "completed" ? new Date() : null,
    };
    if (validated.title) updateData.title = validated.title;
    if (validated.description !== undefined)
      updateData.description = validated.description;
    if (validated.status) updateData.status = validated.status;
    if (validated.priority) updateData.priority = validated.priority;
    if (validated.category) updateData.category = validated.category;
    if (validated.domain) updateData.domain = validated.domain;
    if (validated.dueDate) updateData.dueDate = new Date(validated.dueDate);
    if (validated.estimatedMinutes !== undefined)
      updateData.estimatedMinutes = validated.estimatedMinutes;
    if (validated.tags) updateData.tags = validated.tags;

    const updated = await db
      .update(schema.tasks)
      .set(updateData)
      .where(eq(schema.tasks.id, taskId))
      .returning();

    return c.json({ task: updated[0] });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation error", details: error.errors }, 400);
    }
    console.error("Error updating task:", error);
    return c.json({ error: "Failed to update task" }, 500);
  }
});

// DELETE /api/tasks/:id - Delete task
tasksRouter.delete("/:id", async (c) => {
  try {
    const taskId = parseInt(c.req.param("id"));
    const userId = 1;

    if (!db) {
      // Mock mode
      const index = mockTasks.findIndex((t) => t.id === taskId);
      if (index === -1) return c.json({ error: "Task not found" }, 404);
      mockTasks.splice(index, 1);
      return c.json({ message: "Task deleted successfully" });
    }

    const deleted = await db
      .delete(schema.tasks)
      .where(and(eq(schema.tasks.id, taskId), eq(schema.tasks.userId, userId)))
      .returning();

    if (!deleted.length) {
      return c.json({ error: "Task not found" }, 404);
    }

    return c.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return c.json({ error: "Failed to delete task" }, 500);
  }
});

// POST /api/tasks/batch-update - Bulk update tasks (for reordering)
tasksRouter.post("/batch-update", async (c) => {
  try {
    const { updates } = await c.req.json(); // Array of { id, order }

    if (!db) {
      // Mock mode
      for (const update of updates) {
        const task = mockTasks.find((t) => t.id === update.id);
        if (task) task.order = update.order;
      }
      return c.json({ message: "Tasks updated successfully" });
    }

    // Update all in transaction
    for (const update of updates) {
      await db
        .update(schema.tasks)
        .set({ order: update.order })
        .where(eq(schema.tasks.id, update.id));
    }

    return c.json({ message: "Tasks updated successfully" });
  } catch (error) {
    console.error("Error batch updating tasks:", error);
    return c.json({ error: "Failed to update tasks" }, 500);
  }
});

export default tasksRouter;
