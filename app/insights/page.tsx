"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  Clock,
  Target,
  Heart,
  DollarSign,
  Zap,
  Brain,
  BarChart3,
} from "lucide-react";
import { useApp } from "@/lib/context/app-context";
import {
  HeatmapCalendar,
  RadarChart,
  CorrelationMatrix,
} from "@/components/charts";
import { AILifeCoach } from "@/components/ai/life-coach";
import { useMemo, useState } from "react";

export default function InsightsPage() {
  const {
    insights,
    generateInsights,
    clearInsights,
    isLoading,
    tasks,
    habits,
    timeEntries,
    journalEntries,
  } = useApp();

  const handleGenerateInsights = async () => {
    await generateInsights();
  };

  // Generate heatmap data from habits/time entries
  const heatmapData = useMemo(() => {
    const last90Days: Array<{ date: string; value: number; label: string }> =
      [];
    const today = new Date();

    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      // Count habit completions and time logged
      const habitsDone = habits.filter((h) =>
        h.completions?.some((c) => c.date === dateStr && c.completed),
      ).length;
      const minutesLogged = timeEntries
        .filter((t) => t.date.split("T")[0] === dateStr)
        .reduce((s, t) => s + t.duration, 0);

      const value = habitsDone * 20 + Math.min(minutesLogged / 10, 60);

      last90Days.push({
        date: dateStr,
        value,
        label: `${habitsDone} habits, ${Math.round(minutesLogged / 60)}h logged`,
      });
    }

    return last90Days;
  }, [habits, timeEntries]);

  // Generate radar chart data
  const radarData = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    const completedTasks = tasks.filter((t) => t.status === "completed").length;
    const totalTasks = tasks.length || 1;
    const habitsCompleted = habits.filter((h) =>
      h.completions?.some((c) => c.date === today && c.completed),
    ).length;
    const totalHabits = habits.length || 1;
    const todayTime = timeEntries
      .filter((t) => t.date.split("T")[0] === today)
      .reduce((s, t) => s + t.duration, 0);
    const avgMood =
      journalEntries.length > 0
        ? journalEntries.slice(0, 7).reduce((s, e) => s + (e.mood || 5), 0) /
          Math.min(journalEntries.length, 7)
        : 5;
    const avgEnergy =
      journalEntries.length > 0
        ? journalEntries.slice(0, 7).reduce((s, e) => s + (e.energy || 5), 0) /
          Math.min(journalEntries.length, 7)
        : 5;

    return [
      { label: "Tasks", value: (completedTasks / totalTasks) * 100 },
      { label: "Habits", value: (habitsCompleted / totalHabits) * 100 },
      { label: "Focus", value: Math.min(todayTime / 4, 100) },
      { label: "Mood", value: avgMood * 10 },
      { label: "Energy", value: avgEnergy * 10 },
      { label: "Goals", value: 65 }, // Placeholder
    ];
  }, [tasks, habits, timeEntries, journalEntries]);

  // Correlation matrix data
  const correlationDomains = [
    { id: "habits", label: "Habits", color: "#10b981" },
    { id: "tasks", label: "Tasks", color: "#3b82f6" },
    { id: "time", label: "Focus", color: "#8b5cf6" },
    { id: "mood", label: "Mood", color: "#ec4899" },
    { id: "energy", label: "Energy", color: "#f59e0b" },
  ];

  const correlations = [
    {
      from: "habits",
      to: "mood",
      value: 0.72,
      insight: "Consistent habits strongly boost your mood",
    },
    {
      from: "habits",
      to: "energy",
      value: 0.65,
      insight: "Morning routines correlate with higher energy",
    },
    {
      from: "time",
      to: "tasks",
      value: 0.81,
      insight: "Deep focus sessions drive task completion",
    },
    {
      from: "energy",
      to: "time",
      value: 0.58,
      insight: "Higher energy enables longer focus sessions",
    },
    {
      from: "mood",
      to: "tasks",
      value: 0.45,
      insight: "Better mood slightly improves productivity",
    },
    {
      from: "mood",
      to: "energy",
      value: 0.7,
      insight: "Mood and energy are closely linked",
    },
    {
      from: "habits",
      to: "tasks",
      value: 0.4,
      insight: "Habits create structure for task work",
    },
    {
      from: "habits",
      to: "time",
      value: 0.35,
      insight: "Routine habits support focus time",
    },
    {
      from: "energy",
      to: "tasks",
      value: 0.55,
      insight: "Energy levels affect task completion rate",
    },
    {
      from: "time",
      to: "mood",
      value: 0.3,
      insight: "Productive days improve mood slightly",
    },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case "pattern":
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case "recommendation":
        return <Lightbulb className="h-5 w-5 text-yellow-500" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case "achievement":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default:
        return <Sparkles className="h-5 w-5 text-purple-500" />;
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6 pb-24">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">AI Insights</h1>
            <p className="text-muted-foreground text-sm md:text-base mt-1">
              Deep analytics and personalized recommendations
            </p>
          </div>
        </div>

        <Tabs defaultValue="coach" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="coach" className="gap-2">
              <Brain className="w-4 h-4" />
              AI Life Coach
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="coach">
            <AILifeCoach />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="flex justify-end gap-2">
              {insights.length > 0 && (
                <Button variant="outline" size="sm" onClick={clearInsights}>
                  Clear
                </Button>
              )}
              <Button
                className="gap-2"
                onClick={handleGenerateInsights}
                disabled={isLoading}
              >
                <Sparkles className="h-4 w-4" />
                {isLoading ? "Analyzing..." : "Generate"}
              </Button>
            </div>

            {/* Analytics Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Radar Chart - Life Balance */}
              <RadarChart
                data={radarData}
                title="Life Balance Score"
                color="#8b5cf6"
              />

              {/* Correlation Matrix */}
              <CorrelationMatrix
                domains={correlationDomains}
                correlations={correlations}
                title="Domain Correlations"
              />
            </div>

            {/* Activity Heatmap */}
            <HeatmapCalendar
              data={heatmapData}
              title="Activity History"
              colorScale="green"
            />

            {/* AI Generated Insights */}
            {insights.length > 0 && (
              <div className="space-y-3 md:space-y-4">
                <h2 className="text-lg md:text-2xl font-semibold">
                  AI Analysis
                </h2>
                {insights.map((insight) => (
                  <Card
                    key={insight.id}
                    className={`border-l-4 border-border/50 ${
                      insight.severity === "critical"
                        ? "border-l-red-500"
                        : insight.severity === "warning"
                          ? "border-l-amber-500"
                          : insight.severity === "success"
                            ? "border-l-emerald-500"
                            : "border-l-blue-500"
                    }`}
                  >
                    <CardContent className="pt-4 md:pt-6 px-4 md:px-6">
                      <div className="flex items-start gap-3 md:gap-4">
                        {getIcon(insight.type)}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base md:text-lg">
                            {insight.title}
                          </h3>
                          <p className="text-muted-foreground text-sm mt-1 md:mt-2">
                            {insight.content}
                          </p>
                          <div className="flex items-center gap-2 mt-2 md:mt-3 flex-wrap">
                            <Badge
                              variant="outline"
                              className="capitalize text-[10px] md:text-xs"
                            >
                              {insight.type}
                            </Badge>
                            <Badge
                              variant={
                                insight.actionable ? "default" : "secondary"
                              }
                              className="text-[10px] md:text-xs"
                            >
                              {insight.actionable ? "Actionable" : "Info"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Insight Categories */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <Card className="hover:shadow-md transition-shadow border-border/50">
                <CardHeader className="pb-2 px-4 md:px-6">
                  <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                    <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
                    Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 md:px-6">
                  <p className="text-xs md:text-sm text-muted-foreground">
                    AI detects correlations between habits and wellbeing.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow border-border/50">
                <CardHeader className="pb-2 px-4 md:px-6">
                  <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                    <Lightbulb className="h-4 w-4 md:h-5 md:w-5 text-amber-500" />
                    Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 md:px-6">
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Personalized suggestions to optimize your time.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow border-border/50">
                <CardHeader className="pb-2 px-4 md:px-6">
                  <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                    <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-red-500" />
                    Warnings
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 md:px-6">
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Alerts about burnout risk and overcommitment.
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow border-border/50">
                <CardHeader className="pb-2 px-4 md:px-6">
                  <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                    <CheckCircle2 className="h-4 w-4 md:h-5 md:w-5 text-emerald-500" />
                    Wins
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 md:px-6">
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Recognition of your progress and milestones.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
