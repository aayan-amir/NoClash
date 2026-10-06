# Architectural & Product Decisions Log

This document records architectural, design, and product decisions for **NoClash**, with context and justification.

---

### D1. Product Name: NoClash
- **Choice:** Rebranded from working title "Loom" to "NoClash".
- **Rationale:** Directly addresses the primary problem and question students have during registration ("Will these classes clash?"). It is punchy, memorable, student-centric, and communicates zero-conflict timetable composition in one second.

### D2. Zero External Backend & Database
- **Choice:** Pure static Single Page Application with URL-encoded parameters for sharing and local offline filesystem authoring via `npm run admin`.
- **Rationale:** Guarantees zero server operational cost, infinite scalability on free static hosting (Render/GitHub Pages), 100% privacy (no user tracking or server-stored schedules), and instant response times without cold starts.

### D3. URL-Encoded Sharing with Non-Destructive Preview Mode
- **Choice:** Schedules encode selections into compact Base64URL strings (`/s/5/share/<payload>`). Recipients view the schedule in a non-destructive "Shared Preview Mode" with explicit action buttons (`[Use this schedule]` vs `[Keep my schedule]`).
- **Rationale:** Ensures recipients never accidentally overwrite their own carefully composed timetable by clicking a friend's link, while keeping URLs under 100 characters.

### D4. Mobile Split Layout (Persistent Grid + Draggable Sheet)
- **Choice:** Top 45% sticky viewport for the SVG timetable grid; bottom 55% draggable sheet with three snap points (Peek, Half, Full).
- **Rationale:** Resolves the screen real-estate challenge on small phones (320px–360px). Allows students to scroll options while keeping the timetable in view so real-time ghost previews and clash feedback remain visible.

### D5. Display Face Selection: Albert Sans
- **Choice:** Albert Sans paired with Atkinson Hyperlegible for body/UI.
- **Rationale:** Geometric, modern, friendly sans-serif with distinct personality that avoids the banned generic typography list (Inter, Roboto, Space Grotesk, DM Sans, etc.), while remaining lightweight and cleanly subsettable.

### D6. Seed Data: Semester 5 (Computer Systems & Software Engineering)
- **Choice:** Seeded with 5th Semester containing 8 components (CompNet Th/Lab, WebEng Th/Lab, Compiler Construction, Enterprise Systems, Probability & Statistics, Technical Report Writing).
- **Rationale:** Directly matches the real university department timetable data provided by the user, providing an authentic test fixture and immediate production readiness.

### D7. Zero-Vulnerability Security & Tailwind CSS v4 Engine
- **Choice:** Upgraded from Tailwind CSS v3 to Tailwind CSS v4 (`@tailwindcss/vite` and `tailwindcss@4.3.3`) and Vite 6 / Vitest 4.
- **Rationale:** Completely eliminated legacy vulnerabilities from Tailwind v3's nested dependency tree (`chokidar`, `micromatch`, `braces`, `tinypool`), achieving `0 vulnerabilities` on `npm audit`. Simultaneously reduced gzipped CSS bundle size to 6.4 KB (well within the 15 KB budget) and boosted build speeds.

### D8. Horizontal Grid Orientation (Time on X-Axis, Days on Y-Axis)
- **Choice:** Structured the SVG Weave grid and standalone Canvas exporter with Periods (1 to 12) along the horizontal X-axis and Weekdays (Mon to Fri) along the vertical Y-axis.
- **Rationale:** Directly mirrors the university's official schedule format and student mental model at SSUET Karachi. Multi-period sessions (e.g. 3-period lab slots) expand horizontally across period rails while preserving clean day-by-day vertical stacking.

### D9. XML-Safe SVG Canvas Export & Vector Fallback
- **Choice:** Added comprehensive XML character entity escaping (`escapeXml`) for all dynamic strings in SVG generation, switched browser image loading to UTF-8 Data URIs (`data:image/svg+xml;charset=utf-8,...`), and added automatic high-res `.svg` vector download fallback if HTML5 Canvas rasterization encounters platform quirks.
- **Rationale:** Browsers reject SVG images during `new Image().src = ...` rendering if dynamic text (e.g., department name "Faculty of Computing & Applied Sciences" or course "Probability & Statistics") contains unescaped ampersands (`&`) or XML entities. Pre-sanitizing and offering vector fallback guarantees high-definition timetable saving across all mobile and desktop browsers.

### D10. Mobile Landscape PC/Monitor View & Side-by-Side Spools
- **Choice:** Optimized the mobile experience into two distinct orientation states:
  1. **Portrait Mode:** Bottom sheet initializes in a slim 46px peek state with quick expand/collapse chevrons and drag gestures, preventing it from blocking the timetable. An orientation guidance banner encourages users to rotate their phone horizontally for the full desktop layout (`Tip: Rotate phone horizontally for the full timetable view`).
  2. **Landscape Mode:** The bottom sheet is completely hidden (`landscape:hidden`), bottom padding is removed, and the SVG timetable chart renders on the left (`flex-1`) while the Course Spools sidebar renders on the right (`hidden landscape:flex lg:flex w-72 sm:w-80 lg:w-96`), exactly mirroring the desktop PC layout side-by-side with zero manual toggling required.
- **Rationale:** Mobile phones in landscape have aspect ratios (~2.2:1) that almost identically match the 12-period horizontal timetable (2.6:1). Allowing mobile landscape to adopt the desktop PC layout eliminates vertical and horizontal scroll friction, providing an authentic full-screen monitor view.

### D11. Ultra-Compact Mobile Header & Navbar
- **Choice:** Reduced the vertical footprint of the top navigation bar, orientation tip, and weave sub-bar on mobile phones from ~54px down to ~32px via responsive padding (`py-1 sm:py-2.5`), compact title typography (`text-base sm:text-xl`), smaller badge sizing, and scaled icon buttons (`p-1 sm:p-2`, `size={14}`).
- **Rationale:** Mobile devices—particularly in landscape orientation where total viewport height is only 360px–420px—cannot afford bulky 50px+ headers. Shaving ~22px off the top bar increases effective timetable chart visibility by over 10-15%, ensuring immediate clarity and room for period columns.

### D12. Elimination of Flex Centering Scroll Cutoff (Periods 1 & 2 Left Clipping)
- **Choice:** Decoupled the 2D scroll container (`overflow-x-auto overflow-y-auto overscroll-contain`) from CSS Flexbox centering (`justify-center`). Placed a non-negative block wrapper (`min-w-[620px] w-full min-h-full`) inside, with SVG `preserveAspectRatio="xMinYMid meet"` and left alignment on mobile.
- **Rationale:** When an element with `overflow-x: auto` also uses `display: flex; justify-content: center;`, any child wider than the viewport is centered, pushing its start (left ~130px containing the Day rail and Periods 1 & 2) into negative coordinate space (`x < 0`). Because browser scroll models only permit non-negative `scrollLeft >= 0`, users on mobile devices were permanently blocked from viewing or scrolling left to Periods 1 and 2. The block wrapper guarantees `scrollLeft = 0` aligns with the true origin (Day rail and Period 1), enabling frictionless left/right panning without data loss.

### D13. Production Deployment Target: Vercel Static Edge
- **Choice:** Deployed as a static SPA on Vercel with SPA routing rewrite (`vercel.json`), eliminating server dyno operational costs and providing automatic worldwide SSL and edge caching.
- **Rationale:** NoClash requires no server runtime or database. Vercel delivers <100ms global response times with automatic build previews and zero-cost hosting.

