import { describe, expect, it } from 'vitest';
import {
  countChosen,
  getProgressSummary,
  isComplete,
  remaining,
} from '../../src/core/progress';
import semester5Json from '../../public/data/semester-5.json';
import type { SemesterFile } from '../../src/core/types';

describe('progress.ts', () => {
  const semester = semester5Json as SemesterFile;

  it('correctly reports 0 chosen on empty picks', () => {
    const summary = getProgressSummary(semester, {});
    expect(summary.chosenCount).toBe(0);
    expect(summary.requiredTotal).toBe(8);
    expect(summary.isComplete).toBe(false);
    expect(summary.remainingComponents.length).toBe(8);
  });

  it('correctly tracks partial picks', () => {
    const picks = {
      'comp-net-theory': 'A',
      'comp-net-lab': 'A',
    };
    expect(countChosen(semester, picks)).toBe(2);
    expect(isComplete(semester, picks)).toBe(false);

    const rem = remaining(semester, picks);
    expect(rem.length).toBe(6);
    expect(rem.some((c) => c.id === 'comp-net-theory')).toBe(false);
    expect(rem.some((c) => c.id === 'web-eng-theory')).toBe(true);
  });

  it('correctly reports complete when all required components are chosen', () => {
    const fullPicks: Record<string, string> = {};
    for (const id of semester.requiredComponentIds) {
      fullPicks[id] = 'A';
    }

    const summary = getProgressSummary(semester, fullPicks);
    expect(summary.chosenCount).toBe(8);
    expect(summary.requiredTotal).toBe(8);
    expect(summary.isComplete).toBe(true);
    expect(summary.remainingComponents.length).toBe(0);
    expect(isComplete(semester, fullPicks)).toBe(true);
  });

  it('handles empty requiredComponentIds edge case', () => {
    const emptySem: SemesterFile = {
      ...semester,
      requiredComponentIds: [],
    };
    expect(isComplete(emptySem, {})).toBe(true);
    expect(countChosen(emptySem, {})).toBe(0);
    expect(remaining(emptySem, {})).toEqual([]);
    expect(getProgressSummary(emptySem, {}).isComplete).toBe(false);
  });

  it('skips unmapped component in remaining when reqId does not exist in components', () => {
    const corruptedSem: SemesterFile = {
      ...semester,
      requiredComponentIds: ['non-existent-comp'],
    };
    const rem = remaining(corruptedSem, {});
    expect(rem).toEqual([]);
  });
});
