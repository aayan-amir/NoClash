import type { Day, Option, SemesterFile, Session } from './types';
import { minutesToTime, periodRange } from './time';

export function buildOptions(semester: SemesterFile): Option[] {
  const options: Option[] = [];
  const allDays: Day[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  for (const section of semester.sections) {
    // Group slots by componentId
    const slotsByComponent = new Map<string, typeof section.slots>();

    for (const slot of section.slots) {
      const list = slotsByComponent.get(slot.componentId) ?? [];
      list.push(slot);
      slotsByComponent.set(slot.componentId, list);
    }

    for (const [componentId, slots] of slotsByComponent.entries()) {
      const sessions: Session[] = [];
      const teacherSet = new Set<string>();
      let minStart = Infinity;
      let maxEnd = -Infinity;

      const dayMask: Record<Day, boolean> = {
        Mon: false,
        Tue: false,
        Wed: false,
        Thu: false,
        Fri: false,
        Sat: false,
        Sun: false,
      };

      for (const slot of slots) {
        const range = periodRange(slot.periods, semester.periods);
        dayMask[slot.day] = true;
        teacherSet.add(slot.teacher);

        if (range.startMinutes < minStart) {
          minStart = range.startMinutes;
        }
        if (range.endMinutes > maxEnd) {
          maxEnd = range.endMinutes;
        }

        sessions.push({
          day: slot.day,
          periods: slot.periods,
          startMinutes: range.startMinutes,
          endMinutes: range.endMinutes,
          teacher: slot.teacher,
          room: slot.room,
        });
      }

      // Sort sessions by day index, then startMinutes
      sessions.sort((a, b) => {
        const dayA = allDays.indexOf(a.day);
        const dayB = allDays.indexOf(b.day);
        if (dayA !== dayB) return dayA - dayB;
        return a.startMinutes - b.startMinutes;
      });

      options.push({
        componentId,
        sectionId: section.id,
        sectionName: section.name,
        sessions,
        teachers: Array.from(teacherSet),
        dayMask,
        earliestStart: minutesToTime(minStart),
        latestEnd: minutesToTime(maxEnd),
      });
    }
  }

  return options;
}

export function findOption(
  options: Option[],
  componentId: string,
  sectionId: string
): Option | undefined {
  return options.find(
    (opt) => opt.componentId === componentId && opt.sectionId === sectionId
  );
}

export function getOptionsForComponent(
  options: Option[],
  componentId: string
): Option[] {
  return options.filter((opt) => opt.componentId === componentId);
}
