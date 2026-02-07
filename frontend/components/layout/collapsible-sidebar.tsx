"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  CheckSquare,
  Target,
  Flag,
  CalendarDays,
  Timer,
  Wallet,
  BookOpen,
  Brain,
  Settings,
  ChevronLeft,
  ChevronRight,
  X,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react";
import { useApp } from "@/lib/context/app-context";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/habits", label: "Habits", icon: Target },
  { href: "/goals", label: "Goals", icon: Flag },
  { href: "/day-planner", label: "Day Planner", icon: CalendarDays },
  { href: "/time-tracker", label: "Time Tracker", icon: Timer },
  { href: "/finance", label: "Expenses", icon: Wallet },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/ai-coach", label: "AI Coach", icon: Brain },
];

const bottomItems = [{ href: "/settings", label: "Settings", icon: Settings }];

export function CollapsibleSidebar() {
  const pathname = usePathname();
  const { settings, updateSettings } = useApp();
  const isCollapsed = settings?.sidebarCollapsed ?? false;
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapse = useCallback(() => {
    updateSettings({ sidebarCollapsed: !isCollapsed });
  }, [isCollapsed, updateSettings]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const NavLink = ({
    item,
    collapsed,
  }: {
    item: (typeof navItems)[0];
    collapsed: boolean;
  }) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;
    return (
      <Link
        href={item.href}
        className={cn(
          "group relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
          collapsed ? "justify-center" : "",
          isActive
            ? "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300"
            : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]",
        )}
        title={collapsed ? item.label : undefined}
      >
        {isActive && (
          <motion.div
            layoutId="sidebar-active"
            className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-purple-600 dark:bg-purple-400"
            transition={{ type: "spring", stiffness: 350, damping: 30 }}
          />
        )}
        <Icon
          className={cn(
            "w-[18px] h-[18px] flex-shrink-0",
            isActive && "text-purple-600 dark:text-purple-400",
          )}
        />
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-4 left-4 z-50 lg:hidden p-2.5 rounded-xl bg-white dark:bg-[var(--color-bg-secondary)] border border-[var(--color-border)] shadow-sm"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-50 w-[280px] bg-white dark:bg-[var(--color-bg-primary)] border-r border-[var(--color-border)] lg:hidden flex flex-col"
          >
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-white" />
                </div>
                <span className="font-semibold tracking-tight">CorteXia</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-3 space-y-0.5 scrollbar-thin">
              {navItems.map((item) => (
                <NavLink key={item.href} item={item} collapsed={false} />
              ))}
            </nav>
            <div className="p-3 border-t border-[var(--color-border)] space-y-0.5">
              {bottomItems.map((item) => (
                <NavLink key={item.href} item={item} collapsed={false} />
              ))}
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex fixed inset-y-0 left-0 z-30 flex-col bg-white dark:bg-[var(--color-bg-primary)] border-r border-[var(--color-border)] transition-all duration-300 ease-out",
          isCollapsed ? "w-[68px]" : "w-[260px]",
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex items-center border-b border-[var(--color-border)] h-16 px-4",
            isCollapsed ? "justify-center" : "gap-2.5",
          )}
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <Brain className="w-5 h-5 text-white" />
          </div>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col min-w-0"
            >
              <span className="font-bold text-base tracking-tight">
                CorteXia
              </span>
              <span className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-widest">
                Life OS
              </span>
            </motion.div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5 scrollbar-thin">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} collapsed={isCollapsed} />
          ))}
        </nav>

        {/* Bottom */}
        <div className="p-3 border-t border-[var(--color-border)] space-y-0.5">
          {bottomItems.map((item) => (
            <NavLink key={item.href} item={item} collapsed={isCollapsed} />
          ))}
          <button
            onClick={toggleCollapse}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] transition-all text-xs"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
