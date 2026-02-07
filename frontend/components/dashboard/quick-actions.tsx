"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  CheckSquare,
  Target,
  Clock,
  DollarSign,
  PenTool,
  Book,
  Flag,
  Sparkles,
  Zap,
  Command,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const quickActions = [
  {
    id: "task",
    label: "Add Task",
    icon: CheckSquare,
    shortcut: "T",
    color: "bg-blue-500 hover:bg-blue-600",
    description: "Create a new task",
  },
  {
    id: "habit",
    label: "Log Habit",
    icon: Target,
    shortcut: "H",
    color: "bg-orange-500 hover:bg-orange-600",
    description: "Mark habit complete",
  },
  {
    id: "time",
    label: "Log Time",
    icon: Clock,
    shortcut: "L",
    color: "bg-cyan-500 hover:bg-cyan-600",
    description: "Track focus session",
  },
  {
    id: "expense",
    label: "Add Expense",
    icon: DollarSign,
    shortcut: "E",
    color: "bg-emerald-500 hover:bg-emerald-600",
    description: "Record a transaction",
  },
  {
    id: "journal",
    label: "Journal",
    icon: PenTool,
    shortcut: "J",
    color: "bg-rose-500 hover:bg-rose-600",
    description: "Write journal entry",
  },
  {
    id: "study",
    label: "Study",
    icon: Book,
    shortcut: "S",
    color: "bg-indigo-500 hover:bg-indigo-600",
    description: "Start study session",
  },
  {
    id: "goal",
    label: "New Goal",
    icon: Flag,
    shortcut: "G",
    color: "bg-pink-500 hover:bg-pink-600",
    description: "Set a new goal",
  },
  {
    id: "ai",
    label: "Ask AI",
    icon: Sparkles,
    shortcut: "A",
    color: "bg-purple-500 hover:bg-purple-600",
    description: "Get AI assistance",
  },
];

export function QuickActions() {
  const [hoveredAction, setHoveredAction] = useState<string | null>(null);

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-500" />
          Quick Actions
        </h3>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Command className="w-3 h-3" />
          <span>+ key for shortcuts</span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          const isHovered = hoveredAction === action.id;

          return (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onMouseEnter={() => setHoveredAction(action.id)}
              onMouseLeave={() => setHoveredAction(null)}
              className={cn(
                "relative flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200",
                "border-2 border-gray-100 dark:border-gray-800",
                "hover:border-transparent hover:shadow-lg hover:-translate-y-1",
                isHovered && action.color,
              )}
            >
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center mb-2 transition-colors",
                  isHovered
                    ? "bg-white/20 text-white"
                    : `${action.color.split(" ")[0]} text-white`,
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span
                className={cn(
                  "text-sm font-medium transition-colors",
                  isHovered ? "text-white" : "text-gray-700 dark:text-gray-300",
                )}
              >
                {action.label}
              </span>

              {/* Keyboard Shortcut */}
              <div
                className={cn(
                  "absolute top-2 right-2 w-5 h-5 rounded text-[10px] font-medium flex items-center justify-center transition-colors",
                  isHovered
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-400",
                )}
              >
                {action.shortcut}
              </div>

              {/* Hover tooltip */}
              <motion.div
                initial={false}
                animate={{
                  opacity: isHovered ? 1 : 0,
                  y: isHovered ? 0 : 5,
                }}
                className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 pointer-events-none"
              >
                {action.description}
              </motion.div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
