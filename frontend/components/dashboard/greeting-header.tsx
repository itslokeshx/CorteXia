"use client";

import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { Sun, Sunrise, Sunset, Moon, Plus } from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

function getGreeting(hour: number): { icon: LucideIcon; text: string } {
  if (hour >= 0 && hour < 5) return { icon: Moon, text: "Quiet. Focus. Now." };
  if (hour >= 5 && hour < 8) return { icon: Sunrise, text: "Ahead of Noise" };
  if (hour >= 8 && hour < 12) return { icon: Sun, text: "Build Momentum" };
  if (hour >= 12 && hour < 17) return { icon: Sun, text: "Stay Consistent" };
  if (hour >= 17 && hour < 21) return { icon: Sunset, text: "Finish With Purpose" };
  return { icon: Moon, text: "Slow. Focus. Count." };
}

export function GreetingHeader({ onAddTask }: { onAddTask?: () => void }) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { profile, user } = useAuth();

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const { icon: Icon, text } = useMemo(
    () => getGreeting(currentTime.getHours()),
    [currentTime],
  );

  const displayName =
    profile?.full_name?.trim() ||
    user?.email?.split("@")[0] ||
    "there";
  const firstName = displayName.split(/\s+/)[0];

  return (
    <header className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Icon className="w-5 h-5 text-[var(--color-text-tertiary)]" />
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[var(--color-text-primary)]">
              {text}, {firstName}
            </h1>
          </div>
          <p className="text-sm text-[var(--color-text-tertiary)]">
            {format(currentTime, "EEEE, MMMM d")} · {format(currentTime, "h:mm a")}
          </p>
        </div>
        {onAddTask && (
          <Button
            size="sm"
            variant="outline"
            onClick={onAddTask}
            className="shrink-0"
          >
            <Plus className="w-4 h-4" />
            Add task
          </Button>
        )}
      </div>
    </header>
  );
}
