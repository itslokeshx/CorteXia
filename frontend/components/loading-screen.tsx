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

  useEffect(() => {
    // 4 seconds total
    const timer = setTimeout(() => {
      setExit(true);
      setTimeout(() => onComplete?.(), 800);
    }, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <AnimatePresence>
      {!exit && (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        >
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
              duration: 0.8
            }}
            className="flex flex-col items-center gap-6"
          >
            <Brain
              className="w-16 h-16 text-foreground"
              strokeWidth={1.2} // Fine, precise stroke
            />

            <div className="flex flex-col items-center gap-2">
              <h1 className="text-xl font-medium tracking-tight text-foreground">
                CorteXia
              </h1>
              {/* 
                   Progress? 
                   No bar. Just a subtle text indicator, or nothing. 
                   Steve would probably prefer nothing, but user asked for "4 sec".
                   Let's do a micro-spinner or just wait.
                */}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
