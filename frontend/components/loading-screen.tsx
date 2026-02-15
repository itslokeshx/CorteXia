"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ═══════════════════════════════════════════════════════════════
   CORTEXIA PRELOADER — Ultra-minimal, premium brand experience
   Single point of loading for the entire app (used in AuthGuard)
   ═══════════════════════════════════════════════════════════════ */

// Generate neural nodes in a brain-like cluster
function generateNodes(count: number) {
  const nodes: { x: number; y: number; delay: number; size: number }[] = [];
  const cx = 100, cy = 100;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const layer = Math.floor(i / 8);
    const radius = 18 + layer * 14 + Math.sin(i * 1.7) * 6;
    nodes.push({
      x: cx + Math.cos(angle + layer * 0.3) * radius,
      y: cy + Math.sin(angle + layer * 0.3) * radius * 0.85,
      delay: i * 0.035,
      size: 1.2 + Math.random() * 1.2,
    });
  }
  return nodes;
}

// Generate connection paths between nearby nodes
function generateConnections(nodes: { x: number; y: number }[]) {
  const conns: { x1: number; y1: number; x2: number; y2: number; d: number }[] = [];
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dx = nodes[j].x - nodes[i].x;
      const dy = nodes[j].y - nodes[i].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 38 && conns.length < 50) {
        conns.push({ x1: nodes[i].x, y1: nodes[i].y, x2: nodes[j].x, y2: nodes[j].y, d: (i + j) * 0.018 });
      }
    }
  }
  return conns;
}

const MESSAGES = [
  "Initializing AI…",
  "Loading workspace…",
  "Syncing data…",
  "Preparing insights…",
  "Almost ready…",
];

export function LoadingScreen({
  progress = 0,
  onComplete,
}: {
  progress?: number;
  stage?: string;
  onComplete?: () => void;
}) {
  const [phase, setPhase] = useState(0);
  const [msgIdx, setMsgIdx] = useState(0);
  const [internalPct, setInternalPct] = useState(0);

  const nodes = useMemo(() => generateNodes(28), []);
  const conns = useMemo(() => generateConnections(nodes), [nodes]);

  // 4-second timeline: nodes → connections → logo → progress → exit
  useEffect(() => {
    const start = Date.now();
    const duration = 4000;

    const tick = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min((elapsed / duration) * 100, 100);
      setInternalPct(pct);

      // Phase progression
      if (elapsed > 400 && phase < 1) setPhase(1);   // connections draw
      if (elapsed > 1000 && phase < 2) setPhase(2);  // logo + progress
      if (elapsed > 3400 && phase < 3) setPhase(3);  // exit

      if (pct >= 100) {
        clearInterval(tick);
        setTimeout(() => onComplete?.(), 500);
      }
    }, 30);

    return () => clearInterval(tick);
  }, [onComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cycle status messages
  useEffect(() => {
    if (phase < 2) return;
    const iv = setInterval(() => setMsgIdx(i => Math.min(i + 1, MESSAGES.length - 1)), 500);
    return () => clearInterval(iv);
  }, [phase]);

  const displayPct = progress || internalPct;

  return (
    <AnimatePresence>
      {phase < 4 && (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center"
          style={{ background: "var(--color-bg-primary)" }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {/* Subtle ambient radial */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.03]"
            style={{
              background: "radial-gradient(circle at 50% 40%, var(--color-accent-primary) 0%, transparent 60%)",
            }}
          />

          {/* Neural brain visualization */}
          <motion.div
            className="relative w-40 h-40 sm:w-48 sm:h-48"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full" fill="none">
              {/* Connections — draw in */}
              {phase >= 1 && conns.map((c, i) => (
                <motion.line
                  key={`c${i}`}
                  x1={c.x1} y1={c.y1} x2={c.x2} y2={c.y2}
                  stroke="var(--color-text-tertiary)"
                  strokeWidth="0.4"
                  strokeOpacity={0.25}
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{
                    pathLength: { duration: 0.7, delay: c.d, ease: "easeOut" },
                    opacity: { duration: 0.2, delay: c.d },
                  }}
                />
              ))}

              {/* Nodes — scale in */}
              {nodes.map((n, i) => (
                <motion.circle
                  key={`n${i}`}
                  cx={n.x} cy={n.y} r={n.size}
                  fill="var(--color-text-secondary)"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 0.6 }}
                  transition={{ duration: 0.4, delay: n.delay, ease: "easeOut" }}
                />
              ))}

              {/* Center pulse */}
              <motion.circle
                cx="100" cy="100" r="3"
                fill="var(--color-accent-primary)"
                initial={{ scale: 0 }}
                animate={{ scale: phase >= 1 ? [0, 1.3, 1] : 0, opacity: phase >= 1 ? 1 : 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />
              {phase >= 1 && (
                <motion.circle
                  cx="100" cy="100" r="10"
                  fill="none"
                  stroke="var(--color-accent-primary)"
                  strokeWidth="0.3"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: [0.5, 2, 2.5], opacity: [0.4, 0.1, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
                />
              )}
            </svg>
          </motion.div>

          {/* Logo */}
          <motion.h1
            className="mt-5 text-2xl sm:text-3xl font-light tracking-[0.08em]"
            style={{ color: "var(--color-text-primary)" }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: phase >= 2 ? 1 : 0, y: phase >= 2 ? 0 : 12 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            CorteXia
          </motion.h1>

          <motion.p
            className="mt-1.5 text-xs"
            style={{ color: "var(--color-text-tertiary)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: phase >= 2 ? 1 : 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            Your Second Brain
          </motion.p>

          {/* Progress bar */}
          <motion.div
            className="mt-8 w-44 sm:w-52"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase >= 2 ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <div
              className="h-[2px] rounded-full overflow-hidden"
              style={{ background: "var(--color-border)" }}
            >
              <motion.div
                className="h-full rounded-full relative"
                style={{ background: "var(--color-accent-primary)" }}
                initial={{ width: "0%" }}
                animate={{ width: `${displayPct}%` }}
                transition={{ duration: 0.15, ease: "linear" }}
              >
                {/* Shimmer */}
                <motion.div
                  className="absolute inset-0 opacity-25"
                  style={{
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
                  }}
                  animate={{ x: ["-100%", "200%"] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>
            </div>
          </motion.div>

          {/* Status text */}
          <div className="mt-4 h-5 overflow-hidden">
            <AnimatePresence mode="wait">
              {phase >= 2 && (
                <motion.p
                  key={msgIdx}
                  className="text-[11px] sm:text-xs text-center"
                  style={{ color: "var(--color-text-tertiary)" }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.2 }}
                >
                  {MESSAGES[msgIdx]}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hook retained for compatibility
type LoadingStage = "auth" | "database" | "userData" | "ready";

export function useAppLoading(authReady: boolean, dataReady: boolean) {
  const [stage, setStage] = useState<LoadingStage>("auth");
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    const totalDuration = 4000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const calculatedProgress = Math.min((elapsed / totalDuration) * 100, 100);
      setProgress(calculatedProgress);

      if (calculatedProgress < 25) setStage("auth");
      else if (calculatedProgress < 60) setStage("database");
      else if (calculatedProgress < 95) setStage("userData");
      else setStage("ready");

      if (authReady && dataReady && calculatedProgress >= 100) {
        setDone(true);
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [authReady, dataReady]);

  return { stage, progress, isLoading: !done };
}
