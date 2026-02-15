import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { connectDB } from "../config/database";
import User from "../models/User";
import { AuthRequest, authMiddleware, signToken } from "../middleware/auth";

const router = Router();

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─── POST /api/auth/signup ───
router.post("/signup", async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters" });
      return;
    }

    await connectDB();

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      res.status(400).json({ error: "Email already registered" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      email: email.toLowerCase(),
      name: name || email.split("@")[0],
      password: hashedPassword,
      provider: "credentials",
    });

    const token = signToken({
      id: user._id.toString(),
      email: user.email,
    });

    res.status(201).json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        image: user.image || null,
        onboardingCompleted: user.onboardingCompleted || false,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/auth/login ───
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: "Email and password required" });
      return;
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user || !user.password) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ error: "Invalid credentials" });
      return;
    }

    const token = signToken({
      id: user._id.toString(),
      email: user.email,
    });

    res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        image: user.image || null,
        onboardingCompleted: user.onboardingCompleted || false,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── POST /api/auth/google ───
// Accepts either { credential } (ID token from GSI) OR { access_token } (from OAuth2 token client)
router.post("/google", async (req: Request, res: Response) => {
  try {
    const { credential, access_token } = req.body;

    let email: string | undefined;
    let name: string | undefined;
    let picture: string | undefined;

    if (access_token) {
      // OAuth2 implicit flow — exchange access_token for user info
      const userInfoRes = await fetch(
        "https://www.googleapis.com/oauth2/v3/userinfo",
        { headers: { Authorization: `Bearer ${access_token}` } },
      );
      if (!userInfoRes.ok) {
        res.status(401).json({ error: "Invalid Google access token" });
        return;
      }
      const userInfo = (await userInfoRes.json()) as {
        email?: string;
        name?: string;
        picture?: string;
      };
      email = userInfo.email;
      name = userInfo.name;
      picture = userInfo.picture;
    } else if (credential) {
      // Classic GSI ID token flow
      const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      email = payload?.email;
      name = payload?.name;
      picture = payload?.picture;
    } else {
      res
        .status(400)
        .json({ error: "Google credential or access_token required" });
      return;
    }

    if (!email) {
      res.status(400).json({ error: "Could not get email from Google" });
      return;
    }

    await connectDB();

    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      user = await User.create({
        email: email.toLowerCase(),
        name: name || email.split("@")[0],
        image: picture || null,
        provider: "google",
        emailVerified: new Date(),
      });
    }

    const token = signToken({
      id: user._id.toString(),
      email: user.email,
    });

    res.json({
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        image: user.image || null,
        onboardingCompleted: user.onboardingCompleted || false,
      },
    });
  } catch (error) {
    console.error("Google auth error:", error);
    res.status(500).json({ error: "Google authentication failed" });
  }
});

// ─── GET /api/auth/me ───
router.get("/me", authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await connectDB();

    const user = (await User.findById(req.userId).lean()) as any;
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    res.json({
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      image: user.image || null,
      onboardingCompleted: user.onboardingCompleted || false,
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
