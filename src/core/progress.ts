import type { Component, ProgressSummary, SemesterFile } from './types';

export function remaining(
  semester: SemesterFile,
  picks: Record<string, string>
): Component[] {
  const componentMap = new Map<string, Component>();
  for (const comp of semester.components) {
    componentMap.set(comp.id, comp);
  }

  const unchosen: Component[] = [];
  for (const reqId of semester.requiredComponentIds) {
    if (!picks[reqId]) {
      const comp = componentMap.get(reqId);
      if (comp) {
        unchosen.push(comp);
      }
    }
  }

  return unchosen;
}

export function isComplete(
  semester: SemesterFile,
  picks: Record<string, string>
): boolean {
  if (semester.requiredComponentIds.length === 0) {
    return true;
  }
  return semester.requiredComponentIds.every((reqId) => Boolean(picks[reqId]));
}

export function countChosen(
  semester: SemesterFile,
  picks: Record<string, string>
): number {
  let count = 0;
  for (const reqId of semester.requiredComponentIds) {
    if (picks[reqId]) {
      count++;
    }
  }
  return count;
}

export function getProgressSummary(
  semester: SemesterFile,
  picks: Record<string, string>
): ProgressSummary {
  const chosen = countChosen(semester, picks);
  const total = semester.requiredComponentIds.length;
  const rem = remaining(semester, picks);

  return {
    chosenCount: chosen,
    requiredTotal: total,
    isComplete: chosen === total && total > 0,
    remainingComponents: rem,
  };
}
