"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useState,
  useEffect,
} from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  timezone: string;
  theme: "light" | "dark" | "auto";
  notification_preferences: Record<string, boolean>;
  onboarding_completed: boolean;
  last_active_at: string;
  created_at: string;
  updated_at: string;
}

interface AuthUser {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  session: any;
  loading: boolean;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  signInWithGoogle: (credential: string) => Promise<void>;
  signInWithCredentials: (
    email: string,
    password: string,
  ) => Promise<{ error?: string }>;
  signUpWithCredentials: (
    email: string,
    password: string,
    name: string,
  ) => Promise<{ error?: string }>;
  signInAsDemo: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  getToken: () => string | null;
}

// ═══════════════════════════════════════════════════════════════
// TOKEN HELPERS
// ═══════════════════════════════════════════════════════════════
function saveAuth(token: string, user: AuthUser) {
  localStorage.setItem("cortexia_token", token);
  localStorage.setItem("cortexia_user", JSON.stringify(user));
}

function loadAuth(): { token: string | null; user: AuthUser | null } {
  if (typeof window === "undefined") return { token: null, user: null };
  const token = localStorage.getItem("cortexia_token");
  const userStr = localStorage.getItem("cortexia_user");
  const user = userStr ? JSON.parse(userStr) : null;
  return { token, user };
}

function clearAuth() {
  localStorage.removeItem("cortexia_token");
  localStorage.removeItem("cortexia_user");
}

// ═══════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const { token, user: savedUser } = loadAuth();
    if (token && savedUser) {
      fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error("Token invalid");
        })
        .then((data) => {
          setUser(data);
          saveAuth(token, data);
        })
        .catch(() => {
          clearAuth();
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const profile: UserProfile | null = user
    ? {
        id: user.id,
        email: user.email || "",
        full_name: user.name || null,
        avatar_url: user.image || null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        theme: "dark",
        notification_preferences: {},
        onboarding_completed: true,
        last_active_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    : null;

  const isDemoMode = false;

  const getToken = useCallback(() => {
    return localStorage.getItem("cortexia_token");
  }, []);

  const signInWithGoogle = useCallback(async (credential: string) => {
    const res = await fetch(`${API_URL}/api/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Google sign in failed");

    saveAuth(data.token, data.user);
    setUser(data.user);
  }, []);

  const signInWithCredentials = useCallback(
    async (email: string, password: string) => {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) return { error: data.error || "Login failed" };

      saveAuth(data.token, data.user);
      setUser(data.user);
      return {};
    },
    [],
  );

  const signUpWithCredentials = useCallback(
    async (email: string, password: string, name: string) => {
      const res = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();
      if (!res.ok) return { error: data.error || "Signup failed" };

      saveAuth(data.token, data.user);
      setUser(data.user);
      return {};
    },
    [],
  );

  const signInAsDemo = useCallback(async () => {
    console.warn("Demo mode not available.");
  }, []);

  const handleSignOut = useCallback(async () => {
    clearAuth();
    setUser(null);
    window.location.href = "/login";
  }, []);

  const updateProfile = useCallback(async (_updates: Partial<UserProfile>) => {
    // Profile updates go through settings API
  }, []);

  const refreshProfile = useCallback(async () => {
    const token = localStorage.getItem("cortexia_token");
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
        saveAuth(token, data);
      }
    } catch {
      // Ignore
    }
  }, []);

  const value: AuthContextType = {
    user,
    profile,
    session: user ? { user } : null,
    loading,
    isAuthenticated: !!user,
    isDemoMode,
    signInWithGoogle,
    signInWithCredentials,
    signUpWithCredentials,
    signInAsDemo,
    signOut: handleSignOut,
    updateProfile,
    refreshProfile,
    getToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
