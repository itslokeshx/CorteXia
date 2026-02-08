import { Router, Response } from "express";
import { connectDB } from "../config/database";
import UserSettings from "../models/UserSettings";
import { AuthRequest, authMiddleware } from "../middleware/auth";

const router = Router();
router.use(authMiddleware);

router.get("/", async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const doc = (await UserSettings.findOne({
      userId: req.userId,
    }).lean()) as any;

    res.json(doc?.settings || null);
  } catch (error) {
    console.error("GET settings error:", error);
    res.status(500).json({ error: "Failed to fetch settings" });
  }
});

router.put("/", async (req: AuthRequest, res: Response) => {
  try {
    const settings = req.body;
    await connectDB();

    await UserSettings.findOneAndUpdate(
      { userId: req.userId },
      { $set: { settings } },
      { upsert: true, new: true },
    );

    res.json({ message: "Settings saved" });
  } catch (error) {
    console.error("PUT settings error:", error);
    res.status(500).json({ error: "Failed to save settings" });
  }
});

export default router;
