'use client';

import { Task } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trash2, Clock, Flag } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
}

const DOMAIN_COLORS: Record<string, string> = {
  work: 'bg-blue-500/10 text-blue-600',
  health: 'bg-green-500/10 text-green-600',
  study: 'bg-purple-500/10 text-purple-600',
  personal: 'bg-pink-500/10 text-pink-600',
  finance: 'bg-amber-500/10 text-amber-600',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: 'text-green-600',
  medium: 'text-yellow-600',
  high: 'text-red-600',
};

export function TaskCard({ task, onToggle, onDelete, onEdit }: TaskCardProps) {
  const isCompleted = task.status === 'completed';

  return (
    <Card className={cn(
      'transition-all hover:shadow-md',
      isCompleted && 'opacity-60 bg-muted/50'
    )}>
      <CardContent className="pt-6 flex items-start gap-4">
        <Checkbox
          checked={isCompleted}
          onCheckedChange={() => onToggle(task.id)}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className={cn(
              'font-medium',
              isCompleted && 'line-through text-muted-foreground'
            )}>
              {task.title}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(task.id)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          
          {task.description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            <Badge variant="secondary" className={DOMAIN_COLORS[task.domain] || ''}>
              {task.domain.charAt(0).toUpperCase() + task.domain.slice(1)}
            </Badge>
            
            <Badge
              variant="outline"
              className={cn('flex items-center gap-1', PRIORITY_COLORS[task.priority])}
            >
              <Flag className="h-3 w-3" />
              {task.priority}
            </Badge>

            {task.timeSpent && (
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {task.timeSpent}m
              </Badge>
            )}
          </div>

          {task.subtasks && task.subtasks.length > 0 && (
            <div className="mt-3 ml-2 space-y-1">
              {task.subtasks.slice(0, 2).map((sub) => (
                <div key={sub.id} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={sub.completed} disabled />
                  <span className={cn(sub.completed && 'line-through text-muted-foreground')}>
                    {sub.title}
                  </span>
                </div>
              ))}
              {task.subtasks.length > 2 && (
                <p className="text-xs text-muted-foreground">
                  +{task.subtasks.length - 2} more subtasks
                </p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-muted-foreground">
              {new Date(task.dueDate).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </p>
            {isCompleted && task.completedAt && (
              <p className="text-xs text-green-600">
                Completed {new Date(task.completedAt).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
