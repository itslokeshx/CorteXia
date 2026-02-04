"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { LiveLifeStateCore } from "@/components/dashboard/live-life-state-core";
import { SignalConstellationV2 } from "@/components/dashboard/signal-constellation-v2";
import { AIReasoningStripV2 } from "@/components/dashboard/ai-reasoning-strip-v2";
import { WeeklySynthesis } from "@/components/dashboard/weekly-synthesis";
import { CrossDomainMap } from "@/components/dashboard/cross-domain-map";
import { ConversationalAI } from "@/components/ai/conversational-ai";
import { ProactiveAlerts } from "@/components/dashboard/proactive-alerts";

export default function DashboardPage() {
  return (
    <AppLayout>
      {/* Hero Section with Live Life State */}
      <section className="min-h-screen pt-8">
        <div className="max-w-7xl mx-auto">
          {/* Page Header with Greeting */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-balance bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Your Life, Understood
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              AI-powered insights across every dimension of your life
            </p>
          </div>

          {/* Main Dashboard Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Life State Core - spans 2 columns */}
            <div className="lg:col-span-2">
              <LiveLifeStateCore />
            </div>

            {/* Weekly Synthesis */}
            <div className="lg:col-span-1">
              <WeeklySynthesis />
            </div>
          </div>

          {/* AI Reasoning Strip */}
          <div className="mb-8">
            <AIReasoningStripV2 />
          </div>

          {/* Second Row - Constellation and Cross-Domain */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Signal Constellation */}
            <SignalConstellationV2 />

            {/* Cross-Domain Map */}
            <CrossDomainMap />
          </div>

          {/* Bottom Spacing */}
          <div className="h-24" />
        </div>
      </section>

      {/* Floating Components */}
      <ConversationalAI />
      <ProactiveAlerts />
    </AppLayout>
  );
}
