"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/lib/context/app-context";
import { useAuth } from "@/lib/context/auth-context";
import { AppLayout } from "@/components/layout/app-layout";
import { useTour } from "@/lib/context/tour-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Moon,
  Sun,
  Download,
  Upload,
  Trash2,
  Monitor,
  LogOut,
  AlertTriangle,
  User,
  Shield,
  Database,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
    importData,
  } = useApp();
  const { restartTour } = useTour();

  const { user, profile, signOut, isDemoMode } = useAuth();

  // Theme state
  const [theme, setTheme] = useState<"dark" | "light" | "system">("dark");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Load theme from settings on mount
  useEffect(() => {
    if (settings?.theme) {
      setTheme(settings.theme);
      applyTheme(settings.theme);
    }
  }, [settings?.theme]);

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
  };

  const handleThemeChange = (newTheme: "dark" | "light" | "system") => {
    setTheme(newTheme);
    applyTheme(newTheme);
    updateSettings({ theme: newTheme });
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
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        toast.promise(importData(data), {
          loading: "Importing data...",
          success: "Data imported successfully! Reloading...",
          error: "Failed to import data",
        });
      } catch {
        toast.error("Failed to parse import file");
      }
    };
    reader.readAsText(file);
  };

  const handleDeleteAllData = async () => {
    if (deleteConfirmText !== "DELETE") return;

    setIsDeleting(true);
    try {
      // Delete all user data from MongoDB
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("cortexia_token")
          : null;
      await fetch(`${API_URL}/api/delete-all-data`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      await signOut();
      toast.success("All data deleted. Signed out.");

      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    } catch {
      toast.error("Failed to delete data");
      setIsDeleting(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    window.location.href = "/login";
  };

  // Data counts
  const dataCounts = {
    tasks: tasks.length,
    habits: habits.length,
    transactions: transactions.length,
    timeEntries: timeEntries.length,
    goals: goals.length,
    studySessions: studySessions.length,
    journalEntries: journalEntries.length,
  };

  const totalItems = Object.values(dataCounts).reduce((a, b) => a + b, 0);

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6 pb-24 max-w-2xl mx-auto w-full px-4 sm:px-6 lg:px-8"
      >
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
            Settings
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            Preferences, data, and account management
          </p>
        </div>

        {/* Account */}
        <Card className="border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white text-sm font-semibold">
                  {(profile?.full_name || user?.email || "U")
                    .charAt(0)
                    .toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {profile?.full_name || "User"}
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    {isDemoMode ? (
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        Demo Account
                      </span>
                    ) : (
                      user?.email || "demo@cortexia.app"
                    )}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="w-full sm:w-auto text-xs h-8 gap-1.5 border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-red-500 hover:border-red-500/30"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Theme */}
        <Card className="border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
              <div>
                <Label className="text-sm font-medium text-[var(--color-text-primary)]">
                  Theme
                </Label>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                  Choose your preferred appearance
                </p>
              </div>
              <div className="w-full sm:w-auto grid grid-cols-3 sm:flex gap-1 p-1 bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border)]">
                {[
                  { value: "light" as const, icon: Sun, label: "Light" },
                  { value: "dark" as const, icon: Moon, label: "Dark" },
                  { value: "system" as const, icon: Monitor, label: "Auto" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleThemeChange(opt.value)}
                    className={cn(
                      "flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                      theme === opt.value
                        ? "bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] shadow-sm"
                        : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]",
                    )}
                  >
                    <opt.icon className="w-3.5 h-3.5" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label className="text-sm font-medium text-[var(--color-text-primary)]">
                  Notifications
                </Label>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
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
                <div className="h-px bg-[var(--color-border)]" />
                <div className="flex items-center justify-between gap-4">
                  <Label className="text-sm text-[var(--color-text-secondary)]">
                    Task reminders
                  </Label>
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
                <div className="flex items-center justify-between gap-4">
                  <Label className="text-sm text-[var(--color-text-secondary)]">
                    Habit reminders
                  </Label>
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

        {/* Data Management */}
        <Card className="border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[var(--color-text-tertiary)]" />
              <Label className="text-sm font-medium text-[var(--color-text-primary)]">
                Data
              </Label>
            </div>

            {/* Data overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { label: "Tasks", count: dataCounts.tasks },
                { label: "Habits", count: dataCounts.habits },
                { label: "Goals", count: dataCounts.goals },
                { label: "Time entries", count: dataCounts.timeEntries },
              ].map((item) => (
                <div
                  key={item.label}
                  className="px-3 py-2 rounded-lg bg-[var(--color-bg-primary)] border border-[var(--color-border)]"
                >
                  <p className="text-lg font-semibold text-[var(--color-text-primary)]">
                    {item.count}
                  </p>
                  <p className="text-[10px] text-[var(--color-text-tertiary)]">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>

            <div className="h-px bg-[var(--color-border)]" />

            <div className="flex flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportData}
                className="w-full sm:w-auto text-xs h-8 border-[var(--color-border)]"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Export JSON
              </Button>
              <div className="relative w-full sm:w-auto">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto text-xs h-8 border-[var(--color-border)]"
                >
                  <Upload className="w-3.5 h-3.5 mr-1.5" />
                  Import
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-500/20 bg-[var(--color-bg-secondary)]">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-500/70" />
              <Label className="text-sm font-medium text-red-500/90">
                Danger Zone
              </Label>
            </div>
            <p className="text-xs text-[var(--color-text-tertiary)]">
              Permanently delete all your data. This action cannot be undone.
              {totalItems > 0 && (
                <span className="text-[var(--color-text-secondary)]">
                  {" "}
                  You have {totalItems} items across all categories.
                </span>
              )}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              className="w-full sm:w-auto text-xs h-8 text-red-500 hover:text-red-600 border-red-500/30 hover:border-red-500/50 hover:bg-red-500/10"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Delete All Data
            </Button>
          </CardContent>
        </Card>

        {/* Onboarding & Help */}
        <Card className="border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--color-text-tertiary)]" />
              <Label className="text-sm font-medium text-[var(--color-text-primary)]">
                Onboarding & Help
              </Label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Restart Product Tour
                </p>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                  Replay the welcome onboarding guide
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  await restartTour();
                  window.location.href = "/";
                }}
                className="text-xs h-8 border-[var(--color-border)]"
              >
                Restart Tour
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card className="border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium text-[var(--color-text-primary)]">
                  CorteXia
                </Label>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                  Version 1.0.0 · Your Second Brain
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* ═══ DELETE CONFIRMATION DIALOG ═══ */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <DialogTitle className="text-base">Delete All Data</DialogTitle>
                <DialogDescription className="text-xs mt-0.5">
                  This action is permanent and irreversible
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* What will be deleted */}
            <div className="rounded-lg bg-red-500/5 border border-red-500/10 p-3 space-y-1.5">
              <p className="text-xs font-medium text-red-500/80">
                The following will be permanently deleted:
              </p>
              <div className="grid grid-cols-2 gap-1 text-[11px] text-[var(--color-text-tertiary)]">
                {Object.entries(dataCounts)
                  .filter(([, count]) => count > 0)
                  .map(([key, count]) => (
                    <p key={key}>
                      • {count} {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                    </p>
                  ))}
              </div>
            </div>

            {/* Type DELETE confirmation */}
            <div>
              <label className="text-xs font-medium text-[var(--color-text-secondary)] block mb-2">
                Type <span className="font-bold text-red-500">DELETE</span> to
                confirm
              </label>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE here"
                className="font-mono text-sm w-full"
                autoFocus
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteConfirmText("");
              }}
              className="text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAllData}
              disabled={deleteConfirmText !== "DELETE" || isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white text-sm disabled:opacity-40"
            >
              {isDeleting ? "Deleting..." : "Delete Everything"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
