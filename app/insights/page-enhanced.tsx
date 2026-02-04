'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Lightbulb, TrendingUp, Award, Zap } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useApp } from '@/lib/context/app-context';

export default function InsightsPage() {
  const { 
    tasks, 
    habits, 
    journalEntries, 
    goals, 
    transactions, 
    generateInsights,
    insights,
    clearInsights,
    isLoading,
  } = useApp();
  
  const [displayInsights, setDisplayInsights] = useState<any[]>([]);

  useEffect(() => {
    generateInsights().then(() => {
      setDisplayInsights(insights);
    });
  }, []);

  const generateDynamicInsights = () => {
    const newInsights = [];

    // Habit streak insight
    const goodHabits = habits.filter((h) => h.streak > 7);
    if (goodHabits.length > 0) {
      newInsights.push({
        type: 'achievement',
        icon: 'award',
        title: 'Consistent Habits',
        content: `You've maintained ${goodHabits.length} habit(s) with a 7+ day streak. Excellent consistency!`,
        severity: 'success',
      });
    }

    // Task completion insight
    const completedTasks = tasks.filter((t) => t.status === 'completed').length;
    if (completedTasks > 10) {
      newInsights.push({
        type: 'achievement',
        icon: 'trending-up',
        title: 'Productive Sprint',
        content: `You've completed ${completedTasks} tasks. Keep the momentum going!`,
        severity: 'success',
      });
    }

    // Spending insight
    const weekSpent = transactions
      .filter((t) => {
        const tDate = new Date(t.date);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return t.type === 'expense' && tDate > weekAgo;
      })
      .reduce((sum, t) => sum + t.amount, 0);

    if (weekSpent > 500) {
      newInsights.push({
        type: 'warning',
        icon: 'alert',
        title: 'Spending Alert',
        content: `You've spent $${weekSpent.toFixed(2)} this week. Consider reviewing your budget.`,
        severity: 'warning',
      });
    }

    // Goal progress insight
    const slowGoals = goals.filter((g) => g.progress < 25 && g.status === 'active');
    if (slowGoals.length > 0) {
      newInsights.push({
        type: 'recommendation',
        icon: 'lightbulb',
        title: 'Goal Acceleration',
        content: `You have ${slowGoals.length} goal(s) at less than 25% progress. Consider breaking them into smaller milestones.`,
        severity: 'info',
      });
    }

    // Mood trend insight
    if (journalEntries.length >= 7) {
      const recentMood = journalEntries.slice(0, 7).reduce((sum, e) => sum + e.mood, 0) / 7;
      if (recentMood < 5) {
        newInsights.push({
          type: 'recommendation',
          icon: 'alert',
          title: 'Wellbeing Check',
          content: `Your average mood this week is ${recentMood.toFixed(1)}/10. Consider activities that boost your mood.`,
          severity: 'warning',
        });
      }
    }

    return newInsights;
  };

  const allInsights = displayInsights.length > 0 ? displayInsights : generateDynamicInsights();

  const getIcon = (type: string) => {
    switch (type) {
      case 'award':
        return <Award className="h-5 w-5" />;
      case 'trending-up':
        return <TrendingUp className="h-5 w-5" />;
      case 'alert':
        return <AlertCircle className="h-5 w-5" />;
      case 'lightbulb':
        return <Lightbulb className="h-5 w-5" />;
      default:
        return <Zap className="h-5 w-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'success':
        return 'border-green-500/30 bg-green-500/5';
      case 'warning':
        return 'border-amber-500/30 bg-amber-500/5';
      case 'info':
        return 'border-blue-500/30 bg-blue-500/5';
      default:
        return 'border-border';
    }
  };

  const getSeverityBadgeColor = (severity: string) => {
    switch (severity) {
      case 'success':
        return 'bg-green-500/10 text-green-700';
      case 'warning':
        return 'bg-amber-500/10 text-amber-700';
      case 'info':
        return 'bg-blue-500/10 text-blue-700';
      default:
        return '';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-balance">Insights</h1>
            <p className="text-muted-foreground mt-2">
              AI-powered analysis of your life patterns and recommendations.
            </p>
          </div>
          <Button 
            onClick={() => {
              clearInsights();
              const newInsights = generateDynamicInsights();
              setDisplayInsights(newInsights);
            }}
            variant="outline"
          >
            Refresh Insights
          </Button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Tasks Completed</div>
              <div className="text-3xl font-bold">{tasks.filter(t => t.status === 'completed').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Active Habits</div>
              <div className="text-3xl font-bold text-green-600">{habits.filter(h => h.streak > 0).length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Goals In Progress</div>
              <div className="text-3xl font-bold text-blue-600">{goals.filter(g => g.status === 'active').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Average Mood</div>
              <div className="text-3xl font-bold text-purple-600">
                {journalEntries.length > 0 
                  ? (journalEntries.reduce((sum, j) => sum + j.mood, 0) / journalEntries.length).toFixed(1)
                  : 'N/A'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Insights Feed */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Your Insights</h2>
          <div className="space-y-4">
            {allInsights.length === 0 ? (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <Lightbulb className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No insights yet. Keep tracking your data!</p>
                </CardContent>
              </Card>
            ) : (
              allInsights.map((insight, idx) => (
                <Card key={idx} className={`border-2 ${getSeverityColor(insight.severity)}`}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1 text-muted-foreground">
                        {getIcon(insight.icon)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold">{insight.title}</h3>
                          <Badge className={getSeverityBadgeColor(insight.severity)}>
                            {insight.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{insight.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Recommendations */}
        <Card className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-purple-200/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Recommended Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2 text-sm">
              {habits.some(h => h.streak === 0) && (
                <li className="flex items-start gap-2">
                  <span className="text-purple-600 mt-1">•</span>
                  <span>Start a new habit to build momentum. Even small habits create big changes.</span>
                </li>
              )}
              {goals.some(g => g.progress > 80) && (
                <li className="flex items-start gap-2">
                  <span className="text-green-600 mt-1">•</span>
                  <span>You're close to completing a goal! Push for the finish line.</span>
                </li>
              )}
              {tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length > 3 && (
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-1">•</span>
                  <span>Focus on high-priority tasks first. Prioritization improves productivity.</span>
                </li>
              )}
              {journalEntries.length < 3 && (
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 mt-1">•</span>
                  <span>Start journaling regularly. Reflection improves self-awareness.</span>
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
