'use client';

import React from "react"

import { useState } from 'react';
import { Clock, Brain, RotateCw, Target, DollarSign, BookOpen, Smartphone, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Signal {
  id: string;
  icon: React.ReactNode;
  label: string;
  status: 'stable' | 'warning' | 'critical';
  value: string;
  domain: string;
}

const SIGNALS: Signal[] = [
  {
    id: 'time',
    icon: <Clock className="w-8 h-8" />,
    label: 'Time',
    status: 'stable',
    value: '8.2h',
    domain: 'Productive hours today',
  },
  {
    id: 'focus',
    icon: <Brain className="w-8 h-8" />,
    label: 'Focus',
    status: 'stable',
    value: '94%',
    domain: 'Deep work quality',
  },
  {
    id: 'habits',
    icon: <RotateCw className="w-8 h-8" />,
    label: 'Habits',
    status: 'stable',
    value: '7/8',
    domain: 'Daily habits completed',
  },
  {
    id: 'goals',
    icon: <Target className="w-8 h-8" />,
    label: 'Goals',
    status: 'stable',
    value: '3/5',
    domain: 'Weekly milestones hit',
  },
  {
    id: 'money',
    icon: <DollarSign className="w-8 h-8" />,
    label: 'Money',
    status: 'warning',
    value: '78%',
    domain: 'Budget remaining',
  },
  {
    id: 'study',
    icon: <BookOpen className="w-8 h-8" />,
    label: 'Study',
    status: 'stable',
    value: '2.5h',
    domain: 'Learning time logged',
  },
  {
    id: 'screen',
    icon: <Smartphone className="w-8 h-8" />,
    label: 'Screen',
    status: 'warning',
    value: '6.1h',
    domain: 'Total screen time',
  },
  {
    id: 'energy',
    icon: <Zap className="w-8 h-8" />,
    label: 'Energy',
    status: 'stable',
    value: '72%',
    domain: 'Energy level estimate',
  },
];

const STATUS_COLORS = {
  stable: '#10B981',
  warning: '#F59E0B',
  critical: '#EF4444',
};

export function SignalConstellation() {
  const [hoveredSignal, setHoveredSignal] = useState<string | null>(null);

  // Calculate positions for 8 signals in a circle
  const radius = 240;
  const signals = SIGNALS.map((signal, index) => {
    const angle = (index * 360) / SIGNALS.length;
    const x = Math.cos((angle * Math.PI) / 180) * radius;
    const y = Math.sin((angle * Math.PI) / 180) * radius;
    return { ...signal, x, y };
  });

  return (
    <div className="relative w-full flex justify-center py-12">
      <div className="relative w-full max-w-2xl aspect-square">
        {/* Orbital paths (subtle) */}
        <svg className="absolute inset-0 w-full h-full opacity-30">
          <circle
            cx="50%"
            cy="50%"
            r={`${(radius / 480) * 100}%`}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            className="text-border"
          />
        </svg>

        {/* Signals */}
        {signals.map((signal) => (
          <div
            key={signal.id}
            className="absolute w-24 h-24 flex items-center justify-center"
            style={{
              left: '50%',
              top: '50%',
              transform: `translate(calc(-50% + ${signal.x}px), calc(-50% + ${signal.y}px))`,
              transition: 'all 0.3s ease-out',
            }}
            onMouseEnter={() => setHoveredSignal(signal.id)}
            onMouseLeave={() => setHoveredSignal(null)}
          >
            <button
              className={cn(
                'w-full h-full rounded-2xl border-2 transition-all duration-300',
                'flex flex-col items-center justify-center gap-1',
                'hover:shadow-lg hover:scale-105 cursor-pointer',
                hoveredSignal === signal.id
                  ? 'bg-bg-secondary border-border shadow-lg'
                  : 'bg-background border-border hover:border-border'
              )}
              title={signal.domain}
            >
              {/* Status Indicator */}
              <div
                className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[signal.status] }}
              />

              {/* Icon */}
              <div className="text-text-primary opacity-80">{signal.icon}</div>

              {/* Label */}
              <span className="text-xs font-semibold text-text-primary uppercase tracking-wider">
                {signal.label}
              </span>

              {/* Value (shown on hover) */}
              {hoveredSignal === signal.id && (
                <span className="text-sm font-mono text-text-secondary mt-1">{signal.value}</span>
              )}
            </button>
          </div>
        ))}

        {/* Center indicator */}
        <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-text-primary rounded-full transform -translate-x-1/2 -translate-y-1/2" />
      </div>
    </div>
  );
}
