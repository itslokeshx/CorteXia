import { Hono } from "hono";

const usersRouter = new Hono();

// Mock user for development
const mockUser = {
  id: 1,
  uuid: "demo-user-uuid",
  email: "demo@cortexia.app",
  name: "Demo User",
  avatarUrl: null,
  timezone: "America/New_York",
  preferences: {
    theme: "dark" as const,
    weekStartsOn: 1 as const,
    currency: "USD",
    dateFormat: "MM/DD/YYYY",
    timeFormat: "12h" as const,
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// GET /api/users/me - Get current user
usersRouter.get("/me", async (c) => {
  try {
    return c.json({ user: mockUser });
  } catch (error) {
    console.error("Error fetching user:", error);
    return c.json({ error: "Failed to fetch user" }, 500);
  }
});

// PATCH /api/users/me - Update current user
usersRouter.patch("/me", async (c) => {
  try {
    const body = await c.req.json();
    const updatedUser = {
      ...mockUser,
      ...body,
      updatedAt: new Date().toISOString(),
    };
    return c.json({ user: updatedUser });
  } catch (error) {
    console.error("Error updating user:", error);
    return c.json({ error: "Failed to update user" }, 500);
  }
});

// GET /api/users/me/preferences - Get user preferences
usersRouter.get("/me/preferences", async (c) => {
  try {
    return c.json({ preferences: mockUser.preferences });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return c.json({ error: "Failed to fetch preferences" }, 500);
  }
});

// PATCH /api/users/me/preferences - Update user preferences
usersRouter.patch("/me/preferences", async (c) => {
  try {
    const body = await c.req.json();
    mockUser.preferences = { ...mockUser.preferences, ...body };
    return c.json({ preferences: mockUser.preferences });
  } catch (error) {
    console.error("Error updating preferences:", error);
    return c.json({ error: "Failed to update preferences" }, 500);
  }
});

export default usersRouter;
