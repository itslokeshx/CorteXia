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
    // 4 seconds strict
    const duration = 4000;
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
          setTimeout(() => onComplete?.(), 500); // Fast exit 0.5s
        }, 200);
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
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {/* 
             The Symbol. 
             No blur. No glow. Sharp vectors.
             Breathing opacity only.
          */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0.3, 1, 0.3],
            }}
            transition={{
              opacity: { duration: 3, ease: "easeInOut", repeat: Infinity },
            }}
            className="flex flex-col items-center gap-6 relative z-10"
          >
            <div className="relative">
              <Brain
                className="w-12 h-12 text-foreground"
                strokeWidth={1.5} // Slightly thicker for smaller size
              />
            </div>

            <div className="flex flex-col items-center gap-3">
              <h1 className="text-lg font-medium tracking-[0.2em] text-foreground uppercase antialiased">
                CorteXia
              </h1>

              {/* Ultra-Compact Sharp Progress */}
              <div className="flex items-center gap-3">
                {/* Progress Bar */}
                <div className="relative w-32 h-1 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${progress}%`, transition: 'none' }}
                  />
                </div>
                {/* Percentage */}
                <span className="text-[10px] font-bold font-mono text-primary tabular-nums w-[32px] text-right">
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
