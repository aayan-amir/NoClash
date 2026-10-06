import { describe, expect, it } from 'vitest';
import {
  ManifestSchema,
  SemesterFileSchema,
  SlotSchema,
} from '../../src/core/schema';
import semester5Json from '../../public/data/semester-5.json';
import manifestJson from '../../public/data/manifest.json';
import type { SemesterFile } from '../../src/core/types';

describe('schema.ts', () => {
  it('validates seed semester-5.json successfully', () => {
    const result = SemesterFileSchema.safeParse(semester5Json);
    expect(result.success).toBe(true);
  });

  it('validates manifest.json successfully', () => {
    const result = ManifestSchema.safeParse(manifestJson);
    expect(result.success).toBe(true);
  });

  describe('SlotSchema', () => {
    it('accepts consecutive periods', () => {
      const res = SlotSchema.safeParse({
        day: 'Mon',
        periods: [4, 5, 6],
        componentId: 'comp-net-theory',
        teacher: 'Lal',
      });
      expect(res.success).toBe(true);
    });

    it('rejects non-consecutive periods', () => {
      const res = SlotSchema.safeParse({
        day: 'Mon',
        periods: [4, 6],
        componentId: 'comp-net-theory',
        teacher: 'Lal',
      });
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('strictly consecutive');
      }
    });
  });

  describe('SemesterFileSchema validation rules', () => {
    const baseValid = semester5Json as SemesterFile;

    it('rejects when period start is not before end', () => {
      const invalid = JSON.parse(JSON.stringify(baseValid));
      invalid.periods[0].start = '09:00';
      invalid.periods[0].end = '08:00';
      const res = SemesterFileSchema.safeParse(invalid);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('must be before end');
      }
    });

    it('rejects duplicate period IDs', () => {
      const invalid = JSON.parse(JSON.stringify(baseValid));
      invalid.periods[1].id = invalid.periods[0].id;
      const res = SemesterFileSchema.safeParse(invalid);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('Duplicate period ID');
      }
    });

    it('rejects duplicate component IDs', () => {
      const invalid = JSON.parse(JSON.stringify(baseValid));
      invalid.components[1].id = invalid.components[0].id;
      const res = SemesterFileSchema.safeParse(invalid);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('Duplicate component ID');
      }
    });

    it('rejects duplicate section IDs', () => {
      const invalid = JSON.parse(JSON.stringify(baseValid));
      invalid.sections[1].id = invalid.sections[0].id;
      const res = SemesterFileSchema.safeParse(invalid);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('Duplicate section ID');
      }
    });

    it('rejects requiredComponentId not defined in components', () => {
      const invalid = JSON.parse(JSON.stringify(baseValid));
      invalid.requiredComponentIds.push('ghost-component');
      const res = SemesterFileSchema.safeParse(invalid);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('ghost-component');
      }
    });

    it('rejects slot day not in semester days list', () => {
      const invalid = JSON.parse(JSON.stringify(baseValid));
      invalid.sections[0].slots[0].day = 'Sat';
      const res = SemesterFileSchema.safeParse(invalid);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('is not in semester days list');
      }
    });

    it('rejects slot referencing unknown componentId', () => {
      const invalid = JSON.parse(JSON.stringify(baseValid));
      invalid.sections[0].slots[0].componentId = 'unknown-comp';
      const res = SemesterFileSchema.safeParse(invalid);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('unknown component');
      }
    });

    it('rejects slot referencing unknown period id', () => {
      const invalid = JSON.parse(JSON.stringify(baseValid));
      invalid.sections[0].slots[0].periods = [99];
      const res = SemesterFileSchema.safeParse(invalid);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('unknown period id 99');
      }
    });

    it('rejects overlapping slots within the same section', () => {
      const invalid = JSON.parse(JSON.stringify(baseValid));
      // Add a slot to Section A on Mon period 4 that overlaps with Mon 4-5
      invalid.sections[0].slots.push({
        day: 'Mon',
        periods: [4],
        componentId: 'enterprise-sys',
        teacher: 'Muneeb',
      });
      const res = SemesterFileSchema.safeParse(invalid);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('overlapping slots');
      }
    });

    it('rejects required component not offered by any section', () => {
      const invalid = JSON.parse(JSON.stringify(baseValid));
      // Add a required component with no slots in any section
      invalid.components.push({
        id: 'new-unoffered',
        subjectId: 'new-unoffered',
        subjectName: 'Unoffered Course',
        kind: 'single',
        code: 'Unoff',
      });
      invalid.requiredComponentIds.push('new-unoffered');
      const res = SemesterFileSchema.safeParse(invalid);
      expect(res.success).toBe(false);
      if (!res.success) {
        expect(res.error.issues[0].message).toContain('is not offered by any section');
      }
    });
  });
});
