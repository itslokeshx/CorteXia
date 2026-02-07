"use client";

import Link from "next/link";
import Image from "next/image";
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
          "group relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-normal transition-all duration-150",
          collapsed ? "justify-center" : "",
          isActive
            ? "bg-[#ececf1] dark:bg-[#2a2b32] text-gray-900 dark:text-white"
            : "text-gray-700 dark:text-gray-300 hover:bg-[#ececf1] dark:hover:bg-[#2a2b32]",
        )}
        title={collapsed ? item.label : undefined}
      >
        <Icon
          className={cn(
            "w-[18px] h-[18px] flex-shrink-0",
            isActive
              ? "text-gray-900 dark:text-white"
              : "text-gray-600 dark:text-gray-400",
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
                <div className="w-8 h-8 rounded-xl overflow-hidden flex-shrink-0">
                  <Image
                    src="/Cortexia-icon.jpeg"
                    alt="CorteXia"
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
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
          "hidden lg:flex fixed inset-y-0 left-0 z-30 flex-col bg-[#f9fafb] dark:bg-[#171717] transition-all duration-300 ease-out group",
          isCollapsed ? "w-[68px]" : "w-[260px]",
        )}
      >
        {/* Logo and Toggle */}
        <div
          className={cn(
            "flex items-center h-14 px-3 border-b border-gray-200 dark:border-gray-700 relative",
            isCollapsed ? "justify-center" : "gap-2.5",
          )}
        >
          {isCollapsed ? (
            /* Centered icon with overlay expand button */
            <div className="relative w-8 h-8">
              <div className="w-8 h-8 rounded-lg overflow-hidden">
                <Image
                  src="/Cortexia-icon.jpeg"
                  alt="CorteXia"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={toggleCollapse}
                className="absolute inset-0 flex items-center justify-center rounded-lg text-white bg-gray-900/80 dark:bg-gray-100/80 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-gray-900/90 dark:hover:bg-gray-100/90"
                title="Expand sidebar"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Expanded view */
            <>
              <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src="/Cortexia-icon.jpeg"
                  alt="CorteXia"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              </div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col min-w-0"
              >
                <span className="font-semibold text-sm tracking-tight">
                  CorteXia
                </span>
                <span className="text-[9px] text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Life OS
                </span>
              </motion.div>
              <button
                onClick={toggleCollapse}
                className="p-2 ml-auto rounded-lg text-gray-600 dark:text-gray-400 hover:bg-[#ececf1] dark:hover:bg-[#2a2b32] transition-all opacity-0 group-hover:opacity-100"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5 scrollbar-thin">
          {navItems.map((item) => (
            <NavLink key={item.href} item={item} collapsed={isCollapsed} />
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-2 py-2 border-t border-gray-200 dark:border-gray-700 space-y-0.5">
          {bottomItems.map((item) => (
            <NavLink key={item.href} item={item} collapsed={isCollapsed} />
          ))}
        </div>
      </aside>
    </>
  );
}
