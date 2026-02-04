'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Plus, Clock, TrendingUp, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '@/lib/context/app-context';

export default function TimeAnalyticsPage() {
  const { timeEntries, addTimeEntry, deleteTimeEntry, getWeeklyStats, getTodayStats, getFocusQualityBreakdown } = useApp();
  const [open, setOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    task: '',
    category: 'work' as const,
    duration: '30',
    date: new Date().toISOString().split('T')[0],
    focusQuality: 'moderate' as const,
    interruptions: '0',
    notes: '',
  });

  const todayStats = getTodayStats();
  const weeklyStats = getWeeklyStats();
  const focusQuality = getFocusQualityBreakdown();

  const categoryData = Object.entries(weeklyStats.byCategory).map(([category, minutes]) => ({
    name: category.charAt(0).toUpperCase() + category.slice(1),
    value: Math.round(minutes / 60 * 10) / 10,
  }));

  const focusQualityData = Object.entries(focusQuality).map(([quality, data]) => ({
    name: quality.charAt(0).toUpperCase() + quality.slice(1),
    value: Math.round(data.percentage * 10) / 10,
    color: quality === 'deep' ? '#10B981' : quality === 'moderate' ? '#F59E0B' : '#EF4444',
  }));

  const handleAddEntry = () => {
    if (newEntry.task.trim() && newEntry.duration) {
      addTimeEntry({
        ...newEntry,
        duration: parseInt(newEntry.duration),
        interruptions: parseInt(newEntry.interruptions),
      });
      setNewEntry({
        task: '',
        category: 'work',
        duration: '30',
        date: new Date().toISOString().split('T')[0],
        focusQuality: 'moderate',
        interruptions: '0',
        notes: '',
      });
      setOpen(false);
    }
  };

  const totalHours = 8; // Declare totalHours variable
  const DAILY_DATA = [
    { day: 'Monday', work: 200, learning: 150, admin: 100 },
    { day: 'Tuesday', work: 220, learning: 160, admin: 110 },
    { day: 'Wednesday', work: 240, learning: 170, admin: 120 },
    { day: 'Thursday', work: 260, learning: 180, admin: 130 },
    { day: 'Friday', work: 280, learning: 190, admin: 140 },
    { day: 'Saturday', work: 300, learning: 200, admin: 150 },
    { day: 'Sunday', work: 320, learning: 210, admin: 160 },
  ]; // Declare DAILY_DATA variable

  const CATEGORY_DISTRIBUTION = [
    { name: 'Work', value: 400, color: '#8B5CF6' },
    { name: 'Learning', value: 300, color: '#06B6D4' },
    { name: 'Admin', value: 200, color: '#F59E0B' },
  ]; // Declare CATEGORY_DISTRIBUTION variable

  const QUALITY_STATS = [
    { quality: 'Deep', hours: 4.75, color: '#10B981' },
    { quality: 'Moderate', hours: 3.25, color: '#F59E0B' },
    { quality: 'Shallow', hours: 0, color: '#EF4444' },
  ]; // Declare QUALITY_STATS variable

  const timeLogs = [
    { id: 1, category: 'Work', duration: 60, quality: 'focused', color: '#10B981' },
    { id: 2, category: 'Learning', duration: 45, quality: 'distracted', color: '#EF4444' },
    { id: 3, category: 'Admin', duration: 30, quality: 'moderate', color: '#F59E0B' },
  ]; // Declare timeLogs variable

  return (
    <AppLayout>
      <div className="space-y-8 pb-32">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-balance">Time Analytics</h1>
            <p className="text-muted-foreground mt-2">
              {(todayStats.totalMinutes / 60).toFixed(1)} hours logged today
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" size="lg">
                <Plus className="h-4 w-4" />
                Log Time
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Log Time Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Task name"
                  value={newEntry.task}
                  onChange={(e) => setNewEntry({ ...newEntry, task: e.target.value })}
                />
                <Select value={newEntry.category} onValueChange={(v) => setNewEntry({ ...newEntry, category: v as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="work">Work</SelectItem>
                    <SelectItem value="study">Study</SelectItem>
                    <SelectItem value="health">Health</SelectItem>
                    <SelectItem value="personal">Personal</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Duration (minutes)"
                  value={newEntry.duration}
                  onChange={(e) => setNewEntry({ ...newEntry, duration: e.target.value })}
                />
                <Select value={newEntry.focusQuality} onValueChange={(v) => setNewEntry({ ...newEntry, focusQuality: v as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="deep">Deep Focus</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="shallow">Shallow</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="Interruptions"
                  value={newEntry.interruptions}
                  onChange={(e) => setNewEntry({ ...newEntry, interruptions: e.target.value })}
                />
                <Input
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                />
                <Button onClick={handleAddEntry} className="w-full">
                  Log Entry
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">Total Hours</div>
              <div className="text-3xl font-bold">{(todayStats.totalMinutes / 60).toFixed(1)}</div>
              <div className="text-xs text-muted-foreground mt-2">vs 8h goal</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">Deep Focus</div>
              <div className="text-3xl font-bold text-green-600">{(todayStats.deepFocus / 60).toFixed(1)}h</div>
              <div className="text-xs text-muted-foreground mt-2">Peak focus time</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">Interruptions</div>
              <div className="text-3xl font-bold text-amber-600">{todayStats.totalInterruptions}</div>
              <div className="text-xs text-muted-foreground mt-2">Today</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground mb-1">Entries</div>
              <div className="text-3xl font-bold text-blue-600">{todayStats.entries.length}</div>
              <div className="text-xs text-muted-foreground mt-2">Logged today</div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        {categoryData.length > 0 && (
          <div className="grid grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Time by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => `${value}h`} />
                    <Bar dataKey="value" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Focus Quality</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={focusQualityData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}%`}
                    >
                      {focusQualityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Recent Entries */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Time Entries</CardTitle>
          </CardHeader>
          <CardContent>
            {timeEntries.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No time entries yet. Start logging!</p>
            ) : (
              <div className="space-y-2">
                {timeEntries.slice(0, 10).map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
                    <div className="flex-1">
                      <p className="font-medium">{entry.task}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground capitalize">
                          {entry.category}
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground">
                          {entry.duration}m
                        </span>
                        <span className={`text-xs px-2 py-1 rounded text-white ${
                          entry.focusQuality === 'deep' ? 'bg-green-500' :
                          entry.focusQuality === 'moderate' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}>
                          {entry.focusQuality} focus
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteTimeEntry(entry.id)}
                      className="text-destructive hover:bg-destructive/10 p-2 rounded"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
