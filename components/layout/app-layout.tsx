"use client";

import { Header } from "./header";
import { CollapsibleSidebar } from "./collapsible-sidebar";
import { ReactNode, useState, useEffect } from "react";
import { useApp } from "@/lib/context/app-context";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { usePathname } from "next/navigation";

export function AppLayout({ children }: { children: ReactNode }) {
  const { settings } = useApp();
  const [mounted, setMounted] = useState(false);
  const isCollapsed = settings?.sidebarCollapsed ?? false;
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-neutral-950">
      <Header />
      <CollapsibleSidebar />
      <main
        className={cn(
          "min-h-screen transition-[margin] duration-200 ease-out",
          // Desktop: adjust margin based on sidebar state
          mounted && isCollapsed ? "lg:ml-14" : "lg:ml-60",
          // Mobile: no margin (sidebar overlays)
          "ml-0",
          // Padding
          "px-4 sm:px-6 lg:px-8 py-6 pt-16 lg:pt-6",
        )}
      >
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
