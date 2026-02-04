"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, Flame, Trash2, Calendar } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/lib/context/app-context";
import { cn } from "@/lib/utils";

interface Habit {
  id: string;
  name: string;
  description: string;
  frequency: string;
  streak: number;
  currentStreak: number;
  color: string;
  completed: boolean;
  domain: string;
}

interface HabitWithUI {
  id: string;
  name: string;
  category: string;
  streak: number;
  longestStreak: number;
  completions: { date: string; completed: boolean }[];
  color: string;
  active: boolean;
}

export default function HabitsPage() {
  const { habits, completeHabit, deleteHabit, addHabit, getHabitStreak } =
    useApp();
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [newHabit, setNewHabit] = useState({
    name: "",
    description: "",
    category: "health" as const,
    frequency: "daily" as const,
    targetDays: 1,
    color: "#3B82F6",
  });

  const today = new Date().toISOString().split("T")[0];
  const filteredHabits = habits.filter(
    (h) => categoryFilter === "all" || h.category === categoryFilter,
  );

  const stats = {
    total: habits.length,
    completed: habits.filter((h) =>
      h.completions.find((c) => c.date === today && c.completed),
    ).length,
    activeStreaks: habits.filter((h) => h.streak > 0).length,
    avgStreak:
      habits.length > 0
        ? Math.round(
            habits.reduce((sum, h) => sum + h.streak, 0) / habits.length,
          )
        : 0,
  };

  const handleAddHabit = () => {
    if (newHabit.name.trim()) {
      addHabit({
        ...newHabit,
        color: newHabit.color,
        description: newHabit.description,
        active: true,
      });
      setNewHabit({
        name: "",
        description: "",
        category: "health",
        frequency: "daily",
        targetDays: 1,
        color: "#3B82F6",
      });
      setOpen(false);
    }
  };

  const handleToggleCompletion = (habitId: string) => {
    completeHabit(habitId, today);
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6 pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Habits</h1>
            <p className="text-muted-foreground text-sm md:text-base mt-1">
              Build consistency and track your daily habits
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Habit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-4 sm:mx-auto">
              <DialogHeader>
                <DialogTitle>Create New Habit</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Habit name"
                  value={newHabit.name}
                  onChange={(e) =>
                    setNewHabit({ ...newHabit, name: e.target.value })
                  }
                />
                <Input
                  placeholder="Description (optional)"
                  value={newHabit.description}
                  onChange={(e) =>
                    setNewHabit({ ...newHabit, description: e.target.value })
                  }
                />
                <Select
                  value={newHabit.category}
                  onValueChange={(v) =>
                    setNewHabit({ ...newHabit, category: v as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="productivity">Productivity</SelectItem>
                    <SelectItem value="learning">Learning</SelectItem>
                    <SelectItem value="fitness">Fitness</SelectItem>
                    <SelectItem value="mindfulness">Mindfulness</SelectItem>
                    <SelectItem value="social">Social</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={newHabit.frequency}
                  onValueChange={(v) =>
                    setNewHabit({ ...newHabit, frequency: v as any })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2 items-center">
                  <label className="text-sm font-medium">Color:</label>
                  <input
                    type="color"
                    value={newHabit.color}
                    onChange={(e) =>
                      setNewHabit({ ...newHabit, color: e.target.value })
                    }
                    className="h-8 w-12 rounded cursor-pointer"
                  />
                </div>
                <Button onClick={handleAddHabit} className="w-full">
                  Create Habit
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="text-2xl md:text-3xl font-bold">
                {stats.total}
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">
                Total Habits
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="text-2xl md:text-3xl font-bold text-emerald-500">
                {stats.completed}
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">
                Completed Today
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="text-2xl md:text-3xl font-bold text-orange-500">
                {stats.activeStreaks}
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">
                Active Streaks
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="text-2xl md:text-3xl font-bold text-blue-500">
                {stats.avgStreak}
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">
                Avg Streak
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[150px] sm:w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="health">Health</SelectItem>
            <SelectItem value="productivity">Productivity</SelectItem>
            <SelectItem value="learning">Learning</SelectItem>
            <SelectItem value="fitness">Fitness</SelectItem>
            <SelectItem value="mindfulness">Mindfulness</SelectItem>
            <SelectItem value="social">Social</SelectItem>
          </SelectContent>
        </Select>

        {/* Habits Grid */}
        {filteredHabits.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="pt-10 pb-10 md:pt-12 md:pb-12 text-center">
              <p className="text-muted-foreground text-sm md:text-base">
                No habits in this category. Create one to get started!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {filteredHabits.map((habit) => {
              const todayCompleted = habit.completions.find(
                (c) => c.date === today,
              )?.completed;
              const recentCompletions = habit.completions.slice(-7);

              return (
                <Card
                  key={habit.id}
                  className={cn(
                    "transition-all hover:shadow-md border-border/50",
                    todayCompleted && "border-emerald-500/50 bg-emerald-500/5",
                  )}
                >
                  <CardHeader className="pb-3 px-4 md:px-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                          <div
                            className="h-2.5 w-2.5 md:h-3 md:w-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: habit.color }}
                          />
                          <span className="truncate">{habit.name}</span>
                        </CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteHabit(habit.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 flex-shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3 md:space-y-4 px-4 md:px-6">
                    {/* Streak */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Flame className="h-4 w-4 md:h-5 md:w-5 text-orange-500" />
                        <span className="font-semibold text-sm md:text-base">
                          {habit.streak} day streak
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="text-[10px] md:text-xs"
                      >
                        Best: {habit.longestStreak}
                      </Badge>
                    </div>

                    {/* Today's Completion */}
                    <Button
                      variant={todayCompleted ? "default" : "outline"}
                      className="w-full gap-2 h-9 md:h-10 text-sm"
                      onClick={() => handleToggleCompletion(habit.id)}
                    >
                      <Check className="h-4 w-4" />
                      {todayCompleted ? "Completed" : "Mark Done"}
                    </Button>

                    {/* Mini Calendar */}
                    <div className="space-y-2">
                      <p className="text-[10px] md:text-xs font-medium text-muted-foreground">
                        Last 7 days
                      </p>
                      <div className="grid grid-cols-7 gap-1">
                        {recentCompletions.map((completion, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "h-6 w-full md:h-7 rounded text-[10px] md:text-xs flex items-center justify-center font-medium",
                              completion.completed
                                ? "bg-emerald-500 text-white"
                                : "bg-muted text-muted-foreground",
                            )}
                            title={completion.date}
                          >
                            {new Date(completion.date).getDate()}
                          </div>
                        ))}
                      </div>
                    </div>

                    <p className="text-[10px] md:text-xs text-muted-foreground">
                      {habit.completions.filter((c) => c.completed).length}{" "}
                      completions total
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
