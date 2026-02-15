"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain } from "lucide-react";

/* ═══════════════════════════════════════════════════════════════
   CORTEXIA PRELOADER — The "Steve Jobs" Standard
   Radical reduction. Essence only. 
   Pure breathing symbol + refined typography.
   ═══════════════════════════════════════════════════════════════ */

export function LoadingScreen({ onComplete }: { onComplete?: () => void }) {
  const [exit, setExit] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // 3.5 seconds to reach 100%
    const duration = 3500;
    const startTime = Date.now();

    const updateProgress = () => {
      const elapsed = Date.now() - startTime;
      const rawProgress = Math.min(elapsed / duration, 1);

      // Smooth easing (easeOutQuart)
      const easedProgress = 1 - Math.pow(1 - rawProgress, 4);

      setProgress(easedProgress * 100);

      if (rawProgress < 1) {
        requestAnimationFrame(updateProgress);
      } else {
        // Complete
        setTimeout(() => {
          setExit(true);
          setTimeout(() => onComplete?.(), 1000);
        }, 500);
      }
    };

    requestAnimationFrame(updateProgress);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!exit && (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background overflow-hidden"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, filter: "blur(10px)" }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Subtle Background Texture for "Richness" */}
          <div className="absolute inset-0 bg-grid-pattern opacity-[0.015] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-secondary/5 opacity-40 pointer-events-none" />

          {/* 
             The Symbol. 
             No effects. No glow. Just the form.
             Breathing animation mimic Apple's sleep indicator.
          */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{
              opacity: [0.4, 1, 0.4],
              scale: 1
            }}
            transition={{
              opacity: { duration: 3, ease: "easeInOut", repeat: Infinity },
              duration: 1.5, ease: "easeOut"
            }}
            className="flex flex-col items-center gap-8 relative z-10"
          >
            <div className="relative">
              <Brain
                className="w-16 h-16 text-foreground"
                strokeWidth={1} // Ultra-fine stroke
              />
              {/* Very subtle glow */}
              <div className="absolute inset-0 bg-foreground/20 blur-[40px] rounded-full scale-150" />
            </div>

            <div className="flex flex-col items-center gap-4">
              <h1 className="text-2xl font-light tracking-[0.25em] text-foreground uppercase">
                CorteXia
              </h1>

              {/* Synchronized Inline Progress */}
              <div className="flex items-center gap-3">
                {/* Progress Bar */}
                <div className="relative w-24 h-[2px] bg-secondary/50 rounded-full overflow-hidden backdrop-blur-sm">
                  <div
                    className="h-full bg-foreground shadow-[0_0_10px_currentColor]"
                    style={{ width: `${progress}%`, transition: 'none' }}
                  />
                </div>
                {/* Percentage */}
                <span className="text-xs font-mono font-light tracking-widest text-muted-foreground/80 tabular-nums min-w-[32px]">
                  {Math.floor(progress)}%
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
