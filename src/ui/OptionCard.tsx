import React from 'react';
import { copy } from '../copy/en';
import type { Option } from '../core/types';
import { to12Hour } from '../core/time';
import { KnotIcon } from './icons';
import { DayStrip } from './DayStrip';

interface OptionCardProps {
  option: Option;
  isSelected: boolean;
  clashReason?: string;
  threadColor: string;
  onSelect: () => void;
  onRemove?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export const OptionCard: React.FC<OptionCardProps> = ({
  option,
  isSelected,
  clashReason,
  threadColor,
  onSelect,
  onRemove,
  onMouseEnter,
  onMouseLeave,
}) => {
  const hasClash = Boolean(clashReason);

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`p-3.5 bg-ground border rounded transition-all duration-150 ${
        isSelected
          ? 'border-ink ring-1 ring-ink bg-ground'
          : hasClash
          ? 'border-clash/40 hover:border-clash bg-clash/5'
          : 'border-rule hover:border-ink/50'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-ink">{option.sectionName}</span>
          {isSelected && (
            <span
              className="px-1.5 py-0.5 rounded text-[10px] font-semibold text-ground"
              style={{ backgroundColor: threadColor }}
            >
              Selected
            </span>
          )}
        </div>
        <span className="text-xs text-ink-soft truncate max-w-[140px]">
          {option.teachers.join(', ')}
        </span>
      </div>

      {/* Day strip showing meeting days and earliest/latest time */}
      <div className="my-2.5">
        <DayStrip
          dayMask={option.dayMask}
          timeRange={`${to12Hour(option.earliestStart)} to ${to12Hour(option.latestEnd)}`}
          activeColor={threadColor}
        />
      </div>

      {/* Clash notification badge if overlapping */}
      {hasClash && (
        <div className="mb-3 p-2 bg-clash/10 border border-clash/30 rounded text-[11px] text-clash flex items-start gap-1.5">
          <KnotIcon className="shrink-0 mt-0.5" size={14} />
          <span>{clashReason}</span>
        </div>
      )}

      {/* Action button */}
      {isSelected ? (
        <button
          onClick={onRemove ?? onSelect}
          className="w-full py-2 px-3 rounded text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1.5 bg-ground border border-clash/60 text-clash hover:bg-clash/10 cursor-pointer"
        >
          <span>✕ Remove from timetable</span>
        </button>
      ) : (
        <button
          onClick={onSelect}
          className={`w-full py-2 px-3 rounded text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
            hasClash
              ? 'bg-clash text-ground hover:opacity-90'
              : 'bg-ink text-ground hover:opacity-90'
          }`}
        >
          {copy.options.useThis}
        </button>
      )}
    </div>
  );
};
