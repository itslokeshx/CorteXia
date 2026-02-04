'use client';

import { Checkbox } from "@/components/ui/checkbox"
import { Edit2, Trash2, Zap } from 'lucide-react';
import { useEffect } from "react"
import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, Flag, CheckCircle2, Circle, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useApp } from '@/lib/context/app-context';
import { TaskCard } from '@/components/tasks/task-card';
import type { Task as TaskType } from '@/lib/types';

const DOMAIN_LABELS = {
  work: 'Work',
  focus: 'Focus',
  personal: 'Personal',
  leisure: 'Leisure',
  health: 'Health',
  study: 'Study',
  finance: 'Finance',
};

export default function TasksPage() {
  const { tasks, addTask, deleteTask, completeTask, updateTask } = useApp();
  const [filter, setFilter] = useState<'all' | 'todo' | 'in-progress' | 'completed'>('all');
  const [domainFilter, setDomainFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    domain: 'work' as const,
    priority: 'medium' as const,
    dueDate: new Date().toISOString().split('T')[0],
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    domain: 'focus' as const,
    priority: 'medium' as const,
    dueDate: '',
    timeEstimate: 0,
  });

  const filteredTasks = tasks.filter((task) => {
    const matchesFilter = filter === 'all' || task.status === filter;
    const matchesDomain = domainFilter === 'all' || task.domain === domainFilter;
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    return matchesFilter && matchesDomain && matchesSearch;
  });

  const completedCount = filteredTasks.filter((t) => t.status === 'completed').length;
  const completionRate = filteredTasks.length > 0 ? (completedCount / filteredTasks.length) * 100 : 0;

  useEffect(() => {
    let result = tasks;

    if (filter !== 'all') {
      result = result.filter((t) => t.status === filter);
    }

    if (searchTerm) {
      result = result.filter((t) =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Additional filtering logic can be added here if needed
  }, [tasks, filter, searchTerm]);

  const handleAddTask = () => {
    if (newTask.title.trim()) {
      addTask({
        ...newTask,
        status: 'todo',
      });
      setNewTask({
        title: '',
        description: '',
        domain: 'work',
        priority: 'medium',
        dueDate: new Date().toISOString().split('T')[0],
      });
      setOpen(false);
    }
  };

  const handleEditTask = (task: TaskType) => {
    setFormData({
      title: task.title,
      description: task.description,
      domain: task.domain,
      priority: task.priority,
      dueDate: task.dueDate || '',
      timeEstimate: task.timeEstimate || 0,
    });
    setEditingId(task.id);
    setIsOpen(true);
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold text-balance">Tasks</h1>
            <p className="text-muted-foreground mt-2">
              Manage your work, health, study, personal, and finance tasks in one place.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2" size="lg">
                <Plus className="h-4 w-4" />
                New Task
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Input
                  placeholder="Task title"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                />
                <Textarea
                  placeholder="Description (optional)"
                  value={newTask.description}
                  onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                  rows={3}
                />
                <div className="grid grid-cols-2 gap-4">
                  <Select value={newTask.domain} onValueChange={(v) => setNewTask({ ...newTask, domain: v as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="work">Work</SelectItem>
                      <SelectItem value="health">Health</SelectItem>
                      <SelectItem value="study">Study</SelectItem>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="focus">Focus</SelectItem>
                      <SelectItem value="leisure">Leisure</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                />
                <Input
                  type="number"
                  value={newTask.timeEstimate}
                  onChange={(e) => setNewTask({ ...newTask, timeEstimate: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
                <Button onClick={handleAddTask} className="w-full">
                  Create Task
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold">{tasks.length}</div>
              <p className="text-sm text-muted-foreground">Total Tasks</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-green-600">{completedCount}</div>
              <p className="text-sm text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-3xl font-bold text-red-600">{tasks.filter((t) => t.priority === 'high' && t.status !== 'completed').length}</div>
              <p className="text-sm text-muted-foreground">High Priority</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <Select value={filter} onValueChange={(v) => setFilter(v as any)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tasks</SelectItem>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select value={domainFilter} onValueChange={setDomainFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Domains</SelectItem>
              <SelectItem value="work">Work</SelectItem>
              <SelectItem value="health">Health</SelectItem>
              <SelectItem value="study">Study</SelectItem>
              <SelectItem value="personal">Personal</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="focus">Focus</SelectItem>
              <SelectItem value="leisure">Leisure</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1"
          />
        </div>

        {/* Tasks List */}
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <Card>
              <CardContent className="pt-12 pb-12 text-center">
                <Circle className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">No tasks found. Create one to get started!</p>
              </CardContent>
            </Card>
          ) : (
            filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={completeTask}
                onDelete={deleteTask}
                onEdit={() => handleEditTask(task)}
              />
            ))
          )}
        </div>

        {/* Summary Card */}
        {filteredTasks.length > 0 && (
          <Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-blue-200/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Progress Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Completion Rate</span>
                    <span className="text-sm font-bold">
                      {completionRate.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-full transition-all"
                      style={{
                        width: `${completionRate}%`,
                      }}
                    />
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Keep up the momentum! You've completed {completedCount} of {tasks.length} tasks.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
