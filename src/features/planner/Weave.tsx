import React, { useMemo } from 'react';
import { intervalsOverlap, to12Hour } from '../../core/time';
import type { Clash, Day, Option, SemesterFile, Session } from '../../core/types';
import { getContrastTextColor } from '../../design/tokens';
import { WeaveDefs } from '../../design/weavePatterns';

interface WeaveProps {
  semester: SemesterFile;
  pickedOptions: Option[];
  clashes: Clash[];
  previewCandidate: Option | null;
  componentColorMap: Record<string, string>;
  componentMap: Map<string, { code: string; subjectName: string }>;
  onSelectOption?: (option: Option) => void;
}

const DAY_RAIL_WIDTH = 64;
const HEADER_HEIGHT = 44;
const DAY_ROW_HEIGHT = 68;
const VIRTUAL_WIDTH = 1000;

export const Weave: React.FC<WeaveProps> = ({
  semester,
  pickedOptions,
  clashes,
  previewCandidate,
  componentColorMap,
  componentMap,
}) => {
  const days = semester.days;
  const periods = semester.periods;

  const periodColumnWidth = (VIRTUAL_WIDTH - DAY_RAIL_WIDTH) / periods.length;
  const totalHeight = HEADER_HEIGHT + days.length * DAY_ROW_HEIGHT;

  // Map of periodId to index (0-indexed)
  const periodIndexMap = useMemo(() => {
    const map = new Map<number, number>();
    periods.forEach((p, idx) => map.set(p.id, idx));
    return map;
  }, [periods]);

  // Map of day to row index (0-indexed)
  const dayIndexMap = useMemo(() => {
    const map = new Map<Day, number>();
    days.forEach((d, idx) => map.set(d, idx));
    return map;
  }, [days]);

  // Identify sessions from picked options
  const scheduledSessions = useMemo(() => {
    const list: Array<{
      session: Session;
      option: Option;
      componentId: string;
      color: string;
    }> = [];

    for (const opt of pickedOptions) {
      const color = componentColorMap[opt.componentId] ?? 'var(--ink)';
      for (const sess of opt.sessions) {
        list.push({
          session: sess,
          option: opt,
          componentId: opt.componentId,
          color,
        });
      }
    }
    return list;
  }, [pickedOptions, componentColorMap]);

  // Identify clashing session coordinates
  const clashKeys = useMemo(() => {
    const set = new Set<string>();
    for (const c of clashes) {
      for (const pId of c.periodIds) {
        set.add(`${c.day}-${pId}`);
      }
    }
    return set;
  }, [clashes]);

  // Accessible text summary
  const a11ySummary = `Weekly timetable grid with ${pickedOptions.length} classes chosen and ${clashes.length} clashes detected.`;

  return (
    <div className="relative w-full h-full flex flex-col bg-ground select-none overflow-hidden">
      {/* Visually hidden screen reader text alternative */}
      <div className="sr-only" aria-live="polite">
        <h2>Accessible Timetable Summary</h2>
        <p>{a11ySummary}</p>
        <ul>
          {scheduledSessions.map(({ session, componentId, option }, idx) => {
            const comp = componentMap.get(componentId);
            return (
              <li key={idx}>
                {session.day} periods {session.periods.join(', ')}: {comp?.subjectName} with {session.teacher} (Section {option.sectionId})
              </li>
            );
          })}
        </ul>
      </div>

      <div className="w-full h-full overflow-x-auto overflow-y-auto overscroll-contain">
        <div className="min-w-[620px] sm:min-w-[720px] w-full min-h-full flex items-center justify-start lg:justify-center p-1 sm:p-2">
          <svg
            viewBox={`0 0 ${VIRTUAL_WIDTH} ${totalHeight}`}
            className="w-full h-full max-h-full"
            preserveAspectRatio="xMinYMid meet"
            role="img"
            aria-label={a11ySummary}
          >
          <WeaveDefs />

          {/* Background Ground Plate */}
          <rect width={VIRTUAL_WIDTH} height={totalHeight} fill="var(--ground)" />

          {/* Header Row (Periods / Time on X-Axis) */}
          <g>
            {/* Top-left corner cell */}
            <rect
              x={0}
              y={0}
              width={DAY_RAIL_WIDTH}
              height={HEADER_HEIGHT}
              fill="var(--ground-sunk)"
              stroke="var(--rule)"
              strokeWidth="0.75"
            />
            <text
              x={DAY_RAIL_WIDTH / 2}
              y={HEADER_HEIGHT / 2 + 5}
              textAnchor="middle"
              className="text-[12px] font-bold fill-ink"
              style={{ fontFamily: 'Atkinson Hyperlegible, sans-serif' }}
            >
              Day
            </text>

            {periods.map((period, pIdx) => {
              const x = DAY_RAIL_WIDTH + pIdx * periodColumnWidth;
              return (
                <g key={period.id}>
                  <rect
                    x={x}
                    y={0}
                    width={periodColumnWidth}
                    height={HEADER_HEIGHT}
                    fill="var(--ground-sunk)"
                    stroke="var(--rule)"
                    strokeWidth="0.75"
                  />
                  <text
                    x={x + periodColumnWidth / 2}
                    y={17}
                    textAnchor="middle"
                    className="text-[12px] font-bold fill-ink"
                  >
                    {period.id}
                  </text>
                  <text
                    x={x + periodColumnWidth / 2}
                    y={32}
                    textAnchor="middle"
                    className="text-[9px] font-medium fill-ink-soft tracking-tight"
                  >
                    {to12Hour(period.start)} to {to12Hour(period.end)}
                  </text>
                </g>
              );
            })}
          </g>

          {/* Grid Rows (Days on Y-Axis) */}
          {days.map((day, dIdx) => {
            const y = HEADER_HEIGHT + dIdx * DAY_ROW_HEIGHT;
            return (
              <g key={day}>
                {/* Day Rail Cell */}
                <rect
                  x={0}
                  y={y}
                  width={DAY_RAIL_WIDTH}
                  height={DAY_ROW_HEIGHT}
                  fill="var(--ground-sunk)"
                  stroke="var(--rule)"
                  strokeWidth="0.75"
                />
                <text
                  x={DAY_RAIL_WIDTH / 2}
                  y={y + DAY_ROW_HEIGHT / 2 + 5}
                  textAnchor="middle"
                  className="text-[13px] font-bold fill-ink"
                  style={{ fontFamily: 'Atkinson Hyperlegible, sans-serif' }}
                >
                  {day}
                </text>

                {/* Period Cells for this Day */}
                {periods.map((period, pIdx) => {
                  const x = DAY_RAIL_WIDTH + pIdx * periodColumnWidth;
                  const isClashing = clashKeys.has(`${day}-${period.id}`);

                  return (
                    <g key={`${day}-${period.id}`}>
                      {/* Empty cell with warp & weft hairline texture */}
                      <rect
                        x={x}
                        y={y}
                        width={periodColumnWidth}
                        height={DAY_ROW_HEIGHT}
                        fill="url(#warp-weft-empty)"
                        stroke="var(--rule)"
                        strokeWidth="0.5"
                      />

                      {/* Conflict overlay texture if clashing */}
                      {isClashing && (
                        <rect
                          x={x}
                          y={y}
                          width={periodColumnWidth}
                          height={DAY_ROW_HEIGHT}
                          fill="url(#twill-clash)"
                          stroke="var(--clash)"
                          strokeWidth="1.5"
                        />
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}

          {/* Scheduled Sessions (Continuous Multi-Period Blocks horizontally) */}
          {scheduledSessions.map(({ session, componentId, option, color }, idx) => {
            const dIdx = dayIndexMap.get(session.day);
            if (dIdx === undefined) return null;

            const firstPeriod = Math.min(...session.periods);
            const firstIdx = periodIndexMap.get(firstPeriod) ?? 0;
            const span = session.periods.length;

            const x = DAY_RAIL_WIDTH + firstIdx * periodColumnWidth + 2;
            const y = HEADER_HEIGHT + dIdx * DAY_ROW_HEIGHT + 2;
            const w = span * periodColumnWidth - 4;
            const h = DAY_ROW_HEIGHT - 4;

            const comp = componentMap.get(componentId);
            const textColor = getContrastTextColor(color);

            return (
              <g
                key={`session-${idx}`}
                className="transition-all duration-200 cursor-pointer"
              >
                {/* Continuous Thread Rectangle */}
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  rx="3"
                  fill={color}
                  stroke={color}
                  strokeWidth="1"
                />

                {/* Plain Weave Textile Texture Overlay */}
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  rx="3"
                  fill="url(#plain-weave)"
                  style={{ color: textColor }}
                  pointerEvents="none"
                />

                {/* Text Label Plate */}
                <g pointerEvents="none">
                  <text
                    x={x + 6}
                    y={y + 17}
                    className="text-[12px] font-bold"
                    fill={textColor}
                    style={{ fontFamily: 'Atkinson Hyperlegible, sans-serif' }}
                  >
                    {comp?.code ?? componentId}
                  </text>
                  <text
                    x={x + 6}
                    y={y + 32}
                    className="text-[10px]"
                    fill={textColor}
                    fillOpacity="0.88"
                  >
                    Sec {option.sectionId} • {session.teacher}
                  </text>
                  {session.room && (
                    <text
                      x={x + 6}
                      y={y + 46}
                      className="text-[9px]"
                      fill={textColor}
                      fillOpacity="0.75"
                    >
                      [{session.room}]
                    </text>
                  )}
                </g>
              </g>
            );
          })}

          {/* Ghost Preview Candidates (Dashed Outline Threads) */}
          {previewCandidate &&
            previewCandidate.sessions.map((candSess, idx) => {
              const dIdx = dayIndexMap.get(candSess.day);
              if (dIdx === undefined) return null;

              const firstPeriod = Math.min(...candSess.periods);
              const firstIdx = periodIndexMap.get(firstPeriod) ?? 0;
              const span = candSess.periods.length;

              const x = DAY_RAIL_WIDTH + firstIdx * periodColumnWidth + 2;
              const y = HEADER_HEIGHT + dIdx * DAY_ROW_HEIGHT + 2;
              const w = span * periodColumnWidth - 4;
              const h = DAY_ROW_HEIGHT - 4;

              const color = componentColorMap[previewCandidate.componentId] ?? 'var(--ink)';

              // Check if this ghost overlaps any existing pick
              const hasConflict = scheduledSessions.some(
                (s) =>
                  s.componentId !== previewCandidate.componentId &&
                  s.session.day === candSess.day &&
                  intervalsOverlap(
                    candSess.startMinutes,
                    candSess.endMinutes,
                    s.session.startMinutes,
                    s.session.endMinutes
                  )
              );

              return (
                <g key={`ghost-${idx}`}>
                  <rect
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    rx="3"
                    fill={hasConflict ? 'var(--clash)' : 'none'}
                    fillOpacity={hasConflict ? '0.15' : '0'}
                    stroke={hasConflict ? 'var(--clash)' : color}
                    strokeWidth="2"
                    strokeDasharray="4 2"
                  />
                  {hasConflict && (
                    <rect
                      x={x}
                      y={y}
                      width={w}
                      height={h}
                      rx="3"
                      fill="url(#twill-clash)"
                      fillOpacity="0.3"
                    />
                  )}
                </g>
              );
            })}
        </svg>
        </div>
      </div>
    </div>
  );
};
