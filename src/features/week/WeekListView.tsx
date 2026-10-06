import React from 'react';
import { toDayList } from '../../core/export';
import { to12Hour } from '../../core/time';
import type { SemesterFile } from '../../core/types';
import { getContrastTextColor } from '../../design/tokens';

interface WeekListViewProps {
  semester: SemesterFile;
  picks: Record<string, string>;
  componentColorMap: Record<string, string>;
}

export const WeekListView: React.FC<WeekListViewProps> = ({
  semester,
  picks,
  componentColorMap,
}) => {
  const dayList = toDayList(semester, picks);
  const activeDays = semester.days;

  const hasAnyPicks = Object.keys(picks).length > 0;

  if (!hasAnyPicks) {
    return (
      <div className="p-8 text-center text-ink-soft">
        <p className="text-sm">No classes selected yet. Pick components to see your day-by-day list.</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl mx-auto overflow-y-auto">
      {activeDays.map((day) => {
        const classes = dayList[day];
        if (classes.length === 0) return null;

        return (
          <section key={day} className="border border-rule rounded-sheet bg-ground-sunk p-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-ink border-b border-rule pb-2 mb-3">
              {day}
            </h3>

            <div className="space-y-2.5">
              {classes.map((cls, idx) => {
                const threadColor = componentColorMap[cls.componentId] ?? 'var(--ink)';
                const textColor = getContrastTextColor(threadColor);

                return (
                  <div
                    key={`${cls.componentId}-${idx}`}
                    className="p-3 bg-ground border border-rule rounded flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="px-2 py-0.5 rounded text-xs font-semibold shrink-0"
                        style={{
                          backgroundColor: threadColor,
                          color: textColor,
                        }}
                      >
                        {cls.code}
                      </span>
                      <div>
                        <div className="text-xs font-bold text-ink">{cls.subjectName}</div>
                        <div className="text-[11px] text-ink-soft mt-0.5">
                          Section {cls.sectionId} • {cls.teacher}
                          {cls.room && ` • Room: ${cls.room}`}
                        </div>
                      </div>
                    </div>

                    <div className="text-xs font-mono font-medium text-ink-soft shrink-0">
                      {cls.timeRange.split('–').map(to12Hour).join(' to ')}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
};
