import { describe, expect, it } from 'vitest';
import { conflictsWith, findClashes, formatClashMessage } from '../../src/core/clash';
import { buildStandaloneSvgString } from '../../src/core/canvasSvg';
import { toDayList, toPlainText } from '../../src/core/export';
import { buildOptions, findOption, getOptionsForComponent } from '../../src/core/options';
import { getProgressSummary } from '../../src/core/progress';
import { decodeSchedule, encodeSchedule } from '../../src/core/sharing';
import type { Option, SemesterFile } from '../../src/core/types';
import semester5Json from '../../public/data/semester-5.json';

describe('End-to-End Student Journey Simulation (Add, Clash, Remove, Swap, Share)', () => {
  const semester = semester5Json as SemesterFile;
  const allOptions = buildOptions(semester);
  const compMap = new Map(semester.components.map((c) => [c.id, c]));
  const compNameMap = Object.fromEntries(
    semester.components.map((c) => [c.id, `${c.subjectName} (${c.code})`])
  );
  const colorMap: Record<string, string> = {
    'comp-net-theory': '#B23A2E',
    'comp-net-lab': '#2E6F40',
    'web-eng-theory': '#1D5AAB',
    'web-eng-lab': '#D9A21B',
    'compiler-const': '#7E3F8F',
    'enterprise-sys': '#9C5821',
    'prob-stats': '#028090',
    'tech-writing': '#5C677D',
  };

  it('simulates a complete realistic student workflow without any inconsistencies', () => {
    // ------------------------------------------------------------------------
    // ACT 1: Student starts with pure Section A default schedule
    // ------------------------------------------------------------------------
    let picks: Record<string, string> = {};
    for (const c of semester.components) {
      picks[c.id] = 'A';
    }

    let pickedOptions = Object.entries(picks)
      .map(([compId, secId]) => findOption(allOptions, compId, secId))
      .filter((o): o is Option => o !== undefined);

    // Verify Section A has all 8 courses selected
    let progress = getProgressSummary(semester, picks);
    expect(progress.chosenCount).toBe(8);
    expect(progress.requiredTotal).toBe(8);
    expect(progress.isComplete).toBe(true);

    // Verify Section A internally has ZERO clashes
    let clashes = findClashes(pickedOptions);
    expect(clashes.length).toBe(0);

    // ------------------------------------------------------------------------
    // ACT 2: Student swaps Computer Networks Lab from Section A to Section F
    // Section A CompNetLab: Thu P4-6 (Sobiya)
    // Section F CompNetLab: Thu P7-9 (Marium)
    // ------------------------------------------------------------------------
    // Remove Section A lab
    delete picks['comp-net-lab'];
    expect(picks['comp-net-lab']).toBeUndefined();

    // Verify progress drops to 7
    progress = getProgressSummary(semester, picks);
    expect(progress.chosenCount).toBe(7);
    expect(progress.isComplete).toBe(false);

    // Add Section F CompNetLab
    picks['comp-net-lab'] = 'F';
    pickedOptions = Object.entries(picks)
      .map(([compId, secId]) => findOption(allOptions, compId, secId))
      .filter((o): o is Option => o !== undefined);

    // Verify no clash between Section A routine and Section F CompNet Lab (Thu 7-9)
    clashes = findClashes(pickedOptions);
    expect(clashes.length).toBe(0);
    expect(progress.requiredTotal).toBe(8);

    // ------------------------------------------------------------------------
    // ACT 3: Student attempts to swap Computer Networks Theory to Section F
    // Section F CompNetTh: Mon P4-5 & Thu P5 (Lal)
    // But Student has Section A WebEngLab on Mon P4-6 (10:30-13:00)!
    // ------------------------------------------------------------------------
    const secFCompNetTheory = findOption(allOptions, 'comp-net-theory', 'F')!;

    // Check conflict preview before picking
    const prospectiveClashes = conflictsWith(secFCompNetTheory, pickedOptions);
    expect(prospectiveClashes.length).toBe(1);
    expect(prospectiveClashes[0].day).toBe('Mon');
    expect(prospectiveClashes[0].periodIds).toEqual([4, 5]);

    // Format human-readable reason
    const clashMsg = formatClashMessage(prospectiveClashes[0], compNameMap);
    expect(clashMsg).toBe('Computer Networks (CompNet) overlaps Web Technologies (WebTec Lab) on Mon, 10:30 to 12:10');

    // The student picks it anyway to test the system
    picks['comp-net-theory'] = 'F';
    pickedOptions = Object.entries(picks)
      .map(([compId, secId]) => findOption(allOptions, compId, secId))
      .filter((o): o is Option => o !== undefined);

    clashes = findClashes(pickedOptions);
    expect(clashes.length).toBe(1);
    expect(clashes[0].day).toBe('Mon');
    expect(clashes[0].periodIds).toEqual([4, 5]);

    // ------------------------------------------------------------------------
    // ACT 4: Student removes the clashing subject (Unpicking)
    // ------------------------------------------------------------------------
    delete picks['comp-net-theory'];
    pickedOptions = Object.entries(picks)
      .map(([compId, secId]) => findOption(allOptions, compId, secId))
      .filter((o): o is Option => o !== undefined);

    clashes = findClashes(pickedOptions);
    expect(clashes.length).toBe(0); // Clashes resolved!

    // Re-pick Section A for Computer Networks Theory (Mon P2, Wed P10-11)
    picks['comp-net-theory'] = 'A';
    pickedOptions = Object.entries(picks)
      .map(([compId, secId]) => findOption(allOptions, compId, secId))
      .filter((o): o is Option => o !== undefined);

    clashes = findClashes(pickedOptions);
    expect(clashes.length).toBe(0);

    // ------------------------------------------------------------------------
    // ACT 5: Student drops an elective (Technical Report Writing)
    // ------------------------------------------------------------------------
    delete picks['tech-writing'];
    progress = getProgressSummary(semester, picks);
    expect(progress.chosenCount).toBe(7);
    expect(progress.isComplete).toBe(false);

    // Student re-picks Section A for Technical Report Writing
    picks['tech-writing'] = 'A';
    progress = getProgressSummary(semester, picks);
    expect(progress.chosenCount).toBe(8);
    expect(progress.isComplete).toBe(true);

    // ------------------------------------------------------------------------
    // ACT 6: Share URL encoding & decoding verification
    // ------------------------------------------------------------------------
    const encodedHash = encodeSchedule(semester.semester.id, semester.dataVersion, picks);
    expect(typeof encodedHash).toBe('string');
    expect(encodedHash.length).toBeGreaterThan(5);

    // A peer opens the link
    const decoded = decodeSchedule(encodedHash, semester);
    expect(decoded.picks).toEqual(picks);
    expect(decoded.picks['comp-net-lab']).toBe('F'); // Custom section preserved
    expect(decoded.picks['comp-net-theory']).toBe('A');

    // ------------------------------------------------------------------------
    // ACT 7: Export Plain Text and SVG Canvas rendering verification
    // ------------------------------------------------------------------------
    const plainText = toPlainText(semester, picks);
    expect(plainText).toContain('NoClash — 5th Semester');
    expect(plainText).toContain('## Mon');
    expect(plainText).toContain('## Thu');
    expect(plainText).toContain('Sec F, Marium [HFT-04]'); // Section F lab correctly included!

    const svg = buildStandaloneSvgString({
      semester,
      pickedOptions,
      clashes: [],
      componentColorMap: colorMap,
      componentMap: compMap,
      isDark: false,
    });

    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('(Zero clashes)');
    expect(svg).toContain('Sec F • Marium');
    expect(svg).toContain('Sec A • Rija');
    expect(svg).toContain('[HFT-04]');
  });
});
