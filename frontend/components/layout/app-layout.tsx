"use client";


import { usePathname } from "next/navigation";
import { CollapsibleSidebar } from "./collapsible-sidebar";
import { ReactNode, useState, useEffect } from "react";
import { useApp } from "@/lib/context/app-context";
import { useAuth } from "@/lib/context/auth-context";
import { ConversationalAI } from "@/components/ai/conversational-ai";
import { CommandPalette } from "@/components/ai/command-palette";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { settings } = useApp();
  const { isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);
  const isCollapsed = settings?.sidebarCollapsed ?? false;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0A0B0D]">
      <CollapsibleSidebar />
      <main
        className={cn(
          "min-h-screen transition-[margin-left] duration-200 ease-out",
          "max-lg:!ml-0",
          "px-6 sm:px-8 lg:px-12 py-8 pt-16 lg:pt-8 sm:pb-20",
          mounted && isCollapsed ? "ml-[68px]" : "ml-[260px]",
        )}
      >
        <div className="max-w-[1200px] mx-auto">{children}</div>
      </main>
      {/* AI Chatbot - only when fully authenticated and not on AI Coach page */}
      {isAuthenticated && pathname !== "/ai-coach" && <ConversationalAI />}
      {isAuthenticated && <CommandPalette />}
    </div>
  );
}
