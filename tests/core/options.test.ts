import { describe, expect, it } from 'vitest';
import { buildOptions, findOption, getOptionsForComponent } from '../../src/core/options';
import semester5Json from '../../public/data/semester-5.json';
import type { SemesterFile } from '../../src/core/types';

describe('options.ts', () => {
  const semester = semester5Json as SemesterFile;
  const options = buildOptions(semester);

  it('correctly groups options across sections', () => {
    // 8 components across 6 sections (A through F) = 48 options
    expect(options.length).toBe(48);
  });

  it('aggregates multi-session slots under the same option', () => {
    // Section A comp-net-theory meets Mon P2 and Wed P10-11 (2 sessions)
    const secACompNet = findOption(options, 'comp-net-theory', 'A');
    expect(secACompNet).toBeDefined();
    expect(secACompNet?.sessions.length).toBe(2);
    expect(secACompNet?.dayMask.Mon).toBe(true);
    expect(secACompNet?.dayMask.Wed).toBe(true);
    expect(secACompNet?.dayMask.Tue).toBe(false);
    expect(secACompNet?.teachers).toEqual(['Rija']);
    expect(secACompNet?.earliestStart).toBe('08:50');
    expect(secACompNet?.latestEnd).toBe('17:10');
  });

  it('sorts sessions chronologically by day and time', () => {
    const secACompNet = findOption(options, 'comp-net-theory', 'A')!;
    expect(secACompNet.sessions[0].day).toBe('Mon');
    expect(secACompNet.sessions[1].day).toBe('Wed');
  });

  it('handles multiple sessions on the same day in chronological order', () => {
    const testSem: SemesterFile = {
      ...semester,
      sections: [
        {
          id: 'T',
          name: 'Section T',
          slots: [
            { day: 'Mon', periods: [8], componentId: 'comp-net-theory', teacher: 'Lal' },
            { day: 'Mon', periods: [2], componentId: 'comp-net-theory', teacher: 'Lal' },
          ],
        },
      ],
    };
    const built = buildOptions(testSem);
    expect(built[0].sessions[0].periods).toEqual([2]);
    expect(built[0].sessions[1].periods).toEqual([8]);
  });

  it('findOption returns undefined if not found', () => {
    expect(findOption(options, 'comp-net-theory', 'NonExistent')).toBeUndefined();
    expect(findOption(options, 'non-existent', 'A')).toBeUndefined();
  });

  it('getOptionsForComponent retrieves all options for a component across sections', () => {
    const compNetOpts = getOptionsForComponent(options, 'comp-net-theory');
    expect(compNetOpts.length).toBe(6);
    expect(compNetOpts.map((o) => o.sectionId)).toEqual(['A', 'B', 'C', 'D', 'E', 'F']);
  });
});
