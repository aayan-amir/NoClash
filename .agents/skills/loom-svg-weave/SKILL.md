---
name: loom-svg-weave
description: Guidelines and recipes for building the SVG-based weekly Weave grid, dynamic textures, clash rendering, ghost previews, and canvas export.
---

# Loom SVG Weave Grid & Export Specification

## 1. Grid Architecture (Single-SVG Rendering)
- Render the weekly grid as a single cohesive SVG inside a responsive viewport container.
- Columns correspond to days (Mon–Fri, plus Sat/Sun if provided).
- Rows correspond to timetable periods (e.g., 12 periods).
- Fixed time rail on the left (40px) displaying period numbers and start times.
- Cell height: 44px on mobile, 56px on desktop.

## 2. Textures and Defs (`<defs>`)
Define all patterns once within `<defs>` and reuse via `fill="url(#pattern-id)"`:
1. **`#warp-weft-empty`**: Faint crossing hairlines in `--rule` on `--ground` background.
2. **`#plain-weave`**: Subtle 4x4 matrix representing interlaced warp & weft threads.
3. **`#twill-clash`**: Diagonal 45-degree interlaced twill pattern combining contrasting thread colors and a knot glyph to represent conflicts without relying on color alone.
4. **`#ghost-thread`**: 1.5px dashed outline stroke with transparent fill for previewing candidates on tap/hover.

## 3. Responsive Column Constraints & Narrow Viewports (<360px)
At 360px width:
- Total width = 360px.
- Left time rail = 40px. Remaining = 320px across 5 days = 64px per column.
- Display hierarchy:
  - Default (≥768px): Full short name + Teacher + Room (e.g., `CompNet • Lal • L1`).
  - Mobile (360px–767px): Short display code + Teacher (e.g., `CompNet\nLal`).
  - Ultra-narrow (<360px): 2–3 letter uppercase code (e.g., `CN`, `WE`, `CC`) or solid woven block with label revealed in bottom preview sheet.
- Never trigger horizontal scrolling for standard 5-day schedules. Only introduce horizontal scrolling if the semester contains 6 or 7 active days.

## 4. Multi-Period Slots
- If a class occupies consecutive periods (e.g., periods 7–9), render as **one continuous SVG rectangle**, never multiple fractured cells.
- Label bar sits inside the continuous rectangle with an opaque background plate to guarantee text legibility.

## 5. Ghost Previews and Clash State
- **Candidate Selection**: When an option is previewed (touch tap on mobile, hover on desktop):
  - Render candidate as a ghost dashed outline (`stroke-dasharray="4,2"`).
  - If the candidate overlaps an existing pick:
    - Overlay the `#twill-clash` texture on the intersecting period cells.
    - Render a small knot glyph at the center of the conflict.
    - Show an explicit one-line conflict summary in the option card: `"{A} overlaps {B} on {Day}, {start} to {end}"`.

## 6. High-Fidelity Image Export (SVG → Canvas → PNG)
- Output size: 1080px wide, dynamic height based on period count.
- **Font Embedding**: Web fonts must be converted to base64 Data URIs and injected as `@font-face` within the SVG `<style>` tag prior to rasterization, ensuring offline rendering fidelity.
- Background uses `--ground`, including the subtle border rules, full timetable title, semester label, thread legend with color swatches, and a quiet discreet footer watermark ("Loom").
