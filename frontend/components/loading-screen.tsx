"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain } from "lucide-react";

// ═══════════════════════════════════════════════════════════════
// LOADING MESSAGES
// ═══════════════════════════════════════════════════════════════
const MESSAGES = [
  { icon: "🧠", text: "Your second brain is waking up…" },
  { icon: "📊", text: "Analyzing your life patterns…" },
  { icon: "🎯", text: "Organizing your goals…" },
  { icon: "✨", text: "Preparing personalized insights…" },
  { icon: "🔄", text: "Syncing your universe…" },
  { icon: "💡", text: "Building your clarity…" },
];

const SUBTEXTS = [
  "Every great day starts with clarity.",
  "You're about to see your life from a new perspective.",
  "Organizing chaos into progress…",
  "Your future self will thank you.",
];

// ═══════════════════════════════════════════════════════════════
// PARTICLE BACKGROUND
// ═══════════════════════════════════════════════════════════════
function ParticleField() {
  const particles = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        id: i,
        sx: Math.random() * 100,
        sy: Math.random() * 100,
        ex: (i % 8) * 12.5 + 6.25,
        ey: Math.floor(i / 8) * 20 + 10,
        size: 2 + Math.random() * 3,
      })),
    [],
  );

  return (
    <div className="absolute inset-0 overflow-hidden opacity-20 pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-[var(--color-text-tertiary)]"
          style={{ width: p.size, height: p.size }}
          initial={{
            left: `${p.sx}%`,
            top: `${p.sy}%`,
            scale: 0,
            opacity: 0,
          }}
          animate={{
            left: `${p.ex}%`,
            top: `${p.ey}%`,
            scale: 1,
            opacity: 0.5,
          }}
          transition={{
            duration: 2.5,
            delay: p.id * 0.04,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// LOADING SCREEN
// ═══════════════════════════════════════════════════════════════
export function LoadingScreen({
  progress = 0,
  stage,
}: {
  progress: number;
  stage?: string;
}) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [subtext] = useState(
    () => SUBTEXTS[Math.floor(Math.random() * SUBTEXTS.length)],
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % MESSAGES.length);
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[var(--color-bg-primary)]">
      <ParticleField />

      <div className="relative z-10 text-center px-8 max-w-md w-full">
        {/* Brain icon */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8"
        >
          <motion.div
            animate={{
              scale: [1, 1.04, 1],
              rotate: [0, 3, -3, 0],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="inline-block"
          >
            <Brain
              className="w-16 h-16 text-[var(--color-text-primary)]"
              strokeWidth={1.2}
            />
          </motion.div>

          <h1 className="text-2xl font-semibold text-[var(--color-text-primary)] mt-5 tracking-tight">
            CorteXia
          </h1>
        </motion.div>

        {/* Rotating message */}
        <div className="h-8 mb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={msgIndex}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="flex items-center justify-center gap-2"
            >
              <span className="text-lg">{MESSAGES[msgIndex].icon}</span>
              <span className="text-sm text-[var(--color-text-secondary)]">
                {MESSAGES[msgIndex].text}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Progress bar */}
        <div className="w-full max-w-xs mx-auto mb-3">
          <div className="h-1.5 bg-[var(--color-bg-tertiary)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[var(--color-text-primary)] rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <motion.p
            className="text-[11px] text-[var(--color-text-tertiary)] mt-2 tabular-nums"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {progress}%
          </motion.p>
        </div>

        {/* Subtext */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-[12px] italic text-[var(--color-text-tertiary)] mt-6"
        >
          "{subtext}"
        </motion.p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// LOADING HOOK
// ═══════════════════════════════════════════════════════════════
type LoadingStage = "auth" | "database" | "userData" | "ready";

export function useAppLoading(authReady: boolean, dataReady: boolean) {
  const [stage, setStage] = useState<LoadingStage>("auth");
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Stage 1: auth check → 0-40%
    if (!authReady) {
      setStage("auth");
      const t = setTimeout(() => setProgress(20), 200);
      return () => clearTimeout(t);
    }

    // Stage 2: auth done → 40-70%
    setProgress(40);
    setStage("database");

    const t1 = setTimeout(() => setProgress(60), 300);

    // Stage 3: data → 70-100%
    if (dataReady) {
      const t2 = setTimeout(() => {
        setProgress(85);
        setStage("userData");
      }, 400);

      const t3 = setTimeout(() => {
        setProgress(100);
        setStage("ready");
      }, 700);

      const t4 = setTimeout(() => setDone(true), 1100);

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
        clearTimeout(t4);
      };
    }

    return () => clearTimeout(t1);
  }, [authReady, dataReady]);

  return { stage, progress, isLoading: !done };
}
