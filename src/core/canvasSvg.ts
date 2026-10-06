import type { Clash, Option, SemesterFile } from './types';
import { to12Hour } from './time';
import { getContrastTextColor } from '../design/tokens';

export interface ExportSvgParams {
  semester: SemesterFile;
  pickedOptions: Option[];
  clashes: Clash[];
  componentColorMap: Record<string, string>;
  componentMap: Map<string, { code: string; subjectName: string }>;
  isDark?: boolean;
}

export function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildStandaloneSvgString(params: ExportSvgParams): string {
  const { semester, pickedOptions, clashes, componentColorMap, componentMap, isDark = false } = params;

  const bg = isDark ? '#151A30' : '#F3F3EF';
  const bgSunk = isDark ? '#101426' : '#E7E7E1';
  const ink = isDark ? '#ECEDF2' : '#1B1D22';
  const inkSoft = isDark ? '#A3A7B8' : '#4A4E57';
  const rule = isDark ? '#2C3352' : '#CFCFC7';
  const clashColor = isDark ? '#FF6B6B' : '#B3261E';
  const weaveColor = isDark ? '#FFFFFF' : '#000000';

  const width = 1080;
  const padding = 40;
  const gridWidth = width - padding * 2; // 1000px
  const dayRailWidth = 72;
  const periodColWidth = (gridWidth - dayRailWidth) / semester.periods.length;

  const headerHeight = 110;
  const gridHeaderHeight = 44;
  const dayRowHeight = 64;
  const gridBodyHeight = semester.days.length * dayRowHeight;
  const gridTotalHeight = gridHeaderHeight + gridBodyHeight;

  // Legend calculation (2 columns)
  const legendItemHeight = 32;
  const legendRows = Math.ceil(pickedOptions.length / 2);
  const legendHeight = 40 + legendRows * legendItemHeight;
  const footerHeight = 40;

  const totalHeight = padding + headerHeight + gridTotalHeight + legendHeight + footerHeight + padding;

  const periodIndexMap = new Map<number, number>();
  semester.periods.forEach((p, idx) => periodIndexMap.set(p.id, idx));

  const dayIndexMap = new Map(semester.days.map((d, idx) => [d, idx]));

  // Build clash coordinate set
  const clashKeys = new Set<string>();
  for (const c of clashes) {
    for (const pId of c.periodIds) {
      clashKeys.add(`${c.day}-${pId}`);
    }
  }

  // Generate SVG elements
  const gridY = padding + headerHeight;

  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${totalHeight}" width="${width}" height="${totalHeight}">
  <defs>
    <style>
      text { font-family: 'Atkinson Hyperlegible', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    </style>
    <pattern id="exp-warp-weft" width="16" height="16" patternUnits="userSpaceOnUse">
      <path d="M 8 0 L 8 16 M 0 8 L 16 8" stroke="${rule}" stroke-width="0.5" stroke-opacity="0.5" />
    </pattern>
    <pattern id="exp-plain-weave" width="8" height="8" patternUnits="userSpaceOnUse">
      <rect width="4" height="4" fill="${weaveColor}" fill-opacity="0.08" />
      <rect x="4" y="4" width="4" height="4" fill="${weaveColor}" fill-opacity="0.08" />
    </pattern>
    <pattern id="exp-clash" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <line x1="0" y1="0" x2="0" y2="10" stroke="${clashColor}" stroke-width="3" />
      <line x1="5" y1="0" x2="5" y2="10" stroke="${ink}" stroke-width="2" stroke-opacity="0.8" />
    </pattern>
  </defs>

  <!-- Background Canvas -->
  <rect width="${width}" height="${totalHeight}" fill="${bg}" />

  <!-- Document Header -->
  <g transform="translate(${padding}, ${padding})">
    <text x="0" y="32" font-size="28" font-weight="700" fill="${ink}">NoClash</text>
    <text x="120" y="32" font-size="16" font-weight="500" fill="${inkSoft}">• ${escapeXml(semester.semester.label)} Routine</text>
    <text x="0" y="60" font-size="14" fill="${inkSoft}">${escapeXml(`${semester.department}, ${semester.institution}`)}</text>
    <text x="0" y="84" font-size="13" font-weight="600" fill="${clashes.length > 0 ? clashColor : ink}">
      ${pickedOptions.length} of ${semester.requiredComponentIds.length} classes chosen ${
    clashes.length > 0 ? `(${clashes.length} clashes detected)` : '(Zero clashes)'
  }
    </text>
  </g>

  <!-- Grid Header (Periods / Time on X-Axis) -->
  <g transform="translate(${padding}, ${gridY})">
    <rect x="0" y="0" width="${dayRailWidth}" height="${gridHeaderHeight}" fill="${bgSunk}" stroke="${rule}" stroke-width="1" />
    <text x="${dayRailWidth / 2}" y="${gridHeaderHeight / 2 + 5}" font-size="13" font-weight="700" text-anchor="middle" fill="${ink}">Day</text>
`;

  semester.periods.forEach((period, pIdx) => {
    const x = dayRailWidth + pIdx * periodColWidth;
    svg += `
    <rect x="${x}" y="0" width="${periodColWidth}" height="${gridHeaderHeight}" fill="${bgSunk}" stroke="${rule}" stroke-width="1" />
    <text x="${x + periodColWidth / 2}" y="18" font-size="13" font-weight="700" text-anchor="middle" fill="${ink}">${period.id}</text>
    <text x="${x + periodColWidth / 2}" y="33" font-size="9" font-weight="500" text-anchor="middle" fill="${inkSoft}">${escapeXml(to12Hour(period.start))} to ${escapeXml(to12Hour(period.end))}</text>
`;
  });

  // Grid Rows (Days on Y-Axis)
  semester.days.forEach((day, dIdx) => {
    const y = gridHeaderHeight + dIdx * dayRowHeight;
    svg += `
    <!-- Day ${day} Rail -->
    <rect x="0" y="${y}" width="${dayRailWidth}" height="${dayRowHeight}" fill="${bgSunk}" stroke="${rule}" stroke-width="1" />
    <text x="${dayRailWidth / 2}" y="${y + dayRowHeight / 2 + 5}" font-size="14" font-weight="700" text-anchor="middle" fill="${ink}">${escapeXml(day)}</text>
`;

    // Period cells for this day
    semester.periods.forEach((period, pIdx) => {
      const x = dayRailWidth + pIdx * periodColWidth;
      const isClashing = clashKeys.has(`${day}-${period.id}`);
      svg += `
    <rect x="${x}" y="${y}" width="${periodColWidth}" height="${dayRowHeight}" fill="url(#exp-warp-weft)" stroke="${rule}" stroke-width="0.75" />
`;
      if (isClashing) {
        svg += `
    <rect x="${x}" y="${y}" width="${periodColWidth}" height="${dayRowHeight}" fill="url(#exp-clash)" stroke="${clashColor}" stroke-width="1.5" />
`;
      }
    });
  });

  // Scheduled Sessions (Continuous Horizontal Blocks along X-axis)
  for (const opt of pickedOptions) {
    const color = componentColorMap[opt.componentId] ?? ink;
    const textColor = getContrastTextColor(color);
    const comp = componentMap.get(opt.componentId);

    for (const sess of opt.sessions) {
      const dIdx = dayIndexMap.get(sess.day);
      if (dIdx === undefined) continue;

      const firstPeriod = Math.min(...sess.periods);
      const firstIdx = periodIndexMap.get(firstPeriod) ?? 0;
      const span = sess.periods.length;

      const x = dayRailWidth + firstIdx * periodColWidth + 2;
      const y = gridHeaderHeight + dIdx * dayRowHeight + 2;
      const w = span * periodColWidth - 4;
      const h = dayRowHeight - 4;

      svg += `
    <!-- Session Block -->
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${color}" stroke="${color}" stroke-width="1" />
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="url(#exp-plain-weave)" />
    <text x="${x + 6}" y="${y + 18}" font-size="12" font-weight="700" fill="${textColor}">${escapeXml(comp?.code ?? opt.componentId)}</text>
    <text x="${x + 6}" y="${y + 34}" font-size="10" fill="${textColor}" fill-opacity="0.9">Sec ${escapeXml(opt.sectionId)} • ${escapeXml(sess.teacher)}</text>
`;
      if (sess.room && h > 40) {
        svg += `
    <text x="${x + 6}" y="${y + 48}" font-size="9" fill="${textColor}" fill-opacity="0.75">[${escapeXml(sess.room)}]</text>
`;
      }
    }
  }

  svg += `  </g>

  <!-- Legend Section -->
  <g transform="translate(${padding}, ${gridY + gridTotalHeight + 24})">
    <text x="0" y="0" font-size="13" font-weight="700" text-anchor="start" fill="${ink}">SCHEDULE DETAILS &amp; INSTRUCTORS</text>
`;

  pickedOptions.forEach((opt, idx) => {
    const colIdx = idx % 2;
    const rowIdx = Math.floor(idx / 2);
    const legX = colIdx * (gridWidth / 2);
    const legY = 20 + rowIdx * legendItemHeight;
    const color = componentColorMap[opt.componentId] ?? ink;
    const comp = componentMap.get(opt.componentId);

    svg += `
    <g transform="translate(${legX}, ${legY})">
      <rect x="0" y="0" width="14" height="14" rx="2" fill="${color}" />
      <text x="22" y="11" font-size="12" font-weight="600" fill="${ink}">${escapeXml(comp?.subjectName ?? opt.componentId)}</text>
      <text x="22" y="24" font-size="10" fill="${inkSoft}">Section ${escapeXml(opt.sectionId)} • ${escapeXml(opt.teachers.join(', '))} • ${escapeXml(opt.sessions.map((s) => `${s.day} P${s.periods.join('-')}`).join(', '))}</text>
    </g>
`;
  });

  svg += `  </g>

  <!-- Footer Watermark -->
  <g transform="translate(${padding}, ${totalHeight - padding + 10})">
    <text x="0" y="0" font-size="11" fill="${inkSoft}">Generated by NoClash • Private, Static &amp; Offline • https://noclash.app</text>
  </g>
</svg>`;

  return svg;
}
