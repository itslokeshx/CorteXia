'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Heart } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '@/lib/context/app-context';
import { cn } from '@/lib/utils';

export default function JournalPage() {
  const { journalEntries, addJournalEntry, deleteJournalEntry } = useApp();
  const [open, setOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    mood: 5,
    energy: 5,
    tags: '',
  });

  const handleAddEntry = () => {
    if (newEntry.title.trim() && newEntry.content.trim()) {
      addJournalEntry({
        title: newEntry.title,
        content: newEntry.content,
        mood: newEntry.mood,
        energy: newEntry.energy,
        tags: newEntry.tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      setNewEntry({
        title: '',
        content: '',
        mood: 5,
        energy: 5,
        tags: '',
      });
      setOpen(false);
    }
  };

  const getMoodColor = (mood: number) => {
    if (mood >= 8) return 'text-green-600';
    if (mood >= 6) return 'text-blue-600';
    if (mood >= 4) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMoodLabel = (mood: number) => {
    if (mood >= 8) return 'Excellent';
    if (mood >= 6) return 'Good';
    if (mood >= 4) return 'Fair';
    return 'Poor';
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-balance">Journal</h1>
            <p className="text-muted-foreground mt-2">
              Reflect on your thoughts, mood, and energy levels.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" size="lg">
                <Plus className="h-4 w-4" />
                New Entry
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Journal Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Title"
                  value={newEntry.title}
                  onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                />
                <Textarea
                  placeholder="What's on your mind?"
                  value={newEntry.content}
                  onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                  rows={6}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Mood: {newEntry.mood}/10</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={newEntry.mood}
                      onChange={(e) => setNewEntry({ ...newEntry, mood: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Energy: {newEntry.energy}/10</label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={newEntry.energy}
                      onChange={(e) => setNewEntry({ ...newEntry, energy: parseInt(e.target.value) })}
                      className="w-full"
                    />
                  </div>
                </div>
                <Input
                  placeholder="Tags (comma separated)"
                  value={newEntry.tags}
                  onChange={(e) => setNewEntry({ ...newEntry, tags: e.target.value })}
                />
                <Button onClick={handleAddEntry} className="w-full">
                  Save Entry
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {journalEntries.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Heart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">No journal entries yet. Start reflecting!</p>
              </CardContent>
            </Card>
          ) : (
            journalEntries.slice(0, 20).map((entry) => (
              <Card key={entry.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle>{entry.title}</CardTitle>
                      <div className="flex items-center gap-3 mt-2">
                        <span className={cn('text-sm font-medium', getMoodColor(entry.mood))}>
                          Mood: {getMoodLabel(entry.mood)}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Energy: {entry.energy}/10
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteJournalEntry(entry.id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground line-clamp-3">{entry.content}</p>
                  {entry.tags && entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {entry.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(entry.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
