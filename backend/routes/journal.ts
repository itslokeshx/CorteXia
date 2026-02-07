import { Hono } from "hono";
import { z } from "zod";
import { db, schema } from "../db/client";
import { eq, and, desc, gte } from "drizzle-orm";
import { subDays, format } from "date-fns";

const journalRouter = new Hono();

const createEntrySchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1),
  mood: z.string().optional(),
  moodScore: z.number().min(1).max(10).optional(),
  energy: z.number().min(1).max(10).optional(),
  stress: z.number().min(1).max(10).optional(),
  focus: z.number().min(1).max(10).optional(),
  tags: z.array(z.string()).default([]),
  gratitude: z.array(z.string()).optional(),
  wins: z.array(z.string()).optional(),
  improvements: z.array(z.string()).optional(),
  date: z.string().optional(),
});

// Mock data
let mockJournalEntries: any[] = [
  {
    id: 1,
    userId: 1,
    title: "Productive Day",
    content: `Today was incredibly productive. Finished the main feature for the project and got positive feedback from the team. Feeling motivated to continue tomorrow.\n\nSpent some quality time learning about system design patterns. The distributed systems concepts are finally starting to click.`,
    mood: "energized",
    moodScore: 8,
    energy: 8,
    stress: 3,
    focus: 9,
    tags: ["productive", "work", "learning"],
    gratitude: ["Great team collaboration", "Good health", "Morning coffee"],
    wins: ["Completed main feature", "Helped teammate debug issue"],
    date: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    userId: 1,
    title: "Challenging but Growth",
    content: `Faced some setbacks with the deployment today. The CI/CD pipeline broke and it took a few hours to figure out the issue. But learned a lot about Docker networking in the process.\n\nReminder to myself: challenges are opportunities for growth.`,
    mood: "neutral",
    moodScore: 6,
    energy: 5,
    stress: 6,
    focus: 7,
    tags: ["challenges", "learning", "devops"],
    gratitude: [
      "Supportive colleagues",
      "Documentation was helpful",
      "Healthy lunch",
    ],
    improvements: ["Take more breaks during debugging", "Ask for help earlier"],
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    userId: 1,
    title: "Weekend Reset",
    content: `Took some time off to recharge. Went for a long walk in the park and caught up on reading. Sometimes stepping away from work is exactly what you need for clarity.\n\nPlanning to start fresh next week with renewed energy.`,
    mood: "happy",
    moodScore: 9,
    energy: 9,
    stress: 2,
    focus: 6,
    tags: ["rest", "self-care", "nature"],
    gratitude: [
      "Beautiful weather",
      "Finished a great book",
      "Quality family time",
    ],
    wins: ["Completed 10K steps", "Read 50 pages"],
    date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
];
let mockJournalIdCounter = 4;

// GET /api/journal/entries - Get journal entries
journalRouter.get("/entries", async (c) => {
  try {
    const userId = 1;
    const days = parseInt(c.req.query("days") || "30");
    const startDate = subDays(new Date(), days);

    if (!db) {
      const filtered = mockJournalEntries.filter(
        (e) => new Date(e.date) >= startDate,
      );
      return c.json({ entries: filtered });
    }

    const entries = await db
      .select()
      .from(schema.journalEntries)
      .where(
        and(
          eq(schema.journalEntries.userId, userId),
          gte(schema.journalEntries.date, startDate),
        ),
      )
      .orderBy(desc(schema.journalEntries.date));

    return c.json({ entries });
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    return c.json({ error: "Failed to fetch journal entries" }, 500);
  }
});

// POST /api/journal/entries - Create journal entry
journalRouter.post("/entries", async (c) => {
  try {
    const userId = 1;
    const body = await c.req.json();
    const validated = createEntrySchema.parse(body);

    const entryDate = validated.date ? new Date(validated.date) : new Date();

    if (!db) {
      const newEntry = {
        id: mockJournalIdCounter++,
        userId,
        ...validated,
        date: entryDate.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockJournalEntries.unshift(newEntry);
      return c.json({ entry: newEntry }, 201);
    }

    const newEntry = await db
      .insert(schema.journalEntries)
      .values({
        userId,
        ...validated,
        date: entryDate,
      })
      .returning();

    return c.json({ entry: newEntry[0] }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation error", details: error.errors }, 400);
    }
    console.error("Error creating journal entry:", error);
    return c.json({ error: "Failed to create journal entry" }, 500);
  }
});

// GET /api/journal/entries/:id - Get single entry
journalRouter.get("/entries/:id", async (c) => {
  try {
    const entryId = parseInt(c.req.param("id"));
    const userId = 1;

    if (!db) {
      const entry = mockJournalEntries.find((e) => e.id === entryId);
      if (!entry) return c.json({ error: "Entry not found" }, 404);
      return c.json({ entry });
    }

    const entry = await db
      .select()
      .from(schema.journalEntries)
      .where(
        and(
          eq(schema.journalEntries.id, entryId),
          eq(schema.journalEntries.userId, userId),
        ),
      )
      .limit(1);

    if (!entry.length) {
      return c.json({ error: "Entry not found" }, 404);
    }

    return c.json({ entry: entry[0] });
  } catch (error) {
    console.error("Error fetching journal entry:", error);
    return c.json({ error: "Failed to fetch journal entry" }, 500);
  }
});

// PATCH /api/journal/entries/:id - Update entry
journalRouter.patch("/entries/:id", async (c) => {
  try {
    const entryId = parseInt(c.req.param("id"));
    const userId = 1;
    const body = await c.req.json();

    if (!db) {
      const index = mockJournalEntries.findIndex((e) => e.id === entryId);
      if (index === -1) return c.json({ error: "Entry not found" }, 404);
      mockJournalEntries[index] = {
        ...mockJournalEntries[index],
        ...body,
        updatedAt: new Date().toISOString(),
      };
      return c.json({ entry: mockJournalEntries[index] });
    }

    const updated = await db
      .update(schema.journalEntries)
      .set({ ...body, updatedAt: new Date() })
      .where(
        and(
          eq(schema.journalEntries.id, entryId),
          eq(schema.journalEntries.userId, userId),
        ),
      )
      .returning();

    if (!updated.length) {
      return c.json({ error: "Entry not found" }, 404);
    }

    return c.json({ entry: updated[0] });
  } catch (error) {
    console.error("Error updating journal entry:", error);
    return c.json({ error: "Failed to update journal entry" }, 500);
  }
});

// DELETE /api/journal/entries/:id - Delete entry
journalRouter.delete("/entries/:id", async (c) => {
  try {
    const entryId = parseInt(c.req.param("id"));
    const userId = 1;

    if (!db) {
      const index = mockJournalEntries.findIndex((e) => e.id === entryId);
      if (index === -1) return c.json({ error: "Entry not found" }, 404);
      mockJournalEntries.splice(index, 1);
      return c.json({ message: "Entry deleted successfully" });
    }

    const deleted = await db
      .delete(schema.journalEntries)
      .where(
        and(
          eq(schema.journalEntries.id, entryId),
          eq(schema.journalEntries.userId, userId),
        ),
      )
      .returning();

    if (!deleted.length) {
      return c.json({ error: "Entry not found" }, 404);
    }

    return c.json({ message: "Entry deleted successfully" });
  } catch (error) {
    console.error("Error deleting journal entry:", error);
    return c.json({ error: "Failed to delete journal entry" }, 500);
  }
});

// GET /api/journal/stats - Get journal statistics
journalRouter.get("/stats", async (c) => {
  try {
    const userId = 1;
    const days = parseInt(c.req.query("days") || "30");
    const startDate = subDays(new Date(), days);

    if (!db) {
      const periodEntries = mockJournalEntries.filter(
        (e) => new Date(e.date) >= startDate,
      );

      const avgMood =
        periodEntries.length > 0
          ? periodEntries.reduce((sum, e) => sum + (e.moodScore || 5), 0) /
            periodEntries.length
          : 0;

      const avgEnergy =
        periodEntries.length > 0
          ? periodEntries.reduce((sum, e) => sum + (e.energy || 5), 0) /
            periodEntries.length
          : 0;

      const avgStress =
        periodEntries.length > 0
          ? periodEntries.reduce((sum, e) => sum + (e.stress || 5), 0) /
            periodEntries.length
          : 0;

      const allTags = periodEntries.flatMap((e) => e.tags || []);
      const tagCounts = allTags.reduce(
        (acc, tag) => {
          acc[tag] = (acc[tag] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      const topTags = Object.entries(tagCounts)
        .sort((a, b) => (b[1] as number) - (a[1] as number))
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count: count as number }));

      return c.json({
        totalEntries: periodEntries.length,
        avgMood: Math.round(avgMood * 10) / 10,
        avgEnergy: Math.round(avgEnergy * 10) / 10,
        avgStress: Math.round(avgStress * 10) / 10,
        topTags,
        streak: calculateJournalStreak(mockJournalEntries),
      });
    }

    return c.json({
      totalEntries: 0,
      avgMood: 0,
      avgEnergy: 0,
      avgStress: 0,
      topTags: [],
      streak: 0,
    });
  } catch (error) {
    console.error("Error fetching journal stats:", error);
    return c.json({ error: "Failed to fetch journal stats" }, 500);
  }
});

// Helper: Calculate journal streak
function calculateJournalStreak(entries: any[]): number {
  if (!entries.length) return 0;

  const sortedEntries = [...entries].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < sortedEntries.length; i++) {
    const entryDate = new Date(sortedEntries[i].date);
    entryDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor(
      (today.getTime() - entryDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysDiff === streak) {
      streak++;
    } else if (daysDiff > streak) {
      break;
    }
  }

  return streak;
}

export default journalRouter;
