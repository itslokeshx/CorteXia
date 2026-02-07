"use client";

import { AppLayout } from "@/components/layout/app-layout";
import { UnifiedTimeline } from "@/components/timeline/unified-timeline";

export default function TimelinePage() {
  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6 pb-24">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Timeline</h1>
          <p className="text-muted-foreground text-sm md:text-base mt-1">
            Your complete life history in one view
          </p>
        </div>

        <UnifiedTimeline />
      </div>
    </AppLayout>
  );
}
