---
name: loom-data-authoring
description: Timetable data schemas, Zod validation rules, URL-encoded sharing specification, and local admin panel filesystem management.
---

# Loom Data Authoring & Storage Specifications

## 1. Zod Validation & Schema Invariants
All timetable JSON data must strictly pass Zod schemas at build, runtime, and during admin edits:
- `schemaVersion`: Numeric (currently `1`).
- `dataVersion`: ISO date format with sequence (e.g., `"2026-10-06.1"`).
- Period times: strict `"HH:MM"` 24-hour strings; period numbers must be strictly consecutive and non-overlapping.
- Slots:
  - Must reference valid `componentId` and valid `periods`.
  - Consecutive period validation (`[4, 5]` valid; `[4, 6]` rejected).
  - Slots within the same section must never overlap in time on the same day.
- Components:
  - Must define `id`, `subjectId`, `subjectName`, `kind` (`'theory' | 'practical' | 'single'`), and optional `code`.
  - Every ID in `requiredComponentIds` must be provided by at least one section.
- **Component ID Immutability Contract**: Component IDs are permanent once created. Changing or renaming an ID breaks stored local picks and shared links.

## 2. URL-Encoded Sharing Specification (Zero Backend)
Shared schedules encode the student's selections into a compact base64url string appended to the URL:
- **Format**: `loom.app/#/s/<semesterId>/share/<payload>` or `loom.app/s/<semesterId>/share/<payload>`
- **Payload Composition**:
  `semesterId.dataVersion.pick1pick2pick3...`
  where each pick is encoded as:
  - `componentIndex` (base36/hex character)
  - `sectionIndex` (base36/hex character)
- **Shared Link UX / Preview Mode**:
  1. Recipient opens URL.
  2. App renders the shared schedule in a persistent **Preview Banner**:
     - *"Viewing a shared schedule for Semester 5"*
     - Action buttons: `[Use this schedule]` vs `[Keep my schedule]` (or `[Browse without saving]`).
  3. Clicking `[Use this schedule]` safely copies the incoming picks into `localStorage`, replacing the current session after a confirmation prompt.
  4. If `dataVersion` in the link differs from current data:
     - Retain valid matching slots.
     - Highlight modified or removed options with a *"Schedule updated since shared"* notice.

## 3. Local Admin Panel Architecture (`npm run admin`)
- **Isolation**: Admin code lives in `admin/` with its own `vite.admin.config.ts`. It is strictly excluded from production bundle and Render builds.
- **Filesystem Write Hook**: Uses a lightweight local Vite dev plugin (`localDataWriterPlugin`) listening on `POST /api/save-timetable` to write validated JSON directly to `public/data/semester-<id>.json`.
- **Validation**: Runs Zod schemas in real-time in the browser prior to saving, displaying exact line/slot errors and preventing corrupt file writes.
- **Workflow**:
  1. `npm run admin` opens `http://localhost:5174`.
  2. Owner manages slots, teachers, and rooms via visual grid and form controls.
  3. On save, writes to disk and bumps `dataVersion`.
  4. Owner commits to Git and pushes to trigger automatic static deployment on Render.
