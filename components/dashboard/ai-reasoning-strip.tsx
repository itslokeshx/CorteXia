'use client';

import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

interface AIReasoningProps {
  why: string;
  whatNext: string;
  onAction?: () => void;
}

export function AIReasoningStrip({
  why = 'Screen time spiked 40% → broken gym habit → task failures cascade',
  whatNext = 'Block Instagram after 10pm & set gym alarm for 6am tomorrow',
  onAction,
}: AIReasoningProps) {
  return (
    <div className="fixed bottom-0 left-60 right-0 h-32 bg-gradient-to-t from-background via-background/95 to-transparent border-t border-border/30 backdrop-blur-lg flex items-center px-8 z-30">
      <div className="max-w-7xl mx-auto w-full flex items-center gap-8 justify-between">
        {/* Why Section */}
        <div className="flex-1 max-w-md">
          <p className="text-xs uppercase tracking-wider text-text-tertiary font-semibold mb-2">
            Why
          </p>
          <p className="text-base text-text-secondary leading-relaxed">
            {why}
          </p>
        </div>

        {/* Divider */}
        <div className="w-px h-12 bg-border/50" />

        {/* What Next Section */}
        <div className="flex-1 max-w-md">
          <p className="text-xs uppercase tracking-wider text-text-tertiary font-semibold mb-2">
            What Next
          </p>
          <p className="text-base text-text-secondary leading-relaxed">
            {whatNext}
          </p>
        </div>

        {/* Action Button */}
        <Button
          onClick={onAction}
          className="bg-state-ontrack hover:bg-state-ontrack/90 text-white font-semibold gap-2 px-6 h-10 flex-shrink-0 group"
        >
          Do It
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </div>
    </div>
  );
}
