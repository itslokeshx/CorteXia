"use client";

import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { Sun, Sunrise, Sunset, Moon, Plus } from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";
import { Button } from "@/components/ui/button";
import type { LucideIcon } from "lucide-react";

function getGreeting(hour: number): { icon: LucideIcon; text: string } {
  if (hour >= 5 && hour < 8) return { icon: Sunrise, text: "A new beginning" };
  if (hour >= 8 && hour < 12) return { icon: Sun, text: "Today begins now" };
  if (hour >= 12 && hour < 17) return { icon: Sun, text: "Making steady progress" };
  if (hour >= 17 && hour < 21) return { icon: Sunset, text: "Time to reflect" };
  if (hour >= 21 || hour < 5) return { icon: Moon, text: "It still matters" }; // 9 PM - 5 AM cover
  return { icon: Moon, text: "You’re still here" }; // Fallback/Specific 12AM-5AM overlap handling if needed, but the above covers it.
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
    <header className="flex flex-row items-center justify-between gap-3 py-1 sm:py-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 mb-0.5 sm:mb-1">
          <Icon className="w-5 h-5 sm:w-7 sm:h-7 text-[var(--accent-primary)] shrink-0" />
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[var(--color-text-primary)] truncate">
            {text}, {firstName}
          </h1>
        </div>
        <p className="text-xs sm:text-base text-[var(--color-text-secondary)] font-medium pl-0.5 sm:pl-1 truncate">
          {format(currentTime, "EEEE, MMMM d")}
        </p>
      </div>
      {onAddTask && (
        <Button
          size="default"
          className="shrink-0 rounded-full transition-all shadow-sm hover:shadow-md h-10 w-10 sm:w-auto p-0 sm:px-4 sm:py-2"
          onClick={onAddTask}
          aria-label="Quick Task"
        >
          <Plus className="w-5 h-5 sm:mr-2" />
          <span className="hidden sm:inline">Quick Task</span>
        </Button>
      )}
    </header>
  );
}
