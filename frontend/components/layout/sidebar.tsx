"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Settings,
  LogOut,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/context/auth-context";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/habits", label: "Habits", icon: Target },
  { href: "/time-tracker", label: "Focus", icon: Clock },
  { href: "/timeline", label: "Timeline", icon: CalendarRange },
  { href: "/finance", label: "Money", icon: DollarSign },
  { href: "/study", label: "Study", icon: BookOpen },
  { href: "/goals", label: "Goals", icon: Flag },
  { href: "/insights", label: "AI Insights", icon: Brain },
  { href: "/journal", label: "Journal", icon: PenTool },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <aside className="fixed left-0 top-0 h-screen w-60 border-r border-[var(--color-border)] bg-[var(--color-bg-primary)] flex flex-col">
      <nav className="flex flex-col gap-2 p-4 flex-1 overflow-y-auto">
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
                "text-[var(--color-accent-primary)] bg-[var(--color-bg-secondary)] font-medium",
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info Section */}
      <div className="border-t border-[var(--color-border)] p-4 space-y-2">
        {/* User Profile */}
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[var(--color-bg-secondary)]">
          <div className="w-8 h-8 rounded-full bg-[var(--color-accent-primary)] flex items-center justify-center text-white text-sm font-semibold">
            {profile?.full_name?.charAt(0) ||
              user?.email?.charAt(0).toUpperCase() ||
              "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
              {profile?.full_name || "User"}
            </p>
            <p className="text-xs text-[var(--color-text-tertiary)] truncate">
              {user?.email}
            </p>
          </div>
        </div>

        {/* Settings Link */}
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200",
            "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)]",
            pathname === "/settings" &&
            "text-[var(--color-accent-primary)] bg-[var(--color-bg-secondary)] font-medium",
          )}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">Settings</span>
        </Link>

        {/* Sign Out Button */}
        <Button
          onClick={handleSignOut}
          variant="ghost"
          className="w-full justify-start gap-3 px-4 py-2.5 h-auto text-[var(--color-text-secondary)] hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">Sign Out</span>
        </Button>
      </div>
    </aside>
  );
}
