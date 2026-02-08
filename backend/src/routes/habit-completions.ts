import { Router, Response } from "express";
import { connectDB } from "../config/database";
import HabitCompletion from "../models/HabitCompletion";
import { AuthRequest, authMiddleware } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

// POST /api/habit-completions
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    const { habitId, date, completed, note } = req.body;
    await connectDB();

    const completion = (await HabitCompletion.findOneAndUpdate(
      { habitId, userId: req.userId, date },
      {
        $set: { completed, note },
        $setOnInsert: { habitId, userId: req.userId, date },
      },
      { upsert: true, new: true },
    ).lean()) as any;

    res.status(201).json({
      id: completion._id.toString(),
      habitId: completion.habitId.toString(),
      date: completion.date,
      completed: completion.completed,
      note: completion.note,
    });
  } catch (error) {
    console.error("POST habit-completion error:", error);
    res.status(500).json({ error: "Failed to save completion" });
  }
});

// DELETE /api/habit-completions?habitId=xxx&date=yyy
router.delete("/", async (req: AuthRequest, res: Response) => {
  try {
    const habitId = req.query.habitId as string;
    const date = req.query.date as string;

    if (!habitId || !date) {
      res.status(400).json({ error: "habitId and date required" });
      return;
    }

    await connectDB();

    await HabitCompletion.findOneAndDelete({
      habitId,
      userId: req.userId,
      date,
    });

    res.json({ message: "Completion deleted" });
  } catch (error) {
    console.error("DELETE habit-completion error:", error);
    res.status(500).json({ error: "Failed to delete completion" });
  }
});

export default router;
