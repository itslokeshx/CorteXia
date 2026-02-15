import { Router, Response } from "express";
import { connectDB } from "../config/database";
import User from "../models/User";
import { AuthRequest, authMiddleware } from "../middleware/auth";

const router = Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// ─── PATCH /api/user/onboarding ───
// Updates the onboardingCompleted status for the user
router.patch("/onboarding", async (req: AuthRequest, res: Response) => {
    try {
        const { completed } = req.body;

        if (typeof completed !== "boolean") {
            res.status(400).json({ error: "completed (boolean) is required" });
            return;
        }

        await connectDB();

        const user = await User.findByIdAndUpdate(
            req.userId,
            {
                $set: { onboardingCompleted: completed }
            },
            { new: true }
        );

        if (!user) {
            res.status(404).json({ error: "User not found" });
            return;
        }

        res.json({
            success: true,
            onboardingCompleted: user.onboardingCompleted
        });
    } catch (error) {
        console.error("Update onboarding status error:", error);
        res.status(500).json({ error: "Failed to update onboarding status" });
    }
});

export default router;
