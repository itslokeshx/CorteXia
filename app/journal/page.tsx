'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, PenTool, Trash2, Calendar, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useApp } from '@/lib/context/app-context';

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  date: string;
  mood: string;
  tags: string[];
  aiSummary: string;
}

const SAMPLE_ENTRIES = [
  {
    id: '1',
    title: 'Learning TypeScript',
    content: `Started learning TypeScript and it's becoming clearer with each day. 
    The type system is a game changer for maintaining large codebases.`,
    date: '1 week ago',
    mood: 'great',
    tags: ['typescript', 'programming', 'growth'],
    aiSummary: 'Began learning TypeScript, impressed by its type system.',
  },
  {
    id: '2',
    title: 'Project Setbacks',
    content: `Faced some setbacks with the current project. 
    But instead of giving up, I took a step back, reassessed, and found a better approach.
    
    Realized that obstacles are opportunities to learn and improve.
    Cold shower in the morning helped reset my mindset.`,
    date: '2 days ago',
    mood: 'difficult',
    tags: ['growth', 'challenges', 'resilience'],
    aiSummary: 'Faced project setbacks but demonstrated resilience by reassessing approach and finding solutions.',
  },
];

const MOOD_COLORS = {
  great: '#10B981',
  good: '#3B82F6',
  neutral: '#F59E0B',
  difficult: '#EF4444',
};

const MOOD_LABELS = {
  great: '🌟 Great',
  good: '😊 Good',
  neutral: '😐 Neutral',
  difficult: '😔 Difficult',
};

export default function JournalPage() {
  const { journalEntries, addJournalEntry, deleteJournalEntry } = useApp();
  const [open, setOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    date: new Date().toISOString().split('T')[0],
    mood: 5,
    energy: 5,
    focus: 5,
  });

  const handleAddEntry = () => {
    if (newEntry.title.trim() && newEntry.content.trim()) {
      addJournalEntry(newEntry);
      setNewEntry({
        title: '',
        content: '',
        date: new Date().toISOString().split('T')[0],
        mood: 5,
        energy: 5,
        focus: 5,
      });
      setOpen(false);
    }
  };

  const getMoodEmoji = (mood: number) => {
    if (mood <= 3) return '😔';
    if (mood <= 5) return '😐';
    if (mood <= 7) return '🙂';
    if (mood <= 9) return '😊';
    return '🤩';
  };

  const [entries, setEntries] = useState(SAMPLE_ENTRIES);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);

  return (
    <AppLayout>
      <div className="space-y-8 pb-32">
        {/* Header */}
        <div className="mb-12 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-text-primary mb-2">Journal</h1>
            <p className="text-lg text-text-secondary">
              {entries.length} reflections this week
            </p>
          </div>
          <Button className="bg-state-ontrack hover:bg-state-ontrack/90 text-white gap-2">
            <Plus className="w-5 h-5" />
            New Entry
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-12">
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="text-sm text-text-tertiary mb-1">Total Entries</div>
              <div className="text-3xl font-bold text-state-ontrack">{entries.length}</div>
              <div className="text-xs text-text-tertiary mt-2">This week</div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="text-sm text-text-tertiary mb-1">Great Days</div>
              <div className="text-3xl font-bold text-state-momentum">
                {entries.filter((e) => e.mood === 'great').length}
              </div>
              <div className="text-xs text-text-tertiary mt-2">Feeling excellent</div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="text-sm text-text-tertiary mb-1">Avg Words</div>
              <div className="text-3xl font-bold text-state-drift">
                {Math.round(
                  entries.reduce((sum, e) => sum + e.content.split(' ').length, 0) / entries.length
                )}
              </div>
              <div className="text-xs text-text-tertiary mt-2">Per entry</div>
            </CardContent>
          </Card>
          <Card className="border-border">
            <CardContent className="pt-6">
              <div className="text-sm text-text-tertiary mb-1">Top Tags</div>
              <div className="text-xl font-bold text-state-ontrack">
                {['learning', 'productivity', 'growth']}
              </div>
              <div className="text-xs text-text-tertiary mt-2">Common themes</div>
            </CardContent>
          </Card>
        </div>

        {/* Entries Grid */}
        <div className="grid grid-cols-2 gap-6">
          {/* Entry List */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Recent Entries</h2>
            {entries.map((entry) => (
              <Card
                key={entry.id}
                className="border-border cursor-pointer transition-all hover:shadow-md"
                onClick={() => setSelectedEntry(entry)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0 mt-1"
                      style={{ backgroundColor: MOOD_COLORS[entry.mood] }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-text-primary truncate">
                        {entry.title}
                      </h3>
                      <p className="text-sm text-text-tertiary mt-1 line-clamp-2">
                        {entry.content}
                      </p>
                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        <span className="text-xs text-text-tertiary">{entry.date}</span>
                        <span
                          className="text-xs px-2 py-1 rounded text-white"
                          style={{ backgroundColor: MOOD_COLORS[entry.mood] }}
                        >
                          {MOOD_LABELS[entry.mood]}
                        </span>
                      </div>
                      {entry.tags.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-2">
                          {entry.tags.map((tag) => (
                            <span
                              key={tag}
                              className="text-xs px-2 py-1 rounded bg-bg-secondary text-text-secondary"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Entry Detail or Welcome */}
          <div>
            <h2 className="text-lg font-semibold text-text-primary mb-4">
              {selectedEntry ? selectedEntry.title : 'Start Writing'}
            </h2>
            {selectedEntry ? (
              <Card className="border-border h-full">
                <CardContent className="p-6 space-y-6">
                  {/* Header */}
                  <div className="pb-4 border-b border-border">
                    <div className="flex items-center gap-2 mb-3">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: MOOD_COLORS[selectedEntry.mood] }}
                      />
                      <span
                        className="text-sm px-2 py-1 rounded text-white"
                        style={{ backgroundColor: MOOD_COLORS[selectedEntry.mood] }}
                      >
                        {MOOD_LABELS[selectedEntry.mood]}
                      </span>
                      <span className="text-sm text-text-tertiary ml-auto">
                        {selectedEntry.date}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-text-primary">
                      {selectedEntry.title}
                    </h3>
                  </div>

                  {/* Content */}
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <p className="text-text-secondary whitespace-pre-line leading-relaxed">
                      {selectedEntry.content}
                    </p>
                  </div>

                  {/* Tags */}
                  {selectedEntry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedEntry.tags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-3 py-1 rounded-full bg-bg-secondary text-text-secondary hover:bg-bg-tertiary transition-colors"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* AI Summary */}
                  <div className="p-4 rounded-lg bg-bg-secondary border border-border space-y-2">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-state-ontrack" />
                      <span className="text-sm font-semibold text-text-primary">AI Summary</span>
                    </div>
                    <p className="text-sm text-text-secondary">
                      {selectedEntry.aiSummary}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-border h-full">
                <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                  <PenTool className="w-16 h-16 text-text-tertiary opacity-50 mb-4" />
                  <h3 className="text-lg font-semibold text-text-primary mb-2">
                    Start Your Reflection
                  </h3>
                  <p className="text-text-secondary max-w-sm">
                    Writing helps you process thoughts, track growth, and discover patterns in your life.
                    Start by clicking on an entry or creating a new one.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
