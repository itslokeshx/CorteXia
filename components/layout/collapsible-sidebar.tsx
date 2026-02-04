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
  BookOpen,
  Flag,
  Brain,
  PenTool,
  Settings,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Calendar,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/context/app-context";

const navigation = [
  { name: "Dashboard", href: "/", icon: Home, color: "text-purple-500" },
  { name: "Tasks", href: "/tasks", icon: CheckSquare, color: "text-blue-500" },
  { name: "Habits", href: "/habits", icon: Target, color: "text-orange-500" },
  { name: "Goals", href: "/goals", icon: Flag, color: "text-pink-500" },
  { name: "Time", href: "/time", icon: Clock, color: "text-cyan-500" },
  {
    name: "Money",
    href: "/finance",
    icon: DollarSign,
    color: "text-emerald-500",
  },
  { name: "Study", href: "/study", icon: BookOpen, color: "text-indigo-500" },
  {
    name: "Timeline",
    href: "/timeline",
    icon: Calendar,
    color: "text-amber-500",
  },
  {
    name: "AI Insights",
    href: "/insights",
    icon: Brain,
    color: "text-violet-500",
  },
  { name: "Journal", href: "/journal", icon: PenTool, color: "text-rose-500" },
];

const bottomNavigation = [
  {
    name: "Settings",
    href: "/settings",
    icon: Settings,
    color: "text-gray-500",
  },
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
  }: {
    item: (typeof navigation)[0];
    showLabel: boolean;
  }) => {
    const Icon = item.icon;
    const isActive = pathname === item.href;

    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative",
          "hover:bg-gray-100 dark:hover:bg-gray-800/50",
          isActive &&
            "bg-gradient-to-r from-purple-500/10 to-blue-500/10 dark:from-purple-500/20 dark:to-blue-500/20",
          isActive && "border-l-3 border-purple-500",
        )}
        title={item.name}
      >
        <div
          className={cn(
            "w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200",
            isActive
              ? "bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/25"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white",
          )}
        >
          <Icon className="w-5 h-5" />
        </div>

        <AnimatePresence mode="wait">
          {showLabel && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.15 }}
              className={cn(
                "whitespace-nowrap text-sm font-medium overflow-hidden",
                isActive
                  ? "text-gray-900 dark:text-white"
                  : "text-gray-600 dark:text-gray-400",
              )}
            >
              {item.name}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Active indicator dot */}
        {isActive && !showLabel && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-purple-500"
          />
        )}
      </Link>
    );
  };

  if (!mounted) return null;

  return (
    <>
      {/* Mobile Hamburger Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="lg:hidden fixed top-4 left-4 z-50 p-2.5 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label={isMobileOpen ? "Close menu" : "Open menu"}
      >
        <AnimatePresence mode="wait">
          {isMobileOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <X className="w-6 h-6" />
            </motion.div>
          ) : (
            <motion.div
              key="menu"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Menu className="w-6 h-6" />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          width: isCollapsed ? 80 : 256,
        }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="hidden lg:flex fixed left-0 top-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40 flex-col"
      >
        {/* Logo */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-500 to-blue-500 p-0.5">
              <div className="w-full h-full rounded-[10px] overflow-hidden bg-white dark:bg-gray-900 flex items-center justify-center">
                <Image
                  src="/Cortexia-icon.jpeg"
                  alt="CorteXia"
                  width={36}
                  height={36}
                  className="rounded-lg"
                />
              </div>
            </div>
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <span className="font-bold text-xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    CorteXia
                  </span>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 -mt-0.5">
                    Your Life, Understood
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </Link>
        </div>

        {/* Toggle Button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-colors z-50"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <motion.div
            animate={{ rotate: isCollapsed ? 0 : 180 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight className="w-3.5 h-3.5 text-gray-600 dark:text-gray-400" />
          </motion.div>
        </button>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-700">
          {navigation.map((item) => (
            <NavLink key={item.href} item={item} showLabel={!isCollapsed} />
          ))}
        </nav>

        {/* Bottom Navigation */}
        <div className="p-3 border-t border-gray-200 dark:border-gray-800">
          {bottomNavigation.map((item) => (
            <NavLink key={item.href} item={item} showLabel={!isCollapsed} />
          ))}
        </div>
      </motion.aside>

      {/* Mobile Sidebar Overlay */}
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
              className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            />

            {/* Mobile Sidebar */}
            <motion.aside
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="lg:hidden fixed left-0 top-0 h-screen w-72 bg-white dark:bg-gray-900 z-50 flex flex-col shadow-2xl"
            >
              {/* Logo */}
              <div className="p-4 border-b border-gray-200 dark:border-gray-800 pt-16">
                <Link
                  href="/"
                  className="flex items-center gap-3"
                  onClick={() => setIsMobileOpen(false)}
                >
                  <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-500 to-blue-500 p-0.5">
                    <div className="w-full h-full rounded-[10px] overflow-hidden bg-white dark:bg-gray-900 flex items-center justify-center">
                      <Image
                        src="/Cortexia-icon.jpeg"
                        alt="CorteXia"
                        width={36}
                        height={36}
                        className="rounded-lg"
                      />
                    </div>
                  </div>
                  <div>
                    <span className="font-bold text-xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      CorteXia
                    </span>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 -mt-0.5">
                      Your Life, Understood
                    </p>
                  </div>
                </Link>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {navigation.map((item) => (
                  <NavLink key={item.href} item={item} showLabel={true} />
                ))}
              </nav>

              {/* Bottom Navigation */}
              <div className="p-3 border-t border-gray-200 dark:border-gray-800">
                {bottomNavigation.map((item) => (
                  <NavLink key={item.href} item={item} showLabel={true} />
                ))}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
