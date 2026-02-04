"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Calendar,
  Trash2,
  Target,
  TreePine,
  Kanban,
  GanttChart,
  Sparkles,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Clock,
  ArrowRight,
  Loader2,
  Zap,
  TrendingUp,
  Milestone,
  Brain,
  Link2,
  LayoutList,
  ListTodo,
  Flame,
  Star,
  Mountain,
  Compass,
  CalendarDays,
  Trophy,
  Edit2,
} from "lucide-react";
import { useState, useMemo, useCallback } from "react";
import { useApp } from "@/lib/context/app-context";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { format, differenceInDays, addDays } from "date-fns";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

// Goal horizon types
const GOAL_HORIZONS = {
  life: {
    label: "Life Goal",
    icon: Mountain,
    color: "#8b5cf6",
    description: "Long-term vision (5+ years)",
  },
  yearly: {
    label: "Yearly Goal",
    icon: Star,
    color: "#f59e0b",
    description: "This year's objectives",
  },
  quarterly: {
    label: "Quarterly",
    icon: Compass,
    color: "#3b82f6",
    description: "Next 3 months",
  },
  monthly: {
    label: "Monthly",
    icon: CalendarDays,
    color: "#22c55e",
    description: "This month's focus",
  },
  weekly: {
    label: "Weekly",
    icon: Calendar,
    color: "#06b6d4",
    description: "This week's targets",
  },
};

// Category configurations
const CATEGORY_CONFIG: Record<string, { color: string; emoji: string }> = {
  personal: { color: "#8b5cf6", emoji: "🌟" },
  health: { color: "#22c55e", emoji: "💪" },
  career: { color: "#3b82f6", emoji: "💼" },
  education: { color: "#f59e0b", emoji: "📚" },
  financial: { color: "#10b981", emoji: "💰" },
  family: { color: "#ec4899", emoji: "👨‍👩‍👧" },
  creativity: { color: "#f97316", emoji: "🎨" },
  relationships: { color: "#ef4444", emoji: "❤️" },
};

// Types for AI Roadmap
interface AIRoadmapStep {
  title: string;
  description: string;
  timeframe: string;
  tasks: string[];
}

interface AIRoadmap {
  steps: AIRoadmapStep[];
  totalTimeWeeks: number;
  tips: string[];
}

// Connected Items Component - Shows linked tasks and habits
function ConnectedItems({ goalId }: { goalId: string }) {
  const { tasks, habits } = useApp();

  const linkedTasks = tasks.filter((t) => t.linkedGoalId === goalId);
  const linkedHabits = habits.filter((h) => h.linkedGoalIds?.includes(goalId));

  if (linkedTasks.length === 0 && linkedHabits.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-800">
      <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-2">
        Connected Items
      </p>
      <div className="space-y-1.5">
        {linkedTasks.slice(0, 3).map((task) => (
          <div key={task.id} className="flex items-center gap-2 text-xs">
            <div
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                task.status === "completed" ? "bg-green-500" : "bg-blue-500",
              )}
            />
            <ListTodo className="h-3 w-3 text-muted-foreground" />
            <span
              className={cn(
                task.status === "completed" &&
                  "line-through text-muted-foreground",
              )}
            >
              {task.title}
            </span>
          </div>
        ))}
        {linkedHabits.slice(0, 3).map((habit) => (
          <div key={habit.id} className="flex items-center gap-2 text-xs">
            <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
            <Flame className="h-3 w-3 text-muted-foreground" />
            <span>{habit.name}</span>
            {habit.streak > 0 && (
              <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">
                🔥 {habit.streak}
              </Badge>
            )}
          </div>
        ))}
        {(linkedTasks.length > 3 || linkedHabits.length > 3) && (
          <p className="text-[10px] text-muted-foreground">
            +
            {Math.max(0, linkedTasks.length - 3) +
              Math.max(0, linkedHabits.length - 3)}{" "}
            more items
          </p>
        )}
      </div>
    </div>
  );
}

// Goal Tree Item Component with hierarchy support
function GoalTreeItem({
  goal,
  onDelete,
  onMilestoneComplete,
  onEdit,
  depth = 0,
}: {
  goal: any;
  onDelete: (id: string) => void;
  onMilestoneComplete: (goalId: string, milestoneId: string) => void;
  onEdit: (goal: any) => void;
  depth?: number;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasMilestones = goal.milestones && goal.milestones.length > 0;
  const completedMilestones =
    goal.milestones?.filter((m: any) => m.completed).length || 0;
  const totalMilestones = goal.milestones?.length || 0;

  const horizonConfig = GOAL_HORIZONS[goal.horizon as keyof typeof GOAL_HORIZONS] || GOAL_HORIZONS.quarterly;
  const HorizonIcon = horizonConfig.icon;
  const categoryConfig = CATEGORY_CONFIG[goal.category] || { emoji: "🎯" };

  const targetDate = new Date(goal.targetDate);
  const daysLeft = differenceInDays(targetDate, new Date());
  const isOverdue = daysLeft < 0 && goal.status !== "completed";

  const priorityColors = {
    low: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    medium:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    high: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };

  const statusColors = {
    active: "border-l-blue-500",
    completed: "border-l-emerald-500",
    paused: "border-l-amber-500",
    abandoned: "border-l-gray-500",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="relative"
    >
      <div
        className={cn(
          "ml-0 border-l-4 rounded-lg bg-card shadow-sm hover:shadow-md transition-all",
          statusColors[goal.status as keyof typeof statusColors],
          isOverdue && goal.status === "active" && "ring-1 ring-red-500/50",
        )}
        style={{ marginLeft: `${depth * 24}px` }}
      >
        <div className="p-4">
          {/* Horizon Badge */}
          <div className="flex items-center gap-2 mb-3">
            <div 
              className="flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium"
              style={{ backgroundColor: `${horizonConfig.color}20`, color: horizonConfig.color }}
            >
              <HorizonIcon className="h-3 w-3" />
              {horizonConfig.label}
            </div>
            {isOverdue && (
              <Badge variant="destructive" className="text-[10px]">
                Overdue
              </Badge>
            )}
          </div>

          {/* Header */}
          <div className="flex items-start gap-3">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-1 p-0.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
            >
              {hasMilestones ? (
                isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )
              ) : (
                <Circle className="w-4 h-4 text-gray-300" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{categoryConfig.emoji}</span>
                  <h3 className="font-semibold text-base">{goal.title}</h3>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      priorityColors[
                        goal.priority as keyof typeof priorityColors
                      ],
                    )}
                  >
                    {goal.priority}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit(goal)}
                    className="h-6 w-6 p-0"
                  >
                    <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDelete(goal.id)}
                    className="h-6 w-6 p-0"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive/70" />
                  </Button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                {goal.description}
              </p>

              {/* Progress Bar */}
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{goal.progress}%</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${goal.progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Meta info */}
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(goal.targetDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <Badge variant="secondary" className="text-[10px]">
                  {goal.category}
                </Badge>
                {hasMilestones && (
                  <span className="flex items-center gap-1">
                    <Milestone className="w-3 h-3" />
                    {completedMilestones}/{totalMilestones} milestones
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Milestones */}
          <AnimatePresence>
            {isExpanded && hasMilestones && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="ml-7 mt-4 space-y-2 overflow-hidden"
              >
                {goal.milestones.map((milestone: any, idx: number) => (
                  <motion.div
                    key={milestone.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className={cn(
                      "flex items-center gap-3 p-2.5 rounded-lg transition-colors cursor-pointer",
                      milestone.completed
                        ? "bg-emerald-50 dark:bg-emerald-900/20"
                        : "bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800",
                    )}
                    onClick={() => onMilestoneComplete(goal.id, milestone.id)}
                  >
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
                        milestone.completed
                          ? "border-emerald-500 bg-emerald-500"
                          : "border-gray-300 dark:border-gray-600",
                      )}
                    >
                      {milestone.completed && (
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "flex-1 text-sm",
                        milestone.completed &&
                          "line-through text-muted-foreground",
                      )}
                    >
                      {milestone.title}
                    </span>
                    {milestone.targetDate && (
                      <span className="text-xs text-muted-foreground">
                        {new Date(milestone.targetDate).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </span>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// Kanban Board Component
function GoalKanbanBoard({
  goals,
  onDelete,
}: {
  goals: any[];
  onDelete: (id: string) => void;
}) {
  const columns = [
    { key: "active", title: "Active", color: "bg-blue-500" },
    { key: "paused", title: "Paused", color: "bg-amber-500" },
    { key: "completed", title: "Completed", color: "bg-emerald-500" },
  ];

  const groupedGoals = useMemo(() => {
    return columns.map((col) => ({
      ...col,
      goals: goals.filter((g) => g.status === col.key),
    }));
  }, [goals]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
      {groupedGoals.map((column) => (
        <div key={column.key} className="space-y-4">
          <div className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-full", column.color)} />
            <h3 className="font-semibold">{column.title}</h3>
            <Badge variant="secondary" className="ml-auto">
              {column.goals.length}
            </Badge>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {column.goals.map((goal) => (
                <motion.div
                  key={goal.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Card className="border-border/50 hover:shadow-md transition-shadow">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm line-clamp-2">
                          {goal.title}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(goal.id)}
                          className="h-6 w-6 p-0 flex-shrink-0"
                        >
                          <Trash2 className="h-3 w-3 text-destructive/70" />
                        </Button>
                      </div>

                      <Progress value={goal.progress} className="h-1.5" />

                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-[9px]">
                          {goal.category}
                        </Badge>
                        <span>{goal.progress}%</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>

            {column.goals.length === 0 && (
              <div className="p-6 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg text-center text-sm text-muted-foreground">
                No goals in {column.title.toLowerCase()}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// Timeline View Component
function GoalTimeline({ goals }: { goals: any[] }) {
  const sortedGoals = useMemo(
    () =>
      [...goals].sort(
        (a, b) =>
          new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime(),
      ),
    [goals],
  );

  const now = new Date();

  return (
    <div className="relative space-y-6">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 via-purple-500 to-emerald-500" />

      {sortedGoals.map((goal, index) => {
        const targetDate = new Date(goal.targetDate);
        const isPast = targetDate < now;
        const daysLeft = Math.ceil(
          (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );

        return (
          <motion.div
            key={goal.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative flex gap-4"
          >
            {/* Timeline dot */}
            <div
              className={cn(
                "relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                goal.status === "completed"
                  ? "bg-emerald-500"
                  : isPast
                    ? "bg-red-500"
                    : "bg-blue-500",
              )}
            >
              {goal.status === "completed" ? (
                <CheckCircle2 className="w-4 h-4 text-white" />
              ) : (
                <Target className="w-4 h-4 text-white" />
              )}
            </div>

            {/* Content */}
            <Card className="flex-1 border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold">{goal.title}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                      {goal.description}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-medium">
                      {targetDate.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                    <p
                      className={cn(
                        "text-xs",
                        isPast && goal.status !== "completed"
                          ? "text-red-500"
                          : "text-muted-foreground",
                      )}
                    >
                      {goal.status === "completed"
                        ? "Completed"
                        : isPast
                          ? "Overdue"
                          : `${daysLeft} days left`}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex items-center gap-3">
                  <Progress value={goal.progress} className="flex-1 h-1.5" />
                  <span className="text-xs font-medium">{goal.progress}%</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}

      {sortedGoals.length === 0 && (
        <div className="ml-12 p-8 text-center text-muted-foreground">
          No goals to display on timeline
        </div>
      )}
    </div>
  );
}

// AI Roadmap Generator Component
function AIRoadmapGenerator({
  onGenerateRoadmap,
}: {
  onGenerateRoadmap: (roadmap: AIRoadmap) => void;
}) {
  const [goalTitle, setGoalTitle] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<AIRoadmap | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateRoadmap = async () => {
    if (!goalTitle.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Generate a detailed roadmap to achieve this goal: "${goalTitle}". 
          
          Return ONLY valid JSON in this exact format, no markdown or extra text:
          {
            "steps": [
              {
                "title": "Step title",
                "description": "What to do",
                "timeframe": "Week 1-2",
                "tasks": ["Task 1", "Task 2", "Task 3"]
              }
            ],
            "totalTimeWeeks": 12,
            "tips": ["Tip 1", "Tip 2", "Tip 3"]
          }
          
          Include 4-6 steps with 3-5 tasks each. Be specific and actionable.`,
          context: {
            tasks: [],
            habits: [],
            timeEntries: [],
            goals: [],
            journalEntries: [],
            transactions: [],
          },
        }),
      });

      const data = await response.json();

      // Try to parse the AI response as JSON
      try {
        let jsonStr = data.response || data.message || "";
        jsonStr = jsonStr
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();

        const parsedRoadmap = JSON.parse(jsonStr);
        setRoadmap(parsedRoadmap);
        onGenerateRoadmap(parsedRoadmap);
      } catch {
        // If parsing fails, create a sample roadmap
        const sampleRoadmap: AIRoadmap = {
          steps: [
            {
              title: "Foundation & Planning",
              description: "Set up the basics and create a solid plan",
              timeframe: "Week 1-2",
              tasks: [
                "Define clear objectives",
                "Research best practices",
                "Create action plan",
              ],
            },
            {
              title: "Learning & Skill Building",
              description: "Acquire necessary knowledge and skills",
              timeframe: "Week 3-4",
              tasks: [
                "Study relevant materials",
                "Practice core skills",
                "Get feedback",
              ],
            },
            {
              title: "Implementation",
              description: "Start putting your plan into action",
              timeframe: "Week 5-8",
              tasks: [
                "Execute main tasks",
                "Track progress",
                "Adjust as needed",
              ],
            },
            {
              title: "Review & Optimize",
              description: "Evaluate progress and improve",
              timeframe: "Week 9-12",
              tasks: [
                "Review achievements",
                "Identify improvements",
                "Celebrate wins",
              ],
            },
          ],
          totalTimeWeeks: 12,
          tips: [
            "Break large tasks into smaller, manageable chunks",
            "Track your progress daily",
            "Don't be afraid to adjust the timeline",
          ],
        };
        setRoadmap(sampleRoadmap);
        onGenerateRoadmap(sampleRoadmap);
      }
    } catch {
      setError("Failed to generate roadmap. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Input Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <Sparkles className="w-5 h-5" />
          <h3 className="font-semibold">AI Roadmap Generator</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Enter your goal and let AI create a personalized roadmap with
          actionable steps.
        </p>
        <div className="flex gap-2">
          <Input
            placeholder="e.g., Learn to play guitar, Build a startup, Run a marathon..."
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && generateRoadmap()}
            className="flex-1"
          />
          <Button
            onClick={generateRoadmap}
            disabled={isLoading || !goalTitle.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Generate
              </>
            )}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Roadmap Display */}
      {roadmap && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Timeline */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            Estimated completion: {roadmap.totalTimeWeeks} weeks
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {roadmap.steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative"
              >
                {/* Connection line */}
                {index < roadmap.steps.length - 1 && (
                  <div className="absolute left-4 top-10 bottom-0 w-0.5 bg-gradient-to-b from-primary to-primary/20" />
                )}

                <div className="flex gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {index + 1}
                  </div>
                  <Card className="flex-1 border-border/50">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold">{step.title}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {step.timeframe}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {step.description}
                      </p>
                      <div className="space-y-1">
                        {step.tasks.map((task, taskIdx) => (
                          <div
                            key={taskIdx}
                            className="flex items-center gap-2 text-sm"
                          >
                            <Circle className="w-3 h-3 text-muted-foreground" />
                            {task}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Tips */}
          {roadmap.tips && roadmap.tips.length > 0 && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-primary font-semibold">
                  <Brain className="w-4 h-4" />
                  Pro Tips
                </div>
                <ul className="space-y-2">
                  {roadmap.tips.map((tip, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default function GoalsPage() {
  const { goals, addGoal, deleteGoal, completeMilestone, getGoalStats } =
    useApp();
  const [open, setOpen] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [activeView, setActiveView] = useState<"tree" | "board" | "timeline">(
    "tree",
  );
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
  const [milestoneInput, setMilestoneInput] = useState("");

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

  const handleAddMilestone = () => {
    if (milestoneInput.trim()) {
      setNewGoal({
        ...newGoal,
        milestones: [
          ...newGoal.milestones,
          {
            id: crypto.randomUUID(),
            title: milestoneInput,
            targetDate: "",
            completed: false,
          },
        ],
      });
      setMilestoneInput("");
    }
  };

  const handleRoadmapGenerated = (roadmap: AIRoadmap) => {
    const milestones = roadmap.steps.map((step) => ({
      id: crypto.randomUUID(),
      title: step.title,
      targetDate: "",
      completed: false,
    }));

    setNewGoal({
      ...newGoal,
      milestones,
    });
    setAiDialogOpen(false);
    setOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-6 pb-24">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Target className="w-7 h-7 text-primary" />
              Goals
            </h1>
            <p className="text-muted-foreground text-sm md:text-base mt-1">
              Set ambitious goals and track your journey
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  <span className="hidden sm:inline">AI Roadmap</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Generate AI Roadmap
                  </DialogTitle>
                  <DialogDescription>
                    Let AI create a personalized roadmap for your goal
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="max-h-[60vh] pr-4">
                  <AIRoadmapGenerator
                    onGenerateRoadmap={handleRoadmapGenerated}
                  />
                </ScrollArea>
              </DialogContent>
            </Dialog>

            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Goal
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md mx-4 sm:mx-auto max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle>Create New Goal</DialogTitle>
                </DialogHeader>
                <ScrollArea className="max-h-[70vh] pr-4">
                  <div className="space-y-4">
                    <Input
                      placeholder="Goal title"
                      value={newGoal.title}
                      onChange={(e) =>
                        setNewGoal({ ...newGoal, title: e.target.value })
                      }
                    />
                    <Textarea
                      placeholder="Description - What do you want to achieve?"
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
                          <SelectItem value="financial">Financial</SelectItem>
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

                    {/* Milestones */}
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Milestones</label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a milestone..."
                          value={milestoneInput}
                          onChange={(e) => setMilestoneInput(e.target.value)}
                          onKeyDown={(e) =>
                            e.key === "Enter" &&
                            (e.preventDefault(), handleAddMilestone())
                          }
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAddMilestone}
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      {newGoal.milestones.length > 0 && (
                        <div className="space-y-1 mt-2">
                          {newGoal.milestones.map((m, idx) => (
                            <div
                              key={m.id}
                              className="flex items-center gap-2 p-2 bg-muted/50 rounded text-sm"
                            >
                              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <span className="flex-1">{m.title}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() =>
                                  setNewGoal({
                                    ...newGoal,
                                    milestones: newGoal.milestones.filter(
                                      (_, i) => i !== idx,
                                    ),
                                  })
                                }
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <Button onClick={handleAddGoal} className="w-full">
                      Create Goal
                    </Button>
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-500" />
                <div className="text-2xl md:text-3xl font-bold">
                  {stats.total}
                </div>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Total Goals
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <div className="text-2xl md:text-3xl font-bold text-emerald-500">
                  {stats.completed}
                </div>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Completed
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500" />
                <div className="text-2xl md:text-3xl font-bold text-blue-500">
                  {stats.inProgress}
                </div>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                In Progress
              </p>
            </CardContent>
          </Card>
          <Card className="border-border/50">
            <CardContent className="pt-4 md:pt-6 px-3 md:px-6">
              <div className="flex items-center gap-2">
                <Milestone className="w-5 h-5 text-purple-500" />
                <div className="text-2xl md:text-3xl font-bold text-purple-500">
                  {stats.avgProgress}%
                </div>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground mt-1">
                Avg Progress
              </p>
            </CardContent>
          </Card>
        </div>

        {/* View Tabs */}
        <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="tree" className="gap-2">
              <TreePine className="w-4 h-4" />
              <span className="hidden sm:inline">Tree</span>
            </TabsTrigger>
            <TabsTrigger value="board" className="gap-2">
              <Kanban className="w-4 h-4" />
              <span className="hidden sm:inline">Board</span>
            </TabsTrigger>
            <TabsTrigger value="timeline" className="gap-2">
              <GanttChart className="w-4 h-4" />
              <span className="hidden sm:inline">Timeline</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tree" className="mt-6">
            {goals.length === 0 ? (
              <Card className="border-border/50">
                <CardContent className="pt-10 pb-10 md:pt-16 md:pb-16 text-center">
                  <Target className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
                  <p className="text-muted-foreground text-sm md:text-base mb-4">
                    No goals yet. Create one to get started!
                  </p>
                  <Button onClick={() => setOpen(true)} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Create Your First Goal
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {goals.map((goal) => (
                  <GoalTreeItem
                    key={goal.id}
                    goal={goal}
                    onDelete={deleteGoal}
                    onMilestoneComplete={completeMilestone}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="board" className="mt-6">
            <GoalKanbanBoard goals={goals} onDelete={deleteGoal} />
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
            <GoalTimeline goals={goals} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
