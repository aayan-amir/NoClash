---
name: loom-design-system
description: Design system guidelines for Loom. Enforces the woven cloth metaphor, textile color tokens, Atkinson Hyperlegible typography, WCAG AA contrast rules, and prevents generic template aesthetics.
---

# Loom Design System & Visual Identity

## 1. The Core Metaphor: The Week is Woven Cloth
- **Warp (Vertical)**: Days of the week.
- **Weft (Horizontal)**: Periods across time.
- **Threads**: Subject components, each bound to a specific natural dye color.
- **Spools**: Component checklist selectors in the panel/sheet.
- **Clashes**: Two threads conflicting over the same warp/weft cell, rendered via twill diagonal weave texture and knot glyphs.

## 2. Hard Anti-Patterns (Banned AI/Template Aesthetics)
Never introduce:
- Purple/blue ambient glow, gradients, or heavy radial backgrounds
- Glassmorphism, backdrop-blur overlays, pillowy cards with diffuse drop shadows
- All-caps tracked-out section labels or decorative middle dots (`•`)
- Generic icon libraries (Lucide, Heroicons, FontAwesome) or emojis as UI icons
- Template fonts: Inter, Roboto, Space Grotesk, Fraunces, Playfair, Geist, DM Sans
- Floating celebration animations or confetti on completion

## 3. Typography & Token Standards
- **Body / Interface**: Atkinson Hyperlegible Next (or Atkinson Hyperlegible), 400 & 600 weight. Minimum mobile body 16px.
- **Display**: One characterful, open-license face (e.g., Albert Sans or Familjen Grotesk), used in sentence case.
- **Base Grid**: 4px base increment (4, 8, 12, 16, 24, 32, 48px).
- **Radii**:
  - Thread blocks: `2px` (crisply sheared fabric look).
  - Sheets & modals: `8px`.
  - Badges & chips: `999px`.
- **Elevation**: Flat surfaces with hairline rules (`--rule`), background tone shifts (`--ground` vs `--ground-sunk`), no box shadows.

## 4. Color Tokens (CSS Custom Properties)
```css
:root {
  --ground: #F3F3EF;       /* Bleached cotton */
  --ground-sunk: #E7E7E1;  /* Recessed areas */
  --ink: #1B1D22;          /* Deep dye ink */
  --ink-soft: #4A4E57;     /* Secondary text */
  --rule: #CFCFC7;         /* Loom reed separator */
  --clash: #B3261E;        /* Conflict alert */
}

[data-theme="dark"] {
  --ground: #151A30;       /* Indigo vat */
  --ground-sunk: #101426;
  --ink: #ECEDF2;
  --ink-soft: #A3A7B8;
  --rule: #2C3352;
  --clash: #FF6B6B;
}
```

Natural-dye thread colors:
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

*Note: Any text superimposed on thread colors must dynamically evaluate contrast to maintain ≥4.5:1 against either `#1B1D22` or `#FFFFFF`.*
