---
name: loom-component-patterns
description: Component architecture and interaction patterns for Loom, including the mobile Apple Maps split layout, draggable bottom sheet, spool chips, and native accessible primitives.
---

# Loom Component Patterns & Layout Architecture

## 1. Mobile Split View (Apple Maps Paradigm)
On mobile (<768px):
- **Top Viewport (Persistent Weave)**:
  - Takes 40–50% of the screen height.
  - Houses the single SVG weekly grid.
  - Never scrolls away during option browsing so the user sees real-time ghost previews and clash indicators.
- **Bottom Draggable Sheet**:
  - Three snap points:
    - **Peek (~15% height)**: Displays summary status ("5 of 8 chosen", clash badge if any, quick expand handle).
    - **Half (~50% height)**: Displays the Spool Checklist (scrollable list of components).
    - **Full (~85% height)**: Displays the active component's Option Cards for direct selection and comparison.
  - Supports swipe/drag gestures and backdrop dismiss.

## 2. Desktop & Tablet Layout (≥768px, ≥1024px)
- **Tablet (768px – 1023px)**:
  - Weave expands to 56px period row heights.
  - Draggable bottom sheet transitions to a bottom docked panel with generous touch targets.
- **Desktop (≥1024px)**:
  - Full two-column split layout:
    - Left column: The Weave SVG grid (takes flexible remaining width, clean border separation).
    - Right column (fixed 360–400px): Spool Checklist and active Option Cards panel.
  - Hovering an option card on desktop instantly renders the ghost thread on the grid; clicking commits the selection.

## 3. Spool Checklist Component
- Each required component renders as an SVG **Spool**:
  - **Empty Spool**: Thread bobbin outline with component label.
  - **Wound Spool**: Bobbin filled with the assigned natural-dye thread color, showing chosen section badge and teacher name.
  - **Attention Spool**: Warns of missing/modified classes if timetable data was updated.
- Ordering: Stable ordering based on day-of-week of the component's earliest session, breaking ties by data array index. Never jump or reorder as items are selected.

## 4. Option Cards
Each card represents one section's complete offering for that component:
- Header: Section name (e.g., Section A) and Teacher(s).
- Day strip: Micro Mon–Fri horizontal badge showing active meeting days.
- Time range: Earliest start to latest finish (e.g., `08:00 – 12:10`).
- Clash warning: Inline alert showing exact conflict and affected partner course.
- Action: "Use this" button (or "Selected" state indicator).

## 5. Native Accessible UI Primitives
No external component libraries (no Radix, no MUI, no shadcn):
- Modals & dialogs: Native `<dialog>` element with `.showModal()`, handling Escape and backdrop clicks.
- Toasts: Bottom-center fixed position, 4000ms auto-dismiss, limit 1 active toast at a time (e.g., "Copied to clipboard").
- Forms & Controls: Native semantic tags with explicit `:focus-visible` styling (2px solid `--ink`, 2px offset).
- Touch Targets: Enforce minimum 44px x 44px hit areas on all interactive touchpoints.
