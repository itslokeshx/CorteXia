"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Home,
  CheckSquare,
  Target,
  Clock,
  DollarSign,
  Flag,
  Brain,
  PenTool,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Calendar,
  Timer,
  Heart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/context/app-context";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Habits", href: "/habits", icon: Target },
  { name: "Goals", href: "/goals", icon: Flag },
  { name: "Day Planner", href: "/day-planner", icon: Calendar },
  { name: "Time Tracker", href: "/time-tracker", icon: Timer },
  { name: "Expenses", href: "/finance", icon: DollarSign },
  { name: "Journal", href: "/journal", icon: PenTool },
  { name: "AI Coach", href: "/ai-coach", icon: Heart },
];

const bottomNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
];

interface CollapsibleSidebarProps {
  defaultCollapsed?: boolean;
}

export function CollapsibleSidebar({
  defaultCollapsed = false,
}: CollapsibleSidebarProps) {
  const pathname = usePathname();
  const { settings, updateSettings } = useApp();
  const [isCollapsed, setIsCollapsed] = useState(
    settings?.sidebarCollapsed ?? defaultCollapsed,
  );
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && settings?.sidebarCollapsed !== undefined) {
      setIsCollapsed(settings.sidebarCollapsed);
    }
  }, [settings?.sidebarCollapsed, mounted]);

  const toggleSidebar = () => {
    const newCollapsed = !isCollapsed;
    setIsCollapsed(newCollapsed);
    if (updateSettings) {
      updateSettings({ sidebarCollapsed: newCollapsed } as any);
    }
  };

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  // Close mobile menu on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMobileOpen(false);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, []);

  const NavLink = ({
    item,
    showLabel,
    onClick,
  }: {
    item: (typeof navigation)[0];
    showLabel: boolean;
    onClick?: () => void;
  }) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;

    return (
      <Link
        href={item.href}
        onClick={onClick}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150 group",
          isActive
            ? "bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-white"
            : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50 hover:text-neutral-900 dark:hover:text-white",
        )}
        title={item.name}
      >
        <Icon
          className={cn(
            "w-[18px] h-[18px] flex-shrink-0",
            isActive
              ? "text-neutral-900 dark:text-white"
              : "text-neutral-500 dark:text-neutral-400",
          )}
        />

        <span
          className={cn(
            "whitespace-nowrap text-sm font-medium overflow-hidden transition-all duration-200",
            showLabel ? "opacity-100 w-auto" : "opacity-0 w-0",
          )}
        >
          {item.name}
        </span>
      </Link>
    );
  };

  const [isHoveringCollapsed, setIsHoveringCollapsed] = useState(false);

  if (!mounted) return null;

  return (
    <>
      {/* Mobile Hamburger Button - Clean ChatGPT style */}
      <button
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label={isMobileOpen ? "Close menu" : "Open menu"}
      >
        {isMobileOpen ? (
          <PanelLeftClose className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
        ) : (
          <PanelLeft className="w-5 h-5 text-neutral-700 dark:text-neutral-300" />
        )}
      </button>

      {/* Desktop Sidebar - Stable CSS-based transitions */}
      <aside
        style={{ width: isCollapsed ? 56 : 240 }}
        className="hidden lg:flex fixed left-0 top-0 h-screen bg-neutral-50 dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 z-40 flex-col transition-[width] duration-200 ease-out"
      >
        {/* Header with Logo & Toggle */}
        <div
          className={cn(
            "h-14 flex items-center border-b border-neutral-200 dark:border-neutral-800",
            isCollapsed ? "px-2 justify-center" : "px-3 justify-between",
          )}
        >
          {isCollapsed ? (
            // Collapsed: Show site icon, on hover show expand icon
            <button
              onClick={toggleSidebar}
              onMouseEnter={() => setIsHoveringCollapsed(true)}
              onMouseLeave={() => setIsHoveringCollapsed(false)}
              className="p-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-all relative w-8 h-8 flex items-center justify-center"
              aria-label="Expand sidebar"
            >
              <div
                className={cn(
                  "absolute inset-0 flex items-center justify-center transition-opacity duration-150",
                  isHoveringCollapsed ? "opacity-0" : "opacity-100",
                )}
              >
                <div className="w-7 h-7 rounded-lg overflow-hidden">
                  <Image
                    src="/Cortexia-icon.jpeg"
                    alt="CorteXia"
                    width={28}
                    height={28}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div
                className={cn(
                  "absolute inset-0 flex items-center justify-center transition-opacity duration-150",
                  isHoveringCollapsed ? "opacity-100" : "opacity-0",
                )}
              >
                <PanelLeft className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
              </div>
            </button>
          ) : (
            // Expanded: Show logo and toggle
            <>
              <Link href="/" className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0">
                  <Image
                    src="/Cortexia-icon.jpeg"
                    alt="CorteXia"
                    width={28}
                    height={28}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="font-semibold text-neutral-900 dark:text-white">
                  CorteXia
                </span>
              </Link>
              <button
                onClick={toggleSidebar}
                className="p-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                aria-label="Collapse sidebar"
              >
                <PanelLeftClose className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
              </button>
            </>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto scrollbar-thin">
          {navigation.map((item) => (
            <NavLink key={item.href} item={item} showLabel={!isCollapsed} />
          ))}
        </nav>

        {/* Bottom Navigation */}
        <div className="px-2 py-3 border-t border-neutral-200 dark:border-neutral-800">
          {bottomNavigation.map((item) => (
            <NavLink key={item.href} item={item} showLabel={!isCollapsed} />
          ))}
        </div>
      </aside>

      {/* Mobile Sidebar Overlay - Clean slide-in */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />

            {/* Mobile Sidebar */}
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
              className="lg:hidden fixed left-0 top-0 h-screen w-[280px] bg-neutral-50 dark:bg-neutral-900 z-50 flex flex-col"
            >
              {/* Header */}
              <div className="h-14 px-4 flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800">
                <Link
                  href="/"
                  className="flex items-center gap-2.5"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <div className="w-8 h-8 rounded-lg overflow-hidden">
                    <Image
                      src="/Cortexia-icon.jpeg"
                      alt="CorteXia"
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="font-semibold text-neutral-900 dark:text-white">
                    CorteXia
                  </span>
                </Link>
                <button
                  onClick={() => setIsMobileOpen(false)}
                  className="p-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors"
                >
                  <PanelLeftClose className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
                {navigation.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    showLabel={true}
                    onClick={() => setIsMobileOpen(false)}
                  />
                ))}
              </nav>

              {/* Bottom Navigation */}
              <div className="px-2 py-3 border-t border-neutral-200 dark:border-neutral-800">
                {bottomNavigation.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    showLabel={true}
                    onClick={() => setIsMobileOpen(false)}
                  />
                ))}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
