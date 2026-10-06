# Timetable Data Authoring Guide

This guide explains how the department owner authors, verifies, and updates timetable files for **NoClash**.

---

## 1. Overview
NoClash uses **zero external databases or cloud servers**. All timetable data lives in versioned JSON files committed to Git under:
```
public/data/
  manifest.json
  semester-5.json
```

---

## 2. Option A: Visual Authoring (`npm run admin`) — Recommended

NoClash includes a built-in local authoring studio that runs entirely in your browser with real-time schema validation:

1. In your terminal, run:
   ```bash
   npm run admin
   ```
2. Open `http://localhost:5174` in your browser.
3. The visual studio lets you:
   - Browse sections (Section A, Section B, etc.).
   - Inspect existing class sessions and meeting times.
   - Add new slots or delete obsolete ones.
   - View real-time Zod schema validation (warns immediately if slots overlap or period numbers are invalid).
4. Click **Save Changes to Disk**:
   - The studio automatically bumps `dataVersion` and writes the updated JSON directly to `public/data/semester-<id>.json`.
5. Run tests and commit to deploy:
   ```bash
   npm run validate:data
   git add public/data/
   git commit -m "data: update Semester 5 timetables"
   git push
   ```

---

## 3. Option B: Paste Import Script (`npm run import:paste`)

If you have timetable data from a spreadsheet or email formatted as:
```
Day, Periods, Course Component, Teacher
Mon, 4-5, Computer Networks Theory, Lal
Wed, 1-2, Web Engineering Theory, Natalia
Thu, 7-9, Computer Networks Lab, Marium
```

You can import it directly into a section:
```bash
npm run import:paste -- --semester 5 --section A input.txt
```
The script will:
- Parse periods and clean teacher names (e.g. `Mehwish_W` becomes `Mehwish W`).
- Match component names using smart fuzzy matching.
- Refuse to write if there are schema or timetable overlaps.
- Update `public/data/semester-5.json` and bump `dataVersion`.

---

## 4. Option C: Manual Editing

If editing JSON files by hand, you must follow these rules:

1. **Component ID Immutability:** Once published, never change a component's `id` (e.g. `comp-net-theory`). Modifying an ID breaks existing student bookmarks and shared timetable URLs.
2. **Consecutive Periods:** Periods in a slot must be strictly consecutive (e.g. `[4, 5]`, never `[4, 6]`).
3. **No Section Clashes:** Two slots within the same section cannot overlap on the same day.
4. **Validation:** Always verify before committing:
   ```bash
   npm run validate:data
   ```

---

## 5. Adding a New Semester

1. Create `public/data/semester-<id>.json` following the schema in `src/core/schema.ts`.
2. Add the semester entry to `public/data/manifest.json`:
   ```json
   {
     "id": "6",
     "label": "6th Semester",
     "file": "/data/semester-6.json"
   }
   ```
3. Run `npm run validate:data` to confirm validity.
