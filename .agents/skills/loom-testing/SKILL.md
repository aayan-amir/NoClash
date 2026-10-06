---
name: loom-testing
description: Testing conventions, 100% branch coverage requirements for src/core, bundle size budget checks, and Playwright verification flows for Loom.
---

# Loom Testing, Verification & Budgets

## 1. Core Logic Branch Coverage (Vitest)
All files under `src/core/` must achieve 100% branch and statement test coverage:
- `time.ts`:
  - 24-hour parsing to minutes.
  - Slot overlap calculation: identical periods, multi-period spans, non-overlapping adjacent periods (end == next start).
  - Cross-day comparisons (different days never clash).
- `options.ts`:
  - Grouping multi-session slots under the same `(sectionId, componentId)` option.
  - Correct calculation of `dayMask`, `earliestStart`, and `latestEnd`.
- `clash.ts`:
  - Pairwise overlap detection with day and period details.
  - Preview candidate evaluation (`conflictsWith` must ignore existing pick for the same component).
  - Property test: clash detection is symmetric and idempotent.
- `progress.ts`:
  - Accurate calculation of chosen count, remaining components, and completion status.
- `schema.ts`:
  - Negative tests for every Zod invariant: overlapping slots in same section, invalid period intervals, missing required components.

## 2. Bundle Size Budget Enforcement (`scripts/check-size.ts`)
Run before build completes. Fail CI if thresholds are breached:
- Initial JS (production gzipped) ≤ **120 KB**.
- Initial CSS (production gzipped) ≤ **15 KB**.
- Self-hosted font files (Latin subset WOFF2) ≤ **60 KB**.
- Zero raster images in app bundles (only SVG/CSS).

## 3. End-to-End Verification (Playwright)
Core automated end-to-end test cases:
1. **Onboarding**: Select Semester 5 → select Section A → verify 8 spools populated on Weave.
2. **Conflict Flow**: Select an option from Section B that conflicts with an existing pick → verify twill pattern, knot glyph, and clash text reason appear → switch to non-conflicting option → verify clash clears.
3. **Persistence & Offline**: Populate schedule → reload page → confirm state persists → simulate offline mode → confirm app continues functioning.
4. **Shared Link Flow**: Open `loom.app/s/5/share/<payload>` → confirm preview banner appears → click `[Use this schedule]` → confirm picks import into current user state.
5. **Accessibility**: Run `@axe-core/playwright` on all major views; zero automated WCAG 2.2 AA violations.
