import React from 'react';
import { getContrastTextColor } from '../design/tokens';

interface SpoolProps {
  name: string;
  code: string;
  kind: 'theory' | 'practical' | 'single';
  threadColor: string;
  chosenSectionId?: string;
  teacher?: string;
  isSelected?: boolean;
  needsAttention?: boolean;
  onClick: () => void;
  onClear?: (e: React.MouseEvent) => void;
}

export const Spool: React.FC<SpoolProps> = ({
  name,
  code,
  kind,
  threadColor,
  chosenSectionId,
  teacher,
  isSelected = false,
  needsAttention = false,
  onClick,
  onClear,
}) => {
  const isFilled = Boolean(chosenSectionId);
  const textColor = isFilled ? getContrastTextColor(threadColor) : 'var(--ink)';

  return (
    <button
      onClick={onClick}
      role="button"
      aria-pressed={isSelected}
      className={`w-full p-2.5 rounded text-left flex items-center justify-between border transition-all duration-150 ${
        isSelected
          ? 'border-ink bg-ground ring-1 ring-ink'
          : 'border-rule bg-ground/60 hover:bg-ground hover:border-ink/40'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* SVG Spool Bobbin Graphic */}
        <div className="shrink-0 relative w-6 h-8">
          <svg
            viewBox="0 0 24 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-full h-full"
            aria-hidden="true"
          >
            {/* Top flange of spool */}
            <path
              d="M3 4C3 2.89543 3.89543 2 5 2H19C20.1046 2 21 2.89543 21 4V6H3V4Z"
              fill={isFilled ? 'var(--ink)' : 'var(--rule)'}
            />

            {/* Middle core / Wound thread */}
            {isFilled ? (
              <g>
                <rect x="5" y="6" width="14" height="20" fill={threadColor} />
                {/* Winding thread lines */}
                <line x1="5" y1="10" x2="19" y2="10" stroke="white" strokeOpacity="0.25" strokeWidth="0.75" />
                <line x1="5" y1="15" x2="19" y2="15" stroke="white" strokeOpacity="0.25" strokeWidth="0.75" />
                <line x1="5" y1="20" x2="19" y2="20" stroke="white" strokeOpacity="0.25" strokeWidth="0.75" />
              </g>
            ) : (
              <rect
                x="6"
                y="6"
                width="12"
                height="20"
                stroke="var(--rule)"
                strokeWidth="1.2"
                strokeDasharray="2 2"
                fill="none"
              />
            )}

            {/* Bottom flange of spool */}
            <path
              d="M3 26H21V28C21 29.1046 20.1046 30 19 30H5C3.89543 30 3 29.1046 3 28V26Z"
              fill={isFilled ? 'var(--ink)' : 'var(--rule)'}
            />
          </svg>
        </div>

        <div>
          <div className="text-xs font-semibold text-ink line-clamp-1">{name}</div>
          <div className="text-[11px] text-ink-soft flex items-center gap-1.5 mt-0.5">
            <span>{code}</span>
            <span>•</span>
            <span className="capitalize">{kind}</span>
            {teacher && (
              <>
                <span>•</span>
                <span className="truncate max-w-[90px]">{teacher}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isFilled ? (
          <div className="flex items-center gap-1.5">
            <span
              className="px-2 py-0.5 rounded text-[11px] font-semibold border"
              style={{
                backgroundColor: threadColor,
                borderColor: threadColor,
                color: textColor,
              }}
            >
              Sec {chosenSectionId}
            </span>
            {onClear && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onClear(e);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    onClear(e as unknown as React.MouseEvent);
                  }
                }}
                title={`Remove ${code} from timetable`}
                className="w-5 h-5 rounded flex items-center justify-center text-ink-soft hover:text-clash hover:bg-ground-sunk transition-colors text-xs font-bold cursor-pointer"
              >
                ✕
              </span>
            )}
          </div>
        ) : (
          <span className="text-[11px] text-ink-soft italic">Unpicked</span>
        )}

        {needsAttention && (
          <span
            className="w-2.5 h-2.5 rounded-full bg-clash animate-pulse"
            title="Timetable data changed. Choose again."
          />
        )}
      </div>
    </button>
  );
};
