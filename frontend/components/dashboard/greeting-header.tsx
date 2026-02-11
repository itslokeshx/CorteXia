"use client";

import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import {
  Sparkles,
  Zap,
  Flame,
  Trophy,
  ListTodo,
  MessageCircle,
  Hand,
  Rocket,
  Hammer
} from "lucide-react";
import { useAuth } from "@/lib/context/auth-context";
import { useApp } from "@/lib/context/app-context";
import type { LucideIcon } from "lucide-react";

type GreetingType = {
  text: string;
  icon: LucideIcon;
  weight: number; // Higher weight = more likely to appear
  condition?: (context: GreetingContext) => boolean;
};

type GreetingContext = {
  taskCount: number;
  streakCount: number;
  completedTasks: number;
  isProductive: boolean;
};

const DEFAULT_GREETINGS: GreetingType[] = [
  // The Best Ones
  { text: "Hey [Name], what's up?", icon: MessageCircle, weight: 2 },
  { text: "[Name], ready to build?", icon: Hammer, weight: 2 },
  { text: "Welcome back, [Name] ✨", icon: Hand, weight: 2 },
  { text: "[Name], let's create.", icon: Sparkles, weight: 2 },
  { text: "Hey [Name], let's go.", icon: Rocket, weight: 2 },

  // My #1 Pick (Heavily weighted)
  { text: "Hey [Name], ready?", icon: Zap, weight: 5 },

  // Alternative
  { text: "Hey [Name], what's up?", icon: MessageCircle, weight: 2 },
];

function getDynamicGreetings(context: GreetingContext): GreetingType[] {
  const dynamicOptions: GreetingType[] = [];

  // Dynamic Options (with context)
  if (context.taskCount > 0) {
    dynamicOptions.push({
      text: `Hey [Name], ${context.taskCount} tasks.`,
      icon: ListTodo,
      weight: 4,
    });
  }

  if (context.streakCount > 0) {
    dynamicOptions.push({
      text: "Hey [Name], streak alive!",
      icon: Flame,
      weight: 4,
    });
  }

  if (context.isProductive) {
    dynamicOptions.push({
      text: "Hey [Name], crushing it.",
      icon: Trophy,
      weight: 4,
    });
  }

  return dynamicOptions;
}

export function GreetingHeader() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { profile, user } = useAuth();
  const { tasks, habits } = useApp();

  // Basic context derivation
  const context: GreetingContext = useMemo(() => {
    const pendingTasks = tasks.filter(t => t.status !== "completed").length;

    // Calculate active streaks
    const activeStreaks = habits.filter(h => h.active && h.streak > 0).length;

    // Check productivity (simple check: any completed task today?)
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const completedToday = tasks.filter(
      t => t.status === "completed" && t.completedAt?.startsWith(todayStr)
    ).length;

    return {
      taskCount: pendingTasks,
      streakCount: activeStreaks,
      completedTasks: completedToday,
      isProductive: completedToday > 2 // Arbitrary threshold for "Crushing it"
    };
  }, [tasks, habits]);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  // Memoize the selected greeting to prevent flickering on every render
  // We only want it to change if the context drastically changes or on mount/refresh
  const { icon: Icon, text } = useMemo(() => {
    const dynamic = getDynamicGreetings(context);
    const allOptions = [...DEFAULT_GREETINGS, ...dynamic];

    // Weighted random selection
    const totalWeight = allOptions.reduce((sum, item) => sum + item.weight, 0);
    let random = Math.random() * totalWeight;

    for (const option of allOptions) {
      if (random < option.weight) {
        return option;
      }
      random -= option.weight;
    }

    return allOptions[0]; // Fallback
  }, [context.taskCount, context.streakCount, context.isProductive]);
  // Dependencies intentionally limited to avoid changing on every second,
  // but responding to state changes.

  const displayName =
    profile?.full_name?.trim() ||
    user?.email?.split("@")[0] ||
    "there";
  const firstName = displayName.split(/\s+/)[0];

  const finalGreeting = text.replace("[Name]", firstName);

  return (
    <header className="flex flex-row items-center justify-between gap-3 py-1 sm:py-2">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 mb-0.5 sm:mb-1">
          <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--accent-primary)] shrink-0" />
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-[var(--color-text-primary)] truncate">
            {finalGreeting}
          </h1>
        </div>
        <p className="text-xs sm:text-base text-[var(--color-text-secondary)] font-medium pl-0.5 sm:pl-1 truncate">
          {format(currentTime, "EEEE, MMMM d")}
        </p>
      </div>
    </header>
  );
}
