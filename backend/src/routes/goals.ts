import { Router, Response } from "express";
import { connectDB } from "../config/database";
import Goal from "../models/Goal";
import { AuthRequest, authMiddleware } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const goals = await Goal.find({
      userId: req.userId,
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .lean();

    const mapped = goals.map((g: any) => ({
      id: g._id.toString(),
      title: g.title,
      description: g.description,
      category: g.category,
      priority: g.priority,
      targetDate: g.targetDate,
      progress: g.progress,
      status: g.status,
      milestones: g.milestones || [],
      createdAt: g.createdAt?.toISOString?.() || g.createdAt,
      completedAt: g.completedAt,
      level: g.level,
      parentGoalId: g.parentGoalId,
      childGoalIds: g.childGoalIds || [],
      linkedHabitIds: g.linkedHabitIds || [],
      linkedTaskIds: g.linkedTaskIds || [],
      aiRoadmap: g.aiRoadmap,
    }));

    res.json(mapped);
  } catch (error) {
    console.error("GET goals error:", error);
    res.status(500).json({ error: "Failed to fetch goals" });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    console.log("[GOAL POST] Creating goal:", {
      title: req.body.title,
      milestonesCount: req.body.milestones?.length || 0,
      userId: req.userId
    });

    const goal = await Goal.create({
      userId: req.userId,
      ...req.body,
    });

    console.log("[GOAL POST] Goal created successfully:", goal._id.toString());

    const g = goal.toObject();
    res.status(201).json({
      id: g._id.toString(),
      title: g.title,
      description: g.description,
      category: g.category,
      priority: g.priority,
      targetDate: g.targetDate,
      progress: g.progress,
      status: g.status,
      milestones: g.milestones || [],
      createdAt: g.createdAt?.toISOString?.() || g.createdAt,
      completedAt: g.completedAt,
      level: g.level,
      parentGoalId: g.parentGoalId,
      childGoalIds: g.childGoalIds || [],
    });
  } catch (error) {
    console.error("POST goal error:", error);
    res.status(500).json({ error: "Failed to create goal" });
  }
});

router.patch("/", async (req: AuthRequest, res: Response) => {
  try {
    const { id, ...updates } = req.body;
    await connectDB();

    console.log("[GOAL PATCH] Updating goal:", {
      id,
      title: updates.title,
      milestonesCount: updates.milestones?.length || 0,
      userId: req.userId
    });

    const goal = (await Goal.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { $set: updates },
      { new: true },
    ).lean()) as any;

    if (!goal) {
      res.status(404).json({ error: "Goal not found" });
      return;
    }

    console.log("[GOAL PATCH] Goal updated successfully:", goal._id.toString());

    res.json({
      id: goal._id.toString(),
      title: goal.title,
      description: goal.description,
      category: goal.category,
      priority: goal.priority,
      targetDate: goal.targetDate,
      progress: goal.progress,
      status: goal.status,
      milestones: goal.milestones || [],
      createdAt: goal.createdAt?.toISOString?.() || goal.createdAt,
      completedAt: goal.completedAt,
      level: goal.level,
    });
  } catch (error) {
    console.error("PATCH goal error:", error);
    res.status(500).json({ error: "Failed to update goal" });
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

    await Goal.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { $set: { deletedAt: new Date() } },
    );

    res.json({ message: "Goal deleted" });
  } catch (error) {
    console.error("DELETE goal error:", error);
    res.status(500).json({ error: "Failed to delete goal" });
  }
});

export default router;
