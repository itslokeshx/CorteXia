"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { UnifiedTimeline } from "@/components/timeline/unified-timeline";

export default function TimelinePage() {
  return (
    <AppLayout>
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-24 sm:pb-12 space-y-6 sm:space-y-8">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl md:text-3xl text-[var(--text-primary)]">
            Timeline
          </h1>
          <p className="text-[var(--text-secondary)] text-sm mt-1">
            Your complete life history in one view
          </p>
        </div>

        <UnifiedTimeline />
      </div>
    </AppLayout>
  );
}
