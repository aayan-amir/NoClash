import type { Clash, Option } from './types';
import { intervalsOverlap, minutesToTime } from './time';

export function findClashes(picks: Option[]): Clash[] {
  const clashes: Clash[] = [];

  for (let i = 0; i < picks.length; i++) {
    for (let j = i + 1; j < picks.length; j++) {
      const optA = picks[i];
      const optB = picks[j];

      // Alternatives for the same component do not clash with each other
      if (optA.componentId === optB.componentId) {
        continue;
      }

      for (const sessA of optA.sessions) {
        for (const sessB of optB.sessions) {
          if (sessA.day !== sessB.day) {
            continue;
          }

          if (
            intervalsOverlap(
              sessA.startMinutes,
              sessA.endMinutes,
              sessB.startMinutes,
              sessB.endMinutes
            )
          ) {
            // Find overlapping periods
            const overlappingPeriodSet = new Set<number>();
            for (const p of sessA.periods) {
              if (sessB.periods.includes(p)) {
                overlappingPeriodSet.add(p);
              }
            }

            const overlapStart = Math.max(sessA.startMinutes, sessB.startMinutes);
            const overlapEnd = Math.min(sessA.endMinutes, sessB.endMinutes);

            clashes.push({
              a: optA,
              b: optB,
              day: sessA.day,
              periodIds: Array.from(overlappingPeriodSet).sort((x, y) => x - y),
              start: minutesToTime(overlapStart),
              end: minutesToTime(overlapEnd),
            });
          }
        }
      }
    }
  }

  return clashes;
}

/**
 * Checks if a candidate option conflicts with any current picks.
 * Automatically ignores any pick for the same component, because that pick
 * would be replaced by the candidate.
 */
export function conflictsWith(candidate: Option, picks: Option[]): Clash[] {
  // Filter out any existing pick for the same component
  const remainingPicks = picks.filter(
    (pick) => pick.componentId !== candidate.componentId
  );

  const clashes: Clash[] = [];

  for (const pick of remainingPicks) {
    for (const candSess of candidate.sessions) {
      for (const pickSess of pick.sessions) {
        if (candSess.day !== pickSess.day) {
          continue;
        }

        if (
          intervalsOverlap(
            candSess.startMinutes,
            candSess.endMinutes,
            pickSess.startMinutes,
            pickSess.endMinutes
          )
        ) {
          const overlappingPeriodSet = new Set<number>();
          for (const p of candSess.periods) {
            if (pickSess.periods.includes(p)) {
              overlappingPeriodSet.add(p);
            }
          }

          const overlapStart = Math.max(candSess.startMinutes, pickSess.startMinutes);
          const overlapEnd = Math.min(candSess.endMinutes, pickSess.endMinutes);

          clashes.push({
            a: candidate,
            b: pick,
            day: candSess.day,
            periodIds: Array.from(overlappingPeriodSet).sort((x, y) => x - y),
            start: minutesToTime(overlapStart),
            end: minutesToTime(overlapEnd),
          });
        }
      }
    }
  }

  return clashes;
}

export function formatClashMessage(
  clash: Clash,
  componentNameMap: Record<string, string>
): string {
  const nameA = componentNameMap[clash.a.componentId] ?? clash.a.componentId;
  const nameB = componentNameMap[clash.b.componentId] ?? clash.b.componentId;
  return `${nameA} overlaps ${nameB} on ${clash.day}, ${clash.start} to ${clash.end}`;
}
