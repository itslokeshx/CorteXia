"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Trash2 } from "lucide-react";
import { useState } from "react";
import { useApp } from "@/lib/context/app-context";

export default function GoalsPage() {
  const { goals, addGoal, deleteGoal, completeMilestone, getGoalStats } =
    useApp();
  const [open, setOpen] = useState(false);
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    category: "education" as const,
    priority: "high" as const,
    targetDate: new Date(Date.now() + 90 * 86400000)
      .toISOString()
      .split("T")[0],
    progress: 0,
    status: "active" as const,
    milestones: [] as any[],
  });

  const stats = getGoalStats();

  const handleAddGoal = () => {
    if (newGoal.title.trim()) {
      addGoal(newGoal);
      setNewGoal({
        title: "",
        description: "",
        category: "education",
        priority: "high",
        targetDate: new Date(Date.now() + 90 * 86400000)
          .toISOString()
          .split("T")[0],
        progress: 0,
        status: "active",
        milestones: [],
      });
      setOpen(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6 pb-24">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Goals</h1>
            <p className="text-muted-foreground text-sm md:text-base mt-1">
              Set ambitious goals and track progress
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md mx-4 sm:mx-auto">
              <DialogHeader>
                <DialogTitle>Create New Goal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Goal title"
                  value={newGoal.title}
                  onChange={(e) =>
                    setNewGoal({ ...newGoal, title: e.target.value })
                  }
                />
                <Textarea
                  placeholder="Description"
                  value={newGoal.description}
                  onChange={(e) =>
                    setNewGoal({ ...newGoal, description: e.target.value })
                  }
                />
                <div className="grid grid-cols-2 gap-3">
                  <Select
                    value={newGoal.category}
                    onValueChange={(v) =>
                      setNewGoal({ ...newGoal, category: v as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="health">Health</SelectItem>
                      <SelectItem value="career">Career</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="family">Family</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select
                    value={newGoal.priority}
                    onValueChange={(v) =>
                      setNewGoal({ ...newGoal, priority: v as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  type="date"
                  value={newGoal.targetDate}
                  onChange={(e) =>
                    setNewGoal({ ...newGoal, targetDate: e.target.value })
                  }
                />
                <Button onClick={handleAddGoal} className="w-full">
                  Create Goal
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
                Total Goals
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="text-2xl md:text-3xl font-bold text-emerald-500">
                {stats.completed}
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">
                Completed
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="text-2xl md:text-3xl font-bold text-blue-500">
                {stats.inProgress}
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">
                In Progress
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="text-2xl md:text-3xl font-bold text-purple-500">
                {stats.avgProgress}%
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">
                Avg Progress
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Goals Grid */}
        {goals.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="pt-10 pb-10 md:pt-12 md:pb-12 text-center">
              <p className="text-muted-foreground text-sm md:text-base">
                No goals yet. Create one to get started!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {goals.map((goal) => (
              <Card key={goal.id} className="overflow-hidden border-border/50">
                <CardHeader className="pb-3 px-4 md:px-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base md:text-xl truncate">
                        {goal.title}
                      </CardTitle>
                      <Badge
                        className="mt-2 text-[10px] md:text-xs"
                        variant="outline"
                      >
                        {goal.category}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteGoal(goal.id)}
                      className="h-7 w-7 md:h-8 md:w-8 p-0 flex-shrink-0"
                    >
                      <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 md:space-y-4 px-4 md:px-6">
                  <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                    {goal.description}
                  </p>

                  {/* Progress */}
                  <div>
                    <div className="flex justify-between mb-1.5 md:mb-2">
                      <span className="text-xs md:text-sm font-medium">
                        Progress
                      </span>
                      <span className="text-xs md:text-sm font-bold">
                        {goal.progress}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1.5 md:h-2 overflow-hidden">
                      <div
                        className="bg-primary h-full transition-all"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Deadline */}
                  <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    Target: {new Date(goal.targetDate).toLocaleDateString()}
                  </div>

                  {/* Status */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={
                        goal.status === "completed" ? "default" : "secondary"
                      }
                      className="text-[10px] md:text-xs"
                    >
                      {goal.status}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] md:text-xs">
                      {goal.priority}
                    </Badge>
                  </div>

                  {/* Milestones */}
                  {goal.milestones && goal.milestones.length > 0 && (
                    <div className="space-y-1.5 md:space-y-2 pt-2">
                      <p className="text-[10px] md:text-xs font-semibold text-muted-foreground">
                        Milestones
                      </p>
                      {goal.milestones.slice(0, 3).map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center gap-2 text-xs md:text-sm p-1.5 md:p-2 rounded bg-muted/50"
                        >
                          <input
                            type="checkbox"
                            checked={m.completed}
                            onChange={() => completeMilestone(goal.id, m.id)}
                            className="h-3.5 w-3.5 md:h-4 md:w-4"
                          />
                          <span
                            className={
                              m.completed
                                ? "line-through text-muted-foreground"
                                : ""
                            }
                          >
                            {m.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
