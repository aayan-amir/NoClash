import { z } from 'zod';
import type { Day } from './types';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const DaySchema = z.enum(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);

export const PeriodSchema = z.object({
  id: z.number().int().positive(),
  start: z.string().regex(timeRegex, 'Must be valid HH:MM format'),
  end: z.string().regex(timeRegex, 'Must be valid HH:MM format'),
});

export const ComponentKindSchema = z.enum(['theory', 'practical', 'single']);

export const ComponentSchema = z.object({
  id: z.string().min(1),
  subjectId: z.string().min(1),
  subjectName: z.string().min(1),
  kind: ComponentKindSchema,
  code: z.string().min(1),
});

export const SlotSchema = z.object({
  day: DaySchema,
  periods: z.array(z.number().int().positive()).min(1),
  componentId: z.string().min(1),
  teacher: z.string().min(1),
  room: z.string().optional(),
}).refine(
  (slot) => {
    // Consecutive check
    const sorted = [...slot.periods].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] !== sorted[i - 1] + 1) {
        return false;
      }
    }
    return true;
  },
  {
    message: 'Slot periods must be strictly consecutive (e.g. [1, 2], not [1, 3])',
    path: ['periods'],
  }
);

export const SectionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  slots: z.array(SlotSchema),
});

export const ManifestSemesterSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  file: z.string().min(1),
});

export const ManifestSchema = z.object({
  schemaVersion: z.literal(1),
  dataVersion: z.string().min(1),
  semesters: z.array(ManifestSemesterSchema).min(1),
});

function timeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export const SemesterFileSchema = z
  .object({
    schemaVersion: z.literal(1),
    dataVersion: z.string().min(1),
    institution: z.string().min(1),
    department: z.string().min(1),
    semester: z.object({
      id: z.string().min(1),
      label: z.string().min(1),
    }),
    days: z.array(DaySchema).min(1),
    periods: z.array(PeriodSchema).min(1),
    components: z.array(ComponentSchema).min(1),
    requiredComponentIds: z.array(z.string().min(1)),
    sections: z.array(SectionSchema).min(1),
  })
  .superRefine((data, ctx) => {
    // 1. Period start < end
    const periodMap = new Map<number, { startMinutes: number; endMinutes: number }>();
    for (const p of data.periods) {
      const sMin = timeToMinutes(p.start);
      const eMin = timeToMinutes(p.end);
      if (sMin >= eMin) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Period ${p.id} start (${p.start}) must be before end (${p.end})`,
          path: ['periods'],
        });
      }
      if (periodMap.has(p.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate period ID: ${p.id}`,
          path: ['periods'],
        });
      } else {
        periodMap.set(p.id, { startMinutes: sMin, endMinutes: eMin });
      }
    }

    // 2. Unique component IDs
    const componentIds = new Set<string>();
    for (const c of data.components) {
      if (componentIds.has(c.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate component ID: ${c.id}`,
          path: ['components'],
        });
      }
      componentIds.add(c.id);
    }

    // 3. Unique section IDs
    const sectionIds = new Set<string>();
    for (const s of data.sections) {
      if (sectionIds.has(s.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate section ID: ${s.id}`,
          path: ['sections'],
        });
      }
      sectionIds.add(s.id);
    }

    // 4. requiredComponentIds must exist in components
    for (const reqId of data.requiredComponentIds) {
      if (!componentIds.has(reqId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Required component ID "${reqId}" is not defined in components`,
          path: ['requiredComponentIds'],
        });
      }
    }

    // 5. Track which components are offered across all sections
    const offeredComponents = new Set<string>();
    const validDays = new Set<Day>(data.days);

    for (let sIdx = 0; sIdx < data.sections.length; sIdx++) {
      const sec = data.sections[sIdx];
      const sectionSlotSpans: Array<{ day: Day; start: number; end: number; periods: number[] }> = [];

      for (let slIdx = 0; slIdx < sec.slots.length; slIdx++) {
        const slot = sec.slots[slIdx];

        // Day must be valid
        if (!validDays.has(slot.day)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Section "${sec.id}" slot day "${slot.day}" is not in semester days list`,
            path: ['sections', sIdx, 'slots', slIdx, 'day'],
          });
        }

        // Component must exist
        if (!componentIds.has(slot.componentId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Section "${sec.id}" slot references unknown component "${slot.componentId}"`,
            path: ['sections', sIdx, 'slots', slIdx, 'componentId'],
          });
        } else {
          offeredComponents.add(slot.componentId);
        }

        // Period existence and span calculation
        let slotStart = Infinity;
        let slotEnd = -Infinity;
        let validPeriods = true;

        for (const pId of slot.periods) {
          const pInfo = periodMap.get(pId);
          if (!pInfo) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Section "${sec.id}" slot references unknown period id ${pId}`,
              path: ['sections', sIdx, 'slots', slIdx, 'periods'],
            });
            validPeriods = false;
          } else {
            slotStart = Math.min(slotStart, pInfo.startMinutes);
            slotEnd = Math.max(slotEnd, pInfo.endMinutes);
          }
        }

        if (validPeriods) {
          // Check overlap with existing slots in same section
          for (const prev of sectionSlotSpans) {
            if (prev.day === slot.day && prev.start < slotEnd && slotStart < prev.end) {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Section "${sec.id}" has overlapping slots on ${slot.day} between periods [${prev.periods.join(', ')}] and [${slot.periods.join(', ')}]`,
                path: ['sections', sIdx, 'slots', slIdx],
              });
            }
          }
          sectionSlotSpans.push({ day: slot.day, start: slotStart, end: slotEnd, periods: slot.periods });
        }
      }
    }

    // 6. Every required component must be offered by at least one section
    for (const reqId of data.requiredComponentIds) {
      if (!offeredComponents.has(reqId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Required component "${reqId}" is not offered by any section`,
          path: ['requiredComponentIds'],
        });
      }
    }
  });
