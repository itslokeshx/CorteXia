"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CheckSquare,
  Target,
  Clock,
  DollarSign,
  BookOpen,
  Flag,
  Brain,
  PenTool,
  ChevronRight,
  CalendarRange,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/habits", label: "Habits", icon: Target },
  { href: "/time", label: "Time", icon: Clock },
  { href: "/timeline", label: "Timeline", icon: CalendarRange },
  { href: "/finance", label: "Money", icon: DollarSign },
  { href: "/study", label: "Study", icon: BookOpen },
  { href: "/goals", label: "Goals", icon: Flag },
  { href: "/insights", label: "AI Insights", icon: Brain },
  { href: "/journal", label: "Journal", icon: PenTool },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 h-[calc(100vh-64px)] border-r border-border bg-background transition-all duration-300",
        isCollapsed ? "w-20" : "w-60",
      )}
    >
      <nav className="flex flex-col gap-2 p-4 h-full">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                "text-text-secondary hover:text-text-primary hover:bg-bg-secondary",
                isActive &&
                  "text-state-ontrack bg-blue-50 dark:bg-blue-950/30 border-l-3 border-state-ontrack",
              )}
              title={item.label}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </Link>
          );
        })}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Collapse Toggle */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center justify-center py-3 rounded-lg text-text-tertiary hover:bg-bg-secondary transition-colors"
          title={isCollapsed ? "Expand" : "Collapse"}
        >
          <ChevronRight
            className={cn(
              "w-5 h-5 transition-transform",
              isCollapsed && "rotate-180",
            )}
          />
        </button>
      </nav>
    </aside>
  );
}
