"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Sparkles } from "lucide-react";

// ═══════════════════════════════════════════════════════════════
// LOADING MESSAGES
// ═══════════════════════════════════════════════════════════════
const MESSAGES = [
  { icon: "🧠", text: "Initializing CorteXia…" },
  { icon: "📊", text: "Loading your workspace…" },
  { icon: "🎯", text: "Syncing your data…" },
  { icon: "✨", text: "Preparing insights…" },
  { icon: "🚀", text: "Almost ready…" },
];

// ═══════════════════════════════════════════════════════════════
// LOADING SCREEN
// ═══════════════════════════════════════════════════════════════
export function LoadingScreen({
  progress = 0,
  stage,
  onComplete,
}: {
  progress: number;
  stage?: string;
  onComplete?: () => void;
}) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [internalProgress, setInternalProgress] = useState(0);

  // Smooth 5-second 0-100% progress
  useEffect(() => {
    const startTime = Date.now();
    const duration = 5000; // 5 seconds

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min((elapsed / duration) * 100, 100);
      setInternalProgress(newProgress);

      if (newProgress >= 100) {
        clearInterval(interval);
        onComplete?.();
      }
    }, 50);

    return () => clearInterval(interval);
  }, [onComplete]);

  // Cycle through messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const displayProgress = progress || internalProgress;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{
        background: "var(--color-bg-primary)",
      }}
    >
      {/* Subtle ambient glow */}
      <motion.div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          background:
            "radial-gradient(circle at 30% 40%, var(--color-accent-primary) 0%, transparent 50%)",
        }}
        animate={{
          opacity: [0.02, 0.04, 0.02],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      <div className="relative z-10 text-center px-8 max-w-md w-full">
        {/* Brain icon with subtle pulse */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8"
        >
          <motion.div
            animate={{
              scale: [1, 1.03, 1],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="inline-block relative"
          >
            <div
              className="absolute inset-0 blur-2xl opacity-20 scale-150"
              style={{
                background:
                  "radial-gradient(circle, var(--color-accent-primary) 0%, transparent 70%)",
              }}
            />
            <Brain
              className="w-16 h-16 relative z-10"
              style={{ color: "var(--color-text-primary)" }}
              strokeWidth={1.3}
            />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-3xl font-bold mt-4 tracking-tight"
            style={{ color: "var(--color-text-primary)" }}
          >
            CorteXia
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-sm mt-1.5"
            style={{ color: "var(--color-text-tertiary)" }}
          >
            Your Second Brain
          </motion.p>
        </motion.div>

        {/* Rotating message */}
        <div className="h-8 mb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={msgIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="flex items-center justify-center gap-2.5"
            >
              <span className="text-base">{MESSAGES[msgIndex].icon}</span>
              <span
                className="text-sm font-medium"
                style={{ color: "var(--color-text-secondary)" }}
              >
                {MESSAGES[msgIndex].text}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Premium progress bar */}
        <div className="w-full max-w-[320px] mx-auto mb-3">
          <div
            className="h-1.5 rounded-full overflow-hidden backdrop-blur-sm"
            style={{
              background: "var(--color-bg-secondary)",
            }}
          >
            <motion.div
              className="h-full rounded-full relative"
              style={{
                background: "var(--color-accent-primary)",
              }}
              initial={{ width: "0%" }}
              animate={{ width: `${displayProgress}%` }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {/* Subtle shimmer effect */}
              <motion.div
                className="absolute inset-0 opacity-30"
                style={{
                  background:
                    "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
                }}
                animate={{
                  x: ["-100%", "200%"],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          </div>
          <motion.p
            className="text-xs mt-2.5 tabular-nums font-medium"
            style={{ color: "var(--color-text-tertiary)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            {Math.round(displayProgress)}%
          </motion.p>
        </div>

        {/* Sparkle icon */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.3, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Sparkles
            className="w-5 h-5 mx-auto"
            style={{ color: "var(--color-accent-primary)" }}
          />
        </motion.div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// HOOK FOR APP LOADING STATE
// ═══════════════════════════════════════════════════════════════
type LoadingStage = "auth" | "database" | "userData" | "ready";

export function useAppLoading(authReady: boolean, dataReady: boolean) {
  const [stage, setStage] = useState<LoadingStage>("auth");
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const totalDuration = 5000; // 5 seconds total

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const calculatedProgress = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(calculatedProgress);

      // Update stages based on progress
      if (calculatedProgress < 25) {
        setStage("auth");
      } else if (calculatedProgress < 60) {
        setStage("database");
      } else if (calculatedProgress < 95) {
        setStage("userData");
      } else {
        setStage("ready");
      }

      // Done when both ready AND progress is 100%
      if (authReady && dataReady && calculatedProgress >= 100) {
        setDone(true);
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [authReady, dataReady]);

  return { stage, progress, isLoading: !done };
}
