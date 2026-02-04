"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/lib/context/app-context";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Moon, Sun, Download, Upload, Trash2, Monitor } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const {
    settings,
    updateSettings,
    tasks,
    habits,
    transactions,
    timeEntries,
    goals,
    studySessions,
    journalEntries,
  } = useApp();

  // Theme state
  const [theme, setTheme] = useState<"dark" | "light" | "system">("dark");

  // Load theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as
      | "dark"
      | "light"
      | "system"
      | null;
    if (savedTheme) {
      setTheme(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (newTheme: "dark" | "light" | "system") => {
    const html = document.documentElement;

    if (newTheme === "system") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      if (prefersDark) {
        html.classList.add("dark");
      } else {
        html.classList.remove("dark");
      }
    } else if (newTheme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }

    localStorage.setItem("theme", newTheme);
  };

  const handleThemeChange = (newTheme: "dark" | "light" | "system") => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  // Notification settings
  const notificationSettings = settings?.notifications || {
    enabled: true,
    tasks: true,
    habits: true,
  };

  const handleExportData = () => {
    const data = {
      tasks,
      habits,
      transactions,
      timeEntries,
      goals,
      studySessions,
      journalEntries,
      settings,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cortexia-backup-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Data exported successfully");
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        toast.success("Data imported successfully");
      } catch {
        toast.error("Failed to import data");
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = () => {
    if (confirm("Clear all data? This cannot be undone.")) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("cortexia-data");
        window.location.reload();
      }
    }
  };

  const getStorageSize = () => {
    if (typeof window === "undefined") return "0";
    const data = localStorage.getItem("cortexia-data") || "";
    const bytes = new Blob([data]).size;
    return (bytes / 1024).toFixed(0);
  };

  return (
    <AppLayout>
      <div className="space-y-6 pb-24">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-white">
            Settings
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Preferences and data management
          </p>
        </div>

        {/* Theme */}
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Theme</Label>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Choose your preferred appearance
                </p>
              </div>
              <div className="flex gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                <button
                  onClick={() => handleThemeChange("light")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    theme === "light"
                      ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white",
                  )}
                >
                  <Sun className="w-3.5 h-3.5" />
                  Light
                </button>
                <button
                  onClick={() => handleThemeChange("dark")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    theme === "dark"
                      ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white",
                  )}
                >
                  <Moon className="w-3.5 h-3.5" />
                  Dark
                </button>
                <button
                  onClick={() => handleThemeChange("system")}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                    theme === "system"
                      ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white",
                  )}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  Auto
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Notifications</Label>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Enable all notifications
                </p>
              </div>
              <Switch
                checked={notificationSettings.enabled}
                onCheckedChange={(checked) =>
                  updateSettings({
                    notifications: {
                      ...notificationSettings,
                      enabled: checked,
                    },
                  })
                }
              />
            </div>

            {notificationSettings.enabled && (
              <>
                <div className="h-px bg-neutral-200 dark:bg-neutral-800" />
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Task reminders</Label>
                  </div>
                  <Switch
                    checked={notificationSettings.tasks}
                    onCheckedChange={(checked) =>
                      updateSettings({
                        notifications: {
                          ...notificationSettings,
                          tasks: checked,
                        },
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Habit reminders</Label>
                  </div>
                  <Switch
                    checked={notificationSettings.habits}
                    onCheckedChange={(checked) =>
                      updateSettings({
                        notifications: {
                          ...notificationSettings,
                          habits: checked,
                        },
                      })
                    }
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Data */}
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-4 space-y-4">
            <div>
              <Label className="text-sm font-medium">Data</Label>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                {getStorageSize()} KB used • {tasks.length} tasks,{" "}
                {habits.length} habits
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
                className="text-xs h-8"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export
              </Button>
              <div className="relative">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button variant="outline" size="sm" className="text-xs h-8">
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  Import
                </Button>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAllData}
                className="text-xs h-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card className="border-neutral-200 dark:border-neutral-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">CorteXia</Label>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Version 1.0.0
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
