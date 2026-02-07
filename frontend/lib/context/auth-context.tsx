"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { supabase } from "@/lib/supabase";
import type { User, Session } from "@supabase/supabase-js";

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

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  session: Session | null;
  loading: boolean;
  isAuthenticated: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

// ═══════════════════════════════════════════════════════════════
// CONTEXT
// ═══════════════════════════════════════════════════════════════
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const profileFetched = useRef(false);

  // ─── Fetch user profile ───
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Profile fetch error:", error);
      }
      if (data) {
        setProfile(data as UserProfile);
      }
    } catch (err) {
      console.error("Profile fetch failed:", err);
    }
  }, []);

  // ─── Initialize auth ───
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user && !profileFetched.current) {
        profileFetched.current = true;
        fetchProfile(s.user.id);
      }
      setLoading(false);
    });

    // Listen for changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user && !profileFetched.current) {
        profileFetched.current = true;
        fetchProfile(s.user.id);
      }
      if (!s?.user) {
        setProfile(null);
        profileFetched.current = false;
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  // ─── Sign in with Google ───
  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error("Google sign-in error:", error);
    }
  }, []);

  // ─── Sign out ───
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    profileFetched.current = false;
  }, []);

  // ─── Update profile ───
  const updateProfile = useCallback(
    async (updates: Partial<UserProfile>) => {
      if (!user) return;
      const { error } = await supabase
        .from("user_profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) {
        console.error("Profile update error:", error);
      } else {
        setProfile((prev) => (prev ? { ...prev, ...updates } : null));
      }
    },
    [user],
  );

  // ─── Refresh profile ───
  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  }, [user, fetchProfile]);

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    isAuthenticated: !!user,
    signInWithGoogle,
    signOut,
    updateProfile,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
