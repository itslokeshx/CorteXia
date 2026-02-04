"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { useApp } from "@/lib/context/app-context";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { CheckCircle2, Circle, ArrowRight, Flame } from "lucide-react";

export default function DashboardPage() {
  const { tasks, habits } = useApp();

  const today = new Date().toISOString().split("T")[0];

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Calculate essential stats
  const stats = useMemo(() => {
    const pendingTasks = tasks.filter((t) => t.status !== "completed");
    const completedToday = tasks.filter(
      (t) => t.status === "completed" && t.completedAt?.split("T")[0] === today,
    ).length;
    const overdueTasks = pendingTasks.filter(
      (t) => t.dueDate && t.dueDate < today,
    ).length;

    const activeHabits = habits.filter((h) => h.active);
    const habitsCompletedToday = activeHabits.filter((h) =>
      h.completions?.some((c) => c.date === today && c.completed),
    ).length;

    return {
      pendingTasks: pendingTasks.length,
      completedToday,
      overdueTasks,
      activeHabits: activeHabits.length,
      habitsCompletedToday,
    };
  }, [tasks, habits, today]);

  // Get top priority tasks for today
  const priorityTasks = useMemo(() => {
    return tasks
      .filter((t) => t.status !== "completed")
      .sort((a, b) => {
        const aOverdue = a.dueDate && a.dueDate < today ? -2 : 0;
        const bOverdue = b.dueDate && b.dueDate < today ? -2 : 0;
        const aDueToday = a.dueDate === today ? -1 : 0;
        const bDueToday = b.dueDate === today ? -1 : 0;
        const priorityOrder: Record<string, number> = {
          high: 0,
          medium: 1,
          low: 2,
        };
        return (
          aOverdue - bOverdue ||
          aDueToday - bDueToday ||
          (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2)
        );
      })
      .slice(0, 4);
  }, [tasks, today]);

  // Get today's habits
  const todaysHabits = useMemo(() => {
    return habits
      .filter((h) => h.active)
      .map((h) => ({
        ...h,
        isCompleted:
          h.completions?.some((c) => c.date === today && c.completed) ?? false,
      }))
      .slice(0, 5);
  }, [habits, today]);

  return (
    <AppLayout>
      <div className="space-y-8 pb-12">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
            {getGreeting()}
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <div className="text-2xl font-semibold text-neutral-900 dark:text-white">
              {stats.pendingTasks}
            </div>
            <div className="text-xs text-neutral-500 mt-1">Tasks pending</div>
          </div>
          <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <div className="text-2xl font-semibold text-green-600 dark:text-green-400">
              {stats.completedToday}
            </div>
            <div className="text-xs text-neutral-500 mt-1">Done today</div>
          </div>
          <div className="p-4 rounded-lg bg-neutral-50 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
            <div className="text-2xl font-semibold text-neutral-900 dark:text-white">
              {stats.habitsCompletedToday}/{stats.activeHabits}
            </div>
            <div className="text-xs text-neutral-500 mt-1">Habits today</div>
          </div>
          {stats.overdueTasks > 0 ? (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900">
              <div className="text-2xl font-semibold text-red-600 dark:text-red-400">
                {stats.overdueTasks}
              </div>
              <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                Overdue
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
              <div className="text-2xl font-semibold text-green-600 dark:text-green-400">
                ✓
              </div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                On track
              </div>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Tasks */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-neutral-900 dark:text-white">
                Focus today
              </h2>
              <Link
                href="/tasks"
                className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1"
              >
                All tasks <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-1">
              {priorityTasks.length > 0 ? (
                priorityTasks.map((task) => {
                  const isOverdue = task.dueDate && task.dueDate < today;
                  const isDueToday = task.dueDate === today;
                  return (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
                    >
                      <Circle className="w-4 h-4 text-neutral-300 dark:text-neutral-600 flex-shrink-0" />
                      <span className="flex-1 text-sm text-neutral-700 dark:text-neutral-300 truncate">
                        {task.title}
                      </span>
                      {(isOverdue || isDueToday) && (
                        <span
                          className={cn(
                            "text-xs px-1.5 py-0.5 rounded",
                            isOverdue
                              ? "text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400"
                              : "text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400",
                          )}
                        >
                          {isOverdue ? "Overdue" : "Today"}
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-neutral-400 text-sm">
                  No pending tasks
                </div>
              )}
            </div>
          </div>

          {/* Today's Habits */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-neutral-900 dark:text-white">
                Habits
              </h2>
              <Link
                href="/habits"
                className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1"
              >
                All habits <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-1">
              {todaysHabits.length > 0 ? (
                todaysHabits.map((habit) => (
                  <div
                    key={habit.id}
                    className={cn(
                      "flex items-center gap-3 p-3 rounded-lg transition-colors",
                      habit.isCompleted
                        ? "bg-green-50 dark:bg-green-950/20"
                        : "hover:bg-neutral-50 dark:hover:bg-neutral-900",
                    )}
                  >
                    {habit.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-neutral-300 dark:text-neutral-600 flex-shrink-0" />
                    )}
                    <span
                      className={cn(
                        "flex-1 text-sm truncate",
                        habit.isCompleted
                          ? "text-green-700 dark:text-green-400"
                          : "text-neutral-700 dark:text-neutral-300",
                      )}
                    >
                      {habit.name}
                    </span>
                    {habit.streak > 0 && (
                      <span className="text-xs text-orange-500 flex items-center gap-0.5">
                        <Flame className="w-3 h-3" />
                        {habit.streak}
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-neutral-400 text-sm">
                  No habits set up
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-neutral-100 dark:border-neutral-800">
          {[
            { href: "/goals", label: "Goals" },
            { href: "/time", label: "Time tracking" },
            { href: "/journal", label: "Journal" },
            { href: "/insights", label: "AI Insights" },
            { href: "/finance", label: "Finance" },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white px-3 py-1.5 rounded-full border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
