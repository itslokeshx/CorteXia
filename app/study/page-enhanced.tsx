'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Plus, BookOpen, Clock, Zap, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '@/lib/context/app-context';

export default function StudyPage() {
  const { studySessions, addStudySession, deleteStudySession } = useApp();
  const [open, setOpen] = useState(false);
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [newSession, setNewSession] = useState({
    subject: '',
    topic: '',
    duration: '60',
    difficulty: 'medium' as const,
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleAddSession = () => {
    if (newSession.subject.trim() && newSession.duration) {
      addStudySession({
        ...newSession,
        duration: parseInt(newSession.duration),
      });
      setNewSession({
        subject: '',
        topic: '',
        duration: '60',
        difficulty: 'medium',
        notes: '',
        date: new Date().toISOString().split('T')[0],
      });
      setOpen(false);
    }
  };

  const subjectStats = studySessions.reduce((acc, session) => {
    acc[session.subject] = (acc[session.subject] || 0) + session.duration;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(subjectStats).map(([subject, hours]) => ({
    subject,
    hours: Math.round((hours / 60) * 10) / 10,
  }));

  const totalHours = Object.values(subjectStats).reduce((sum, mins) => sum + mins, 0) / 60;

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-balance">Study</h1>
            <p className="text-muted-foreground mt-2">
              Track learning sessions and study progress.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" size="lg">
                <Plus className="h-4 w-4" />
                New Session
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
                  placeholder="Topic"
                  value={newSession.topic}
                  onChange={(e) => setNewSession({ ...newSession, topic: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Duration (minutes)"
                  value={newSession.duration}
                  onChange={(e) => setNewSession({ ...newSession, duration: e.target.value })}
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
                  placeholder="Notes (optional)"
                  value={newSession.notes}
                  onChange={(e) => setNewSession({ ...newSession, notes: e.target.value })}
                />
                <Input
                  type="date"
                  value={newSession.date}
                  onChange={(e) => setNewSession({ ...newSession, date: e.target.value })}
                />
                <Button onClick={handleAddSession} className="w-full">
                  Log Session
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Total Hours</div>
              <div className="text-3xl font-bold">{totalHours.toFixed(1)}h</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Sessions</div>
              <div className="text-3xl font-bold">{studySessions.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Subjects</div>
              <div className="text-3xl font-bold">{Object.keys(subjectStats).length}</div>
            </CardContent>
          </Card>
        </div>

        {chartData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Study by Subject</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value}h`} />
                  <Bar dataKey="hours" fill="#06B6D4" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        <div>
          <h2 className="text-lg font-semibold mb-4">Recent Sessions</h2>
          <div className="space-y-2">
            {studySessions.length === 0 ? (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">No study sessions yet. Start learning!</p>
                </CardContent>
              </Card>
            ) : (
              studySessions.slice(0, 10).map((session) => (
                <Card key={session.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <p className="font-medium">{session.subject}</p>
                      <p className="text-sm text-muted-foreground">{session.topic}</p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {session.duration}m
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-secondary text-secondary-foreground capitalize">
                          {session.difficulty}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteStudySession(session.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
