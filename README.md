# NoClash

> **A high-craft timetable mixer for university students.**  
> Pick your courses across multiple sections without scheduling conflicts. Zero sign-in, zero cloud databases, 100% private and offline-capable.

---

## 🎯 The Problem

During course registration weeks, university departments publish fixed timetable sheets for multiple sections (**Section A, Section B, Section C...**). 

Department rules allow students to cross-register across sections (e.g. taking Web Engineering Theory with Section A and the Lab with Section B). Previously, students had to juggle blurry photos of printed timetables, manual spreadsheets, and notebook grids—often making mistakes and registering for overlapping classes.

**NoClash** solves this by putting the student in control:
1. **Shows when classes are** via a single-SVG weekly **Weave** grid and an accessible Day-by-Day schedule.
2. **Flags clashes immediately** with exact reasons (*"Computer Networks Theory overlaps Web Engineering Lab on Mon, 10:30 to 12:10"*).
3. **Tracks what is left to choose** through an interactive Spool checklist.
4. **Previews before committing** via ghost outline threads projected onto the grid.

---

## 🎨 Visual Identity: The Timetable is a Loom

Built around a cohesive textile metaphor, avoiding generic AI-template aesthetics:
- **Warp (Vertical)**: Days of the week (Mon–Fri).
- **Weft (Horizontal)**: Class periods across time.
- **Threads**: Distinct course components assigned natural-dye colors (madder, turmeric, indigo, tea leaf, terracotta).
- **Spools**: Component checklist bobbins winding thread as courses are picked.
- **Clashes**: Interlaced 45° twill diagonal weave patterns with knot glyphs.
- **Typography**: Atkinson Hyperlegible (high readability) paired with Albert Sans (display face).

---

## ⚡ Architecture & Zero-Backend Design

NoClash runs as a static Single Page Application with **zero operational server costs**:

| Capability | Implementation |
|---|---|
| **Timetable Data** | Versioned static JSON files (`public/data/`) validated with Zod. |
| **Picks Storage** | Local device `localStorage` with migration support and background freshness checks. |
| **Schedule Sharing** | Zero-database URL sharing (`/#/s/5/share/<payload>`) encoding choices in compact Base64URL. |
| **Shared Previews** | Non-destructive banner allowing recipients to preview schedules before importing. |
| **Image Export** | High-resolution 1080px Canvas-to-PNG export with inlined fonts and legend. |
| **Offline PWA** | Precached app shell and data with `vite-plugin-pwa` Service Worker. |
| **Authoring Studio** | Offline visual admin tool (`npm run admin`) running locally on port 5174. |

---

## 📦 Performance & Budgets

Enforced automatically via `npm run check:size`:
- **Initial Production JS:** **75.44 KB** gzipped (Budget: ≤ 120 KB)
- **Initial Production CSS:** **4.08 KB** gzipped (Budget: ≤ 15 KB)
- **Core Unit Test Coverage:** **100% Statement, 100% Branch, 100% Function Coverage** (63 tests)

---

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- npm (v9+)

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
# Opens http://localhost:5173
```

### Local Admin Data Studio
```bash
npm run admin
# Opens http://localhost:5174 for editing sections and slots
```

### Production Build & Size Check
```bash
npm run build
npm run check:size
```

### Running Test Suite
```bash
npm run test:coverage
```

### Validating Timetable JSON Files
```bash
npm run validate:data
```

---

## 📁 Repository Layout

```
├── admin/                     # Local authoring studio (excluded from production builds)
├── docs/
│   ├── architecture.md        # Architectural blueprint
│   ├── data-authoring.md      # Owner timetable management guide
│   └── decisions.md           # Product and design decisions log
├── public/
│   ├── data/
│   │   ├── manifest.json      # Timetable directory
│   │   └── semester-5.json    # Verified Semester 5 seed data
│   ├── icons/                 # PWA vector icons
│   └── favicon.svg
├── scripts/
│   ├── check-size.ts          # Budget verification script
│   ├── import-paste.ts        # Timetable text parser
│   └── validate-data.ts       # Zod data validation script
└── src/
    ├── core/                  # Pure logic (zero React/DOM dependencies, 100% test coverage)
    ├── data/                  # Fetcher, cache, and freshness diffing
    ├── design/                # CSS tokens, SVG pattern defs, and textile palettes
    ├── features/              # Onboarding, Weave planner, and Week list view
    ├── state/                 # Zustand stores with local persistence
    └── ui/                    # Native accessible primitives (Spool, DayStrip, OptionCard, BottomSheet)
```

---

## 📜 License
ISC License. Built with craft for university students.
