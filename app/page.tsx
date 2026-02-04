"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { LifeStateCore } from "@/components/dashboard/life-state-core-new";
import { SignalConstellation } from "@/components/dashboard/signal-constellation-new";
import { TodayTimeline } from "@/components/dashboard/today-timeline";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { UpcomingSection } from "@/components/dashboard/upcoming-section";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/context/app-context";
import { motion } from "framer-motion";
import { useMemo } from "react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import {
  CheckCircle2,
  Flame,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Calendar,
} from "lucide-react";

export default function DashboardPage() {
  const { tasks, habits, journalEntries, goals } = useApp();

  const today = new Date().toISOString().split("T")[0];

  // Get greeting based on time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // Calculate quick stats
  const stats = useMemo(() => {
    const completedTodayCount = tasks.filter(
      (t) => t.status === "completed" && t.completedAt?.split("T")[0] === today,
    ).length;

    const pendingHighPriority = tasks.filter(
      (t) =>
        t.status !== "completed" &&
        (t.priority === "high" || t.priority === "critical"),
    ).length;

    return { completedTodayCount, pendingHighPriority };
  }, [tasks, today]);

  return (
    <AppLayout>
      <div className="space-y-6 sm:space-y-8 pb-24">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
              {getGreeting()} 👋
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {stats.completedTodayCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium">
                <CheckCircle2 className="w-4 h-4" />
                {stats.completedTodayCount} completed today
              </div>
            )}
            {stats.pendingHighPriority > 0 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-sm font-medium">
                <TrendingUp className="w-4 h-4" />
                {stats.pendingHighPriority} high priority
              </div>
            )}
          </div>
        </motion.div>

        {/* Life State Core - Hero Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <LifeStateCore />
        </motion.section>

        {/* Signal Constellation - Quick Stats Grid */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-xl sm:text-2xl font-bold mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
            Life Signals
          </h2>
          <SignalConstellation />
        </motion.section>

        {/* Two Column Layout for Timeline and Upcoming */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Today's Timeline */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <TodayTimeline />
          </motion.section>

          {/* Right Column - Upcoming + Quick Actions */}
          <div className="space-y-6">
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
            >
              <UpcomingSection />
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <QuickActions />
            </motion.section>
          </div>
        </div>

        {/* Today's Priority Tasks & Habits */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Priority Tasks */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-blue-500" />
                  Priority Tasks
                </h3>
                <Link href="/tasks">
                  <Button variant="ghost" size="sm" className="gap-1 text-sm">
                    View All <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <div className="space-y-3">
                {tasks
                  .filter((t) => t.status !== "completed")
                  .sort((a, b) => {
                    const priorityOrder = {
                      critical: 0,
                      high: 1,
                      medium: 2,
                      low: 3,
                    };
                    return (
                      (priorityOrder[a.priority] || 3) -
                      (priorityOrder[b.priority] || 3)
                    );
                  })
                  .slice(0, 5)
                  .map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div
                        className={cn(
                          "w-2.5 h-2.5 rounded-full flex-shrink-0",
                          task.priority === "critical"
                            ? "bg-red-500"
                            : task.priority === "high"
                              ? "bg-orange-500"
                              : task.priority === "medium"
                                ? "bg-amber-500"
                                : "bg-emerald-500",
                        )}
                      />
                      <span className="flex-1 text-sm font-medium truncate">
                        {task.title}
                      </span>
                      {task.dueDate && (
                        <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 flex-shrink-0">
                          <Calendar className="w-3 h-3" />
                          {new Date(task.dueDate).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  ))}
                {tasks.filter((t) => t.status !== "completed").length === 0 && (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-6 text-sm">
                    All tasks completed! 🎉
                  </p>
                )}
              </div>
            </Card>
          </motion.section>

          {/* Today's Habits */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
          >
            <Card className="p-5 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-500" />
                  Today's Habits
                </h3>
                <Link href="/habits">
                  <Button variant="ghost" size="sm" className="gap-1 text-sm">
                    View All <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
              <div className="space-y-3">
                {habits
                  .filter((h) => h.active)
                  .slice(0, 5)
                  .map((habit) => {
                    const isCompleted = habit.completions?.some(
                      (c) => c.date === today && c.completed,
                    );
                    return (
                      <div
                        key={habit.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl transition-colors",
                          isCompleted
                            ? "bg-emerald-50 dark:bg-emerald-900/20"
                            : "bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800",
                        )}
                      >
                        <div
                          className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold",
                            isCompleted
                              ? "bg-emerald-500 text-white"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-500",
                          )}
                        >
                          {isCompleted ? "✓" : ""}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium truncate block">
                            {habit.name}
                          </span>
                          {habit.streak > 0 && (
                            <span className="text-xs text-orange-500 flex items-center gap-1">
                              <Flame className="w-3 h-3" />
                              {habit.streak} day streak
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                {habits.filter((h) => h.active).length === 0 && (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-6 text-sm">
                    No habits yet. Create one to start tracking!
                  </p>
                )}
              </div>
            </Card>
          </motion.section>
        </div>
      </div>
    </AppLayout>
  );
}
