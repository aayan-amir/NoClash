import { describe, expect, it } from 'vitest';
import { toDayList, toPlainText } from '../../src/core/export';
import semester5Json from '../../public/data/semester-5.json';
import type { SemesterFile } from '../../src/core/types';

describe('export.ts', () => {
  const semester = semester5Json as SemesterFile;

  it('toDayList groups picks by day and sorts chronologically', () => {
    const picks = {
      'comp-net-theory': 'A', // Mon P2 (08:50-09:40)
      'web-eng-lab': 'A',     // Mon P4-6 (10:30-13:00)
    };
    const dayList = toDayList(semester, picks);

    expect(dayList.Mon.length).toBe(2);
    expect(dayList.Mon[0].componentId).toBe('comp-net-theory');
    expect(dayList.Mon[0].timeRange).toBe('08:50–09:40');
    expect(dayList.Mon[1].componentId).toBe('web-eng-lab');
    expect(dayList.Mon[1].timeRange).toBe('10:30–13:00');
  });

  it('toDayList handles rooms and unknown components gracefully', () => {
    const semWithRoom: SemesterFile = {
      ...semester,
      sections: [
        {
          id: 'A',
          name: 'Section A',
          slots: [
            {
              day: 'Mon',
              periods: [1],
              componentId: 'comp-net-theory',
              teacher: 'Lal',
              room: 'Lab 1',
            },
          ],
        },
      ],
    };
    const dayList = toDayList(semWithRoom, {
      'comp-net-theory': 'A',
      'unknown-comp': 'A',
      'comp-net-lab': 'UnknownSection',
    });
    expect(dayList.Mon[0].room).toBe('Lab 1');
  });

  it('toPlainText formats human-readable text schedule with headers', () => {
    const picks = {
      'comp-net-theory': 'A',
    };
    const text = toPlainText(semester, picks);

    expect(text).toContain('NoClash — 5th Semester');
    expect(text).toContain('## Mon');
    expect(text).toContain('Computer Networks (CompNet) — Sec A, Rija');
    expect(text).not.toContain('## Tue'); // Empty days omitted
  });

  it('toPlainText includes room information when room is specified', () => {
    const semWithRoom: SemesterFile = {
      ...semester,
      sections: [
        {
          id: 'A',
          name: 'Section A',
          slots: [
            {
              day: 'Mon',
              periods: [1],
              componentId: 'comp-net-theory',
              teacher: 'Lal',
              room: 'Hall 3',
            },
          ],
        },
      ],
    };
    const text = toPlainText(semWithRoom, { 'comp-net-theory': 'A' });
    expect(text).toContain('[Hall 3]');

    const semNoRoom: SemesterFile = {
      ...semester,
      sections: [
        {
          id: 'A',
          name: 'Section A',
          slots: [
            {
              day: 'Mon',
              periods: [1],
              componentId: 'comp-net-theory',
              teacher: 'Lal',
            },
          ],
        },
      ],
    };
    const textNoRoom = toPlainText(semNoRoom, { 'comp-net-theory': 'A' });
    expect(textNoRoom).not.toContain('[');
  });
});
