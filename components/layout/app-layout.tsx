"use client";

import { Header } from "./header";
import { CollapsibleSidebar } from "./collapsible-sidebar";
import { ReactNode, useState, useEffect } from "react";
import { useApp } from "@/lib/context/app-context";
import { cn } from "@/lib/utils";

export function AppLayout({ children }: { children: ReactNode }) {
  const { settings } = useApp();
  const [mounted, setMounted] = useState(false);
  const isCollapsed = settings?.sidebarCollapsed ?? false;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <CollapsibleSidebar />
      <main
        className={cn(
          "pt-16 min-h-screen transition-all duration-200",
          // Desktop: adjust margin based on sidebar state
          mounted && isCollapsed ? "lg:ml-20" : "lg:ml-64",
          // Mobile: no margin (sidebar overlays)
          "ml-0",
          // Padding
          "px-4 sm:px-6 lg:px-8 py-6",
        )}
      >
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
