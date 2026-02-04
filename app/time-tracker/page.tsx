"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useApp } from "@/lib/context/app-context";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Pause,
  Square,
  SkipForward,
  Maximize2,
  Minimize2,
  X,
  Settings,
  Target,
  Clock,
  Flame,
  Coffee,
  Brain,
  CheckCircle,
  Volume2,
  VolumeX,
} from "lucide-react";
import { format, isToday } from "date-fns";
import type { Task, PomodoroSession, TimerSettings } from "@/lib/types";

// Default timer settings
const DEFAULT_TIMER_SETTINGS: TimerSettings = {
  workDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  pomodorosBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  soundEnabled: true,
  notificationsEnabled: true,
};

// Motivational quotes for focus mode
const MOTIVATIONAL_QUOTES = [
  "Deep work produces results",
  "Focus is your superpower",
  "One task at a time",
  "You're building something great",
  "Stay in the zone",
  "Progress over perfection",
  "Small steps, big results",
  "Your focus determines your reality",
];

export default function TimeTrackerPage() {
  const { tasks, goals, timeEntries, addTimeEntry } = useApp();

  // Timer state
  const [timerState, setTimerState] = useState<
    "idle" | "running" | "paused" | "break"
  >("idle");
  const [timeRemaining, setTimeRemaining] = useState(25 * 60); // in seconds
  const [pomodorosCompleted, setPomodorosCompleted] = useState(0);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [settings, setSettings] = useState<TimerSettings>(
    DEFAULT_TIMER_SETTINGS,
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sessions, setSessions] = useState<PomodoroSession[]>([]);
  const [currentSessionStart, setCurrentSessionStart] = useState<Date | null>(
    null,
  );
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get motivational quote
  const [quote] = useState(
    () =>
      MOTIVATIONAL_QUOTES[
        Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)
      ],
  );

  // Pending tasks for selection
  const pendingTasks = useMemo(() => {
    return tasks.filter((t) => t.status !== "completed").slice(0, 15);
  }, [tasks]);

  // Today's sessions
  const todaySessions = useMemo(() => {
    return sessions.filter((s) => isToday(new Date(s.startTime)));
  }, [sessions]);

  // Calculate today's focus time
  const todayFocusTime = useMemo(() => {
    return todaySessions
      .filter((s) => s.type === "work" && s.completed)
      .reduce((sum, s) => sum + (s.actualDuration || s.duration), 0);
  }, [todaySessions]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Format duration for display
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Timer countdown effect
  useEffect(() => {
    if (timerState === "running") {
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timerState]);

  // Handle timer completion
  const handleTimerComplete = useCallback(() => {
    // Play sound
    if (soundEnabled) {
      // Create a simple beep sound
      try {
        const audioContext = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.value = 800;
        oscillator.type = "sine";
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
      } catch (e) {
        console.log("Audio not supported");
      }
    }

    // Vibrate on mobile
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200]);
    }

    // Show notification
    if (
      settings.notificationsEnabled &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      new Notification("Pomodoro Complete! 🍅", {
        body:
          timerState === "running"
            ? `Time for a ${pomodorosCompleted + 1 >= settings.pomodorosBeforeLongBreak ? "long" : "short"} break!`
            : "Break's over! Ready to focus?",
      });
    }

    // Record session
    if (timerState === "running" && currentSessionStart) {
      const session: PomodoroSession = {
        id: `ps-${Date.now()}`,
        startTime: currentSessionStart.toISOString(),
        endTime: new Date().toISOString(),
        duration: settings.workDuration,
        actualDuration: settings.workDuration,
        type: "work",
        linkedTaskId: selectedTask?.id,
        linkedGoalId: selectedTask?.linkedGoalId,
        completed: true,
        interruptions: 0,
      };
      setSessions((prev) => [...prev, session]);

      // Update pomodoro count
      const newCount = pomodorosCompleted + 1;
      setPomodorosCompleted(newCount);

      // Determine break type and start break
      const isLongBreak = newCount % settings.pomodorosBeforeLongBreak === 0;
      const breakDuration = isLongBreak
        ? settings.longBreakDuration
        : settings.shortBreakDuration;

      setTimerState("break");
      setTimeRemaining(breakDuration * 60);

      if (settings.autoStartBreaks) {
        // Auto-start break
        setCurrentSessionStart(new Date());
      }
    } else if (timerState === "break") {
      // Break completed
      setTimerState("idle");
      setTimeRemaining(settings.workDuration * 60);
      setCurrentSessionStart(null);

      if (settings.autoStartPomodoros) {
        handleStart();
      }
    }
  }, [
    timerState,
    pomodorosCompleted,
    settings,
    selectedTask,
    currentSessionStart,
    soundEnabled,
  ]);

  // Start timer
  const handleStart = () => {
    if (timerState === "idle" || timerState === "paused") {
      setTimerState("running");
      if (!currentSessionStart) {
        setCurrentSessionStart(new Date());
      }
    }
  };

  // Pause timer
  const handlePause = () => {
    setTimerState("paused");
  };

  // Resume timer
  const handleResume = () => {
    setTimerState("running");
  };

  // Stop timer
  const handleStop = () => {
    if (timerState === "running" && currentSessionStart) {
      // Record partial session
      const elapsedMinutes = Math.round(
        (Date.now() - currentSessionStart.getTime()) / 60000,
      );
      if (elapsedMinutes > 0) {
        const session: PomodoroSession = {
          id: `ps-${Date.now()}`,
          startTime: currentSessionStart.toISOString(),
          endTime: new Date().toISOString(),
          duration: settings.workDuration,
          actualDuration: elapsedMinutes,
          type: "work",
          linkedTaskId: selectedTask?.id,
          linkedGoalId: selectedTask?.linkedGoalId,
          completed: false,
          interruptions: 1,
        };
        setSessions((prev) => [...prev, session]);
      }
    }

    setTimerState("idle");
    setTimeRemaining(settings.workDuration * 60);
    setCurrentSessionStart(null);

    if (isFullScreen) {
      setIsFullScreen(false);
    }
  };

  // Skip break
  const handleSkipBreak = () => {
    setTimerState("idle");
    setTimeRemaining(settings.workDuration * 60);
    setCurrentSessionStart(null);
  };

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Calculate progress percentage
  const progressPercentage = useMemo(() => {
    const totalSeconds =
      timerState === "break"
        ? (pomodorosCompleted % settings.pomodorosBeforeLongBreak === 0
            ? settings.longBreakDuration
            : settings.shortBreakDuration) * 60
        : settings.workDuration * 60;
    return ((totalSeconds - timeRemaining) / totalSeconds) * 100;
  }, [timeRemaining, timerState, settings, pomodorosCompleted]);

  // Derived state for break time (for use in UI)
  const isBreakTime = timerState === "break";

  // Full screen focus mode
  if (isFullScreen && (timerState === "running" || timerState === "paused")) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gradient-to-br from-neutral-900 via-purple-900/20 to-neutral-900 flex flex-col items-center justify-center text-white z-50"
      >
        {/* Exit Button */}
        <button
          onClick={() => setIsFullScreen(false)}
          className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Sound Toggle */}
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="absolute top-6 left-6 p-2 hover:bg-white/10 rounded-lg transition-colors"
        >
          {soundEnabled ? (
            <Volume2 className="w-6 h-6" />
          ) : (
            <VolumeX className="w-6 h-6" />
          )}
        </button>

        {/* Task Info */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center mb-12"
        >
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">
            {selectedTask?.title || "Focus Session"}
          </h1>
          {selectedTask?.linkedGoalId && (
            <p className="text-purple-300 text-sm sm:text-base">
              <Target className="w-4 h-4 inline mr-1" />
              Linked to Goal
            </p>
          )}
        </motion.div>

        {/* Giant Timer */}
        <motion.div
          className="text-[8rem] sm:text-[12rem] font-bold font-mono leading-none tracking-tight"
          animate={timerState === "running" ? { scale: [1, 1.02, 1] } : {}}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          {formatTime(timeRemaining)}
        </motion.div>

        {/* Progress Bar */}
        <div className="w-64 sm:w-96 h-2 bg-white/20 rounded-full mt-12 overflow-hidden">
          <motion.div
            className={cn(
              "h-full rounded-full",
              isBreakTime ? "bg-green-500" : "bg-purple-500",
            )}
            initial={{ width: "0%" }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        {/* Status */}
        <p className="text-white/60 mt-4 text-lg">
          {isBreakTime
            ? "☕ Break Time"
            : timerState === "paused"
              ? "⏸ Paused"
              : "🎯 Focus Time"}
        </p>

        {/* Motivational Quote */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-lg sm:text-xl text-white/40 mt-8 italic max-w-md text-center"
        >
          &ldquo;{quote}&rdquo;
        </motion.p>

        {/* Controls */}
        <div className="flex gap-4 sm:gap-6 mt-12">
          {timerState === "paused" ? (
            <Button
              size="lg"
              onClick={handleResume}
              className="bg-green-600 hover:bg-green-700 text-white px-8"
            >
              <Play className="w-5 h-5 mr-2" />
              Resume
            </Button>
          ) : (
            <Button
              variant="outline"
              size="lg"
              onClick={handlePause}
              className="border-white/20 text-white hover:bg-white/10 px-8"
            >
              <Pause className="w-5 h-5 mr-2" />
              Pause
            </Button>
          )}
          <Button
            size="lg"
            onClick={handleStop}
            variant="destructive"
            className="px-8"
          >
            <Square className="w-5 h-5 mr-2" />
            Stop
          </Button>
        </div>

        {/* Stats Footer */}
        <div className="absolute bottom-6 text-center text-white/60">
          <p>
            Pomodoro {pomodorosCompleted + 1}/5 • Today:{" "}
            {formatDuration(todayFocusTime)}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 pb-24">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
              Time Tracker
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
              Focus with Pomodoro technique
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSoundEnabled(!soundEnabled)}
            >
              {soundEnabled ? (
                <Volume2 className="h-4 w-4" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsSettingsOpen(true)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            {(timerState === "running" || timerState === "paused") && (
              <Button
                variant="outline"
                onClick={() => setIsFullScreen(true)}
                className="gap-2"
              >
                <Maximize2 className="h-4 w-4" />
                Focus Mode
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timer Section */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Timer</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Task Selector */}
              <div className="mb-6">
                <Label className="text-sm text-neutral-500">
                  Select Task to Track
                </Label>
                <Select
                  value={selectedTask?.id || ""}
                  onValueChange={(v) => {
                    const task = pendingTasks.find((t) => t.id === v);
                    setSelectedTask(task || null);
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Choose a task or work in general..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">General Focus Session</SelectItem>
                    {pendingTasks.map((task) => (
                      <SelectItem key={task.id} value={task.id}>
                        <div className="flex items-center gap-2">
                          <span className="truncate">{task.title}</span>
                          {task.linkedGoalId && (
                            <Target className="h-3 w-3 text-purple-500" />
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Timer Display */}
              <div className="flex flex-col items-center py-8">
                <div className="relative w-48 h-48 sm:w-64 sm:h-64 flex items-center justify-center">
                  {/* Progress Ring */}
                  <svg className="absolute w-full h-full -rotate-90">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="45%"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      className="text-neutral-200 dark:text-neutral-700"
                    />
                    <motion.circle
                      cx="50%"
                      cy="50%"
                      r="45%"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="8"
                      strokeLinecap="round"
                      className={
                        timerState === "break"
                          ? "text-green-500"
                          : "text-purple-500"
                      }
                      strokeDasharray={`${2 * Math.PI * 45}%`}
                      strokeDashoffset={`${2 * Math.PI * 45 * (1 - progressPercentage / 100)}%`}
                    />
                  </svg>

                  {/* Time Display */}
                  <div className="text-center z-10">
                    <div className="text-4xl sm:text-5xl font-bold font-mono">
                      {formatTime(timeRemaining)}
                    </div>
                    <div className="text-sm text-neutral-500 mt-2">
                      {timerState === "break"
                        ? "Break Time ☕"
                        : timerState === "paused"
                          ? "Paused ⏸"
                          : timerState === "running"
                            ? "Focus Time 🎯"
                            : "Ready to focus?"}
                    </div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex gap-3 mt-8">
                  {timerState === "idle" && (
                    <Button
                      size="lg"
                      onClick={handleStart}
                      className="gap-2 bg-purple-600 hover:bg-purple-700"
                    >
                      <Play className="w-5 h-5" />
                      Start Focus
                    </Button>
                  )}
                  {timerState === "running" && (
                    <>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={handlePause}
                        className="gap-2"
                      >
                        <Pause className="w-5 h-5" />
                        Pause
                      </Button>
                      <Button
                        size="lg"
                        variant="destructive"
                        onClick={handleStop}
                        className="gap-2"
                      >
                        <Square className="w-5 h-5" />
                        Stop
                      </Button>
                    </>
                  )}
                  {timerState === "paused" && (
                    <>
                      <Button
                        size="lg"
                        onClick={handleResume}
                        className="gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <Play className="w-5 h-5" />
                        Resume
                      </Button>
                      <Button
                        size="lg"
                        variant="destructive"
                        onClick={handleStop}
                        className="gap-2"
                      >
                        <Square className="w-5 h-5" />
                        Stop
                      </Button>
                    </>
                  )}
                  {timerState === "break" && (
                    <>
                      <Button
                        size="lg"
                        onClick={handleStart}
                        className="gap-2 bg-purple-600 hover:bg-purple-700"
                      >
                        <Play className="w-5 h-5" />
                        Start Break
                      </Button>
                      <Button
                        size="lg"
                        variant="outline"
                        onClick={handleSkipBreak}
                        className="gap-2"
                      >
                        <SkipForward className="w-5 h-5" />
                        Skip Break
                      </Button>
                    </>
                  )}
                </div>

                {/* Pomodoro Counter */}
                <div className="flex items-center gap-2 mt-6">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className={cn(
                        "w-3 h-3 rounded-full transition-colors",
                        i < pomodorosCompleted
                          ? "bg-purple-500"
                          : "bg-neutral-200 dark:bg-neutral-700",
                      )}
                    />
                  ))}
                  <span className="text-sm text-neutral-500 ml-2">
                    {pomodorosCompleted}/5 pomodoros
                  </span>
                </div>

                {/* Timer Info */}
                <p className="text-xs text-neutral-400 mt-4">
                  {settings.workDuration}min work /{" "}
                  {settings.shortBreakDuration}min break /
                  {settings.longBreakDuration}min long break
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Stats Section */}
          <div className="space-y-4">
            {/* Today's Stats */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Today&apos;s Focus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                    <p className="text-3xl font-bold text-purple-600">
                      {formatDuration(todayFocusTime)}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Total Focus Time
                    </p>
                  </div>
                  <div className="text-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                    <p className="text-3xl font-bold text-orange-600">
                      {todaySessions.filter((s) => s.completed).length}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">Pomodoros</p>
                  </div>
                </div>

                {/* Weekly Progress */}
                <div className="mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-neutral-500">
                      Weekly Goal
                    </span>
                    <span className="text-sm font-medium">
                      {formatDuration(todayFocusTime)} / 10h
                    </span>
                  </div>
                  <Progress
                    value={Math.min((todayFocusTime / 600) * 100, 100)}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Recent Sessions */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Brain className="h-4 w-4" />
                  Today&apos;s Sessions
                </CardTitle>
              </CardHeader>
              <CardContent>
                {todaySessions.length === 0 ? (
                  <div className="text-center py-8 text-neutral-500">
                    <Coffee className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No sessions yet today</p>
                    <p className="text-xs">Start your first pomodoro!</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {todaySessions
                      .slice()
                      .reverse()
                      .map((session) => (
                        <div
                          key={session.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg",
                            session.completed
                              ? "bg-green-50 dark:bg-green-900/20"
                              : "bg-neutral-50 dark:bg-neutral-800/50",
                          )}
                        >
                          {session.completed ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <Square className="h-4 w-4 text-neutral-400" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {session.type === "work"
                                ? "Focus Session"
                                : "Break"}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {format(new Date(session.startTime), "h:mm a")} •{" "}
                              {session.actualDuration || session.duration}min
                            </p>
                          </div>
                          {session.linkedTaskId && (
                            <Badge variant="outline" className="text-xs">
                              Task
                            </Badge>
                          )}
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Streak Card */}
            <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white dark:bg-neutral-800 rounded-xl shadow-sm">
                    <Flame className="h-8 w-8 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">
                      {pomodorosCompleted}
                    </p>
                    <p className="text-sm text-neutral-500">Pomodoros Today</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Timer Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Work Duration (min)</Label>
                <Input
                  type="number"
                  min={1}
                  max={90}
                  value={settings.workDuration}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      workDuration: parseInt(e.target.value) || 25,
                    })
                  }
                />
              </div>
              <div>
                <Label>Short Break (min)</Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={settings.shortBreakDuration}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      shortBreakDuration: parseInt(e.target.value) || 5,
                    })
                  }
                />
              </div>
              <div>
                <Label>Long Break (min)</Label>
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={settings.longBreakDuration}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      longBreakDuration: parseInt(e.target.value) || 15,
                    })
                  }
                />
              </div>
              <div>
                <Label>Pomodoros before Long Break</Label>
                <Input
                  type="number"
                  min={2}
                  max={10}
                  value={settings.pomodorosBeforeLongBreak}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      pomodorosBeforeLongBreak: parseInt(e.target.value) || 4,
                    })
                  }
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSettings(DEFAULT_TIMER_SETTINGS)}
            >
              Reset to Default
            </Button>
            <Button
              onClick={() => {
                setTimeRemaining(settings.workDuration * 60);
                setIsSettingsOpen(false);
              }}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
