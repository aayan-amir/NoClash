import type { Day, Period } from './types';

export function parseTimeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  if (parts.length !== 2) {
    throw new Error(`Invalid time format: "${timeStr}". Expected HH:MM`);
  }
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    throw new Error(`Invalid time values: "${timeStr}"`);
  }
  return h * 60 + m;
}

export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const hPad = h.toString().padStart(2, '0');
  const mPad = m.toString().padStart(2, '0');
  return `${hPad}:${mPad}`;
}

export function to12Hour(timeStr: string): string {
  const parts = timeStr.split(':');
  if (parts.length !== 2) {
    return timeStr;
  }
  let h = Number(parts[0]);
  const m = parts[1];
  if (Number.isNaN(h)) {
    return timeStr;
  }
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m}`;
}

export function periodRange(
  periodIds: number[],
  grid: Period[]
): { startMinutes: number; endMinutes: number; start: string; end: string } {
  if (periodIds.length === 0) {
    throw new Error('Cannot calculate range for empty periodIds array');
  }

  const periodMap = new Map<number, Period>();
  for (const p of grid) {
    periodMap.set(p.id, p);
  }

  let minStart = Infinity;
  let maxEnd = -Infinity;
  let earliestStartStr = '';
  let latestEndStr = '';

  for (const pid of periodIds) {
    const period = periodMap.get(pid);
    if (!period) {
      throw new Error(`Period id ${pid} not found in timetable grid`);
    }
    const sMin = parseTimeToMinutes(period.start);
    const eMin = parseTimeToMinutes(period.end);

    if (sMin < minStart) {
      minStart = sMin;
      earliestStartStr = period.start;
    }
    if (eMin > maxEnd) {
      maxEnd = eMin;
      latestEndStr = period.end;
    }
  }

  return {
    startMinutes: minStart,
    endMinutes: maxEnd,
    start: earliestStartStr,
    end: latestEndStr,
  };
}

/**
 * Returns true if two half-open intervals [startA, endA) and [startB, endB) overlap.
 * Note: Adjacent intervals (e.g. [8:00, 8:50) and [8:50, 9:40)) do NOT overlap.
 */
export function intervalsOverlap(
  startA: number,
  endA: number,
  startB: number,
  endB: number
): boolean {
  return startA < endB && startB < endA;
}

export function sessionsOverlap(
  a: { day: Day; startMinutes: number; endMinutes: number },
  b: { day: Day; startMinutes: number; endMinutes: number }
): boolean {
  if (a.day !== b.day) {
    return false;
  }
  return intervalsOverlap(a.startMinutes, a.endMinutes, b.startMinutes, b.endMinutes);
}
