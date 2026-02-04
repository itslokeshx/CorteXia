"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Calendar,
  CheckSquare,
  Target,
  Flag,
  Clock,
  AlertTriangle,
  ChevronRight,
  Flame,
} from "lucide-react";
import { useApp } from "@/lib/context/app-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface UpcomingItem {
  id: string;
  type: "task" | "habit" | "goal" | "deadline";
  title: string;
  subtitle: string;
  date?: string;
  time?: string;
  priority?: "low" | "medium" | "high" | "critical";
  icon: React.ElementType;
  href: string;
  color: string;
}

export function UpcomingSection() {
  const { tasks, habits, goals } = useApp();

  const upcomingItems = useMemo<UpcomingItem[]>(() => {
    const items: UpcomingItem[] = [];
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Upcoming tasks (due in next 7 days)
    const upcomingTasks = tasks
      .filter((t) => {
        if (t.status === "completed") return false;
        if (!t.dueDate) return false;
        const dueDate = new Date(t.dueDate);
        const diffDays = Math.ceil(
          (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
        return diffDays >= 0 && diffDays <= 7;
      })
      .sort(
        (a, b) =>
          new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime(),
      )
      .slice(0, 3);

    upcomingTasks.forEach((task) => {
      const dueDate = new Date(task.dueDate!);
      const isToday = task.dueDate === todayStr;
      const isTomorrow =
        Math.ceil(
          (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        ) === 1;

      items.push({
        id: `task-${task.id}`,
        type: "task",
        title: task.title,
        subtitle: isToday
          ? "Due today"
          : isTomorrow
            ? "Due tomorrow"
            : `Due ${dueDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}`,
        date: task.dueDate,
        priority: task.priority,
        icon: CheckSquare,
        href: "/tasks",
        color:
          task.priority === "high"
            ? "text-orange-500"
            : task.priority === "medium"
              ? "text-amber-500"
              : "text-blue-500",
      });
    });

    // Overdue tasks
    const overdueTasks = tasks
      .filter((t) => {
        if (t.status === "completed") return false;
        if (!t.dueDate) return false;
        return t.dueDate < todayStr;
      })
      .slice(0, 2);

    overdueTasks.forEach((task) => {
      items.unshift({
        id: `overdue-${task.id}`,
        type: "deadline",
        title: task.title,
        subtitle: "OVERDUE",
        date: task.dueDate,
        priority: "critical",
        icon: AlertTriangle,
        href: "/tasks",
        color: "text-red-500",
      });
    });

    // Habits not done today
    const pendingHabits = habits
      .filter((h) => {
        if (!h.active) return false;
        const completedToday = h.completions?.some(
          (c) => c.date === todayStr && c.completed,
        );
        return !completedToday;
      })
      .slice(0, 2);

    pendingHabits.forEach((habit) => {
      items.push({
        id: `habit-${habit.id}`,
        type: "habit",
        title: habit.name,
        subtitle: `${habit.streak || 0} day streak`,
        icon: Flame,
        href: "/habits",
        color: "text-orange-500",
      });
    });

    // Goals with approaching deadlines
    const upcomingGoals = goals
      .filter((g) => {
        if (g.status !== "active") return false;
        if (!g.targetDate) return false;
        const targetDate = new Date(g.targetDate);
        const diffDays = Math.ceil(
          (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
        );
        return diffDays >= 0 && diffDays <= 30;
      })
      .sort(
        (a, b) =>
          new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime(),
      )
      .slice(0, 2);

    upcomingGoals.forEach((goal) => {
      const targetDate = new Date(goal.targetDate);
      const diffDays = Math.ceil(
        (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      items.push({
        id: `goal-${goal.id}`,
        type: "goal",
        title: goal.title,
        subtitle: `${diffDays} days left • ${goal.progress}% complete`,
        date: goal.targetDate,
        icon: Flag,
        href: "/goals",
        color: diffDays <= 7 ? "text-amber-500" : "text-pink-500",
      });
    });

    return items.slice(0, 6);
  }, [tasks, habits, goals]);

  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;
    const colors = {
      critical: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
      high: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300",
      medium:
        "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
      low: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
    };
    return (
      <span
        className={cn(
          "px-2 py-0.5 text-xs font-medium rounded-full",
          colors[priority as keyof typeof colors],
        )}
      >
        {priority}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          Upcoming
        </h3>
        <Link href="/timeline">
          <Button variant="ghost" size="sm" className="text-sm gap-1">
            View Timeline
            <ChevronRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {upcomingItems.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Nothing upcoming</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            Your schedule is clear!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {upcomingItems.map((item, index) => {
            const Icon = item.icon;
            const isOverdue = item.type === "deadline";

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link href={item.href}>
                  <div
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-xl transition-all",
                      "hover:bg-gray-50 dark:hover:bg-gray-800",
                      isOverdue && "bg-red-50 dark:bg-red-950/20",
                    )}
                  >
                    <div
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
                        isOverdue
                          ? "bg-red-100 dark:bg-red-900/30"
                          : "bg-gray-100 dark:bg-gray-800",
                      )}
                    >
                      <Icon className={cn("w-5 h-5", item.color)} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium truncate text-sm">
                          {item.title}
                        </h4>
                        {item.priority && getPriorityBadge(item.priority)}
                      </div>
                      <p
                        className={cn(
                          "text-xs truncate",
                          isOverdue
                            ? "text-red-600 dark:text-red-400 font-medium"
                            : "text-gray-500 dark:text-gray-400",
                        )}
                      >
                        {item.subtitle}
                      </p>
                    </div>

                    <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
