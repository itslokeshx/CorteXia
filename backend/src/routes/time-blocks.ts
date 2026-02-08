import { Router, Response } from "express";
import { connectDB } from "../config/database";
import TimeBlock from "../models/TimeBlock";
import { AuthRequest, authMiddleware } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const blocks = await TimeBlock.find({
      userId: req.userId,
      deletedAt: null,
    })
      .sort({ date: 1, startTime: 1 })
      .lean();

    const mapped = blocks.map((b: any) => ({
      id: b._id.toString(),
      title: b.title,
      description: b.description,
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      duration: b.duration,
      type: b.type,
      status: b.status,
      linkedTaskId: b.linkedTaskId,
      linkedHabitId: b.linkedHabitId,
      linkedGoalId: b.linkedGoalId,
      color: b.color,
      aiGenerated: b.aiGenerated,
      aiReason: b.aiReason,
      notes: b.notes,
      completed: b.completed,
      createdAt: b.createdAt?.toISOString?.() || b.createdAt,
    }));

    res.json(mapped);
  } catch (error) {
    console.error("GET time-blocks error:", error);
    res.status(500).json({ error: "Failed to fetch time blocks" });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const block = await TimeBlock.create({
      userId: req.userId,
      ...req.body,
    });

    const b = block.toObject();
    res.status(201).json({
      id: b._id.toString(),
      title: b.title,
      description: b.description,
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      duration: b.duration,
      type: b.type,
      status: b.status,
      color: b.color,
      completed: b.completed,
      createdAt: b.createdAt?.toISOString?.() || b.createdAt,
    });
  } catch (error) {
    console.error("POST time-block error:", error);
    res.status(500).json({ error: "Failed to create time block" });
  }
});

router.patch("/", async (req: AuthRequest, res: Response) => {
  try {
    const { id, ...updates } = req.body;
    await connectDB();

    const block = (await TimeBlock.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { $set: updates },
      { new: true },
    ).lean()) as any;

    if (!block) {
      res.status(404).json({ error: "Time block not found" });
      return;
    }

    res.json({
      id: block._id.toString(),
      title: block.title,
      date: block.date,
      startTime: block.startTime,
      endTime: block.endTime,
      type: block.type,
      status: block.status,
      completed: block.completed,
    });
  } catch (error) {
    console.error("PATCH time-block error:", error);
    res.status(500).json({ error: "Failed to update time block" });
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

    await TimeBlock.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { $set: { deletedAt: new Date() } },
    );

    res.json({ message: "Time block deleted" });
  } catch (error) {
    console.error("DELETE time-block error:", error);
    res.status(500).json({ error: "Failed to delete time block" });
  }
});

export default router;
