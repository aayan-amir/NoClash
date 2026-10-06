import type { Day, SemesterFile } from './types';
import { minutesToTime, periodRange } from './time';

export interface DayClassItem {
  day: Day;
  startMinutes: number;
  endMinutes: number;
  timeRange: string;
  componentId: string;
  subjectName: string;
  kind: string;
  code: string;
  sectionId: string;
  sectionName: string;
  teacher: string;
  room?: string;
}

export function toDayList(
  semester: SemesterFile,
  picks: Record<string, string>
): Record<Day, DayClassItem[]> {
  const allDays = semester.days;
  const result: Record<Day, DayClassItem[]> = {
    Mon: [],
    Tue: [],
    Wed: [],
    Thu: [],
    Fri: [],
    Sat: [],
    Sun: [],
  };

  const compMap = new Map(semester.components.map((c) => [c.id, c]));
  const secMap = new Map(semester.sections.map((s) => [s.id, s]));

  for (const [componentId, sectionId] of Object.entries(picks)) {
    const comp = compMap.get(componentId);
    const sec = secMap.get(sectionId);
    if (!comp || !sec) continue;

    for (const slot of sec.slots) {
      if (slot.componentId !== componentId) continue;

      const range = periodRange(slot.periods, semester.periods);
      result[slot.day].push({
        day: slot.day,
        startMinutes: range.startMinutes,
        endMinutes: range.endMinutes,
        timeRange: `${minutesToTime(range.startMinutes)}–${minutesToTime(range.endMinutes)}`,
        componentId: comp.id,
        subjectName: comp.subjectName,
        kind: comp.kind,
        code: comp.code,
        sectionId: sec.id,
        sectionName: sec.name,
        teacher: slot.teacher,
        room: slot.room,
      });
    }
  }

  // Sort each day's sessions by startMinutes
  for (const day of allDays) {
    result[day].sort((a, b) => a.startMinutes - b.startMinutes);
  }

  return result;
}

export function toPlainText(
  semester: SemesterFile,
  picks: Record<string, string>
): string {
  const dayList = toDayList(semester, picks);
  const lines: string[] = [];

  lines.push(`NoClash — ${semester.semester.label}`);
  lines.push(`${semester.department}, ${semester.institution}`);
  lines.push('');

  for (const day of semester.days) {
    const classes = dayList[day];
    if (classes.length === 0) {
      continue;
    }

    lines.push(`## ${day}`);
    for (const item of classes) {
      const roomStr = item.room ? ` [${item.room}]` : '';
      lines.push(
        `- ${item.timeRange}: ${item.subjectName} (${item.code}) — Sec ${item.sectionId}, ${item.teacher}${roomStr}`
      );
    }
    lines.push('');
  }

  return lines.join('\n').trim();
}
