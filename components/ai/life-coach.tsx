"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useApp } from "@/lib/context/app-context";
import { cn } from "@/lib/utils";
import {
  Brain,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Target,
  Clock,
  DollarSign,
  Heart,
  Send,
  Loader2,
  Lightbulb,
  RefreshCw,
  ChevronRight,
  Flame,
  Calendar,
  BarChart3,
} from "lucide-react";

interface AIInsight {
  type: "strength" | "warning" | "opportunity" | "suggestion";
  domain: string;
  title: string;
  description: string;
  action?: string;
}

interface LifeAnalysis {
  overallScore: number;
  trend: "up" | "down" | "stable";
  insights: AIInsight[];
  dailyPriorities: string[];
  weeklyFocus: string;
  correlations: string[];
}

// Domain icons
const DOMAIN_ICONS: Record<string, React.ElementType> = {
  tasks: CheckCircle2,
  habits: Flame,
  time: Clock,
  finance: DollarSign,
  goals: Target,
  health: Heart,
  wellbeing: Heart,
};

// Insight type styling
const INSIGHT_STYLES: Record<string, { bg: string; icon: React.ElementType; color: string }> = {
  strength: { bg: "bg-emerald-100 dark:bg-emerald-900/30", icon: TrendingUp, color: "text-emerald-500" },
  warning: { bg: "bg-red-100 dark:bg-red-900/30", icon: AlertTriangle, color: "text-red-500" },
  opportunity: { bg: "bg-blue-100 dark:bg-blue-900/30", icon: Lightbulb, color: "text-blue-500" },
  suggestion: { bg: "bg-purple-100 dark:bg-purple-900/30", icon: Sparkles, color: "text-purple-500" },
};

export function AILifeCoach() {
  const {
    tasks,
    habits,
    goals,
    timeEntries,
    journalEntries,
    getFinanceStats,
  } = useApp();

  const [analysis, setAnalysis] = useState<LifeAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userQuestion, setUserQuestion] = useState("");
  const [customResponse, setCustomResponse] = useState<string | null>(null);
  const [isAskingQuestion, setIsAskingQuestion] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const financeStats = getFinanceStats();

  // Generate local analysis (no AI needed)
  const generateLocalAnalysis = useCallback((): LifeAnalysis => {
    const insights: AIInsight[] = [];
    let score = 50;

    // Task analysis
    const pendingTasks = tasks.filter((t) => t.status !== "completed");
    const completedToday = tasks.filter(
      (t) => t.status === "completed" && t.completedAt?.split("T")[0] === today
    ).length;
    const overdueTasks = tasks.filter(
      (t) => t.status !== "completed" && t.dueDate && t.dueDate < today
    ).length;

    if (completedToday >= 3) {
      score += 10;
      insights.push({
        type: "strength",
        domain: "tasks",
        title: "Productive day!",
        description: `You've completed ${completedToday} tasks today. Keep up the momentum!`,
      });
    }

    if (overdueTasks > 3) {
      score -= 10;
      insights.push({
        type: "warning",
        domain: "tasks",
        title: `${overdueTasks} overdue tasks`,
        description: "Consider prioritizing these or rescheduling to reduce stress.",
        action: "Review and reschedule overdue tasks",
      });
    }

    // Habit analysis
    const activeHabits = habits.filter((h) => h.active);
    const completedHabitsToday = habits.filter((h) =>
      h.completions?.some((c) => c.date === today && c.completed)
    ).length;
    const totalStreaks = habits.reduce((sum, h) => sum + (h.streak || 0), 0);
    const habitCompletionRate = activeHabits.length > 0
      ? (completedHabitsToday / activeHabits.length) * 100
      : 0;

    if (habitCompletionRate >= 80) {
      score += 15;
      insights.push({
        type: "strength",
        domain: "habits",
        title: "Habits on track!",
        description: `${Math.round(habitCompletionRate)}% of habits completed today. Consistency builds character!`,
      });
    } else if (habitCompletionRate < 50 && activeHabits.length > 0) {
      score -= 5;
      insights.push({
        type: "opportunity",
        domain: "habits",
        title: "Habit check-in",
        description: `Only ${completedHabitsToday}/${activeHabits.length} habits done. Small wins add up!`,
        action: "Complete at least one more habit today",
      });
    }

    if (totalStreaks > 20) {
      insights.push({
        type: "strength",
        domain: "habits",
        title: "Strong streaks!",
        description: `${totalStreaks} total streak days across all habits. You're building lasting change!`,
      });
    }

    // Time analysis
    const todayMinutes = timeEntries
      .filter((t) => t.date.split("T")[0] === today)
      .reduce((s, t) => s + t.duration, 0);
    const weekMinutes = timeEntries
      .filter((t) => {
        const entryDate = new Date(t.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return entryDate >= weekAgo;
      })
      .reduce((s, t) => s + t.duration, 0);

    if (todayMinutes >= 180) {
      score += 10;
      insights.push({
        type: "strength",
        domain: "time",
        title: "Deep focus achieved",
        description: `${Math.round(todayMinutes / 60)} hours of focused time today. Quality work!`,
      });
    } else if (todayMinutes < 60 && new Date().getHours() > 14) {
      insights.push({
        type: "suggestion",
        domain: "time",
        title: "Schedule focus time",
        description: "Consider blocking time for deep work in the afternoon.",
        action: "Block a 90-minute focus session",
      });
    }

    // Goal analysis
    const activeGoals = goals.filter((g) => g.status === "active");
    const avgProgress = activeGoals.length > 0
      ? activeGoals.reduce((s, g) => s + g.progress, 0) / activeGoals.length
      : 0;

    if (avgProgress >= 60) {
      score += 10;
      insights.push({
        type: "strength",
        domain: "goals",
        title: "Goals progressing well",
        description: `Average ${Math.round(avgProgress)}% progress across active goals.`,
      });
    }

    const stalledGoals = activeGoals.filter((g) => g.progress < 10);
    if (stalledGoals.length > 0) {
      insights.push({
        type: "opportunity",
        domain: "goals",
        title: `${stalledGoals.length} goals need attention`,
        description: "Some goals haven't made progress yet. Break them into smaller steps.",
        action: "Add milestones to stalled goals",
      });
    }

    // Finance analysis
    if (financeStats.expenses > financeStats.income * 0.8) {
      score -= 5;
      insights.push({
        type: "warning",
        domain: "finance",
        title: "High spending ratio",
        description: "Expenses are at 80%+ of income. Review discretionary spending.",
        action: "Review this month's expenses",
      });
    } else if (financeStats.savings > 0) {
      score += 5;
      insights.push({
        type: "strength",
        domain: "finance",
        title: "Positive savings",
        description: `You've saved $${financeStats.savings.toFixed(0)} this month!`,
      });
    }

    // Journal/wellbeing analysis
    const recentJournals = journalEntries.filter((j) => {
      const entryDate = new Date(j.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return entryDate >= weekAgo;
    });

    const avgMood = recentJournals.length > 0
      ? recentJournals.reduce((s, j) => s + (j.mood || 5), 0) / recentJournals.length
      : 5;

    if (avgMood >= 7) {
      score += 10;
      insights.push({
        type: "strength",
        domain: "wellbeing",
        title: "Great mood this week",
        description: "Your journal entries show positive sentiment. Keep doing what works!",
      });
    } else if (avgMood < 4) {
      insights.push({
        type: "opportunity",
        domain: "wellbeing",
        title: "Consider self-care",
        description: "Recent entries suggest low mood. Prioritize activities that recharge you.",
        action: "Schedule relaxation or social time",
      });
    }

    // Generate correlations
    const correlations: string[] = [];

    if (habitCompletionRate > 70 && avgMood > 6) {
      correlations.push("High habit completion correlates with better mood scores");
    }
    if (todayMinutes > 120 && completedToday > 2) {
      correlations.push("Focused time blocks lead to more task completions");
    }
    if (totalStreaks > 10 && avgProgress > 40) {
      correlations.push("Strong habits are driving goal progress");
    }

    // Calculate trend
    const trend = score >= 60 ? "up" : score <= 40 ? "down" : "stable";

    // Generate daily priorities
    const priorities: string[] = [];
    if (overdueTasks > 0) priorities.push("Clear overdue tasks");
    if (completedHabitsToday < activeHabits.length)
      priorities.push("Complete remaining habits");
    if (todayMinutes < 60) priorities.push("Log focused work time");
    if (priorities.length === 0) priorities.push("Maintain momentum!");

    // Weekly focus
    const weeklyFocus = stalledGoals.length > 0
      ? "Focus on advancing stalled goals"
      : avgProgress < 50
        ? "Push goal progress forward"
        : "Maintain balance across all areas";

    return {
      overallScore: Math.min(100, Math.max(0, score)),
      trend,
      insights: insights.slice(0, 6),
      dailyPriorities: priorities.slice(0, 3),
      weeklyFocus,
      correlations,
    };
  }, [tasks, habits, goals, timeEntries, journalEntries, financeStats, today]);

  const handleAnalyze = () => {
    setIsLoading(true);
    // Simulate loading for better UX
    setTimeout(() => {
      const localAnalysis = generateLocalAnalysis();
      setAnalysis(localAnalysis);
      setIsLoading(false);
    }, 800);
  };

  const handleAskQuestion = async () => {
    if (!userQuestion.trim()) return;

    setIsAskingQuestion(true);
    setCustomResponse(null);

    try {
      const response = await fetch("http://localhost:3001/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userQuestion,
          context: {
            tasks: tasks.slice(0, 10),
            habits: habits.slice(0, 10),
            goals: goals.slice(0, 5),
            timeEntries: timeEntries.slice(0, 10),
            journalEntries: journalEntries.slice(0, 5),
            transactions: [],
          },
        }),
      });

      const data = await response.json();
      setCustomResponse(data.response || data.message || "Unable to generate response.");
    } catch {
      setCustomResponse(
        "I couldn't connect to the AI server. Here's what I can tell you: " +
          generateLocalAnalysis().insights.map((i) => i.title).join(", ")
      );
    } finally {
      setIsAskingQuestion(false);
      setUserQuestion("");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-blue-500/10 border-purple-500/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0"
            >
              <Brain className="w-7 h-7 text-white" />
            </motion.div>

            <div className="flex-1">
              <h2 className="text-xl font-bold flex items-center gap-2">
                AI Life Coach
                <Sparkles className="w-5 h-5 text-yellow-500" />
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Get personalized insights based on your complete life data across all domains.
              </p>
              <Button
                onClick={handleAnalyze}
                disabled={isLoading}
                className="mt-4 gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Analyze My Life
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Results */}
      <AnimatePresence mode="wait">
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Life Score */}
            <Card className="border-border/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Life Score</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-4xl font-bold">{analysis.overallScore}</span>
                      <span className="text-muted-foreground">/100</span>
                      {analysis.trend === "up" && (
                        <TrendingUp className="w-5 h-5 text-emerald-500" />
                      )}
                      {analysis.trend === "down" && (
                        <TrendingDown className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </div>
                  <div className="w-20 h-20 relative">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className="text-gray-200 dark:text-gray-800"
                      />
                      <motion.circle
                        cx="50"
                        cy="50"
                        r="40"
                        fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={2 * Math.PI * 40}
                        initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                        animate={{
                          strokeDashoffset:
                            2 * Math.PI * 40 * (1 - analysis.overallScore / 100),
                        }}
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#8B5CF6" />
                          <stop offset="100%" stopColor="#EC4899" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Daily Priorities */}
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  Today's Priorities
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.dailyPriorities.map((priority, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20"
                  >
                    <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs flex items-center justify-center font-bold">
                      {idx + 1}
                    </span>
                    <span className="text-sm">{priority}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Insights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {analysis.insights.map((insight, idx) => {
                const style = INSIGHT_STYLES[insight.type];
                const Icon = style.icon;
                const DomainIcon = DOMAIN_ICONS[insight.domain] || BarChart3;

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <Card className={cn("border-border/50", style.bg)}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center",
                              style.color,
                              "bg-white dark:bg-gray-900"
                            )}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-semibold text-sm">{insight.title}</h4>
                              <Badge variant="outline" className="text-[9px] gap-1">
                                <DomainIcon className="w-3 h-3" />
                                {insight.domain}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {insight.description}
                            </p>
                            {insight.action && (
                              <Button
                                variant="link"
                                size="sm"
                                className="h-auto p-0 mt-2 text-xs gap-1"
                              >
                                {insight.action}
                                <ChevronRight className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>

            {/* Correlations */}
            {analysis.correlations.length > 0 && (
              <Card className="border-border/50 bg-gradient-to-r from-purple-500/5 to-pink-500/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-500" />
                    AI Discovered Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {analysis.correlations.map((correlation, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                      {correlation}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Weekly Focus */}
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Target className="w-6 h-6 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Weekly Focus</p>
                    <p className="font-semibold">{analysis.weeklyFocus}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ask AI Section */}
      <Card className="border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Brain className="w-5 h-5 text-primary" />
            Ask Your AI Coach
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Ask anything about your productivity, habits, goals..."
              value={userQuestion}
              onChange={(e) => setUserQuestion(e.target.value)}
              className="resize-none"
              rows={2}
            />
            <Button
              onClick={handleAskQuestion}
              disabled={isAskingQuestion || !userQuestion.trim()}
              className="h-auto"
            >
              {isAskingQuestion ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>

          <AnimatePresence>
            {customResponse && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-lg bg-muted/50 text-sm"
              >
                {customResponse}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
