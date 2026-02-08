import { Router, Response } from "express";
import { connectDB } from "../config/database";
import Expense from "../models/Expense";
import { AuthRequest, authMiddleware } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const expenses = await Expense.find({
      userId: req.userId,
      deletedAt: null,
    })
      .sort({ date: -1 })
      .lean();

    const mapped = expenses.map((e: any) => ({
      id: e._id.toString(),
      category: e.category,
      amount: e.amount,
      description: e.description,
      date: e.date,
      type: e.type,
      createdAt: e.createdAt?.toISOString?.() || e.createdAt,
      tags: e.tags || [],
      linkedGoalId: e.linkedGoalId,
      recurring: e.recurring,
      vendor: e.vendor,
    }));

    res.json(mapped);
  } catch (error) {
    console.error("GET expenses error:", error);
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const expense = await Expense.create({
      userId: req.userId,
      ...req.body,
    });

    const e = expense.toObject();
    res.status(201).json({
      id: e._id.toString(),
      category: e.category,
      amount: e.amount,
      description: e.description,
      date: e.date,
      type: e.type,
      createdAt: e.createdAt?.toISOString?.() || e.createdAt,
      tags: e.tags || [],
      linkedGoalId: e.linkedGoalId,
      recurring: e.recurring,
      vendor: e.vendor,
    });
  } catch (error) {
    console.error("POST expense error:", error);
    res.status(500).json({ error: "Failed to create transaction" });
  }
});

router.patch("/", async (req: AuthRequest, res: Response) => {
  try {
    const { id, ...updates } = req.body;
    await connectDB();

    const expense = (await Expense.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { $set: updates },
      { new: true },
    ).lean()) as any;

    if (!expense) {
      res.status(404).json({ error: "Transaction not found" });
      return;
    }

    res.json({
      id: expense._id.toString(),
      category: expense.category,
      amount: expense.amount,
      description: expense.description,
      date: expense.date,
      type: expense.type,
      createdAt: expense.createdAt?.toISOString?.() || expense.createdAt,
    });
  } catch (error) {
    console.error("PATCH expense error:", error);
    res.status(500).json({ error: "Failed to update transaction" });
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

    await Expense.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { $set: { deletedAt: new Date() } },
    );

    res.json({ message: "Transaction deleted" });
  } catch (error) {
    console.error("DELETE expense error:", error);
    res.status(500).json({ error: "Failed to delete transaction" });
  }
});

export default router;
