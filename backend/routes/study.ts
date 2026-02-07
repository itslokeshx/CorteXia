import { Hono } from "hono";
import { z } from "zod";
import { db, schema } from "../db/client";
import { eq, and, gte, desc } from "drizzle-orm";
import { subDays, startOfWeek } from "date-fns";

const studyRouter = new Hono();

const createSessionSchema = z.object({
  subject: z.string().min(1),
  topic: z.string().optional(),
  duration: z.number().min(1),
  pomodoros: z.number().default(0),
  difficulty: z.enum(["easy", "medium", "hard"]).default("medium"),
  focusQuality: z.number().min(1).max(5).optional(),
  notes: z.string().optional(),
  resources: z.array(z.string()).optional(),
});

// Mock data
let mockStudySessions: any[] = [
  {
    id: 1,
    userId: 1,
    subject: "Machine Learning",
    topic: "Neural Networks",
    durationMinutes: 90,
    pomodoros: 3,
    difficulty: "hard",
    focusQuality: 4,
    startTime: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString(),
    notes: "Covered backpropagation and gradient descent",
    createdAt: new Date().toISOString(),
  },
  {
    id: 2,
    userId: 1,
    subject: "TypeScript",
    topic: "Advanced Types",
    durationMinutes: 60,
    pomodoros: 2,
    difficulty: "medium",
    focusQuality: 5,
    startTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 3,
    userId: 1,
    subject: "System Design",
    topic: "Distributed Systems",
    durationMinutes: 45,
    pomodoros: 1,
    difficulty: "hard",
    focusQuality: 3,
    startTime: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    endTime: new Date(Date.now() - 47.25 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  },
];
let mockStudyIdCounter = 4;

// GET /api/study/sessions - Get study sessions
studyRouter.get("/sessions", async (c) => {
  try {
    const userId = 1;
    const days = parseInt(c.req.query("days") || "30");
    const subject = c.req.query("subject");

    const startDate = subDays(new Date(), days);

    if (!db) {
      let filtered = mockStudySessions.filter(
        (s) => new Date(s.startTime) >= startDate,
      );
      if (subject) {
        filtered = filtered.filter((s) => s.subject === subject);
      }
      return c.json({ sessions: filtered });
    }

    let sessions = await db
      .select()
      .from(schema.studySessions)
      .where(
        and(
          eq(schema.studySessions.userId, userId),
          gte(schema.studySessions.startTime, startDate),
        ),
      )
      .orderBy(desc(schema.studySessions.startTime));

    if (subject) {
      sessions = sessions.filter((s) => s.subject === subject);
    }

    return c.json({ sessions });
  } catch (error) {
    console.error("Error fetching study sessions:", error);
    return c.json({ error: "Failed to fetch study sessions" }, 500);
  }
});

// POST /api/study/sessions - Create study session
studyRouter.post("/sessions", async (c) => {
  try {
    const userId = 1;
    const body = await c.req.json();
    const validated = createSessionSchema.parse(body);

    const startTime = new Date();
    const endTime = new Date(
      startTime.getTime() + validated.duration * 60 * 1000,
    );

    if (!db) {
      const newSession = {
        id: mockStudyIdCounter++,
        userId,
        subject: validated.subject,
        topic: validated.topic,
        durationMinutes: validated.duration,
        pomodoros: validated.pomodoros,
        difficulty: validated.difficulty,
        focusQuality: validated.focusQuality,
        notes: validated.notes,
        resources: validated.resources,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        createdAt: new Date().toISOString(),
      };
      mockStudySessions.unshift(newSession);
      return c.json({ session: newSession }, 201);
    }

    const newSession = await db
      .insert(schema.studySessions)
      .values({
        userId,
        subject: validated.subject,
        topic: validated.topic,
        durationMinutes: validated.duration,
        pomodoros: validated.pomodoros,
        difficulty: validated.difficulty,
        focusQuality: validated.focusQuality,
        notes: validated.notes,
        resources: validated.resources,
        startTime,
        endTime,
      })
      .returning();

    return c.json({ session: newSession[0] }, 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return c.json({ error: "Validation error", details: error.errors }, 400);
    }
    console.error("Error creating study session:", error);
    return c.json({ error: "Failed to create study session" }, 500);
  }
});

// DELETE /api/study/sessions/:id - Delete study session
studyRouter.delete("/sessions/:id", async (c) => {
  try {
    const sessionId = parseInt(c.req.param("id"));
    const userId = 1;

    if (!db) {
      const index = mockStudySessions.findIndex((s) => s.id === sessionId);
      if (index === -1) return c.json({ error: "Session not found" }, 404);
      mockStudySessions.splice(index, 1);
      return c.json({ message: "Session deleted successfully" });
    }

    const deleted = await db
      .delete(schema.studySessions)
      .where(
        and(
          eq(schema.studySessions.id, sessionId),
          eq(schema.studySessions.userId, userId),
        ),
      )
      .returning();

    if (!deleted.length) {
      return c.json({ error: "Session not found" }, 404);
    }

    return c.json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Error deleting study session:", error);
    return c.json({ error: "Failed to delete study session" }, 500);
  }
});

// GET /api/study/stats - Get study statistics
studyRouter.get("/stats", async (c) => {
  try {
    const userId = 1;
    const days = parseInt(c.req.query("days") || "30");
    const startDate = subDays(new Date(), days);

    if (!db) {
      const periodSessions = mockStudySessions.filter(
        (s) => new Date(s.startTime) >= startDate,
      );

      const totalMinutes = periodSessions.reduce(
        (sum, s) => sum + s.durationMinutes,
        0,
      );
      const totalPomodoros = periodSessions.reduce(
        (sum, s) => sum + s.pomodoros,
        0,
      );
      const avgFocusQuality =
        periodSessions.length > 0
          ? periodSessions.reduce((sum, s) => sum + (s.focusQuality || 3), 0) /
            periodSessions.length
          : 0;

      const bySubject = periodSessions.reduce(
        (acc, s) => {
          if (!acc[s.subject]) {
            acc[s.subject] = { minutes: 0, sessions: 0 };
          }
          acc[s.subject].minutes += s.durationMinutes;
          acc[s.subject].sessions += 1;
          return acc;
        },
        {} as Record<string, { minutes: number; sessions: number }>,
      );

      return c.json({
        totalMinutes,
        totalHours: Math.round((totalMinutes / 60) * 10) / 10,
        totalPomodoros,
        avgFocusQuality: Math.round(avgFocusQuality * 10) / 10,
        sessionCount: periodSessions.length,
        bySubject,
      });
    }

    return c.json({
      totalMinutes: 0,
      totalHours: 0,
      totalPomodoros: 0,
      avgFocusQuality: 0,
      sessionCount: 0,
      bySubject: {},
    });
  } catch (error) {
    console.error("Error fetching study stats:", error);
    return c.json({ error: "Failed to fetch study stats" }, 500);
  }
});

export default studyRouter;
