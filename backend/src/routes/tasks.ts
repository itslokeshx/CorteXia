import { Router, Response } from "express";
import { connectDB } from "../config/database";
import Task from "../models/Task";
import { AuthRequest, authMiddleware } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

// GET /api/tasks
router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const tasks = await Task.find({
      userId: req.userId,
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .lean();

    const mapped = tasks.map((t: any) => ({
      id: t._id.toString(),
      title: t.title,
      description: t.description,
      domain: t.domain,
      priority: t.priority,
      status: t.status,
      dueDate: t.dueDate,
      dueTime: t.dueTime,
      scheduledFor: t.scheduledFor,
      timeEstimate: t.timeEstimate,
      timeSpent: t.timeSpent,
      completedAt: t.completedAt,
      createdAt: t.createdAt?.toISOString?.() || t.createdAt,
      subtasks: t.subtasks || [],
      tags: t.tags || [],
      linkedGoalId: t.linkedGoalId,
      timeBlockId: t.timeBlockId,
      recurrence: t.recurrence,
    }));

    res.json(mapped);
  } catch (error) {
    console.error("GET tasks error:", error);
    res.status(500).json({ error: "Failed to fetch tasks" });
  }
});

// POST /api/tasks
router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const task = await Task.create({
      userId: req.userId,
      ...req.body,
    });

    const t = task.toObject();
    res.status(201).json({
      id: t._id.toString(),
      title: t.title,
      description: t.description,
      domain: t.domain,
      priority: t.priority,
      status: t.status,
      dueDate: t.dueDate,
      dueTime: t.dueTime,
      scheduledFor: t.scheduledFor,
      timeEstimate: t.timeEstimate,
      timeSpent: t.timeSpent,
      completedAt: t.completedAt,
      createdAt: t.createdAt?.toISOString?.() || t.createdAt,
      subtasks: t.subtasks || [],
      tags: t.tags || [],
      linkedGoalId: t.linkedGoalId,
      recurrence: t.recurrence,
    });
  } catch (error) {
    console.error("POST task error:", error);
    res.status(500).json({ error: "Failed to create task" });
  }
});

// PATCH /api/tasks
router.patch("/", async (req: AuthRequest, res: Response) => {
  try {
    const { id, ...updates } = req.body;
    await connectDB();

    const task = (await Task.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { $set: updates },
      { new: true },
    ).lean()) as any;

    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    res.json({
      id: task._id.toString(),
      title: task.title,
      description: task.description,
      domain: task.domain,
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate,
      dueTime: task.dueTime,
      scheduledFor: task.scheduledFor,
      timeEstimate: task.timeEstimate,
      timeSpent: task.timeSpent,
      completedAt: task.completedAt,
      createdAt: task.createdAt?.toISOString?.() || task.createdAt,
      subtasks: task.subtasks || [],
      tags: task.tags || [],
      linkedGoalId: task.linkedGoalId,
      recurrence: task.recurrence,
    });
  } catch (error) {
    console.error("PATCH task error:", error);
    res.status(500).json({ error: "Failed to update task" });
  }
});

// DELETE /api/tasks?id=xxx
router.delete("/", async (req: AuthRequest, res: Response) => {
  try {
    const id = req.query.id as string;
    if (!id) {
      res.status(400).json({ error: "ID required" });
      return;
    }

    await connectDB();

    await Task.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { $set: { deletedAt: new Date() } },
    );

    res.json({ message: "Task deleted" });
  } catch (error) {
    console.error("DELETE task error:", error);
    res.status(500).json({ error: "Failed to delete task" });
  }
});

export default router;
