import { Router, Response } from "express";
import { connectDB } from "../config/database";
import TimeEntry from "../models/TimeEntry";
import { AuthRequest, authMiddleware } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const entries = await TimeEntry.find({
      userId: req.userId,
      deletedAt: null,
    })
      .sort({ date: -1 })
      .lean();

    const mapped = entries.map((e: any) => ({
      id: e._id.toString(),
      task: e.task,
      category: e.category,
      duration: e.duration,
      date: e.date,
      focusQuality: e.focusQuality,
      interruptions: e.interruptions,
      notes: e.notes,
      createdAt: e.createdAt?.toISOString?.() || e.createdAt,
    }));

    res.json(mapped);
  } catch (error) {
    console.error("GET time-entries error:", error);
    res.status(500).json({ error: "Failed to fetch time entries" });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const entry = await TimeEntry.create({
      userId: req.userId,
      ...req.body,
    });

    const e = entry.toObject();
    res.status(201).json({
      id: e._id.toString(),
      task: e.task,
      category: e.category,
      duration: e.duration,
      date: e.date,
      focusQuality: e.focusQuality,
      interruptions: e.interruptions,
      notes: e.notes,
      createdAt: e.createdAt?.toISOString?.() || e.createdAt,
    });
  } catch (error) {
    console.error("POST time-entry error:", error);
    res.status(500).json({ error: "Failed to create time entry" });
  }
});

router.patch("/", async (req: AuthRequest, res: Response) => {
  try {
    const { id, ...updates } = req.body;
    await connectDB();

    const entry = (await TimeEntry.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { $set: updates },
      { new: true },
    ).lean()) as any;

    if (!entry) {
      res.status(404).json({ error: "Time entry not found" });
      return;
    }

    res.json({
      id: entry._id.toString(),
      task: entry.task,
      category: entry.category,
      duration: entry.duration,
      date: entry.date,
      focusQuality: entry.focusQuality,
      interruptions: entry.interruptions,
      notes: entry.notes,
      createdAt: entry.createdAt?.toISOString?.() || entry.createdAt,
    });
  } catch (error) {
    console.error("PATCH time-entry error:", error);
    res.status(500).json({ error: "Failed to update time entry" });
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

    await TimeEntry.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { $set: { deletedAt: new Date() } },
    );

    res.json({ message: "Time entry deleted" });
  } catch (error) {
    console.error("DELETE time-entry error:", error);
    res.status(500).json({ error: "Failed to delete time entry" });
  }
});

export default router;
