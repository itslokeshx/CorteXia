'use client';

import { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';

interface LifeState {
  label: string;
  description: string;
  score: number;
  color: string;
  stateColor: string;
}

const LIFE_STATES: Record<string, LifeState> = {
  momentum: {
    label: 'High Momentum',
    description: 'Strong habit consistency + ahead on goals + controlled spending',
    score: 87,
    color: '#10B981',
    stateColor: 'from-state-momentum to-state-momentum/80',
  },
  ontrack: {
    label: 'On Track',
    description: 'Progressing well with balanced habits and sustainable focus',
    score: 72,
    color: '#3B82F6',
    stateColor: 'from-state-ontrack to-state-ontrack/80',
  },
  drifting: {
    label: 'Drifting',
    description: 'Some areas slipping but recovery is possible with focus',
    score: 58,
    color: '#F59E0B',
    stateColor: 'from-state-drift to-state-drift/80',
  },
  overloaded: {
    label: 'Overloaded',
    description: 'Too many commitments, need to reduce scope and prioritize',
    score: 42,
    color: '#EF4444',
    stateColor: 'from-state-overload to-state-overload/80',
  },
};

export function LifeStateCore() {
  const [currentState, setCurrentState] = useState<LifeState>(LIFE_STATES.momentum);
  const [isBreathing, setIsBreathing] = useState(true);

  useEffect(() => {
    // Cycle through states for demo (every 6 seconds)
    const states = Object.values(LIFE_STATES);
    let index = 0;

    const interval = setInterval(() => {
      index = (index + 1) % states.length;
      setCurrentState(states[index]);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-24 gap-8">
      {/* Life State Card */}
      <div
        className={`w-full max-w-md px-8 py-12 rounded-2xl border border-border/50 bg-gradient-to-br ${currentState.stateColor} bg-opacity-5 backdrop-blur-sm transition-all duration-800 ease-in-out ${
          isBreathing ? 'animate-pulse' : ''
        }`}
        onMouseEnter={() => setIsBreathing(false)}
        onMouseLeave={() => setIsBreathing(true)}
      >
        <div className="text-center space-y-6">
          {/* State Label */}
          <div>
            <h1
              className="text-5xl font-bold transition-colors duration-800"
              style={{ color: currentState.color }}
            >
              {currentState.label}
            </h1>
          </div>

          {/* State Description */}
          <p className="text-lg text-text-secondary leading-relaxed max-w-sm mx-auto">
            {currentState.description}
          </p>

          {/* Life Score */}
          <div className="flex items-center justify-center gap-2">
            <Activity className="w-4 h-4 text-text-tertiary" />
            <span className="text-sm font-mono text-text-tertiary uppercase tracking-wider">
              Life Score: {currentState.score}/100
            </span>
          </div>
        </div>
      </div>

      {/* State Indicators */}
      <div className="flex gap-3 justify-center">
        {Object.entries(LIFE_STATES).map(([key, state]) => (
          <button
            key={key}
            onClick={() => setCurrentState(state)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              currentState.label === state.label
                ? 'w-8 bg-opacity-100'
                : 'bg-opacity-30 hover:bg-opacity-50'
            }`}
            style={{ backgroundColor: state.color }}
            aria-label={state.label}
          />
        ))}
      </div>
    </div>
  );
}
