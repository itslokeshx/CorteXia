"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Brain, Mail, Lock, Loader2, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Script from "next/script";

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
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [googleReady, setGoogleReady] = useState(false);
  const tokenClientRef = useRef<{ requestAccessToken: () => void } | null>(null);

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, loading, router]);

  // Initialize Google OAuth2 token client when script loads
  useEffect(() => {
    if (!googleReady || !window.google) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "email profile",
      callback: async (tokenResponse: any) => {
        if (tokenResponse.error) {
          setError("Google sign in was cancelled");
          setIsGoogleLoading(false);
          return;
        }
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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Brain className="w-8 h-8 text-muted-foreground" />
        </motion.div>
      </div>
    );
  }

  return (
    <>
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onLoad={() => setGoogleReady(true)}
      />
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-background">

        {/* Aesthetic Background Pattern */}
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] pointer-events-none" />

        {/* Subtle Ambient Glows - simplified and cleaner */}
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-secondary/10 rounded-full blur-[120px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px] relative z-10"
        >
          <div className="relative group">

            {/* Glassmorphic Glow Border Effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-b from-primary/10 to-transparent rounded-[20px] blur-sm opacity-50 group-hover:opacity-100 transition duration-1000"></div>

            <div className="relative bg-card/80 backdrop-blur-2xl border border-white/5 shadow-2xl rounded-[20px] overflow-hidden p-8 sm:p-10">

              {/* Header section with Logo */}
              <div className="flex flex-col items-center text-center mb-8">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                  className="mb-6 relative"
                >
                  <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full scale-110" />
                  <div className="relative bg-background/50 p-4 rounded-2xl border border-white/10 shadow-inner">
                    <Brain className="w-10 h-10 text-foreground" strokeWidth={1.5} />
                  </div>
                </motion.div>

                <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                  CorteXia
                </h1>
                <p className="text-sm text-muted-foreground mt-2 font-medium tracking-wide">
                  Intelligent Workspace
                </p>
              </div>

              {/* Value Prop / Tagline */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-sm text-center text-muted-foreground/80 mb-8 leading-relaxed font-light"
              >
                {isSignUp ? "Begin your journey to clarity." : "Welcome back to your second brain."}
              </motion.p>

              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleClick}
                disabled={isGoogleLoading || !googleReady}
                className="
                    w-full flex items-center justify-center gap-3 
                    py-3 px-4 rounded-xl 
                    bg-secondary/50 hover:bg-secondary/80 
                    border border-border/50
                    text-foreground font-medium text-sm
                    transition-all duration-200 
                    hover:scale-[1.01] active:scale-[0.99]
                    disabled:opacity-50 disabled:cursor-not-allowed
                    mb-6 shadow-sm
                "
              >
                {isGoogleLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                ) : (
                  <GoogleIcon className="w-5 h-5" />
                )}
                <span>
                  {isGoogleLoading ? "Connecting..." : (isSignUp ? "Sign up with Google" : "Continue with Google")}
                </span>
              </button>

              {/* Divider */}
              <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 h-px bg-border/40"></div>
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-medium">Or email</span>
                <div className="flex-1 h-px bg-border/40"></div>
              </div>

              {/* Form */}
              <form onSubmit={handleCredentialAuth} className="space-y-4">
                <motion.div layout className="space-y-4">
                  {isSignUp && (
                    <div className="relative group/input">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                      <Input
                        type="text"
                        placeholder="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10 h-11 bg-background/50 border-white/5 focus:border-primary/50 transition-all rounded-xl"
                        required
                      />
                    </div>
                  )}
                  <div className="relative group/input">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                    <Input
                      type="email"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-11 bg-background/50 border-white/5 focus:border-primary/50 transition-all rounded-xl"
                      required
                    />
                  </div>

                  {/* Password Field with Show/Hide Toggle */}
                  <div className="relative group/input">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-11 bg-background/50 border-white/5 focus:border-primary/50 transition-all rounded-xl"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </motion.div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                    className="text-xs text-red-400 text-center font-medium bg-red-500/10 py-2 rounded-lg"
                  >
                    {error}
                  </motion.p>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all duration-300"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span className="flex items-center gap-2">
                      {isSignUp ? "Create Account" : "Sign In"}
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>
              </form>

              {/* Footer */}
              <div className="mt-8 text-center space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError("");
                  }}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
                >
                  {isSignUp ? "Already have an account? Sign in" : "New to CorteXia? Create account"}
                </button>

                <p className="text-[10px] text-muted-foreground/60 leading-relaxed max-w-[280px] mx-auto">
                  By continuing, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
}
