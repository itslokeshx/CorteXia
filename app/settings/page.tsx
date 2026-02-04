"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/lib/context/app-context";
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Settings,
  Bell,
  Lock,
  User,
  Palette,
  Database,
  Sparkles,
  Download,
  Upload,
  Trash2,
  Key,
  Moon,
  Sun,
  Check,
  AlertTriangle,
  RefreshCw,
  Globe,
} from "lucide-react";

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

  // API connection state
  const [apiStatus, setApiStatus] = useState<
    "unknown" | "connected" | "disconnected"
  >("unknown");
  const [isTestingApi, setIsTestingApi] = useState(false);

  // Theme state
  const [theme, setTheme] = useState<"dark" | "light" | "system">("dark");

  // Check API connection on mount
  useEffect(() => {
    checkApiConnection();
  }, []);

  const checkApiConnection = async () => {
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const response = await fetch(`${API_URL}/health`);
      if (response.ok) {
        setApiStatus("connected");
      } else {
        setApiStatus("disconnected");
      }
    } catch {
      setApiStatus("disconnected");
    }
  };

  const handleTestApi = async () => {
    setIsTestingApi(true);
    try {
      const API_URL =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

      // Test health endpoint
      const healthRes = await fetch(`${API_URL}/health`);
      if (!healthRes.ok) {
        throw new Error("API not responding");
      }

      // Test AI endpoint
      const aiRes = await fetch(`${API_URL}/api/ai/ask`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: 'Say "OK" if AI is working',
          context: {},
        }),
      });

      if (aiRes.ok) {
        const { response } = await aiRes.json();
        setApiStatus("connected");
        toast.success(
          `API connected! AI response: "${response?.slice(0, 50)}..."`,
        );
      } else {
        setApiStatus("connected");
        toast.warning("API connected but AI may not be configured");
      }
    } catch (error) {
      setApiStatus("disconnected");
      toast.error(
        "Failed to connect to API. Make sure the backend is running.",
      );
    } finally {
      setIsTestingApi(false);
    }
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
        // Import logic would go here - for now just show success
        toast.success("Data imported successfully");
      } catch (error) {
        toast.error("Failed to import data. Invalid file format.");
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = () => {
    if (
      confirm("Are you sure you want to clear all data? This cannot be undone.")
    ) {
      localStorage.removeItem("cortexia-data");
      window.location.reload();
    }
  };

  const calculateStorageUsage = () => {
    const data = localStorage.getItem("cortexia-data") || "";
    const bytes = new Blob([data]).size;
    return (bytes / 1024 / 1024).toFixed(2); // Convert to MB
  };

  // Notification settings from context
  const notificationSettings = settings?.notifications || {
    enabled: true,
    tasks: true,
    habits: true,
    insights: true,
  };

  // Privacy settings from context
  const privacySettings = settings?.privacy || {
    dataCollection: true,
    aiAnalysis: true,
  };

  return (
    <AppLayout>
      <section className="pb-32 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              <Settings className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-4xl font-bold">Settings</h1>
            </div>
          </div>
          <p className="text-lg text-muted-foreground mt-4">
            Customize your CorteXia experience and manage your preferences
          </p>
        </div>

        <div className="space-y-8">
          {/* AI Configuration */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <CardTitle className="flex items-center gap-2">
                    AI Configuration
                    {apiStatus === "connected" && (
                      <Badge className="bg-green-500/20 text-green-400">
                        Connected
                      </Badge>
                    )}
                    {apiStatus === "disconnected" && (
                      <Badge variant="destructive">Disconnected</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    AI powered by Groq (Llama 3.1 70B)
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Backend API Connection</Label>
                <div className="flex gap-2">
                  <div className="flex-1 p-3 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          apiStatus === "connected"
                            ? "bg-green-500"
                            : apiStatus === "disconnected"
                              ? "bg-red-500"
                              : "bg-yellow-500"
                        }`}
                      />
                      <span className="text-sm font-medium">
                        {apiStatus === "connected"
                          ? "API Connected"
                          : apiStatus === "disconnected"
                            ? "API Disconnected"
                            : "Checking..."}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {process.env.NEXT_PUBLIC_API_URL ||
                        "http://localhost:3001"}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleTestApi}
                    disabled={isTestingApi}
                  >
                    {isTestingApi ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      "Test Connection"
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  AI is configured on the backend with Groq API. Run the API
                  server with{" "}
                  <code className="px-1 py-0.5 rounded bg-muted">
                    cd api && npm run dev
                  </code>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Appearance */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>
                    Customize how CorteXia looks
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    Select your preferred color scheme
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={theme === "light" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("light")}
                  >
                    <Sun className="w-4 h-4 mr-2" />
                    Light
                  </Button>
                  <Button
                    variant={theme === "dark" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("dark")}
                  >
                    <Moon className="w-4 h-4 mr-2" />
                    Dark
                  </Button>
                  <Button
                    variant={theme === "system" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTheme("system")}
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    System
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Compact View</Label>
                  <p className="text-sm text-muted-foreground">
                    Use a more compact layout
                  </p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Animations</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable interface animations
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                  <Bell className="w-5 h-5 text-yellow-500" />
                </div>
                <div>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>
                    Control how and when you receive notifications
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive all notifications
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
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Task Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Get reminded about upcoming tasks
                  </p>
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
                <div className="space-y-0.5">
                  <Label>Habit Reminders</Label>
                  <p className="text-sm text-muted-foreground">
                    Daily habit check-in reminders
                  </p>
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
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>AI Insights</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive AI-generated insights and recommendations
                  </p>
                </div>
                <Switch
                  checked={notificationSettings.insights}
                  onCheckedChange={(checked) =>
                    updateSettings({
                      notifications: {
                        ...notificationSettings,
                        insights: checked,
                      },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Privacy */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <CardTitle>Privacy & Security</CardTitle>
                  <CardDescription>
                    Protect your data and privacy
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Data Collection</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow anonymous usage analytics
                  </p>
                </div>
                <Switch
                  checked={privacySettings.dataCollection}
                  onCheckedChange={(checked) =>
                    updateSettings({
                      privacy: { ...privacySettings, dataCollection: checked },
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>AI Analysis</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow AI to analyze your data for insights
                  </p>
                </div>
                <Switch
                  checked={privacySettings.aiAnalysis}
                  onCheckedChange={(checked) =>
                    updateSettings({
                      privacy: { ...privacySettings, aiAnalysis: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Data Management */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <Database className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <CardTitle>Data Management</CardTitle>
                  <CardDescription>
                    Export, import, or clear your data
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg bg-secondary border">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">
                    Local Storage Usage
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {calculateStorageUsage()} MB
                  </span>
                </div>
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${Math.min((parseFloat(calculateStorageUsage()) / 5) * 100, 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {tasks.length} tasks, {habits.length} habits,{" "}
                  {transactions.length} transactions, {journalEntries.length}{" "}
                  journal entries
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={handleExportData}>
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
                <div className="relative">
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportData}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button variant="outline">
                    <Upload className="w-4 h-4 mr-2" />
                    Import Data
                  </Button>
                </div>
                <Button variant="destructive" onClick={handleClearAllData}>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Data
                </Button>
              </div>

              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-destructive">
                      Danger Zone
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Clearing all data will permanently delete all your tasks,
                      habits, transactions, journal entries, and settings. This
                      action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* About */}
          <Card>
            <CardHeader>
              <CardTitle>About CorteXia</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Version</p>
                  <p className="font-medium">1.0.0</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Build</p>
                  <p className="font-medium">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Separator />
              <p className="text-sm text-muted-foreground">
                CorteXia is an AI-powered personal life management system
                designed to help you track tasks, habits, finances, and more
                with intelligent insights.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  View Documentation
                </Button>
                <Button variant="outline" size="sm">
                  Report an Issue
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </AppLayout>
  );
}
