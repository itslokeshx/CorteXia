import { Hono } from "hono";
import { z } from "zod";
import { db, schema } from "../db/client";
import { eq, and, gte, desc } from "drizzle-orm";
import { format, subDays } from "date-fns";

const habitsRouter = new Hono();

const createHabitSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  icon: z.string().default("circle"),
  color: z.string().default("#3B82F6"),
  category: z
    .enum([
      "health",
      "productivity",
      "learning",
      "fitness",
      "mindfulness",
      "social",
    ])
    .default("health"),
  frequency: z.enum(["daily", "weekly", "custom"]).default("daily"),
  targetDaysPerWeek: z.number().min(1).max(7).default(7),
  targetCount: z.number().default(1),
  unit: z.string().optional(),
  reminderTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
});

// In-memory storage for development
let mockHabits: any[] = [
  {
    id: 1,
    userId: 1,
    name: "Morning Gym",
    description: "1 hour workout at gym",
    icon: "dumbbell",
    color: "#F97316",
    category: "fitness",
    frequency: "daily",
    targetCount: 1,
    reminderTime: "07:00",
    streak: 12,
    longestStreak: 30,
    isActive: true,
    createdAt: new Date().toISOString(),
    completions: [],
  },
  {
    id: 2,
    userId: 1,
    name: "Meditation",
    description: "10 minutes mindfulness practice",
    icon: "brain",
    color: "#8B5CF6",
    category: "mindfulness",
    frequency: "daily",
    targetCount: 1,
    reminderTime: "06:30",
    streak: 5,
    longestStreak: 21,
    isActive: true,
    createdAt: new Date().toISOString(),
    completions: [],
  },
  {
    id: 3,
    userId: 1,
    name: "Read 10 Pages",
    description: "Daily reading habit",
    icon: "book-open",
    color: "#3B82F6",
    category: "learning",
    frequency: "daily",
    targetCount: 10,
    unit: "pages",
    reminderTime: "21:00",
    streak: 8,
    longestStreak: 45,
    isActive: true,
    createdAt: new Date().toISOString(),
    completions: [],
  },
  {
    id: 4,
    userId: 1,
    name: "Drink Water",
    description: "Stay hydrated",
    icon: "droplet",
    color: "#06B6D4",
    category: "health",
    frequency: "daily",
    targetCount: 8,
    unit: "glasses",
    streak: 3,
    longestStreak: 14,
    isActive: true,
    createdAt: new Date().toISOString(),
    completions: [],
  },
];
let mockHabitIdCounter = 5;

let mockHabitLogs: any[] = [];
let mockHabitLogIdCounter = 1;

// GET /api/habits - Get all habits
habitsRouter.get("/", async (c) => {
  try {
    const userId = 1;
    const includeInactive = c.req.query("includeInactive") === "true";

    if (!db) {
      let filtered = [...mockHabits];
      if (!includeInactive) {
        filtered = filtered.filter((h) => h.isActive);
      }
      return c.json({ habits: filtered });
    }

    let query = db
      .select()
      .from(schema.habits)
      .where(eq(schema.habits.userId, userId));

    if (!includeInactive) {
      query = db
        .select()
        .from(schema.habits)
        .where(
          and(
            eq(schema.habits.userId, userId),
            eq(schema.habits.isActive, true),
          ),
        );
    }

    const allHabits = await query.orderBy(desc(schema.habits.createdAt));
    return c.json({ habits: allHabits });
  } catch (error) {
    console.error("Error fetching habits:", error);
    return c.json({ error: "Failed to fetch habits" }, 500);
  }
});

// POST /api/habits - Create new habit
habitsRouter.post("/", async (c) => {
  try {
    const userId = 1;
    const body = await c.req.json();
    const validated = createHabitSchema.parse(body);

    if (!db) {
      const newHabit = {
        id: mockHabitIdCounter++,
        userId,
        ...validated,
        streak: 0,
        longestStreak: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        completions: [],
      };
      mockHabits.unshift(newHabit);
      return c.json({ habit: newHabit }, 201);
    }

    const newHabit = await db
      .insert(schema.habits)
      .values({
        userId,
        ...validated,
      })
      .returning();

    return c.json({ habit: newHabit[0] }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation error", details: error.errors }, 400);
    }
    console.error("Error creating habit:", error);
    return c.json({ error: "Failed to create habit" }, 500);
  }
});

// GET /api/habits/:id - Get single habit
habitsRouter.get("/:id", async (c) => {
  try {
    const habitId = parseInt(c.req.param("id"));
    const userId = 1;

    if (!db) {
      const habit = mockHabits.find((h) => h.id === habitId);
      if (!habit) return c.json({ error: "Habit not found" }, 404);
      return c.json({ habit });
    }

    const habit = await db
      .select()
      .from(schema.habits)
      .where(
        and(eq(schema.habits.id, habitId), eq(schema.habits.userId, userId)),
      )
      .limit(1);

    if (!habit.length) {
      return c.json({ error: "Habit not found" }, 404);
    }

    return c.json({ habit: habit[0] });
  } catch (error) {
    console.error("Error fetching habit:", error);
    return c.json({ error: "Failed to fetch habit" }, 500);
  }
});

// PATCH /api/habits/:id - Update habit
habitsRouter.patch("/:id", async (c) => {
  try {
    const habitId = parseInt(c.req.param("id"));
    const userId = 1;
    const body = await c.req.json();

    if (!db) {
      const index = mockHabits.findIndex((h) => h.id === habitId);
      if (index === -1) return c.json({ error: "Habit not found" }, 404);
      mockHabits[index] = { ...mockHabits[index], ...body };
      return c.json({ habit: mockHabits[index] });
    }

    const updated = await db
      .update(schema.habits)
      .set({ ...body, updatedAt: new Date() })
      .where(
        and(eq(schema.habits.id, habitId), eq(schema.habits.userId, userId)),
      )
      .returning();

    if (!updated.length) {
      return c.json({ error: "Habit not found" }, 404);
    }

    return c.json({ habit: updated[0] });
  } catch (error) {
    console.error("Error updating habit:", error);
    return c.json({ error: "Failed to update habit" }, 500);
  }
});

// DELETE /api/habits/:id - Delete habit
habitsRouter.delete("/:id", async (c) => {
  try {
    const habitId = parseInt(c.req.param("id"));
    const userId = 1;

    if (!db) {
      const index = mockHabits.findIndex((h) => h.id === habitId);
      if (index === -1) return c.json({ error: "Habit not found" }, 404);
      mockHabits.splice(index, 1);
      return c.json({ message: "Habit deleted successfully" });
    }

    const deleted = await db
      .delete(schema.habits)
      .where(
        and(eq(schema.habits.id, habitId), eq(schema.habits.userId, userId)),
      )
      .returning();

    if (!deleted.length) {
      return c.json({ error: "Habit not found" }, 404);
    }

    return c.json({ message: "Habit deleted successfully" });
  } catch (error) {
    console.error("Error deleting habit:", error);
    return c.json({ error: "Failed to delete habit" }, 500);
  }
});

// GET /api/habits/:id/logs - Get habit check-in history
habitsRouter.get("/:id/logs", async (c) => {
  try {
    const habitId = parseInt(c.req.param("id"));
    const userId = 1;
    const days = parseInt(c.req.query("days") || "90");

    const startDate = format(subDays(new Date(), days), "yyyy-MM-dd");

    if (!db) {
      const logs = mockHabitLogs.filter(
        (l) => l.habitId === habitId && l.date >= startDate,
      );
      return c.json({ logs });
    }

    const logs = await db
      .select()
      .from(schema.habitLogs)
      .where(
        and(
          eq(schema.habitLogs.habitId, habitId),
          eq(schema.habitLogs.userId, userId),
          gte(schema.habitLogs.date, startDate),
        ),
      )
      .orderBy(desc(schema.habitLogs.date));

    return c.json({ logs });
  } catch (error) {
    console.error("Error fetching habit logs:", error);
    return c.json({ error: "Failed to fetch habit logs" }, 500);
  }
});

// POST /api/habits/:id/check-in - Check in habit for today
habitsRouter.post("/:id/check-in", async (c) => {
  try {
    const habitId = parseInt(c.req.param("id"));
    const userId = 1;
    const body = await c.req.json();

    const today = format(new Date(), "yyyy-MM-dd");

    if (!db) {
      // Mock mode - find existing log
      const existingIndex = mockHabitLogs.findIndex(
        (l) => l.habitId === habitId && l.date === today,
      );

      let log;
      if (existingIndex >= 0) {
        // Update existing
        mockHabitLogs[existingIndex] = {
          ...mockHabitLogs[existingIndex],
          completed: body.completed ?? true,
          count: body.count ?? 1,
          quality: body.quality,
          notes: body.notes,
        };
        log = mockHabitLogs[existingIndex];
      } else {
        // Create new
        log = {
          id: mockHabitLogIdCounter++,
          habitId,
          userId,
          date: today,
          completed: body.completed ?? true,
          count: body.count ?? 1,
          quality: body.quality,
          notes: body.notes,
          checkedInAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };
        mockHabitLogs.push(log);
      }

      // Update habit streak
      const habit = mockHabits.find((h) => h.id === habitId);
      if (habit && log.completed) {
        habit.streak = (habit.streak || 0) + 1;
        if (habit.streak > (habit.longestStreak || 0)) {
          habit.longestStreak = habit.streak;
        }
      }

      const streak = habit?.streak || 0;
      return c.json({ log, streak });
    }

    // Check if already checked in today
    const existing = await db
      .select()
      .from(schema.habitLogs)
      .where(
        and(
          eq(schema.habitLogs.habitId, habitId),
          eq(schema.habitLogs.userId, userId),
          eq(schema.habitLogs.date, today),
        ),
      )
      .limit(1);

    let log;

    if (existing.length) {
      // Update existing
      log = await db
        .update(schema.habitLogs)
        .set({
          completed: body.completed ?? true,
          count: body.count ?? 1,
          quality: body.quality,
          notes: body.notes,
          photoUrl: body.photoUrl,
        })
        .where(eq(schema.habitLogs.id, existing[0].id))
        .returning();
    } else {
      // Create new
      log = await db
        .insert(schema.habitLogs)
        .values({
          habitId,
          userId,
          date: today,
          completed: body.completed ?? true,
          count: body.count ?? 1,
          quality: body.quality,
          notes: body.notes,
          photoUrl: body.photoUrl,
        })
        .returning();
    }

    // Calculate streak
    const streak = await calculateStreak(habitId, userId);

    return c.json({ log: log[0], streak });
  } catch (error) {
    console.error("Error checking in habit:", error);
    return c.json({ error: "Failed to check in habit" }, 500);
  }
});

// Helper: Calculate current streak
async function calculateStreak(
  habitId: number,
  userId: number,
): Promise<number> {
  if (!db) return 0;

  const logs = await db
    .select()
    .from(schema.habitLogs)
    .where(
      and(
        eq(schema.habitLogs.habitId, habitId),
        eq(schema.habitLogs.userId, userId),
        eq(schema.habitLogs.completed, true),
      ),
    )
    .orderBy(desc(schema.habitLogs.date))
    .limit(365);

  if (!logs.length) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const log of logs) {
    const logDate = new Date(log.date);
    logDate.setHours(0, 0, 0, 0);
    const daysDiff = Math.floor(
      (today.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (daysDiff === streak) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// GET /api/habits/stats - Get habit statistics
habitsRouter.get("/stats/summary", async (c) => {
  try {
    const userId = 1;
    const today = format(new Date(), "yyyy-MM-dd");

    if (!db) {
      const total = mockHabits.filter((h) => h.isActive).length;
      const todayLogs = mockHabitLogs.filter(
        (l) => l.date === today && l.completed,
      );
      return c.json({
        total,
        completedToday: todayLogs.length,
        avgStreak:
          mockHabits.reduce((sum, h) => sum + (h.streak || 0), 0) /
          Math.max(total, 1),
        longestStreak: Math.max(...mockHabits.map((h) => h.longestStreak || 0)),
      });
    }

    // Real implementation would query DB
    return c.json({
      total: 0,
      completedToday: 0,
      avgStreak: 0,
      longestStreak: 0,
    });
  } catch (error) {
    console.error("Error fetching habit stats:", error);
    return c.json({ error: "Failed to fetch habit stats" }, 500);
  }
});

export default habitsRouter;
