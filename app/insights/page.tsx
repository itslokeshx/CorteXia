'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sparkles, TrendingUp, AlertCircle, CheckCircle2, Lightbulb } from 'lucide-react';
import { useApp } from '@/lib/context/app-context';

export default function InsightsPage() {
  const { insights, generateInsights, clearInsights, isLoading } = useApp();

  const handleGenerateInsights = async () => {
    await generateInsights();
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'pattern':
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case 'recommendation':
        return <Lightbulb className="h-5 w-5 text-yellow-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'achievement':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default:
        return <Sparkles className="h-5 w-5 text-purple-500" />;
    }
  };

  return (
    <AppLayout>
      <div className="space-y-8 pb-32">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-balance">AI Insights</h1>
            <p className="text-muted-foreground mt-2">
              Discover patterns and get personalized recommendations based on your data.
            </p>
          </div>
          <div className="flex gap-2">
            {insights.length > 0 && (
              <Button variant="outline" onClick={clearInsights}>
                Clear
              </Button>
            )}
            <Button className="gap-2" onClick={handleGenerateInsights} disabled={isLoading}>
              <Sparkles className="h-4 w-4" />
              {isLoading ? 'Analyzing...' : 'Generate Insights'}
            </Button>
          </div>
        </div>

        {insights.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p className="text-muted-foreground mb-4">No insights yet. Click "Generate Insights" to analyze your data.</p>
              <Button onClick={handleGenerateInsights} disabled={isLoading}>
                {isLoading ? 'Analyzing...' : 'Generate Insights'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {insights.map((insight) => (
              <Card key={insight.id} className={`border-l-4 ${
                insight.severity === 'critical' ? 'border-l-red-500' :
                insight.severity === 'warning' ? 'border-l-yellow-500' :
                insight.severity === 'success' ? 'border-l-green-500' :
                'border-l-blue-500'
              }`}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    {getIcon(insight.type)}
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{insight.title}</h3>
                      <p className="text-muted-foreground mt-2">{insight.content}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="outline" className="capitalize">
                          {insight.type}
                        </Badge>
                        <Badge variant={insight.actionable ? 'default' : 'secondary'}>
                          {insight.actionable ? 'Actionable' : 'Info'}
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Patterns
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                AI detects correlations between your habits, productivity, and wellbeing to identify what works best for you.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Personalized suggestions to optimize your time, improve habits, and reach your goals faster.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Warnings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Alerts about potential issues like burnout, overcommitment, or spending patterns that need attention.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Recognition of your progress, milestones reached, and positive trends in your personal growth.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
