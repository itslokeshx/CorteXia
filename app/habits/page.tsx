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
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-balance">Habits</h1>
            <p className="text-muted-foreground mt-2">
              Build consistency and track your daily and weekly habits.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" size="lg">
                <Plus className="h-4 w-4" />
                New Habit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
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
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">{stats.total}</div>
              <p className="text-sm text-muted-foreground">Total Habits</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600">
                {stats.completed}
              </div>
              <p className="text-sm text-muted-foreground">Completed Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-orange-600">
                {stats.activeStreaks}
              </div>
              <p className="text-sm text-muted-foreground">Active Streaks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-600">
                {stats.avgStreak}
              </div>
              <p className="text-sm text-muted-foreground">Avg Streak</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
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
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-muted-foreground">
                No habits in this category. Create one to get started!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredHabits.map((habit) => {
              const todayCompleted = habit.completions.find(
                (c) => c.date === today,
              )?.completed;
              const recentCompletions = habit.completions.slice(-12);

              return (
                <Card
                  key={habit.id}
                  className={cn(
                    "transition-all hover:shadow-lg",
                    todayCompleted && "border-green-500/50 bg-green-500/5",
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: habit.color }}
                          />
                          {habit.name}
                        </CardTitle>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteHabit(habit.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Streak */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Flame className="h-5 w-5 text-orange-500" />
                        <span className="font-semibold">
                          {habit.streak} day streak
                        </span>
                      </div>
                      <Badge variant="outline">
                        Personal best: {habit.longestStreak}
                      </Badge>
                    </div>

                    {/* Today's Completion */}
                    <Button
                      variant={todayCompleted ? "default" : "outline"}
                      className="w-full gap-2"
                      onClick={() => handleToggleCompletion(habit.id)}
                    >
                      <Check className="h-4 w-4" />
                      {todayCompleted ? "Completed Today" : "Mark as Done"}
                    </Button>

                    {/* Mini Calendar */}
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground">
                        Last 12 days
                      </p>
                      <div className="grid grid-cols-12 gap-1">
                        {recentCompletions.map((completion, idx) => (
                          <div
                            key={idx}
                            className={cn(
                              "h-6 w-6 rounded text-xs flex items-center justify-center font-bold text-white",
                              completion.completed
                                ? "bg-green-500"
                                : "bg-muted",
                            )}
                            title={completion.date}
                          >
                            {new Date(completion.date).getDate()}
                          </div>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground">
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
