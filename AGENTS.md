# Skiplet — binding agent contract

This repository is the **canonical private template** for all `MDT-*` Meditation exhibitions. A Meditation is the interactive React app itself, not merely a written thesis. All newly generated GitHub repositories must remain private. Do not move this UI into Floks or other libraries without explicit approval.

## Source and structure (mandatory)

- `meditation/NN-slug.md` is the authored **Meditation**. One numbered Markdown chapter equals one **perspective** on the outer 3D carousel.
- Each level-two Markdown heading within a chapter becomes one **view inside that perspective**. An introductory passage creates the `overview` view. Views must **not** be menu entries on the outer carousel.
- `src/App.tsx` is the composition/navigation root. `src/main.tsx` is the unavoidable Vite bootstrap. No other source files or CSS belong at `src/` root.
- `src/libraries/components/` owns reusable React/Three.js components, including `Carousel3D` and `3d` primitives. `src/libraries/utils/` owns reusable functions and data structures; shared CSS is under `src/libraries/styles/`.
- `src/perspectives/<chapter-slug>/Perspective.tsx` is the perspective's interior UI entry. `src/perspectives/<chapter-slug>/views/<view-slug>.tsx` contains its view components. A view can reexport `MarkdownView` or define its own interactive experience.
- `src/perspectives/content.ts` loads authored chapters; `src/perspectives/carouselAssets.ts` injects Meditation-specific meshes/background into the generic menu; `src/perspectives/index.ts` resolves perspective entries. Never import a chapter or Meditation-specific artwork from reusable `Carousel3D`.
- Do not recreate legacy `exposition/`, `src/scene/`, `src/components/`, or `src/exposition.ts`.

## Operational contract

1. Inspect `meditations.config.json` and the current authored chapters before editing. Preserve palette, truth/emotion/art tags, materials and textures.
2. After changing the number or names of chapters/views, run `npm run generate:perspectives`. This generates `src/generated/perspectives.json` and missing React `Perspective.tsx`/`views/*.tsx` files **without overwriting authored components**. On rename/removal, reconcile old files yourself.
3. Run `npm run check:constraints` (equivalent to `node scripts/skiplet.mjs check constraints`) on every change. It rejects legacy architecture, wrong source placement, missing/stale perspective/view files, orphan folders, topic-specific carousel coupling, non-palette colors, and source files over 200 lines.
4. Before merging, run `npm ci`, `npm run check`, and the browser smoke test (including WebGL-disabled fallback and direct perspective links); record exact commit and outcomes. Do not claim unrun checks passed.
5. Reuse the carousel by passing `elements` (arbitrary number, mesh factory, title, subtitle and destination) and `visuals` (base mesh, background and lighting). Double-click enters a perspective; views exist only after entering. Preserve keyboard access, reduced motion, resource disposal and 2D fallback.

No required backend, authentication or database. Use stable React/TypeScript/Vite, small modular files and reproducible lockfiles. Keep all UI colors within the declared palette. Promotion to Skipo, Floks or Kloks is separate and verified.
