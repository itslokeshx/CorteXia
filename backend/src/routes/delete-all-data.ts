import { Router, Response } from "express";
import { connectDB } from "../config/database";
import Task from "../models/Task";
import Habit from "../models/Habit";
import HabitCompletion from "../models/HabitCompletion";
import Expense from "../models/Expense";
import TimeEntry from "../models/TimeEntry";
import Goal from "../models/Goal";
import StudySession from "../models/StudySession";
import JournalEntry from "../models/JournalEntry";
import UserSettings from "../models/UserSettings";
import AIConversation from "../models/AIConversation";
import UserMemory from "../models/UserMemory";
import TimeBlock from "../models/TimeBlock";
import { AuthRequest, authMiddleware } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

router.delete("/", async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.userId;
    await connectDB();

    await Promise.all([
      Task.deleteMany({ userId }),
      Habit.deleteMany({ userId }),
      HabitCompletion.deleteMany({ userId }),
      Expense.deleteMany({ userId }),
      TimeEntry.deleteMany({ userId }),
      Goal.deleteMany({ userId }),
      StudySession.deleteMany({ userId }),
      JournalEntry.deleteMany({ userId }),
      UserSettings.deleteMany({ userId }),
      AIConversation.deleteMany({ userId }),
      UserMemory.deleteMany({ userId }),
      TimeBlock.deleteMany({ userId }),
    ]);

    res.json({ message: "All data deleted" });
  } catch (error) {
    console.error("DELETE all-data error:", error);
    res.status(500).json({ error: "Failed to delete data" });
  }
});

export default router;
