import { Router, Response } from "express";
import { connectDB } from "../config/database";
import JournalEntry from "../models/JournalEntry";
import { AuthRequest, authMiddleware } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const entries = await JournalEntry.find({
      userId: req.userId,
    })
      .sort({ date: -1 })
      .lean();

    const mapped = entries.map((e: any) => ({
      id: e._id.toString(),
      date: e.date,
      title: e.title,
      content: e.content,
      mood: e.mood,
      energy: e.energy,
      focus: e.focus,
      stress: e.stress,
      tags: e.tags || [],
      aiSummary: e.aiSummary,
      aiSentiment: e.aiSentiment,
      aiThemes: e.aiThemes || [],
      aiInsights: e.aiInsights,
      createdAt: e.createdAt?.toISOString?.() || e.createdAt,
      linkedGoalIds: e.linkedGoalIds || [],
      linkedHabitIds: e.linkedHabitIds || [],
      linkedTaskIds: e.linkedTaskIds || [],
      gratitudeList: e.gratitudeList || [],
    }));

    res.json(mapped);
  } catch (error) {
    console.error("GET journal error:", error);
    res.status(500).json({ error: "Failed to fetch journal entries" });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const entry = await JournalEntry.create({
      userId: req.userId,
      ...req.body,
    });

    const e = entry.toObject();
    res.status(201).json({
      id: e._id.toString(),
      date: e.date,
      title: e.title,
      content: e.content,
      mood: e.mood,
      energy: e.energy,
      focus: e.focus,
      stress: e.stress,
      tags: e.tags || [],
      aiSummary: e.aiSummary,
      createdAt: e.createdAt?.toISOString?.() || e.createdAt,
    });
  } catch (error) {
    console.error("POST journal error:", error);
    res.status(500).json({ error: "Failed to create journal entry" });
  }
});

router.patch("/", async (req: AuthRequest, res: Response) => {
  try {
    const { id, ...updates } = req.body;
    await connectDB();

    const entry = (await JournalEntry.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { $set: updates },
      { new: true },
    ).lean()) as any;

    if (!entry) {
      res.status(404).json({ error: "Entry not found" });
      return;
    }

    res.json({
      id: entry._id.toString(),
      date: entry.date,
      title: entry.title,
      content: entry.content,
      mood: entry.mood,
      energy: entry.energy,
      focus: entry.focus,
      stress: entry.stress,
      tags: entry.tags || [],
      aiSummary: entry.aiSummary,
      createdAt: entry.createdAt?.toISOString?.() || entry.createdAt,
    });
  } catch (error) {
    console.error("PATCH journal error:", error);
    res.status(500).json({ error: "Failed to update journal entry" });
  }
});

router.delete("/", async (req: AuthRequest, res: Response) => {
  try {
    const id = req.query.id as string;
    if (!id) {
      res.status(400).json({ error: "ID required" });
      return;
    }

    await connectDB();

    await JournalEntry.findOneAndDelete({
      _id: id,
      userId: req.userId,
    });

    res.json({ message: "Journal entry deleted" });
  } catch (error) {
    console.error("DELETE journal error:", error);
    res.status(500).json({ error: "Failed to delete journal entry" });
  }
});

export default router;
