# NoClash

> **AI-powered timetable extraction and clash-free schedule planning for university students.**

NoClash turns timetable photos, screenshots, scans, and PDFs into structured course data. Upload a timetable, let AI identify courses and sections, review the extracted information, and build a personalized schedule with instant clash detection.

**Live demo:** [no-clash.vercel.app](https://no-clash.vercel.app)  
**Repository:** [github.com/aayan-amir/NoClash](https://github.com/aayan-amir/NoClash)

---

## ✨ Why NoClash?

University timetables are often published as screenshots, scanned documents, PDFs, or photos of printed tables. Students usually have to manually read every row, identify course sections, copy instructors and rooms, compare alternatives, and search for schedule conflicts.

NoClash automates the most tedious part: **turning visual timetable information into usable structured data.**

Instead of starting with a spreadsheet, students can start with the timetable they already have.

---

## 🤖 AI-first workflow

```text
Timetable photo, screenshot, scan, or PDF
                    ↓
       AI analyzes the timetable image
                    ↓
 Courses, sections, instructors, rooms, days,
          and time slots become structured data
                    ↓
       Student reviews and validates the result
                    ↓
       Course components are selected
                    ↓
        Schedule clashes are detected instantly
                    ↓
          A personalized timetable is ready
```

### What the AI extracts

NoClash is designed to recognize the information students need when planning a semester:

- Course names and codes
- Sections and section-specific offerings
- Instructors
- Classrooms and room numbers
- Days of the week
- Start and end times
- Course components such as theory, lab, tutorial, or practical sessions

AI extraction provides a starting point—not a black box. Extracted data can be reviewed and corrected before it is used to build a schedule.

---

## 🧠 From unstructured images to scheduling decisions

NoClash separates the AI task from the scheduling task:

1. **Understand the image** — extract timetable content from visual documents.
2. **Structure the result** — represent courses, sections, and time slots in a consistent format.
3. **Validate the data** — review and correct extraction results.
4. **Plan the semester** — choose course components across available sections.
5. **Reason about conflicts** — detect overlapping classes and explain the clashes.
6. **Share the outcome** — preview and export a usable timetable.

This makes the application useful beyond a single timetable format while keeping conflict detection deterministic and easy to verify.

---

## ⚡ Core features

- **AI timetable extraction** from photos, screenshots, scans, and PDFs
- **Human review and correction** before extracted data is used
- **Course and section planning** across multiple section combinations
- **Instant clash detection** with specific overlap explanations
- **Weekly timetable visualization** for quickly understanding the schedule
- **Day-by-day schedule view** for accessible, focused planning
- **Schedule sharing** through compact URL-encoded selections
- **High-resolution timetable export** as an image
- **Offline-capable planning experience** for working with saved data
- **Local authoring studio** for maintaining timetable data

---

## 🎨 A timetable as a loom

NoClash uses a textile-inspired visual language to make a complex schedule feel understandable:

- **Warp:** days of the week
- **Weft:** class periods across time
- **Threads:** course components represented with distinct colors
- **Spools:** course-component selection controls
- **Knots:** visible clash indicators
- **Weave:** the weekly schedule grid

The visual system is intentionally distinct from generic AI-product aesthetics. AI handles the difficult extraction step; the interface keeps the final planning decision visible and understandable.

---

## 🏗️ Architecture

NoClash is a TypeScript single-page application focused on a lightweight, privacy-conscious planning experience.

| Capability | Implementation |
|---|---|
| Timetable data | Versioned static JSON files in `public/data/` |
| Data validation | Zod schemas and validation scripts |
| Schedule state | Local device storage with migration support |
| Schedule sharing | URL-encoded selections using compact Base64URL payloads |
| Clash detection | Deterministic client-side scheduling logic |
| Image export | Canvas-to-PNG export with fonts and legend |
| Offline support | PWA application shell and cached data |
| Data authoring | Local visual admin studio via `npm run admin` |

The AI extraction layer can convert visual input into the structured timetable format used by the planner. Once data is structured, schedule validation and clash detection remain transparent and predictable.

---

## 🚀 Getting started

### Prerequisites

- Node.js 18 or newer
- npm 9 or newer

### Install dependencies

```bash
npm install
```

### Start the development server

```bash
npm run dev
```

The application opens at `http://localhost:5173`.

### Start the local data authoring studio

```bash
npm run admin
```

The authoring studio opens at `http://localhost:5174`.

### Build for production

```bash
npm run build
```

### Check bundle size

```bash
npm run check:size
```

### Run tests with coverage

```bash
npm run test:coverage
```

### Validate timetable data

```bash
npm run validate:data
```

---

## 📁 Repository layout

```text
├── admin/                     # Local timetable authoring studio
├── docs/
│   ├── architecture.md        # Architectural blueprint
│   ├── data-authoring.md      # Timetable management guide
│   └── decisions.md           # Product and design decisions
├── public/
│   ├── data/
│   │   ├── manifest.json      # Timetable directory
│   │   └── semester-5.json    # Timetable seed data
│   ├── icons/                 # PWA vector icons
│   └── favicon.svg
├── scripts/
│   ├── check-size.ts          # Bundle budget verification
│   ├── import-paste.ts        # Timetable text parser
│   └── validate-data.ts       # Zod data validation
└── src/
    ├── core/                  # Pure scheduling and clash-detection logic
    ├── data/                  # Data fetching, caching, and freshness checks
    ├── design/                # CSS tokens, SVG patterns, and palettes
    ├── features/              # Onboarding, planner, and schedule views
    ├── state/                 # Zustand stores and local persistence
    └── ui/                    # Accessible interface primitives
```

---

## 🔐 Built for reviewable AI output

Timetable extraction can be difficult because real-world documents are inconsistent: layouts vary, text can be blurry, and tables may contain abbreviations or merged cells. NoClash treats AI output as structured assistance that should be inspected before it becomes a student's schedule.

The product experience is built around three principles:

- **AI for interpretation:** reduce manual data entry from visual timetables.
- **Structured data for planning:** make extracted information reusable and searchable.
- **Deterministic validation:** make schedule conflicts explainable and verifiable.

---

## 📜 License

ISC License. Built with craft and AI assistance for university students.
