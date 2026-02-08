import { Router, Response } from "express";
import { connectDB } from "../config/database";
import StudySession from "../models/StudySession";
import { AuthRequest, authMiddleware } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const sessions = await StudySession.find({
      userId: req.userId,
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .lean();

    const mapped = sessions.map((s: any) => ({
      id: s._id.toString(),
      subject: s.subject,
      topic: s.topic,
      duration: s.duration,
      pomodoros: s.pomodoros,
      difficulty: s.difficulty,
      notes: s.notes,
      startTime: s.startTime,
      endTime: s.endTime,
      retention: s.retention,
      createdAt: s.createdAt?.toISOString?.() || s.createdAt,
    }));

    res.json(mapped);
  } catch (error) {
    console.error("GET study-sessions error:", error);
    res.status(500).json({ error: "Failed to fetch study sessions" });
  }
});

router.post("/", async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const studySession = await StudySession.create({
      userId: req.userId,
      ...req.body,
    });

    const s = studySession.toObject();
    res.status(201).json({
      id: s._id.toString(),
      subject: s.subject,
      topic: s.topic,
      duration: s.duration,
      pomodoros: s.pomodoros,
      difficulty: s.difficulty,
      notes: s.notes,
      startTime: s.startTime,
      endTime: s.endTime,
      createdAt: s.createdAt?.toISOString?.() || s.createdAt,
    });
  } catch (error) {
    console.error("POST study-session error:", error);
    res.status(500).json({ error: "Failed to create study session" });
  }
});

router.patch("/", async (req: AuthRequest, res: Response) => {
  try {
    const { id, ...updates } = req.body;
    await connectDB();

    const studySession = (await StudySession.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { $set: updates },
      { new: true },
    ).lean()) as any;

    if (!studySession) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    res.json({
      id: studySession._id.toString(),
      subject: studySession.subject,
      topic: studySession.topic,
      duration: studySession.duration,
      pomodoros: studySession.pomodoros,
      difficulty: studySession.difficulty,
      createdAt:
        studySession.createdAt?.toISOString?.() || studySession.createdAt,
    });
  } catch (error) {
    console.error("PATCH study-session error:", error);
    res.status(500).json({ error: "Failed to update study session" });
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

    await StudySession.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { $set: { deletedAt: new Date() } },
    );

    res.json({ message: "Study session deleted" });
  } catch (error) {
    console.error("DELETE study-session error:", error);
    res.status(500).json({ error: "Failed to delete study session" });
  }
});

export default router;
