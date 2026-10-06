# Loom Engineering Guidelines & Project Rules

## Core Principles
1. **Zero External Backend**: Loom is a static SPA with zero servers or databases. All persistent sharing uses URL-encoded parameters. All authoring occurs locally via `npm run admin` writing directly to `public/data/`.
2. **Textile Metaphor Integrity**: Adhere strictly to the Loom design language (`loom-design-system`). Strictly avoid template looks, purple gradients, glassmorphism, or generic icon libraries.
3. **Pure Core Logic**: Keep `src/core/` 100% free of React, DOM, or browser dependencies so it can execute in raw Node/Vitest environments. Maintain 100% test coverage.
4. **Mobile First & Responsive Discipline**: Design and verify at 360px, 768px, and 1280px. Never permit horizontal scrolling on 5-day timetables.
5. **Strict Bundle Budget**: Keep total gzipped JS under 120KB and CSS under 15KB. No third-party UI kits or icon packages. Build native accessible primitives.
6. **Decisions Log**: Whenever an implementation choice is resolved or refined, document it cleanly in `docs/decisions.md`.
