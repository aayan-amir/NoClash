import React from 'react';
import type { Day } from '../core/types';

interface DayStripProps {
  dayMask: Record<Day, boolean>;
  timeRange?: string;
  activeColor?: string;
}

const ALL_DAYS: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

export const DayStrip: React.FC<DayStripProps> = ({
  dayMask,
  timeRange,
  activeColor = 'var(--ink)',
}) => {
  return (
    <div className="flex items-center justify-between gap-2 text-[11px]">
      <div className="flex items-center gap-1">
        {ALL_DAYS.map((day) => {
          const isActive = dayMask[day];
          return (
            <span
              key={day}
              className={`w-6 h-5 rounded flex items-center justify-center font-medium transition-colors ${
                isActive
                  ? 'text-ground font-semibold'
                  : 'bg-ground-sunk text-ink-soft/40'
              }`}
              style={{
                backgroundColor: isActive ? activeColor : undefined,
              }}
            >
              {day[0]}
            </span>
          );
        })}
      </div>

      {timeRange && (
        <span className="text-ink-soft font-mono text-[11px] font-medium">
          {timeRange}
        </span>
      )}
    </div>
  );
};
