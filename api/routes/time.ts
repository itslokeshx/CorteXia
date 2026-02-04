import { Hono } from "hono";
import { z } from "zod";
import { db, schema } from "../db/client";
import { eq, and, gte, desc } from "drizzle-orm";
import { format, subDays, startOfWeek, endOfWeek } from "date-fns";

const timeRouter = new Hono();

const createTimeEntrySchema = z.object({
  activity: z.string().min(1).max(500),
  category: z.enum(["work", "study", "health", "personal", "leisure"]),
  duration: z.number().min(1),
  focusQuality: z.enum(["deep", "moderate", "shallow"]).optional(),
  interruptions: z.number().default(0),
  notes: z.string().optional(),
  taskId: z.number().optional(),
  date: z.string().optional(),
});

// Mock data
let mockTimeEntries: any[] = [
  {
    id: 1,
    userId: 1,
    activity: "Project development",
    category: "work",
    durationMinutes: 120,
    focusQuality: "deep",
    interruptions: 2,
    startTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    userId: 1,
    activity: "Email and slack",
    category: "work",
    durationMinutes: 45,
    focusQuality: "shallow",
    interruptions: 8,
    startTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    userId: 1,
    activity: "Reading documentation",
    category: "study",
    durationMinutes: 60,
    focusQuality: "moderate",
    interruptions: 1,
    startTime: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
];
let mockTimeIdCounter = 4;

// GET /api/time - Get time entries
timeRouter.get("/", async (c) => {
  try {
    const userId = 1;
    const days = parseInt(c.req.query("days") || "7");
    const category = c.req.query("category");

    const startDate = subDays(new Date(), days);

    if (!db) {
      let filtered = mockTimeEntries.filter(
        (e) => new Date(e.startTime) >= startDate,
      );
      if (category) {
        filtered = filtered.filter((e) => e.category === category);
      }
      return c.json({ entries: filtered });
    }

    let entries = await db
      .select()
      .from(schema.timeLogs)
      .where(
        and(
          eq(schema.timeLogs.userId, userId),
          gte(schema.timeLogs.startTime, startDate),
        ),
      )
      .orderBy(desc(schema.timeLogs.startTime));

    if (category) {
      entries = entries.filter((e) => e.category === category);
    }

    return c.json({ entries });
  } catch (error) {
    console.error("Error fetching time entries:", error);
    return c.json({ error: "Failed to fetch time entries" }, 500);
  }
});

// POST /api/time - Create time entry
timeRouter.post("/", async (c) => {
  try {
    const userId = 1;
    const body = await c.req.json();
    const validated = createTimeEntrySchema.parse(body);

    const startTime = validated.date ? new Date(validated.date) : new Date();
    const endTime = new Date(
      startTime.getTime() + validated.duration * 60 * 1000,
    );

    if (!db) {
      const newEntry = {
        id: mockTimeIdCounter++,
        userId,
        activity: validated.activity,
        category: validated.category,
        durationMinutes: validated.duration,
        focusQuality: validated.focusQuality || "moderate",
        interruptions: validated.interruptions,
        notes: validated.notes,
        taskId: validated.taskId,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        createdAt: new Date().toISOString(),
      };
      mockTimeEntries.unshift(newEntry);
      return c.json({ entry: newEntry }, 201);
    }

    const newEntry = await db
      .insert(schema.timeLogs)
      .values({
        userId,
        activity: validated.activity,
        category: validated.category,
        durationMinutes: validated.duration,
        focusQuality: validated.focusQuality,
        interruptions: validated.interruptions,
        notes: validated.notes,
        taskId: validated.taskId,
        startTime,
        endTime,
      })
      .returning();

    return c.json({ entry: newEntry[0] }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation error", details: error.errors }, 400);
    }
    console.error("Error creating time entry:", error);
    return c.json({ error: "Failed to create time entry" }, 500);
  }
});

// DELETE /api/time/:id - Delete time entry
timeRouter.delete("/:id", async (c) => {
  try {
    const entryId = parseInt(c.req.param("id"));
    const userId = 1;

    if (!db) {
      const index = mockTimeEntries.findIndex((e) => e.id === entryId);
      if (index === -1) return c.json({ error: "Entry not found" }, 404);
      mockTimeEntries.splice(index, 1);
      return c.json({ message: "Entry deleted successfully" });
    }

    const deleted = await db
      .delete(schema.timeLogs)
      .where(
        and(
          eq(schema.timeLogs.id, entryId),
          eq(schema.timeLogs.userId, userId),
        ),
      )
      .returning();

    if (!deleted.length) {
      return c.json({ error: "Entry not found" }, 404);
    }

    return c.json({ message: "Entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting time entry:", error);
    return c.json({ error: "Failed to delete time entry" }, 500);
  }
});

// GET /api/time/stats/today - Get today's stats
timeRouter.get("/stats/today", async (c) => {
  try {
    const userId = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (!db) {
      const todayEntries = mockTimeEntries.filter(
        (e) => new Date(e.startTime) >= today,
      );
      const totalMinutes = todayEntries.reduce(
        (sum, e) => sum + e.durationMinutes,
        0,
      );
      const deepMinutes = todayEntries
        .filter((e) => e.focusQuality === "deep")
        .reduce((sum, e) => sum + e.durationMinutes, 0);
      const totalInterruptions = todayEntries.reduce(
        (sum, e) => sum + (e.interruptions || 0),
        0,
      );

      return c.json({
        totalMinutes,
        deepFocusMinutes: deepMinutes,
        totalInterruptions,
        entries: todayEntries.length,
        byCategory: todayEntries.reduce(
          (acc, e) => {
            acc[e.category] = (acc[e.category] || 0) + e.durationMinutes;
            return acc;
          },
          {} as Record<string, number>,
        ),
      });
    }

    return c.json({
      totalMinutes: 0,
      deepFocusMinutes: 0,
      totalInterruptions: 0,
      entries: 0,
      byCategory: {},
    });
  } catch (error) {
    console.error("Error fetching today stats:", error);
    return c.json({ error: "Failed to fetch today stats" }, 500);
  }
});

// GET /api/time/stats/weekly - Get weekly stats
timeRouter.get("/stats/weekly", async (c) => {
  try {
    const userId = 1;
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

    if (!db) {
      const weekEntries = mockTimeEntries.filter(
        (e) => new Date(e.startTime) >= weekStart,
      );
      const totalMinutes = weekEntries.reduce(
        (sum, e) => sum + e.durationMinutes,
        0,
      );
      const byCategory = weekEntries.reduce(
        (acc, e) => {
          acc[e.category] = (acc[e.category] || 0) + e.durationMinutes;
          return acc;
        },
        {} as Record<string, number>,
      );

      return c.json({
        totalMinutes,
        byCategory,
        entries: weekEntries.length,
        avgDailyMinutes: Math.round(totalMinutes / 7),
      });
    }

    return c.json({
      totalMinutes: 0,
      byCategory: {},
      entries: 0,
      avgDailyMinutes: 0,
    });
  } catch (error) {
    console.error("Error fetching weekly stats:", error);
    return c.json({ error: "Failed to fetch weekly stats" }, 500);
  }
});

export default timeRouter;
