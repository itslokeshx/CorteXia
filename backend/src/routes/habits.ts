import { Router, Response } from "express";
import { connectDB } from "../config/database";
import Habit from "../models/Habit";
import HabitCompletion from "../models/HabitCompletion";
import { AuthRequest, authMiddleware } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

// GET /api/habits
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const habits = await Habit.find({
      userId: req.userId,
      deletedAt: null,
    }).lean();

    const habitIds = habits.map((h: any) => h._id);
    const completions = await HabitCompletion.find({
      habitId: { $in: habitIds },
      userId: req.userId,
    })
      .sort({ date: -1 })
      .lean();

    const completionsByHabit = new Map<
      string,
      Array<{ date: string; completed: boolean; note?: string }>
    >();
    for (const c of completions as any[]) {
      const hid = c.habitId.toString();
      if (!completionsByHabit.has(hid)) completionsByHabit.set(hid, []);
      completionsByHabit.get(hid)!.push({
        date: c.date,
        completed: c.completed,
        note: c.note,
      });
    }

    const mapped = habits.map((h: any) => ({
      id: h._id.toString(),
      name: h.name,
      description: h.description,
      category: h.category,
      frequency: h.frequency,
      customDays: h.customDays,
      color: h.color,
      streak: h.streak || 0,
      longestStreak: h.longestStreak || 0,
      active: h.active,
      targetDaysPerWeek: h.targetDaysPerWeek,
      createdAt: h.createdAt?.toISOString?.() || h.createdAt,
      completions: completionsByHabit.get(h._id.toString()) || [],
      linkedGoalIds: h.linkedGoalIds || [],
      targetTime: h.targetTime,
      duration: h.duration,
    }));

    res.json(mapped);
  } catch (error) {
    console.error("GET habits error:", error);
    res.status(500).json({ error: "Failed to fetch habits" });
  }
});

// POST /api/habits
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const habit = await Habit.create({
      userId: req.userId,
      ...req.body,
    });

    const h = habit.toObject();
    res.status(201).json({
      id: h._id.toString(),
      name: h.name,
      description: h.description,
      category: h.category,
      frequency: h.frequency,
      customDays: h.customDays,
      color: h.color,
      streak: h.streak || 0,
      longestStreak: h.longestStreak || 0,
      active: h.active,
      targetDaysPerWeek: h.targetDaysPerWeek,
      createdAt: h.createdAt?.toISOString?.() || h.createdAt,
      completions: [],
      linkedGoalIds: h.linkedGoalIds || [],
      targetTime: h.targetTime,
      duration: h.duration,
    });
  } catch (error) {
    console.error("POST habit error:", error);
    res.status(500).json({ error: "Failed to create habit" });
  }
});

// PATCH /api/habits
router.patch("/", async (req: AuthRequest, res: Response) => {
  try {
    const { id, ...updates } = req.body;
    await connectDB();

    const habit = (await Habit.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { $set: updates },
      { new: true },
    ).lean()) as any;

    if (!habit) {
      res.status(404).json({ error: "Habit not found" });
      return;
    }

    res.json({
      id: habit._id.toString(),
      name: habit.name,
      description: habit.description,
      category: habit.category,
      frequency: habit.frequency,
      customDays: habit.customDays,
      color: habit.color,
      streak: habit.streak || 0,
      longestStreak: habit.longestStreak || 0,
      active: habit.active,
      createdAt: habit.createdAt?.toISOString?.() || habit.createdAt,
    });
  } catch (error) {
    console.error("PATCH habit error:", error);
    res.status(500).json({ error: "Failed to update habit" });
  }
});

// DELETE /api/habits?id=xxx
router.delete("/", async (req: AuthRequest, res: Response) => {
  try {
    const id = req.query.id as string;
    if (!id) {
      res.status(400).json({ error: "ID required" });
      return;
    }

    await connectDB();

    await Habit.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { $set: { deletedAt: new Date() } },
    );

    res.json({ message: "Habit deleted" });
  } catch (error) {
    console.error("DELETE habit error:", error);
    res.status(500).json({ error: "Failed to delete habit" });
  }
});

export default router;
