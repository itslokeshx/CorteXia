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

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 border-r border-border bg-background">
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
                "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]",
                isActive &&
                  "text-purple-600 bg-purple-50 dark:bg-purple-950/30",
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
