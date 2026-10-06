# Build prompt: Loom, a timetable mixer for students

Working title: **Loom** (placeholder; maintain in one central config constant `APP_NAME` for instant rebranding).

You are a senior front-end engineer and product designer building a public web app that will serve as a premier portfolio piece. Quality, polish, craft, and micro-interactions matter as much as raw functionality. Read this entire document before writing code. Work through the phases in Section 17, verify each phase in a real browser at the specified breakpoints, and do not skip ahead.

---

## 0. How to work

1. First produce a short implementation plan (files, modules, order). Then build phase by phase.
2. After each phase: run type checks, lint, tests, and the bundle size budget check. Open the app in a browser at 320px, 360px, 768px, and 1280px widths. Address and fix any regressions before advancing.
3. Prefer small, well-named modules. No dead code, no TODO comments left behind, no console logs.
4. If an ambiguity arises, choose the simpler, more resilient option, document the decision in `docs/decisions.md` (one concise paragraph), and proceed without stalling.
5. Items marked **OWNER DECISION** must use the stated defaults and remain isolated in configuration constants or CSS tokens.

---

## 1. What the product is

University departments offer multiple semesters, with each semester divided into sections (e.g., Sections A–F). Every section has its own weekly schedule. Department regulations allow students to attend classes across different sections (e.g., attending Web Engineering theory in Section A and the lab in Section D) provided there are no scheduling conflicts.

Loom allows a student to **compose their ideal weekly timetable** by selecting, for each required subject component, one section option from their semester. Loom does **not** auto-generate or algorithmic-rank schedules. It informs and empowers. It does three things with extreme precision:

1. **Shows when classes take place** (an SVG weekly Weave grid and an accessible Day-by-Day view).
2. **Identifies clashes immediately and clearly** (the exact overlapping courses, day, and time window).
3. **Tracks missing choices** (a checklist of required course components awaiting selection).

The student remains in control. Never auto-pick, never block conflicting selections, never reorder options by algorithmic "preference."

### Users
- **Students** (the primary audience): Visiting primarily on mobile devices during high-stress course registration weeks. Zero registration or sign-in barrier.
- **The Owner**: Edits and publishes timetable data semi-annually. All data is stored as static JSON files in the repository, managed locally via an offline visual admin interface (`npm run admin`).

### Non-goals (Strictly Out of Scope)
User registration/passwords, hosted cloud databases, third-party backend APIs, algorithmic schedule ranking, analytics/tracking scripts, tracking cookies, push notifications, payment processing, multi-language localization (English only, centralized in `src/copy/en.ts`).

---

## 2. Stack and constraints

| Area | Choice |
|---|---|
| Build & Dev | Vite + React 18 + TypeScript (strict mode) |
| Styling | Tailwind CSS + CSS Custom Properties design-token layer |
| State Management | Zustand (`persist` middleware for local picks) |
| Validation | Zod for all timetable and configuration JSON (build, runtime, admin) |
| Motion | CSS animations first. Lazy-loaded Framer Motion exclusively for gestures and layout transitions |
| Testing | Vitest + Testing Library (100% branch coverage on `src/core`); Playwright + Axe for E2E and A11y |
| Quality & Budgets | ESLint, Prettier, `tsc --noEmit`, automated bundle size budget checker |
| PWA & Offline | `vite-plugin-pwa`, installable web app, fully functional offline after initial load |
| Hosting | Render Static Site (zero cost tier): automated deployment from Git (`npm ci && npm run build` -> `dist`) |

**UI Library Rule:** Do not install third-party UI component libraries (no MUI, Chakra, Tailwind UI packages, or shadcn-style component generators). Build the required primitives natively using semantic HTML elements (`<dialog>` for modals, native buttons, accessible form elements). Do not install icon libraries (no Lucide, Heroicons, FontAwesome, or emojis); construct all icons as lightweight inline SVGs in `src/ui/icons.tsx`.

### Performance & Bundle Budget (Enforced via `scripts/check-size.ts`)
- Initial production JavaScript ≤ **120 KB** (gzipped).
- Initial production CSS ≤ **15 KB** (gzipped).
- Zero raster images in the app interface (pure CSS and inline SVG).
- Self-hosted WOFF2 fonts (Latin subset only) ≤ **60 KB** total; `font-display: swap`.
- Mobile Lighthouse score ≥ **95** across Performance, Accessibility, and Best Practices.
- Fully functional on low-end devices with 4x CPU throttling.

---

## 3. Repository structure

```
loom/
  public/
    data/
      manifest.json
      semester-5.json
    icons/                     (PWA icons generated from a master SVG)
    favicon.svg
  src/
    core/                      (pure TypeScript, zero React/browser imports, 100% test coverage)
      types.ts
      schema.ts                (Zod validation schemas)
      time.ts                  (time calculations and overlap math)
      options.ts               (slot grouping and options builder)
      clash.ts                 (conflict detection and preview logic)
      progress.ts              (completion metrics and missing components)
      sharing.ts               (URL payload encoding & decoding)
      export.ts                (plain-text and canvas PNG export pipelines)
    data/
      loader.ts                (manifest/semester fetching, version diffing)
      cache.ts                 (safe try/catch localStorage storage wrapper)
    state/
      picks.ts                 (Zustand store with persistence)
      ui.ts                    (active sheets, preview candidates, view modes)
    ui/                        (primitives: Button, Sheet, Chip, Spool, OptionCard, ClashNote, Toast, icons)
    features/
      onboarding/              (semester selection and starter section flow)
      planner/                 (the Weave grid, Spool checklist, preview mode banner)
      week/                    (day-by-day linear schedule view)
      sharing/                 (URL generation, clipboard copy, preview banner actions)
    design/
      tokens.css               (CSS custom property palette and spacing tokens)
      weave.tsx                (SVG pattern definitions, hairlines, and textures)
    copy/
      en.ts                    (central repository for all user-facing strings)
    router.ts                  (lightweight client-side history router)
    main.tsx
  admin/                       (local-only visual editor, excluded from production build)
    index.html
    main.tsx
    components/
  scripts/
    validate-data.ts           (CLI validation for timetable JSON files)
    import-paste.ts            (CLI parser converting text tables to slots)
    check-size.ts              (budget threshold validator)
    generate-icons.ts          (SVG-to-PWA icon generator)
  docs/
    architecture.md
    data-authoring.md
    decisions.md
  vite.config.ts
  vite.admin.config.ts         (separate dev server config for admin)
  render.yaml
  README.md
```

Keep `src/core` completely independent of React or DOM dependencies so it can be verified in raw Node.js.

---

## 4. Data model and validation

All timetable data resides as static JSON files validated via Zod.

```ts
type Day = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

interface Period {
  id: number;
  start: string;  // "08:00" (24-hour format)
  end: string;    // "08:50" (24-hour format)
}

interface Component {
  id: string;                    // permanent ID, e.g. "comp-net-theory"
  subjectId: string;             // parent subject ID, e.g. "comp-net"
  subjectName: string;           // "Computer Networks"
  kind: 'theory' | 'practical' | 'single';
  code: string;                  // short display code for the Weave, e.g. "CompNet"
}

interface Slot {
  day: Day;
  periods: number[];             // strictly consecutive period IDs, e.g. [4, 5]
  componentId: string;
  teacher: string;               // instructor name or "TBA"
  room?: string;                 // e.g. "Lab 2" (displayed, not used for clash logic)
}

interface Section {
  id: string;                    // "A", "B", ...
  name: string;                  // "Section A"
  slots: Slot[];
}

interface SemesterFile {
  schemaVersion: 1;
  dataVersion: string;           // ISO format: "2026-10-06.1"
  institution: string;
  department: string;
  semester: { id: string; label: string }; // e.g. { id: "5", label: "5th Semester" }
  days: Day[];
  periods: Period[];
  components: Component[];
  requiredComponentIds: string[];
  sections: Section[];
}

interface Manifest {
  schemaVersion: 1;
  dataVersion: string;
  semesters: { id: string; label: string; file: string }[];
}
```

### Validation Invariants (Enforced via Zod)
- **Period Continuity:** Slot `periods` must be strictly consecutive (e.g. `[1, 2]` valid; `[1, 3]` rejected).
- **Intra-Section Conflict:** Two slots within the same section must never share a day and overlapping period times.
- **Reference Integrity:** Every slot `componentId` must match an existing component, and all `periods` must exist in the timetable grid.
- **Requirement Viability:** Every component in `requiredComponentIds` must be provided by at least one section.
- **Component ID Immutability:** Component IDs must remain permanent once published; changing an ID invalidates student bookmarks and shared links.

---

## 5. Seed data (Semester 5: Sections A & B)

Use this verified data for Semester 5 (5th Semester).

### Periods
1. `08:00–08:50`, 2. `08:50–09:40`, 3. `09:40–10:30`, 4. `10:30–11:20`, 5. `11:20–12:10`, 6. `12:10–13:00`,
7. `13:00–13:50`, 8. `13:50–14:40`, 9. `14:40–15:30`, 10. `15:30–16:20`, 11. `16:20–17:10`, 12. `17:10–18:00`.
Active Days: `['Mon', 'Tue', 'Wed', 'Thu', 'Fri']`.

### Components (8 Components across 6 Subjects)
1. `comp-net-theory`: Computer Networks (Theory), `kind: 'theory'`, display code: `CompNet`
2. `comp-net-lab`: Computer Networks Lab, `kind: 'practical'`, display code: `CompNet Lab`
3. `web-eng-theory`: Web Engineering (Theory), `kind: 'theory'`, display code: `WebEng`
4. `web-eng-lab`: Web Engineering Lab, `kind: 'practical'`, display code: `WebEng Lab`
5. `compiler-const`: Compiler Construction, `kind: 'single'`, display code: `CompConst`
6. `enterprise-sys`: Enterprise Systems, `kind: 'single'`, display code: `EntSys`
7. `prob-stats`: Probability & Statistics, `kind: 'single'`, display code: `ProbStat`
8. `tech-writing`: Technical Report Writing & Presentation Skills, `kind: 'single'`, display code: `TechWrite`

### Section A Slots
- Mon 4–5: `comp-net-theory`, Teacher: "Lal"
- Mon 6: `enterprise-sys`, Teacher: "Muneeb"
- Mon 7–9: `web-eng-lab`, Teacher: "Rahil"
- Wed 1–2: `web-eng-theory`, Teacher: "Natalia"
- Wed 3: `prob-stats`, Teacher: "TBA"
- Wed 4: `enterprise-sys`, Teacher: "Muneeb"
- Wed 5: `compiler-const`, Teacher: "Mehwish W"
- Thu 5: `comp-net-theory`, Teacher: "Lal"
- Thu 6: `compiler-const`, Teacher: "Mehwish W"
- Thu 7–9: `comp-net-lab`, Teacher: "Marium"
- Thu 10: `prob-stats`, Teacher: "TBA"
- Fri 2: `prob-stats`, Teacher: "TBA"
- Fri 3: `compiler-const`, Teacher: "Mehwish W"
- Fri 4: `enterprise-sys`, Teacher: "Muneeb"
- Fri 5–6: `tech-writing`, Teacher: "TBA"

### Section B Slots
- Mon 1: `compiler-const`, Teacher: "Anum"
- Mon 2: `comp-net-theory`, Teacher: "Rija"
- Mon 3: `enterprise-sys`, Teacher: "Nadeem"
- Mon 4–6: `web-eng-lab`, Teacher: "Mohsin"
- Tue 7–8: `prob-stats`, Teacher: "Ahsan"
- Tue 9: `compiler-const`, Teacher: "Anum"
- Tue 10–11: `tech-writing`, Teacher: "TBA"
- Wed 7: `enterprise-sys`, Teacher: "Nadeem"
- Wed 8: `compiler-const`, Teacher: "Anum"
- Wed 9: `web-eng-theory`, Teacher: "Mohsin"
- Wed 10–11: `comp-net-theory`, Teacher: "Rija"
- Thu 1: `web-eng-theory`, Teacher: "Mohsin"
- Thu 2: `enterprise-sys`, Teacher: "Nadeem"
- Thu 3: `prob-stats`, Teacher: "Ahsan"
- Thu 4–6: `comp-net-lab`, Teacher: "Sobiya"

*Test Case:* Section A `comp-net-theory` (Mon 4–5) clashes directly with Section B `web-eng-lab` (Mon 4–6) on Mon period 4 and 5.

---

## 6. Architecture & data pipeline

### Client-Side State & Persistence
- Stored under `localStorage` key `loom:v1:picks:<semesterId>` as `{ [componentId]: sectionId }`.
- On application startup, load and validate manifest. If local copy is younger than 24 hours, serve immediately without blocking.
- Background refresh diffs `dataVersion`. If updated, re-validate active picks: any pick whose slot structure was removed or modified is marked as `"needs attention"` with an inline notice ("This class schedule changed. Please re-select.").

### Zero-Backend URL-Encoded Sharing
Shareable links encode the complete timetable selection in the URL without requiring external database storage:
- **Format:** `https://loom.app/s/5/share/<base64url-payload>`
- **Payload Structure:** `semesterId.dataVersion.c0s0c1s1...` (compact index pairs).
- **Preview Flow:**
  - Recipient opens a shared link.
  - The application opens in **Shared Preview Mode**.
  - A top banner indicates: *"Viewing a shared timetable for 5th Semester"*.
  - Actions: `[Use this schedule]` and `[Keep my existing schedule]`.
  - Selecting `[Use this schedule]` prompts confirmation before overwriting local picks.

### Local Admin Interface (`npm run admin`)
- Standalone Vite configuration (`vite.admin.config.ts`) running on `localhost:5174`, excluded from production builds.
- Connects to a dev-only Vite middleware endpoint `POST /api/save-timetable` to write verified JSON directly into `public/data/semester-<id>.json`.
- Visual timetable editor provides drag-and-drop or slot creation, teacher assignment, and real-time Zod schema validation before saving.

---

## 7. UX & responsive layouts

### 7.1 Mobile Viewport (<768px): The Split Layout
Modeled after native maps applications:
- **Top Area (Persistent Weave)**: Takes 45% of viewport height; sticky and non-scrollable. Displays the SVG weekly timetable so the student always sees visual feedback when testing options.
- **Bottom Draggable Sheet**:
  - **Peek State (15% height)**: Displays summary indicator ("6 of 8 chosen", clash badge, expand chevron).
  - **Half State (50% height)**: Displays Spool Checklist (scrollable list of course bobbins).
  - **Full State (85% height)**: Expands active component's Option Cards for comparison and selection.

### 7.2 Desktop & Tablet Viewport (≥768px, ≥1024px)
- **Tablet (768px – 1023px)**: Row heights scale to 56px; bottom sheet transitions into an elevated bottom drawer.
- **Desktop (≥1024px)**: Full dual-column workspace:
  - Left column: The Weave SVG grid (occupies remaining width, crisp border separators).
  - Right column: Fixed 380px sidebar containing Spool Checklist and active Option Cards.
  - Hovering over an option card previews the candidate as an outline ghost on the grid; clicking locks in the selection.

### 7.3 Ultra-Narrow Screens (<360px)
- Total width 320px minus 40px time rail leaves 56px per column across 5 days.
- Truncate labels to 2–3 letter uppercase abbreviations (`CN`, `WE`, `CC`) or render solid color bars with full labels accessible in the bottom drawer.
- Never trigger horizontal scrolling on standard 5-day timetables.

---

## 8. Visual system & design tokens

### The Textile Visual Language
- The timetable is a loom.
- Days are the **warp** (vertical threads); periods are the **weft** (horizontal rows).
- Each course component is assigned a consistent **thread color**.
- Conflicting choices are two threads battling for the same intersection, rendered via a **twill diagonal pattern** and a knot indicator.

### Prohibited Aesthetic Tropes (Zero AI-Template Look)
- No purple or blue radial glow backgrounds.
- No glassmorphism, blur backdrops, or heavy pillowy shadows.
- No uppercase tracked-out sub-labels or decorative middle dots.
- No third-party icon libraries or emoji icons.
- No template typography: Inter, Roboto, Space Grotesk, Fraunces, Playfair, Geist, DM Sans.

### Typography & Palette
- **Body / Interface:** Atkinson Hyperlegible Next (or Atkinson Hyperlegible), 400 and 600 weight. Minimum mobile body font size: 16px.
- **Display Face:** Albert Sans or Familjen Grotesk (open license, distinctive character).
- **Tokens (`src/design/tokens.css`):**
  - `--ground`: `#F3F3EF` (bleached cotton neutral)
  - `--ground-sunk`: `#E7E7E1`
  - `--ink`: `#1B1D22`
  - `--ink-soft`: `#4A4E57`
  - `--rule`: `#CFCFC7`
  - `--clash`: `#B3261E`
  - Dark Mode (`[data-theme="dark"]`): `--ground: #151A30` (indigo vat), `--ink: #ECEDF2`, `--rule: #2C3352`, `--clash: #FF6B6B`.
- **Thread Colors:**
  - Madder: `#B23A2E`
  - Turmeric: `#D9A21B`
  - Indigo: `#26357A`
  - Tea Leaf: `#4C6B3A`
  - Kiln Brick: `#C4622D`
  - Aubergine: `#5B2A56`
  - Teal Dye: `#1F6F6B`
  - Iron: `#4A4A4F`
  - Rose Madder: `#C75A7A`
  - Olive: `#7A6A2B`
- Contrast guarantee: All typography rendered over thread fills must dynamically check contrast to maintain ≥4.5:1 against either `#1B1D22` or `#FFFFFF`.

---

## 9. The Weave grid (SVG rendering)

- Render the entire weekly grid as a single SVG element.
- Time rail on the left (40px) shows period numbers and start times.
- Empty cells display the `#warp-weft-empty` hairline texture pattern.
- Occupied sessions fill with the component's thread color and a faint `#plain-weave` interlaced texture.
- Multi-period spans (e.g. periods 7–9) render as **one continuous SVG `<rect>`**, containing a flat label badge (short code, instructor, room).
- **Conflict Representation:** Overlapping cells render a 45-degree diagonal `#twill-clash` texture combining the two conflicting thread colors, accompanied by a small woven knot icon. Never communicate clash state by color alone.
- **Ghost Preview:** Candidate options preview as outline threads (`stroke-dasharray="4,2"` in the thread color).
- **Motion:** Thread selections slide into place over 220ms with an ease-out curve. Conflicting cells receive a single 160ms nudge. All animations respect `prefers-reduced-motion`.

---

## 10. The Spool checklist & primitives

- **Spool Component:** An SVG thread bobbin. Empty spools render as wireframe outlines with course labels; selected spools fill with thread color and display the chosen section and teacher.
- **Option Card:** Displays section identifier, instructor, a mini Mon–Fri active day strip, time range (`08:00 – 12:10`), and conflict notices.
- **Toast Notifications:** Fixed bottom-center, 4000ms auto-dismiss, maximum 1 visible toast (used exclusively for confirmations like "Copied to clipboard").
- **Clash Alert Banner:** Persistent summary above the Weave describing all active conflicts: `"{Course A} overlaps {Course B} on {Day}, {start} to {end}"`.

---

## 11. Export & sharing

- **Copy as Text:** Formats the selected timetable into a clean, human-readable schedule grouped by day, ready for messaging apps.
- **Save as Image:** Renders the Weave SVG onto an off-screen HTML5 Canvas (1080px width, dynamic height) and exports a PNG:
  - Embeds Latin-subset WOFF2 fonts as base64 Data URIs within the SVG `<defs>` prior to rasterization to ensure font fidelity.
  - Includes department header, semester title, legend swatches, and subtle "Loom" branding.
- **URL Link Generation:** Copies the compact base64url share link to clipboard with an inline feedback toast.

---

## 12. Copy and voice guidelines (`src/copy/en.ts`)

- Sentence case throughout. Concise, natural, plain-spoken language.
- Prohibited vocabulary: "successfully", "simply", "just", "seamless", "empower", "unlock".
- No exclamation marks. No weaving puns in buttons or action labels.
- Examples:
  - "Which semester are you in?"
  - "Start with a full section"
  - "Use this"
  - "Choose again"
  - "5 of 8 chosen"
  - "Viewing a shared schedule"
  - "This schedule changed. Choose again."

---

## 13. Accessibility (WCAG 2.2 AA)

- Full keyboard support: Tab index flows through interactive spools and option cards; Escape closes sheets and modal dialogs.
- The Weave SVG features `role="img"`, an informative `aria-label`, and is mirrored by a visually hidden, screen-reader-accessible HTML schedule list.
- Dynamic polite `aria-live` region announces clash state modifications.
- Distinct textural patterns prevent reliance on color perception alone.
- Verified against 200% browser zoom and high contrast settings.

---

## 14. Phased execution plan

### Phase 1: Core foundation & verification
- Project initialization (Vite, React 18, TypeScript strict, ESLint, Prettier, Tailwind).
- Establish `src/core` (`types.ts`, `schema.ts`, `time.ts`, `options.ts`, `clash.ts`, `progress.ts`, `sharing.ts`).
- Create `public/data/manifest.json` and `public/data/semester-5.json` with Section A & B seed data.
- Implement `scripts/validate-data.ts` and `scripts/check-size.ts`.
- Achieve 100% Vitest branch coverage for `src/core`.

### Phase 2: State management, routing & data loader
- Implement `src/data/loader.ts` and safe `localStorage` cache handler with version diffing.
- Implement Zustand store (`src/state/picks.ts`) with persistence.
- Implement lightweight client router supporting `/`, `/s/:id`, and `/s/:id/share/:payload`.
- Build Onboarding flow (Semester select, Section start point) and unstyled Planner checklist.

### Phase 3: The Weave visual system & mobile split view
- Configure design tokens in `src/design/tokens.css` with dark mode support.
- Construct the single-SVG Weave component with empty hairlines, plain weave, twill clash patterns, and ghost previews.
- Build mobile split layout with draggable bottom sheet (peek, half, full snap points) and desktop two-column workspace.
- Implement Spool checklist and Option Cards with DayStrip components.

### Phase 4: Sharing, canvas export & PWA
- Build URL base64url encode/decode sharing logic and Shared Preview Banner.
- Implement text export and SVG-to-Canvas PNG image export with base64 font inlining.
- Configure PWA via `vite-plugin-pwa` (offline caching, app manifest, custom icons).

### Phase 5: Local admin tool & hardening
- Build local admin interface in `admin/` with `vite.admin.config.ts` and dev filesystem write hook.
- Run Playwright end-to-end user journeys (first run, clash trigger/clear, shared link preview/import, offline refresh).
- Run automated `@axe-core/playwright` accessibility audits.
- Verify strict bundle budgets (JS ≤ 120KB gzipped, CSS ≤ 15KB gzipped).
