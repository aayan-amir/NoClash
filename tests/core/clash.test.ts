import { describe, expect, it } from 'vitest';
import { conflictsWith, findClashes, formatClashMessage } from '../../src/core/clash';
import { buildOptions, findOption } from '../../src/core/options';
import semester5Json from '../../public/data/semester-5.json';
import type { SemesterFile } from '../../src/core/types';

describe('clash.ts', () => {
  const semester = semester5Json as SemesterFile;
  const options = buildOptions(semester);

  const secAWebEngLab = findOption(options, 'web-eng-lab', 'A')!; // Mon 4, 5, 6 (10:30-13:00)
  const secFCompNet = findOption(options, 'comp-net-theory', 'F')!; // Mon 4, 5 (10:30-12:10)
  const secAWebEngTh = findOption(options, 'web-eng-theory', 'A')!;
  const secBWebEngTh = findOption(options, 'web-eng-theory', 'B')!;

  it('detects the known real conflict: Sec A WebEngLab vs Sec F CompNetTh', () => {
    const picks = [secAWebEngLab, secFCompNet];
    const clashes = findClashes(picks);

    expect(clashes.length).toBe(1);
    const clash = clashes[0];
    expect(clash.day).toBe('Mon');
    expect(clash.periodIds).toEqual([4, 5]);
    expect(clash.start).toBe('10:30');
    expect(clash.end).toBe('12:10');
  });

  it('alternatives for the same component do not clash with each other', () => {
    const picks = [secAWebEngTh, secBWebEngTh];
    const clashes = findClashes(picks);
    expect(clashes.length).toBe(0);
  });

  it('returns an empty array when there are no clashes', () => {
    // Section A full picks has zero internal clashes
    const secAPicks = options.filter((o) => o.sectionId === 'A');
    const clashes = findClashes(secAPicks);
    expect(clashes.length).toBe(0);
  });

  it('is symmetric and never duplicates clash pairs', () => {
    const picks = [secAWebEngLab, secFCompNet];
    const clashes1 = findClashes(picks);
    const clashes2 = findClashes([secFCompNet, secAWebEngLab]);

    expect(clashes1.length).toBe(1);
    expect(clashes2.length).toBe(1);
  });

  describe('conflictsWith', () => {
    it('ignores existing pick for the same component being replaced', () => {
      // Current pick has Sec A WebEngTh
      const currentPicks = [secAWebEngTh];
      // Candidate is Sec B WebEngTh
      const clashes = conflictsWith(secBWebEngTh, currentPicks);
      expect(clashes.length).toBe(0);
    });

    it('reports conflict when candidate clashes with an existing pick', () => {
      const currentPicks = [secFCompNet];
      const clashes = conflictsWith(secAWebEngLab, currentPicks);
      expect(clashes.length).toBe(1);
      expect(clashes[0].day).toBe('Mon');
      expect(clashes[0].periodIds).toEqual([4, 5]);
    });

    it('returns empty array when candidate is on the same day but does not overlap', () => {
      // Sec A WebEngLab is Mon 4, 5, 6. Sec A CompConst is Mon 1.
      const secACompConst = findOption(options, 'compiler-const', 'A')!;
      const currentPicks = [secAWebEngLab];
      const clashes = conflictsWith(secACompConst, currentPicks);
      expect(clashes.length).toBe(0);
    });
  });

  describe('formatClashMessage', () => {
    it('formats human-readable clash reason string', () => {
      const picks = [secAWebEngLab, secFCompNet];
      const clashes = findClashes(picks);
      const map = {
        'comp-net-theory': 'Computer Networks',
        'web-eng-lab': 'Web Engineering Lab',
      };
      const msg = formatClashMessage(clashes[0], map);
      expect(msg).toBe(
        'Web Engineering Lab overlaps Computer Networks on Mon, 10:30 to 12:10'
      );
    });

    it('falls back to component ID if not present in map', () => {
      const picks = [secAWebEngLab, secFCompNet];
      const clashes = findClashes(picks);
      const msg = formatClashMessage(clashes[0], {});
      expect(msg).toBe(
        'web-eng-lab overlaps comp-net-theory on Mon, 10:30 to 12:10'
      );
    });
  });
});
