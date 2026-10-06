import { describe, expect, it } from 'vitest';
import { parsePasteLines } from '../../scripts/import-paste';
import semester5Json from '../../public/data/semester-5.json';
import type { SemesterFile } from '../../src/core/types';

describe('import-paste.ts parser', () => {
  const semester = semester5Json as SemesterFile;

  it('correctly parses comma-separated timetable lines into valid slots', () => {
    const lines = [
      '# Comment line should be ignored',
      'Mon, 4-5, Computer Networks, Lal',
      'Wed, 1-2, WebEng, Natalia',
      'Fri, 5-6, TechWrite, TBA',
    ];

    const { slots, unmatched } = parsePasteLines(lines, semester);

    expect(unmatched.length).toBe(0);
    expect(slots.length).toBe(3);

    expect(slots[0]).toEqual({
      day: 'Mon',
      periods: [4, 5],
      componentId: 'comp-net-theory',
      teacher: 'Lal',
    });

    expect(slots[1]).toEqual({
      day: 'Wed',
      periods: [1, 2],
      componentId: 'web-eng-theory',
      teacher: 'Natalia',
    });

    expect(slots[2]).toEqual({
      day: 'Fri',
      periods: [5, 6],
      componentId: 'tech-writing',
      teacher: 'TBA',
    });
  });

  it('cleans up underscore-formatted teacher names', () => {
    const lines = ['Wed, 5, Compiler Construction, Mehwish_W'];
    const { slots, unmatched } = parsePasteLines(lines, semester);

    expect(unmatched.length).toBe(0);
    expect(slots[0].teacher).toBe('Mehwish W');
  });

  it('flags unmatched components and invalid days', () => {
    const lines = [
      'Sat, 1, CompNet, Lal', // Sat not in semester.days
      'Mon, 2, NonExistentSubject, John',
      'Mon, 4, , John', // Insufficient fields
      'Mon, bad-period, CompNet, John', // Invalid period
    ];

    const { slots, unmatched } = parsePasteLines(lines, semester);
    expect(slots.length).toBe(0);
    expect(unmatched.length).toBe(4);
    expect(unmatched[0]).toContain('Invalid day "Sat"');
    expect(unmatched[1]).toContain('Unmatched component "NonExistentSubject"');
  });
});
