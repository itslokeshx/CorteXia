'use client';

import React from "react"

import { AppLayout } from '@/components/layout/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings, Bell, Lock, User, Palette, Database } from 'lucide-react';
import { useState } from 'react';

interface SettingSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  settings: Array<{
    id: string;
    label: string;
    value: boolean;
  }>;
}

const SETTING_SECTIONS: SettingSection[] = [
  {
    id: 'account',
    title: 'Account',
    description: 'Manage your profile and account settings',
    icon: <User className="w-5 h-5" />,
    settings: [
      { id: 'profile', label: 'Public profile', value: true },
      { id: 'share', label: 'Allow insights sharing', value: true },
      { id: 'sync', label: 'Auto-sync across devices', value: true },
    ],
  },
  {
    id: 'notifications',
    title: 'Notifications',
    description: 'Control how and when you receive notifications',
    icon: <Bell className="w-5 h-5" />,
    settings: [
      { id: 'daily', label: 'Daily briefing', value: true },
      { id: 'alerts', label: 'Goal alerts', value: true },
      { id: 'reminders', label: 'Habit reminders', value: true },
      { id: 'achievements', label: 'Achievement badges', value: true },
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy & Security',
    description: 'Protect your data and privacy',
    icon: <Lock className="w-5 h-5" />,
    settings: [
      { id: 'encrypt', label: 'End-to-end encryption', value: true },
      { id: '2fa', label: 'Two-factor authentication', value: false },
      { id: 'analytics', label: 'Anonymous analytics', value: true },
    ],
  },
  {
    id: 'appearance',
    title: 'Appearance',
    description: 'Customize how CorteXia looks',
    icon: <Palette className="w-5 h-5" />,
    settings: [
      { id: 'darkmode', label: 'Dark mode', value: true },
      { id: 'compact', label: 'Compact view', value: false },
      { id: 'animations', label: 'Enable animations', value: true },
    ],
  },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState(SETTING_SECTIONS);

  const toggleSetting = (sectionId: string, settingId: string) => {
    setSettings(
      settings.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              settings: section.settings.map((s) =>
                s.id === settingId ? { ...s, value: !s.value } : s
              ),
            }
          : section
      )
    );
  };

  return (
    <AppLayout>
      <section className="pb-32">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-bg-secondary flex items-center justify-center">
              <Settings className="w-6 h-6 text-state-ontrack" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-text-primary">Settings</h1>
            </div>
          </div>
          <p className="text-lg text-text-secondary mt-4">
            Customize your CorteXia experience and manage your preferences
          </p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {settings.map((section) => (
            <Card key={section.id} className="border-border">
              <CardHeader className="border-b border-border">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-bg-secondary flex items-center justify-center text-state-ontrack">
                    {section.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    <p className="text-sm text-text-tertiary mt-1">
                      {section.description}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {section.settings.map((setting) => (
                  <div
                    key={setting.id}
                    className="flex items-center justify-between p-3 rounded hover:bg-bg-secondary transition-colors"
                  >
                    <label className="flex items-center gap-2 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={setting.value}
                        onChange={() => toggleSetting(section.id, setting.id)}
                        className="w-5 h-5 rounded border-border cursor-pointer"
                      />
                      <span className="text-text-primary font-medium">
                        {setting.label}
                      </span>
                    </label>
                    <div
                      className={`w-12 h-6 rounded-full transition-all ${
                        setting.value ? 'bg-state-ontrack' : 'bg-bg-tertiary'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transition-transform ${
                          setting.value ? 'translate-x-6' : 'translate-x-0.5'
                        } mt-0.5`}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Data Management */}
        <Card className="border-border mt-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 rounded-lg bg-bg-secondary border border-border">
              <h3 className="font-semibold text-text-primary mb-2">Storage Usage</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Used</span>
                  <span className="text-sm font-medium text-text-primary">2.3 GB of 15 GB</span>
                </div>
                <div className="w-full h-2 bg-bg-tertiary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-state-ontrack"
                    style={{ width: `${(2.3 / 15) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" size="sm">
                Export Data
              </Button>
              <Button variant="outline" size="sm">
                Delete Old Entries
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <Card className="border-border mt-8">
          <CardHeader>
            <CardTitle>Support & Help</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-text-secondary">
              Need help? Check out our documentation or contact our support team.
            </p>
            <div className="flex gap-3">
              <Button className="bg-state-ontrack hover:bg-state-ontrack/90 text-white">
                View Documentation
              </Button>
              <Button variant="outline">
                Contact Support
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>
    </AppLayout>
  );
}
