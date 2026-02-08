"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useApp } from "@/lib/context/app-context";
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Target,
  Clock,
  Flame,
  BookOpen,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Sparkles,
} from "lucide-react";

type TimelineView = "day" | "week" | "month" | "year";

interface TimelineEvent {
  id: string;
  type:
    | "task"
    | "habit"
    | "goal"
    | "time"
    | "journal"
    | "transaction"
    | "milestone";
  title: string;
  description?: string;
  time: Date;
  category?: string;
  status?: string;
  icon: React.ElementType;
  color: string;
  amount?: number;
}

const VIEW_ICONS: Record<TimelineView, React.ElementType> = {
  day: Calendar,
  week: CalendarDays,
  month: CalendarRange,
  year: CalendarRange,
};

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string }> =
  {
    task: { icon: CheckCircle2, color: "text-blue-500 bg-blue-500/10" },
    habit: { icon: Flame, color: "text-orange-500 bg-orange-500/10" },
    goal: { icon: Target, color: "text-purple-500 bg-purple-500/10" },
    time: { icon: Clock, color: "text-emerald-500 bg-emerald-500/10" },
    journal: { icon: BookOpen, color: "text-pink-500 bg-pink-500/10" },
    transaction: { icon: DollarSign, color: "text-amber-500 bg-amber-500/10" },
    milestone: { icon: Sparkles, color: "text-indigo-500 bg-indigo-500/10" },
  };

export function UnifiedTimeline() {
  const { tasks, habits, goals, timeEntries, journalEntries, transactions } =
    useApp();
  const [view, setView] = useState<TimelineView>("day");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Navigation handlers
  const navigate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate);
    switch (view) {
      case "day":
        newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1));
        break;
      case "week":
        newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7));
        break;
      case "month":
        newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1));
        break;
      case "year":
        newDate.setFullYear(
          newDate.getFullYear() + (direction === "next" ? 1 : -1),
        );
        break;
    }
    setCurrentDate(newDate);
  };

  const goToToday = () => setCurrentDate(new Date());

  // Format date display
  const formatDateDisplay = () => {
    switch (view) {
      case "day":
        return currentDate.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        });
      case "week": {
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        return `${startOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
      }
      case "month":
        return currentDate.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
      case "year":
        return currentDate.getFullYear().toString();
    }
  };

  // Get events for current view
  const events = useMemo((): TimelineEvent[] => {
    const allEvents: TimelineEvent[] = [];
    const dateStr = currentDate.toISOString().split("T")[0];

    // Helper to check if date is in range
    const isInRange = (date: string) => {
      const d = new Date(date);
      switch (view) {
        case "day":
          return date.split("T")[0] === dateStr;
        case "week": {
          const startOfWeek = new Date(currentDate);
          startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(endOfWeek.getDate() + 6);
          return d >= startOfWeek && d <= endOfWeek;
        }
        case "month":
          return (
            d.getMonth() === currentDate.getMonth() &&
            d.getFullYear() === currentDate.getFullYear()
          );
        case "year":
          return d.getFullYear() === currentDate.getFullYear();
      }
    };

    // Tasks
    tasks.forEach((task) => {
      if (task.completedAt && isInRange(task.completedAt)) {
        allEvents.push({
          id: `task-${task.id}`,
          type: "task",
          title: task.title,
          description: task.description,
          time: new Date(task.completedAt),
          category: task.domain,
          status: "completed",
          icon: CheckCircle2,
          color: "text-blue-500",
        });
      }
      if (
        task.createdAt &&
        isInRange(task.createdAt) &&
        task.status !== "completed"
      ) {
        allEvents.push({
          id: `task-created-${task.id}`,
          type: "task",
          title: `Created: ${task.title}`,
          time: new Date(task.createdAt),
          status: task.status,
          icon: Circle,
          color: "text-blue-300",
        });
      }
    });

    // Habits
    habits.forEach((habit) => {
      habit.completions?.forEach((completion) => {
        if (completion.completed && isInRange(completion.date)) {
          allEvents.push({
            id: `habit-${habit.id}-${completion.date}`,
            type: "habit",
            title: habit.name,
            description: `${habit.streak || 0} day streak`,
            time: new Date(completion.date),
            category: habit.category,
            icon: Flame,
            color: "text-orange-500",
          });
        }
      });
    });

    // Goals milestones
    goals.forEach((goal) => {
      goal.milestones?.forEach((milestone) => {
        if (
          milestone.completed &&
          milestone.completedAt &&
          isInRange(milestone.completedAt)
        ) {
          allEvents.push({
            id: `milestone-${goal.id}-${milestone.id}`,
            type: "milestone",
            title: `🎯 ${milestone.title}`,
            description: `Goal: ${goal.title}`,
            time: new Date(milestone.completedAt),
            icon: Sparkles,
            color: "text-purple-500",
          });
        }
      });
    });

    // Time entries
    timeEntries.forEach((entry) => {
      if (isInRange(entry.date)) {
        allEvents.push({
          id: `time-${entry.id}`,
          type: "time",
          title: entry.task || entry.category,
          description: `${Math.round(entry.duration / 60)} min`,
          time: new Date(entry.date),
          category: entry.category,
          icon: Clock,
          color: "text-emerald-500",
        });
      }
    });

    // Journal entries
    journalEntries.forEach((entry) => {
      if (isInRange(entry.date)) {
        allEvents.push({
          id: `journal-${entry.id}`,
          type: "journal",
          title: entry.title || "Journal Entry",
          description: `Mood: ${entry.mood || 5}/10`,
          time: new Date(entry.date),
          icon: BookOpen,
          color: "text-pink-500",
        });
      }
    });

    // Transactions
    transactions.forEach((tx) => {
      if (isInRange(tx.date)) {
        allEvents.push({
          id: `tx-${tx.id}`,
          type: "transaction",
          title: tx.description,
          description: tx.category,
          time: new Date(tx.date),
          amount: tx.amount,
          icon: tx.type === "income" ? TrendingUp : TrendingDown,
          color: tx.type === "income" ? "text-emerald-500" : "text-red-500",
        });
      }
    });

    // Sort by time
    return allEvents.sort((a, b) => b.time.getTime() - a.time.getTime());
  }, [
    tasks,
    habits,
    goals,
    timeEntries,
    journalEntries,
    transactions,
    currentDate,
    view,
  ]);

  // Group events by date for week/month/year views
  const groupedEvents = useMemo(() => {
    const groups: Record<string, TimelineEvent[]> = {};
    events.forEach((event) => {
      const key = event.time.toISOString().split("T")[0];
      if (!groups[key]) groups[key] = [];
      groups[key].push(event);
    });
    return Object.entries(groups).sort((a, b) => b[0].localeCompare(a[0]));
  }, [events]);

  // Stats for current period
  const stats = useMemo(() => {
    const taskEvents = events.filter((e) => e.type === "task").length;
    const habitEvents = events.filter((e) => e.type === "habit").length;
    const timeLogged = events
      .filter((e) => e.type === "time")
      .reduce((sum, e) => {
        const match = e.description?.match(/(\d+)/);
        return sum + (match ? parseInt(match[1]) : 0);
      }, 0);
    const income = events
      .filter((e) => e.type === "transaction" && (e.amount || 0) > 0)
      .reduce((s, e) => s + (e.amount || 0), 0);
    const expenses = events
      .filter((e) => e.type === "transaction" && (e.amount || 0) < 0)
      .reduce((s, e) => s + Math.abs(e.amount || 0), 0);

    return { taskEvents, habitEvents, timeLogged, income, expenses };
  }, [events]);

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* View Controls — responsive */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {(["day", "week", "month", "year"] as TimelineView[]).map((v) => {
            const Icon = VIEW_ICONS[v];
            return (
              <Button
                key={v}
                variant={view === v ? "default" : "ghost"}
                size="sm"
                onClick={() => setView(v)}
                className="gap-1.5 sm:gap-2 text-xs sm:text-sm h-8 sm:h-9 px-2.5 sm:px-3"
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="capitalize">{v}</span>
              </Button>
            );
          })}
        </div>

        <div className="flex items-center justify-center sm:justify-end gap-1.5 sm:gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9"
            onClick={() => navigate("prev")}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm" onClick={goToToday}>
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 sm:h-9 sm:w-9"
            onClick={() => navigate("next")}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Current Date Display */}
      <div className="text-center px-2">
        <h2 className="text-lg font-bold sm:text-xl md:text-2xl break-words">
          {formatDateDisplay()}
        </h2>
        <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">{events.length} events</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
        <Card className="border-border/50">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-bold truncate">{stats.taskEvents}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Tasks</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-orange-500/10 flex items-center justify-center flex-shrink-0">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-bold truncate">{stats.habitEvents}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Habits</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-bold truncate">{Math.round(stats.timeLogged / 60)}h</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Focused</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 hidden sm:block">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-bold truncate">${stats.income.toFixed(0)}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Income</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 hidden sm:block">
          <CardContent className="p-3 sm:p-4 flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-red-500/10 flex items-center justify-center flex-shrink-0">
              <TrendingDown className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-bold truncate">${stats.expenses.toFixed(0)}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground">Expenses</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Events */}
      <AnimatePresence mode="wait">
        {events.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              No events for this period
            </p>
          </motion.div>
        ) : view === "day" ? (
          <motion.div
            key={currentDate.toISOString()}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            {events.map((event, idx) => {
              const config = TYPE_CONFIG[event.type];
              const Icon = config.icon;

              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex gap-4"
                >
                  <div className="flex flex-col items-center">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center",
                        config.color,
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    {idx < events.length - 1 && (
                      <div className="w-px h-full bg-border my-1 flex-1" />
                    )}
                  </div>

                  <Card className="flex-1 border-border/50 hover:shadow-sm transition-shadow min-w-0">
                    <CardContent className="p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-2 min-w-0">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate text-sm sm:text-base">{event.title}</p>
                          {event.description && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {event.description}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-muted-foreground">
                            {event.time.toLocaleTimeString("en-US", {
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                          {event.amount !== undefined && (
                            <p
                              className={cn(
                                "text-sm font-semibold",
                                event.amount > 0
                                  ? "text-emerald-500"
                                  : "text-red-500",
                              )}
                            >
                              {event.amount > 0 ? "+" : ""}$
                              {event.amount.toFixed(2)}
                            </p>
                          )}
                          {event.category && (
                            <Badge
                              variant="outline"
                              className="text-[10px] mt-1"
                            >
                              {event.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            key={currentDate.toISOString()}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            {groupedEvents.map(([dateKey, dayEvents]) => (
              <div key={dateKey}>
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 sticky top-0 bg-background py-2">
                  {new Date(dateKey + "T00:00:00").toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {dayEvents.map((event) => {
                    const config = TYPE_CONFIG[event.type];
                    const Icon = config.icon;

                    return (
                      <Card key={event.id} className="border-border/50">
                        <CardContent className="p-3 flex items-center gap-3">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                              config.color,
                            )}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {event.title}
                            </p>
                            {event.description && (
                              <p className="text-xs text-muted-foreground truncate">
                                {event.description}
                              </p>
                            )}
                          </div>
                          {event.amount !== undefined && (
                            <span
                              className={cn(
                                "text-sm font-semibold",
                                event.amount > 0
                                  ? "text-emerald-500"
                                  : "text-red-500",
                              )}
                            >
                              {event.amount > 0 ? "+" : ""}$
                              {event.amount.toFixed(2)}
                            </span>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
