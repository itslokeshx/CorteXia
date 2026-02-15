"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { useApp } from "@/lib/context/app-context";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { format, subDays, startOfWeek, addDays as addDaysFn } from "date-fns";
import {
  Play,
  Pause,
  Square,
  Clock,
  Flame,
  Zap,
  Timer,
  Coffee,
  Brain,
  ChevronRight,
  X,
  BarChart3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const PRESETS = [
  {
    label: "Deep Work",
    duration: 90,
    icon: Brain,
    color: "from-purple-500 to-violet-600",
    category: "work" as const,
    quality: "deep" as const,
  },
  {
    label: "Pomodoro",
    duration: 25,
    icon: Timer,
    color: "from-red-500 to-orange-500",
    category: "work" as const,
    quality: "deep" as const,
  },
  {
    label: "Flow State",
    duration: 50,
    icon: Zap,
    color: "from-blue-500 to-cyan-500",
    category: "study" as const,
    quality: "deep" as const,
  },
  {
    label: "Quick Focus",
    duration: 15,
    icon: Clock,
    color: "from-green-500 to-emerald-500",
    category: "personal" as const,
    quality: "moderate" as const,
  },
  {
    label: "Break",
    duration: 5,
    icon: Coffee,
    color: "from-amber-400 to-yellow-500",
    category: "health" as const,
    quality: "shallow" as const,
  },
];

export default function TimeTrackerPage() {
  const { timeEntries, addTimeEntry } = useApp();
  const [mode, setMode] = useState<"select" | "running" | "paused">("select");
  const [selectedPreset, setSelectedPreset] = useState(PRESETS[0]);
  const [totalSeconds, setTotalSeconds] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [customDuration, setCustomDuration] = useState("");
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const remaining = Math.max(0, totalSeconds - elapsedSeconds);
  const progress = totalSeconds > 0 ? elapsedSeconds / totalSeconds : 0;
  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;

  const saveEntry = useCallback(
    (preset: (typeof PRESETS)[0], durationMins: number) => {
      addTimeEntry({
        task: preset.label,
        category: preset.category,
        duration: Math.round(durationMins),
        date: format(new Date(), "yyyy-MM-dd"),
        focusQuality: preset.quality,
        interruptions: 0,
        notes: `${preset.label} session — ${Math.round(durationMins)} minutes`,
      });
    },
    [addTimeEntry],
  );

  const startSession = useCallback((preset: (typeof PRESETS)[0]) => {
    setSelectedPreset(preset);
    setTotalSeconds(preset.duration * 60);
    setElapsedSeconds(0);
    setStartTime(new Date());
    setMode("running");
    setFullscreen(true);
  }, []);

  const pauseSession = useCallback(() => {
    setMode("paused");
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const resumeSession = useCallback(() => {
    setMode("running");
  }, []);

  const stopSession = useCallback(() => {
    if (startTime && elapsedSeconds > 10) {
      saveEntry(selectedPreset, elapsedSeconds / 60);
    }
    setMode("select");
    setFullscreen(false);
    setElapsedSeconds(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [saveEntry, elapsedSeconds, selectedPreset, startTime]);

  // Timer tick
  useEffect(() => {
    if (mode === "running") {
      intervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => {
          const next = prev + 1;
          if (next >= totalSeconds) {
            // Timer complete - clean up interval
            if (intervalRef.current) clearInterval(intervalRef.current);
            // Schedule state updates outside of the setter
            setTimeout(() => {
              // Save the full duration since timer completed naturally
              saveEntry(selectedPreset, selectedPreset.duration);
              setMode("select");
              setFullscreen(false);
              setElapsedSeconds(0);
              setStartTime(null);
              setTotalSeconds(0);
            }, 0);
            return next; // Return the final value briefly
          }
          return next;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [mode, totalSeconds, saveEntry, selectedPreset]);

  // Stats
  const stats = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    const todayEntries = (timeEntries || []).filter((e) => e.date === today);
    const todayMinutes = todayEntries.reduce(
      (s, e) => s + (e.duration || 0),
      0,
    );
    const weekEntries = (timeEntries || []).filter((e) => {
      const d = new Date(e.date);
      return d >= subDays(new Date(), 7);
    });
    const weekMinutes = weekEntries.reduce((s, e) => s + (e.duration || 0), 0);
    return {
      todayMinutes,
      weekMinutes,
      todaySessions: todayEntries.length,
      weekSessions: weekEntries.length,
    };
  }, [timeEntries]);

  // Weekly chart data
  const weeklyChart = useMemo(() => {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = addDaysFn(start, i);
      const dateStr = format(date, "yyyy-MM-dd");
      const dayEntries = (timeEntries || []).filter((e) => e.date === dateStr);
      const totalMin = dayEntries.reduce((s, e) => s + (e.duration || 0), 0);
      return {
        day: format(date, "EEE"),
        dateStr,
        totalMin,
        sessions: dayEntries.length,
        isToday: dateStr === format(new Date(), "yyyy-MM-dd"),
      };
    });
    const maxMin = Math.max(1, ...days.map((d) => d.totalMin));
    return { days, maxMin };
  }, [timeEntries]);

  // SVG circle
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  // Full-screen focus mode
  if (fullscreen) {
    return (
      <AnimatePresence>
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background:
              "linear-gradient(135deg, #0f0a1e 0%, #1a0e2e 30%, #0d1117 100%)",
          }}
        >
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-colors z-10"
          >
            <X className="w-5 h-5 text-white/80" />
          </button>

          <div className="flex flex-col items-center gap-8">
            <motion.div>
              <Badge className="bg-white/10 text-white/90 border-white/20 backdrop-blur-sm text-sm px-4 py-1.5">
                {selectedPreset.label}
              </Badge>
            </motion.div>

            <div className="relative">
              <svg width="280" height="280" className="transform -rotate-90">
                <circle
                  cx="140"
                  cy="140"
                  r={radius}
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="6"
                />
                <motion.circle
                  cx="140"
                  cy="140"
                  r={radius}
                  fill="none"
                  stroke="url(#timerGradient)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
                <defs>
                  <linearGradient
                    id="timerGradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#8B5CF6" />
                    <stop offset="100%" stopColor="#06B6D4" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-6xl font-mono font-light text-white tracking-wider">
                  {minutes.toString().padStart(2, "0")}:
                  {seconds.toString().padStart(2, "0")}
                </span>
                <span className="text-sm text-white/50 mt-1">
                  {Math.round(progress * 100)}% complete
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {mode === "running" ? (
                <button
                  onClick={pauseSession}
                  className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <Pause className="w-7 h-7 text-white" />
                </button>
              ) : (
                <button
                  onClick={resumeSession}
                  className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition-colors"
                >
                  <Play className="w-7 h-7 text-white ml-1" />
                </button>
              )}
              <button
                onClick={stopSession}
                className="w-12 h-12 rounded-full bg-red-500/20 backdrop-blur-sm flex items-center justify-center hover:bg-red-500/30 transition-colors"
              >
                <Square className="w-5 h-5 text-red-300" />
              </button>
            </div>

            <p className="text-white/40 text-sm">
              Stay focused. You&apos;re doing great.
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  return (
    <AppLayout>
      <motion.div className="space-y-6 pb-12">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Focus
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Deep focus sessions to maximize your flow
          </p>
        </div>

        {/* Stats */}
        <div data-tour="focus-stats" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              label: "Today",
              value: `${Math.floor(stats.todayMinutes / 60)}h ${stats.todayMinutes % 60}m`,
              icon: Clock,
            },
            {
              label: "Sessions Today",
              value: stats.todaySessions,
              icon: Flame,
            },
            {
              label: "This Week",
              value: `${Math.floor(stats.weekMinutes / 60)}h ${stats.weekMinutes % 60}m`,
              icon: Zap,
            },
            { label: "Week Sessions", value: stats.weekSessions, icon: Timer },
          ].map((s) => (
            <div
              key={s.label}
              className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-1">
                <s.icon className="w-3.5 h-3.5 text-[var(--color-text-tertiary)]" />
                <span className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] font-medium">
                  {s.label}
                </span>
              </div>
              <p className="text-xl font-bold text-[var(--color-text-primary)]">
                {s.value}
              </p>
            </div>
          ))}
        </div>

        {/* Weekly Analytics */}
        <div data-tour="focus-weekly-chart" className="bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl p-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-[var(--color-text-tertiary)]" />
            <h2 className="text-sm font-medium text-[var(--color-text-secondary)]">
              This Week
            </h2>
          </div>
          <div className="flex items-end justify-between gap-2 h-32">
            {weeklyChart.days.map((day) => {
              const height =
                day.totalMin > 0
                  ? Math.max(8, (day.totalMin / weeklyChart.maxMin) * 100)
                  : 4;
              return (
                <div
                  key={day.day}
                  className="flex-1 flex flex-col items-center gap-1.5"
                >
                  {day.totalMin > 0 && (
                    <span className="text-[10px] text-[var(--color-text-tertiary)] tabular-nums">
                      {day.totalMin >= 60
                        ? `${Math.floor(day.totalMin / 60)}h${day.totalMin % 60 > 0 ? `${day.totalMin % 60}m` : ""}`
                        : `${day.totalMin}m`}
                    </span>
                  )}
                  <motion.div
                    className={cn(
                      "w-full max-w-[32px] rounded-md",
                      day.isToday
                        ? "bg-gradient-to-t from-purple-600 to-purple-400"
                        : day.totalMin > 0
                          ? "bg-gradient-to-t from-purple-600/40 to-purple-400/40"
                          : "bg-[var(--color-bg-primary)]",
                    )}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                  <span
                    className={cn(
                      "text-[10px]",
                      day.isToday
                        ? "text-purple-400 font-semibold"
                        : "text-[var(--color-text-tertiary)]",
                    )}
                  >
                    {day.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Presets */}
        <div>
          <h2 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">
            Start a Focus Session
          </h2>
          <div data-tour="focus-presets" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {PRESETS.map((preset) => (
              <motion.button
                key={preset.label}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => startSession(preset)}
                className="flex items-center gap-4 p-5 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl text-left hover:shadow-md transition-all group"
              >
                <div
                  className={cn(
                    "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-sm",
                    preset.color,
                  )}
                >
                  <preset.icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-[var(--color-text-primary)]">
                    {preset.label}
                  </p>
                  <p className="text-sm text-[var(--color-text-tertiary)]">
                    {preset.duration} minutes
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--color-text-tertiary)] opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.button>
            ))}

            {/* Custom Session Card */}
            <motion.div
              data-tour="custom-timer"
              whileHover={{ scale: 1.02 }}
              className="group relative overflow-hidden p-5 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl hover:shadow-lg transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 dark:from-gray-600 dark:to-gray-800 flex items-center justify-center shadow-lg flex-shrink-0">
                  <Clock className="w-6 h-6 text-white" />
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center h-12">
                  <p className="font-medium text-[var(--color-text-primary)] leading-none mb-1.5">
                    Custom Session
                  </p>
                  <p className="text-sm text-[var(--color-text-tertiary)] leading-none">
                    Set your own time
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2">
                <div className="relative flex-1">
                  <Input
                    type="number"
                    min="1"
                    placeholder="Minutes"
                    value={customDuration}
                    onChange={(e) => setCustomDuration(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && customDuration) {
                        const mins = parseInt(customDuration);
                        if (mins > 0) {
                          startSession({
                            label: "Custom Timer",
                            duration: mins,
                            icon: Clock,
                            color: "from-blue-500 to-indigo-600",
                            category: "work",
                            quality: "deep",
                          });
                          setCustomDuration("");
                        }
                      }
                    }}
                    className="h-9 w-full bg-[var(--color-bg-primary)] border-[var(--color-border)] focus:ring-2 focus:ring-blue-500/20 text-sm"
                  />

                </div>

                <Button
                  size="icon"
                  className="h-9 w-9 shrink-0 rounded-lg bg-[var(--color-text-primary)] text-[var(--color-bg-primary)] hover:opacity-90 transition-opacity"
                  disabled={!customDuration || parseInt(customDuration) <= 0}
                  onClick={() => {
                    const mins = parseInt(customDuration);
                    if (mins > 0) {
                      startSession({
                        label: "Custom Session",
                        duration: mins,
                        icon: Clock,
                        color: "from-blue-500 to-indigo-600",
                        category: "work",
                        quality: "deep",
                      });
                      setCustomDuration("");
                    }
                  }}
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                </Button>
              </div>
            </motion.div>
          </div>
        </div>



        {/* Recent Sessions */}
        <div>
          <h2 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">
            Recent Sessions
          </h2>
          <div data-tour="recent-sessions" className="space-y-2">
            {(timeEntries || [])
              .slice(-10)
              .reverse()
              .map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 p-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl"
                >
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] break-words line-clamp-1">
                      {entry.task}
                    </p>
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      {format(new Date(entry.date), "MMM d")} · {entry.duration}
                      m · {entry.focusQuality}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {entry.duration}m
                  </Badge>
                </div>
              ))}
            {(!timeEntries || timeEntries.length === 0) && (
              <div className="text-center py-12 text-[var(--color-text-tertiary)]">
                <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">
                  No sessions yet. Start your first focus session above.
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AppLayout >
  );
}
