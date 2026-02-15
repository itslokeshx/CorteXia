"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, usePathname } from "next/navigation";
import {
    Search,
    CheckSquare,
    Target,
    Wallet,
    BookOpen,
    Clock,
    Sparkles,
    BarChart3,
    Calendar,
    GraduationCap,
    Settings,
    Zap,
    Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommandItem {
    id: string;
    icon: React.ElementType;
    label: string;
    description?: string;
    action: () => void;
    keywords: string[];
    category: "navigation" | "action" | "ai";
}

export function CommandPalette() {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const pathname = usePathname();

    // ⌘K / Ctrl+K — toggle palette
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault();
                setIsOpen((prev) => !prev);
            }
            if (e.key === "Escape") setIsOpen(false);
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Focus input on open
    useEffect(() => {
        if (isOpen) {
            setQuery("");
            setSelectedIndex(0);
            setTimeout(() => inputRef.current?.focus(), 50);
        }
    }, [isOpen]);

    const commands: CommandItem[] = useMemo(() => {
        const nav = (path: string) => () => {
            router.push(path);
            setIsOpen(false);
        };

        return [
            // Navigation
            { id: "nav-dashboard", icon: BarChart3, label: "Dashboard", description: "Overview & insights", action: nav("/"), keywords: ["home", "dashboard", "overview"], category: "navigation" as const },
            { id: "nav-tasks", icon: CheckSquare, label: "Tasks", description: "Manage your tasks", action: nav("/tasks"), keywords: ["tasks", "todo", "list"], category: "navigation" as const },
            { id: "nav-habits", icon: Zap, label: "Habits", description: "Track daily habits", action: nav("/habits"), keywords: ["habits", "routine", "daily"], category: "navigation" as const },
            { id: "nav-goals", icon: Target, label: "Goals", description: "Long-term goals", action: nav("/goals"), keywords: ["goals", "targets", "objectives"], category: "navigation" as const },
            { id: "nav-finance", icon: Wallet, label: "Finance", description: "Expenses & income", action: nav("/finance"), keywords: ["finance", "money", "expenses", "budget"], category: "navigation" as const },
            { id: "nav-journal", icon: BookOpen, label: "Journal", description: "Daily journal", action: nav("/journal"), keywords: ["journal", "diary", "write"], category: "navigation" as const },
            { id: "nav-planner", icon: Calendar, label: "Day Planner", description: "Plan your day", action: nav("/day-planner"), keywords: ["planner", "schedule", "calendar", "day"], category: "navigation" as const },
            { id: "nav-time", icon: Clock, label: "Time Tracker", description: "Track time", action: nav("/time-tracker"), keywords: ["time", "tracker", "pomodoro"], category: "navigation" as const },
            { id: "nav-study", icon: GraduationCap, label: "Study", description: "Study sessions", action: nav("/study"), keywords: ["study", "learn", "education"], category: "navigation" as const },
            { id: "nav-insights", icon: BarChart3, label: "Insights", description: "Analytics & patterns", action: nav("/insights"), keywords: ["insights", "analytics", "stats"], category: "navigation" as const },
            { id: "nav-ai", icon: Brain, label: "AI Coach", description: "Full Jarvis experience", action: nav("/ai-coach"), keywords: ["ai", "jarvis", "coach", "assistant"], category: "navigation" as const },
            { id: "nav-settings", icon: Settings, label: "Settings", description: "Preferences", action: nav("/settings"), keywords: ["settings", "config", "preferences"], category: "navigation" as const },
        ];
    }, [router]);

    const filtered = useMemo(() => {
        if (!query.trim()) return commands;
        const q = query.toLowerCase();
        return commands.filter(
            (c) =>
                c.label.toLowerCase().includes(q) ||
                c.description?.toLowerCase().includes(q) ||
                c.keywords.some((k) => k.includes(q)),
        );
    }, [query, commands]);

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setSelectedIndex((prev) => Math.max(prev - 1, 0));
            } else if (e.key === "Enter" && filtered[selectedIndex]) {
                e.preventDefault();
                filtered[selectedIndex].action();
            }
        };
        window.addEventListener("keydown", handleKey);
        return () => window.removeEventListener("keydown", handleKey);
    }, [isOpen, filtered, selectedIndex]);

    // Reset selection when query changes
    useEffect(() => {
        setSelectedIndex(0);
    }, [query]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Palette */}
                    <motion.div
                        className="fixed z-[101] top-[20%] left-1/2 -translate-x-1/2 w-[90%] max-w-lg"
                        initial={{ opacity: 0, y: -20, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                    >
                        <div className="bg-[var(--color-bg-primary)] border border-[var(--color-border)] rounded-2xl shadow-2xl overflow-hidden">
                            {/* Search input */}
                            <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
                                <Search className="w-5 h-5 text-[var(--color-text-tertiary)] flex-shrink-0" />
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Type a command or search..."
                                    className="flex-1 bg-transparent text-[var(--color-text-primary)] text-sm placeholder:text-[var(--color-text-tertiary)] focus:outline-none"
                                />
                                <kbd className="px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-tertiary)] bg-[var(--color-bg-tertiary)] rounded border border-[var(--color-border)]">
                                    ESC
                                </kbd>
                            </div>

                            {/* Results */}
                            <div className="max-h-[320px] overflow-y-auto py-2">
                                {filtered.length === 0 ? (
                                    <div className="px-4 py-8 text-center">
                                        <Sparkles className="w-6 h-6 mx-auto mb-2 text-[var(--color-text-tertiary)] opacity-40" />
                                        <p className="text-sm text-[var(--color-text-tertiary)]">
                                            No results found
                                        </p>
                                    </div>
                                ) : (
                                    filtered.map((cmd, i) => (
                                        <button
                                            key={cmd.id}
                                            onClick={cmd.action}
                                            className={cn(
                                                "w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors",
                                                i === selectedIndex
                                                    ? "bg-[var(--color-bg-secondary)]"
                                                    : "hover:bg-[var(--color-bg-secondary)]/50",
                                            )}
                                        >
                                            <div
                                                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                                style={{ background: "var(--color-bg-tertiary)" }}
                                            >
                                                <cmd.icon className="w-4 h-4 text-[var(--color-text-secondary)]" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                                                    {cmd.label}
                                                </p>
                                                {cmd.description && (
                                                    <p className="text-xs text-[var(--color-text-tertiary)] truncate">
                                                        {cmd.description}
                                                    </p>
                                                )}
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
