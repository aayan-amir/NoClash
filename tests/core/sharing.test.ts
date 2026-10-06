import { describe, expect, it } from 'vitest';
import {
  decodeSchedule,
  encodeSchedule,
  fromBase64Url,
  toBase64Url,
} from '../../src/core/sharing';
import semester5Json from '../../public/data/semester-5.json';
import type { SemesterFile } from '../../src/core/types';

describe('sharing.ts', () => {
  const semester = semester5Json as SemesterFile;

  describe('base64url encoding/decoding', () => {
    it('round trips arbitrary strings and UTF-8 characters', () => {
      const samples = [
        'hello world',
        'comp-net-theory:A',
        '{"test": true, "symbol": "⚡"}',
        'abc+def/ghi===',
      ];
      for (const sample of samples) {
        const encoded = toBase64Url(sample);
        expect(encoded).not.toContain('+');
        expect(encoded).not.toContain('/');
        expect(encoded).not.toContain('=');
        const decoded = fromBase64Url(encoded);
        expect(decoded).toBe(sample);
      }
    });
  });

  describe('encodeSchedule & decodeSchedule', () => {
    it('round trips valid schedule picks', () => {
      const picks = {
        'comp-net-theory': 'A',
        'comp-net-lab': 'B',
        'web-eng-theory': 'A',
        'web-eng-lab': 'B',
      };
      const hash = encodeSchedule('5', semester.dataVersion, picks);
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(10);

      const result = decodeSchedule(hash, semester);
      expect(result.semesterId).toBe('5');
      expect(result.dataVersion).toBe(semester.dataVersion);
      expect(result.isVersionMatch).toBe(true);
      expect(result.picks).toEqual(picks);
      expect(result.unresolvedComponentIds).toEqual([]);
    });

    it('identifies version mismatch when dataVersion differs', () => {
      const picks = { 'comp-net-theory': 'A' };
      const hash = encodeSchedule('5', '2025-01-01.old', picks);
      const result = decodeSchedule(hash, semester);

      expect(result.dataVersion).toBe('2025-01-01.old');
      expect(result.isVersionMatch).toBe(false);
      expect(result.picks).toEqual(picks);
    });

    it('handles payload where version is omitted', () => {
      const rawJson = JSON.stringify({ s: '5', p: { 'comp-net-theory': 'A' } });
      const hash = toBase64Url(rawJson);
      const result = decodeSchedule(hash, semester);
      expect(result.dataVersion).toBe('');
      expect(result.isVersionMatch).toBe(false);
    });

    it('tracks unresolved picks when a component or section does not exist', () => {
      const picks = {
        'comp-net-theory': 'A',
        'non-existent-comp': 'A',
        'web-eng-theory': 'Z', // Invalid section
      };
      const hash = encodeSchedule('5', semester.dataVersion, picks);
      const result = decodeSchedule(hash, semester);

      expect(result.picks).toEqual({ 'comp-net-theory': 'A' });
      expect(result.unresolvedComponentIds).toEqual([
        'non-existent-comp',
        'web-eng-theory',
      ]);
    });

    it('tracks unresolved picks if section exists but does not offer the component', () => {
      // Modify a copy where section A does not have comp-net-theory slot
      const modifiedSem: SemesterFile = {
        ...semester,
        sections: [
          {
            ...semester.sections[0],
            slots: semester.sections[0].slots.filter(
              (sl) => sl.componentId !== 'comp-net-theory'
            ),
          },
          semester.sections[1],
        ],
      };
      const picks = { 'comp-net-theory': 'A' };
      const hash = encodeSchedule('5', semester.dataVersion, picks);
      const result = decodeSchedule(hash, modifiedSem);

      expect(result.picks).toEqual({});
      expect(result.unresolvedComponentIds).toEqual(['comp-net-theory']);
    });

    it('throws error for invalid base64 hash', () => {
      expect(() => decodeSchedule('@@not-base-64@@', semester)).toThrow(
        'Invalid schedule share code'
      );
    });

    it('throws error for malformed payload JSON', () => {
      const invalidJson = toBase64Url('{"s": "5"}'); // missing p (picks)
      expect(() => decodeSchedule(invalidJson, semester)).toThrow(
        'Malformed schedule share payload'
      );
    });
  });
});
