import { describe, expect, it } from 'vitest';
import {
  intervalsOverlap,
  minutesToTime,
  parseTimeToMinutes,
  periodRange,
  sessionsOverlap,
  to12Hour,
} from '../../src/core/time';
import type { Period } from '../../src/core/types';

describe('time.ts', () => {
  describe('parseTimeToMinutes', () => {
    it('parses valid 24h time strings correctly', () => {
      expect(parseTimeToMinutes('00:00')).toBe(0);
      expect(parseTimeToMinutes('08:30')).toBe(510);
      expect(parseTimeToMinutes('13:45')).toBe(825);
      expect(parseTimeToMinutes('23:59')).toBe(1439);
    });

    it('throws for strings without exactly one colon', () => {
      expect(() => parseTimeToMinutes('0800')).toThrow('Expected HH:MM');
      expect(() => parseTimeToMinutes('08:00:00')).toThrow('Expected HH:MM');
    });

    it('throws for out-of-range hours and minutes', () => {
      expect(() => parseTimeToMinutes('24:00')).toThrow('Invalid time values');
      expect(() => parseTimeToMinutes('12:60')).toThrow('Invalid time values');
      expect(() => parseTimeToMinutes('-1:30')).toThrow('Invalid time values');
      expect(() => parseTimeToMinutes('foo:bar')).toThrow('Invalid time values');
    });
  });

  describe('minutesToTime', () => {
    it('formats minutes into padded HH:MM', () => {
      expect(minutesToTime(0)).toBe('00:00');
      expect(minutesToTime(510)).toBe('08:30');
      expect(minutesToTime(825)).toBe('13:45');
      expect(minutesToTime(1439)).toBe('23:59');
    });
  });

  describe('to12Hour', () => {
    it('converts 24-hour time strings to 12-hour format without leading zeros', () => {
      expect(to12Hour('08:00')).toBe('8:00');
      expect(to12Hour('08:50')).toBe('8:50');
      expect(to12Hour('12:10')).toBe('12:10');
      expect(to12Hour('13:00')).toBe('1:00');
      expect(to12Hour('17:10')).toBe('5:10');
      expect(to12Hour('00:00')).toBe('12:00');
    });

    it('returns raw string for invalid inputs without exactly one colon or invalid numbers', () => {
      expect(to12Hour('invalid')).toBe('invalid');
      expect(to12Hour('foo:bar')).toBe('foo:bar');
    });
  });

  describe('periodRange', () => {
    const grid: Period[] = [
      { id: 1, start: '08:00', end: '08:50' },
      { id: 2, start: '08:50', end: '09:40' },
      { id: 3, start: '09:40', end: '10:30' },
    ];

    it('calculates min start and max end for given periods', () => {
      const range = periodRange([1, 2], grid);
      expect(range.startMinutes).toBe(480);
      expect(range.endMinutes).toBe(580);
      expect(range.start).toBe('08:00');
      expect(range.end).toBe('09:40');
    });

    it('handles non-sequential or reversed period IDs', () => {
      const range = periodRange([2, 1], grid);
      expect(range.startMinutes).toBe(480);
      expect(range.endMinutes).toBe(580);
    });

    it('handles single period', () => {
      const range = periodRange([2], grid);
      expect(range.startMinutes).toBe(530);
      expect(range.endMinutes).toBe(580);
      expect(range.start).toBe('08:50');
      expect(range.end).toBe('09:40');
    });

    it('throws if periodIds array is empty', () => {
      expect(() => periodRange([], grid)).toThrow('Cannot calculate range for empty periodIds array');
    });

    it('throws if a period id is not found in the grid', () => {
      expect(() => periodRange([99], grid)).toThrow('Period id 99 not found');
    });
  });

  describe('intervalsOverlap', () => {
    it('detects identical intervals as overlapping', () => {
      expect(intervalsOverlap(100, 200, 100, 200)).toBe(true);
    });

    it('detects partial overlap', () => {
      expect(intervalsOverlap(100, 200, 150, 250)).toBe(true);
      expect(intervalsOverlap(150, 250, 100, 200)).toBe(true);
    });

    it('adjacent periods do NOT overlap', () => {
      // Period 1 ends at 200, Period 2 starts at 200
      expect(intervalsOverlap(100, 200, 200, 300)).toBe(false);
      expect(intervalsOverlap(200, 300, 100, 200)).toBe(false);
    });

    it('completely disjoint intervals do not overlap', () => {
      expect(intervalsOverlap(100, 200, 300, 400)).toBe(false);
      expect(intervalsOverlap(300, 400, 100, 200)).toBe(false);
    });
  });

  describe('sessionsOverlap', () => {
    it('returns false for sessions on different days even if times overlap', () => {
      const a = { day: 'Mon' as const, startMinutes: 480, endMinutes: 530 };
      const b = { day: 'Tue' as const, startMinutes: 480, endMinutes: 530 };
      expect(sessionsOverlap(a, b)).toBe(false);
    });

    it('returns true for overlapping sessions on the same day', () => {
      const a = { day: 'Mon' as const, startMinutes: 480, endMinutes: 580 };
      const b = { day: 'Mon' as const, startMinutes: 530, endMinutes: 630 };
      expect(sessionsOverlap(a, b)).toBe(true);
    });

    it('returns false for adjacent sessions on the same day', () => {
      const a = { day: 'Mon' as const, startMinutes: 480, endMinutes: 530 };
      const b = { day: 'Mon' as const, startMinutes: 530, endMinutes: 580 };
      expect(sessionsOverlap(a, b)).toBe(false);
    });
  });
});
