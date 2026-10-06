import { describe, expect, it } from 'vitest';
import { buildStandaloneSvgString } from '../../src/core/canvasSvg';
import { buildOptions, findOption } from '../../src/core/options';
import { findClashes } from '../../src/core/clash';
import semester5Json from '../../public/data/semester-5.json';
import type { Option, SemesterFile } from '../../src/core/types';

describe('canvasExport.ts', () => {
  const semester = semester5Json as SemesterFile;
  const allOptions = buildOptions(semester);

  const compMap = new Map(semester.components.map((c) => [c.id, c]));
  const colorMap = {
    'comp-net-theory': '#B23A2E',
    'web-eng-lab': '#D9A21B',
  };

  it('generates standalone 1080px SVG document string', () => {
    const secAWebEngLab = findOption(allOptions, 'web-eng-lab', 'A')!;
    const secFCompNet = findOption(allOptions, 'comp-net-theory', 'F')!;
    const picks = [secAWebEngLab, secFCompNet];
    const clashes = findClashes(picks);

    const svg = buildStandaloneSvgString({
      semester,
      pickedOptions: picks,
      clashes,
      componentColorMap: colorMap,
      componentMap: compMap,
      isDark: false,
    });

    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('viewBox="0 0 1080');
    expect(svg).toContain('NoClash');
    expect(svg).toContain('5th Semester');
    expect(svg).toContain('#F3F3EF'); // Light theme background
    expect(svg).toContain('Computer Networks');
    expect(svg).toContain('1 clashes detected');
    expect(svg).toContain('url(#exp-clash)');
    expect(svg).toContain('SCHEDULE DETAILS');
  });

  it('supports dark mode export rendering with dark tokens', () => {
    const svg = buildStandaloneSvgString({
      semester,
      pickedOptions: [],
      clashes: [],
      componentColorMap: {},
      componentMap: compMap,
      isDark: true,
    });

    expect(svg).toContain('#151A30'); // Dark theme background
    expect(svg).toContain('(Zero clashes)');
  });

  it('includes session room when present', () => {
    const semWithRoom: SemesterFile = {
      ...semester,
      sections: [
        {
          id: 'A',
          name: 'Section A',
          slots: [
            {
              day: 'Mon',
              periods: [1, 2, 3], // Multi-period so height > 48
              componentId: 'comp-net-theory',
              teacher: 'Lal',
              room: 'Lab 2',
            },
          ],
        },
      ],
    };
    const opts = buildOptions(semWithRoom);
    const svg = buildStandaloneSvgString({
      semester: semWithRoom,
      pickedOptions: opts,
      clashes: [],
      componentColorMap: colorMap,
      componentMap: compMap,
    });

    expect(svg).toContain('[Lab 2]');
  });

  it('handles fallback branches: unknown day, missing color, and unmapped component', () => {
    const customOpt: Option = {
      componentId: 'custom-unmapped',
      sectionId: 'Z',
      sectionName: 'Section Z',
      teachers: ['Unknown'],
      sessions: [
        {
          day: 'Sat', // Not in semester.days, triggers dIdx === undefined
          periods: [1],
          startMinutes: 480,
          endMinutes: 530,
          teacher: 'Unknown',
        },
        {
          day: 'Mon', // In semester.days, unknown period 999 triggers ?? 0
          periods: [999],
          startMinutes: 480,
          endMinutes: 530,
          teacher: 'Unknown',
        },
      ],
      dayMask: { Mon: true, Tue: false, Wed: false, Thu: false, Fri: false, Sat: true, Sun: false },
      earliestStart: '08:00',
      latestEnd: '08:50',
    };

    const emptyCompMap = new Map();
    const svg = buildStandaloneSvgString({
      semester,
      pickedOptions: [customOpt],
      clashes: [],
      componentColorMap: {}, // triggers componentColorMap fallback
      componentMap: emptyCompMap, // triggers comp?.code and comp?.subjectName fallbacks
      isDark: false,
    });

    expect(svg).toContain('custom-unmapped');
  });
});
