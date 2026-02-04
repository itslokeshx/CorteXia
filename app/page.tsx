'use client';

import { AppLayout } from '@/components/layout/app-layout';
import { LifeStateCore } from '@/components/dashboard/life-state-core';
import { SignalConstellation } from '@/components/dashboard/signal-constellation';
import { AIReasoningStrip } from '@/components/dashboard/ai-reasoning-strip';

export default function DashboardPage() {
  return (
    <AppLayout>
      {/* Hero Section with Life State */}
      <section className="min-h-screen pt-12">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-text-primary text-balance">
              Your Life, Understood
            </h1>
            <p className="text-lg text-text-secondary mt-3">
              Powered by AI. Real-time insights across every dimension of your life.
            </p>
          </div>

          {/* Life State Core */}
          <LifeStateCore />

          {/* Divider */}
          <div className="my-16 flex items-center gap-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-sm text-text-tertiary uppercase tracking-wider font-semibold">
              Life Signal Constellation
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Signal Constellation */}
          <SignalConstellation />

          {/* Bottom Spacing for AI Strip */}
          <div className="h-40" />
        </div>
      </section>

      {/* AI Reasoning Strip */}
      <AIReasoningStrip
        why="Screen time spiked 40% → broken gym habit → task failures cascade"
        whatNext="Block Instagram after 10pm & set gym alarm for 6am tomorrow"
        onAction={() => console.log('Action triggered')}
      />
    </AppLayout>
  );
}
