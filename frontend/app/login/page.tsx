"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Brain, Mail, Lock, Loader2, User } from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// ═══ Google G icon SVG ═══
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt: (callback?: (notification: any) => void) => void;
        };
        oauth2: {
          initTokenClient: (config: any) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

export default function AuthPage() {
  const router = useRouter();
  const {
    isAuthenticated,
    loading,
    signInWithGoogle,
    signInWithCredentials,
    signUpWithCredentials,
  } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [googleReady, setGoogleReady] = useState(false);
  const tokenClientRef = useRef<{ requestAccessToken: () => void } | null>(
    null,
  );

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, loading, router]);

  // Dynamically load Google Identity Services script
  useEffect(() => {
    if (document.getElementById("google-gsi-script")) return;
    const script = document.createElement("script");
    script.id = "google-gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => setGoogleReady(true);
    document.head.appendChild(script);
  }, []);

  // Initialize Google OAuth2 token client when script loads
  useEffect(() => {
    if (!googleReady || !window.google) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    // Use OAuth2 token client — opens a real Google popup, no iframe/origin issues
    tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "email profile",
      callback: async (tokenResponse: any) => {
        if (tokenResponse.error) {
          setError("Google sign in was cancelled");
          setIsGoogleLoading(false);
          return;
        }
        // We got an access token — send it to backend to exchange for user info
        try {
          setIsGoogleLoading(true);
          setError("");
          await signInWithGoogle(tokenResponse.access_token);
          router.push("/");
        } catch (err: any) {
          setError(err.message || "Google sign in failed");
        } finally {
          setIsGoogleLoading(false);
        }
      },
    });
  }, [googleReady, signInWithGoogle, router]);

  // Google button click — just open the OAuth popup
  const handleGoogleClick = useCallback(() => {
    if (tokenClientRef.current) {
      setIsGoogleLoading(true);
      tokenClientRef.current.requestAccessToken();
    }
  }, []);

  const handleCredentialAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (isSignUp) {
        const result = await signUpWithCredentials(email, password, name);
        if (result.error) {
          setError(result.error);
          setIsSubmitting(false);
          return;
        }
        router.push("/");
      } else {
        const result = await signInWithCredentials(email, password);
        if (result.error) {
          setError(result.error);
          setIsSubmitting(false);
          return;
        }
        router.push("/");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--color-bg-primary)" }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Brain
            className="w-8 h-8"
            style={{ color: "var(--color-text-tertiary)" }}
          />
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <div
        className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
        style={{ background: "var(--color-bg-primary)" }}
      >
        {/* Subtle ambient glow */}
        <motion.div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            background:
              "radial-gradient(circle at 30% 50%, var(--color-accent-primary) 0%, transparent 60%)",
          }}
          animate={{ opacity: [0.03, 0.05, 0.03] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-md relative z-10"
        >
          {/* Card */}
          <div
            className="rounded-2xl border backdrop-blur-xl p-8 sm:p-10 text-center"
            style={{
              borderColor: "var(--color-border)",
              background: "var(--color-bg-secondary)",
            }}
          >
            {/* Logo */}
            <div className="mb-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{
                  delay: 0.1,
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="relative inline-block"
              >
                <div
                  className="absolute inset-0 blur-2xl opacity-20 scale-150"
                  style={{
                    background:
                      "radial-gradient(circle, var(--color-accent-primary) 0%, transparent 70%)",
                  }}
                />
                <Brain
                  className="w-14 h-14 mx-auto relative z-10 mb-4"
                  style={{ color: "var(--color-text-primary)" }}
                  strokeWidth={1.3}
                />
              </motion.div>
              <h1
                className="text-3xl font-bold tracking-tight"
                style={{ color: "var(--color-text-primary)" }}
              >
                CorteXia
              </h1>
              <p
                className="text-sm mt-1.5"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                Your Second Brain
              </p>
            </div>

            {/* Value proposition */}
            <p
              className="text-sm mb-8 leading-relaxed"
              style={{ color: "var(--color-text-secondary)" }}
            >
              Organize your life. Achieve your goals.
              <br />
              All in one intelligent system.
            </p>

            {/* Custom Google Sign-In Button */}
            <button
              type="button"
              onClick={handleGoogleClick}
              disabled={isGoogleLoading || !googleReady}
              className="w-full flex items-center justify-center gap-3 rounded-xl border px-5 py-3.5 text-sm font-medium transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mb-6"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-bg-tertiary)",
                color: "var(--color-text-primary)",
              }}
            >
              {isGoogleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <GoogleIcon className="w-5 h-5" />
              )}
              {isGoogleLoading
                ? "Signing in..."
                : isSignUp
                  ? "Sign up with Google"
                  : "Continue with Google"}
            </button>

            {/* OAuth2 token client — no hidden button needed */}

            {/* Divider */}
            <div className="flex items-center gap-3 mb-6">
              <div
                className="flex-1 h-px"
                style={{ background: "var(--color-border)" }}
              />
              <span
                className="text-[11px] uppercase tracking-wider"
                style={{ color: "var(--color-text-tertiary)" }}
              >
                or {isSignUp ? "create account" : "sign in with email"}
              </span>
              <div
                className="flex-1 h-px"
                style={{ background: "var(--color-border)" }}
              />
            </div>

            {/* Email/Password Form */}
            <form onSubmit={handleCredentialAuth} className="space-y-4">
              {isSignUp && (
                <div className="relative">
                  <User
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: "var(--color-text-tertiary)" }}
                  />
                  <Input
                    type="text"
                    placeholder="Full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              )}
              <div className="relative">
                <Mail
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "var(--color-text-tertiary)" }}
                />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <div className="relative">
                <Lock
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: "var(--color-text-tertiary)" }}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                  minLength={6}
                />
              </div>

              {error && (
                <p className="text-xs text-red-400 text-left">{error}</p>
              )}

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full"
                style={{
                  background: "var(--color-accent-primary)",
                  color: "var(--color-bg-primary)",
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isSignUp ? "Creating account..." : "Signing in..."}
                  </>
                ) : isSignUp ? (
                  "Create Account"
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {/* Toggle sign in / sign up */}
            <div className="mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError("");
                }}
                className="text-sm transition-colors hover:opacity-80"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {isSignUp
                  ? "Already have an account? Sign in"
                  : "Don't have an account? Sign up"}
              </button>
            </div>

            {/* Legal */}
            <p
              className="mt-8 text-[10px] leading-relaxed"
              style={{ color: "var(--color-text-tertiary)" }}
            >
              By continuing, you agree to our{" "}
              <span className="underline cursor-pointer hover:opacity-70">
                Terms
              </span>{" "}
              and{" "}
              <span className="underline cursor-pointer hover:opacity-70">
                Privacy Policy
              </span>
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
}
