"use client";

import { CollapsibleSidebar } from "./collapsible-sidebar";
import { OmnipotentChatbot } from "@/components/ai/omnipotent-chatbot";
import { ReactNode, useState, useEffect } from "react";
import { useApp } from "@/lib/context/app-context";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export function AppLayout({ children }: { children: ReactNode }) {
  const { settings } = useApp();
  const [mounted, setMounted] = useState(false);
  const isCollapsed = settings?.sidebarCollapsed ?? false;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0B0D]">
      <CollapsibleSidebar />
      <motion.main
        initial={false}
        animate={{
          marginLeft: mounted ? (isCollapsed ? 68 : 260) : 260,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={cn(
          "min-h-screen",
          "max-lg:!ml-0",
          "px-6 sm:px-8 lg:px-12 py-8 pt-16 lg:pt-8",
        )}
      >
        <div className="max-w-[1200px] mx-auto">{children}</div>
      </motion.main>
      <OmnipotentChatbot />
    </div>
  );
}
