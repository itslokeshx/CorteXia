"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, CheckSquare, Timer, DollarSign, PenLine } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const ACTIONS: Array<{
  id: string;
  label: string;
  icon: typeof CheckSquare;
  href: string;
  color: string;
  x: number;
  y: number;
}> = [
  { id: "task", label: "Task", icon: CheckSquare, href: "/tasks", color: "#3b82f6", x: 0, y: -72 },
  { id: "focus", label: "Focus", icon: Timer, href: "/time-tracker", color: "#f59e0b", x: -72, y: 0 },
  { id: "expense", label: "Expense", icon: DollarSign, href: "/finance", color: "#ec4899", x: 72, y: 0 },
  { id: "journal", label: "Journal", icon: PenLine, href: "/journal", color: "#06b6d4", x: 0, y: 72 },
];

export function QuickActionsFab() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const toggle = useCallback(() => setOpen((o) => !o), []);
  const close = useCallback(() => setOpen(false), []);

  const handleAction = (href: string) => {
    close();
    router.push(href);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            onClick={close}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center lg:hidden">
        <AnimatePresence>
          {open &&
            ACTIONS.map((action, i) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={action.id}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ delay: i * 0.05, type: "spring", stiffness: 400, damping: 25 }}
                  style={{
                    position: "absolute",
                    left: action.x + 56 / 2 - 24,
                    bottom: action.y + 56 / 2 - 24,
                  }}
                  onClick={() => handleAction(action.href)}
                  className="w-12 h-12 rounded-full border bg-[var(--bg-secondary)] border-[var(--color-border)] shadow-lg flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-2"
                  aria-label={`Add ${action.label}`}
                >
                  <Icon className="w-5 h-5" style={{ color: action.color }} />
                </motion.button>
              );
            })}
        </AnimatePresence>

        <motion.button
          onClick={toggle}
          className={cn(
            "w-14 h-14 rounded-full flex items-center justify-center shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3b82f6] focus-visible:ring-offset-2",
            "bg-[var(--accent-primary)] text-white dark:bg-[var(--accent-primary)] dark:text-black",
          )}
          style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.2)" }}
          animate={{ rotate: open ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          aria-label={open ? "Close menu" : "Open quick actions"}
        >
          <Plus className="w-6 h-6" />
        </motion.button>
        {open && (
          <p className="text-[10px] text-[var(--text-tertiary)] mt-2 max-w-[80px] text-center">
            Tap outside to close
          </p>
        )}
      </div>
    </>
  );
}
