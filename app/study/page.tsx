'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Plus, BookOpen, Clock, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '@/lib/context/app-context';

export default function StudyPage() {
  const { studySessions, addStudySession, deleteStudySession } = useApp();
  const [open, setOpen] = useState(false);
  const [newSession, setNewSession] = useState({
    subject: '',
    duration: '60',
    pomodoros: 1,
    difficulty: 'medium' as const,
    topic: '',
    startTime: new Date().toISOString().split('T')[1].slice(0, 5),
    endTime: new Date().toISOString().split('T')[1].slice(0, 5),
  });

  const handleAddSession = () => {
    if (newSession.subject.trim() && newSession.duration) {
      addStudySession({
        ...newSession,
        duration: parseInt(newSession.duration),
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
      });
      setNewSession({
        subject: '',
        duration: '60',
        pomodoros: 1,
        difficulty: 'medium',
        topic: '',
        startTime: new Date().toISOString().split('T')[1].slice(0, 5),
        endTime: new Date().toISOString().split('T')[1].slice(0, 5),
      });
      setOpen(false);
    }
  };

  const totalHours = studySessions.reduce((sum, s) => sum + s.duration, 0) / 60;
  const avgFocus = studySessions.length > 0
    ? Math.round(studySessions.reduce((sum, s) => sum + (s.difficulty === 'hard' ? 95 : s.difficulty === 'medium' ? 75 : 50), 0) / studySessions.length)
    : 0;

  const bySubject = studySessions.reduce((acc, s) => {
    const existing = acc.find(x => x.name === s.subject);
    if (existing) {
      existing.hours += s.duration / 60;
    } else {
      acc.push({ name: s.subject, hours: s.duration / 60 });
    }
    return acc;
  }, [] as { name: string; hours: number }[]);

  return (
    <AppLayout>
      <div className="space-y-8 pb-32">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-balance">Study</h1>
            <p className="text-muted-foreground mt-2">
              Track study sessions and monitor learning progress by subject.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" size="lg">
                <Plus className="h-4 w-4" />
                Log Session
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Log Study Session</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Subject"
                  value={newSession.subject}
                  onChange={(e) => setNewSession({ ...newSession, subject: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Duration (minutes)"
                  value={newSession.duration}
                  onChange={(e) => setNewSession({ ...newSession, duration: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Pomodoros"
                  value={newSession.pomodoros}
                  onChange={(e) => setNewSession({ ...newSession, pomodoros: parseInt(e.target.value) })}
                />
                <Select value={newSession.difficulty} onValueChange={(v) => setNewSession({ ...newSession, difficulty: v as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Topic (optional)"
                  value={newSession.topic}
                  onChange={(e) => setNewSession({ ...newSession, topic: e.target.value })}
                />
                <Button onClick={handleAddSession} className="w-full">
                  Log Session
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">{studySessions.length}</div>
              <p className="text-sm text-muted-foreground">Sessions</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">{totalHours.toFixed(1)}h</div>
              <p className="text-sm text-muted-foreground">Total Hours</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-purple-600">{avgFocus}%</div>
              <p className="text-sm text-muted-foreground">Avg Focus</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-blue-600">{studySessions.reduce((sum, s) => sum + s.pomodoros, 0)}</div>
              <p className="text-sm text-muted-foreground">Pomodoros</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart */}
        {bySubject.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Study Hours by Subject</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={bySubject}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value.toFixed(1)}h`} />
                  <Bar dataKey="hours" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Sessions List */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
          </CardHeader>
          <CardContent>
            {studySessions.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No study sessions yet. Start learning!</p>
            ) : (
              <div className="space-y-2">
                {studySessions.slice(0, 10).map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors">
                    <div className="flex-1">
                      <p className="font-medium">{session.subject}</p>
                      <div className="flex gap-2 mt-1">
                        <span className="text-xs px-2 py-1 rounded bg-secondary">
                          {session.duration}m
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-secondary capitalize">
                          {session.difficulty}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteStudySession(session.id)}
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
