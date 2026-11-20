# Skiplet — Meditations template

Private React + TypeScript + Vite + Three.js starter for interactive, art-directed Meditations. A Meditation is an exhibition; its chapters are **perspectives**, and their sections are **views**.

## Canonical directory structure

```text
meditation/
  01-opening.md                 # chapter = perspective; ## section = view
src/
  App.tsx                       # thin composition and navigation
  main.tsx                      # Vite bootstrap
  generated/
    perspectives.json           # generated, never hand-edit
  libraries/
    components/
      Carousel3D/               # reusable, pluggable 3D carousel
      3d/                       # reusable meshes and lighting
      ChapterMarkdown.tsx
      PerspectiveNavigation.tsx
      ViewNavigation.tsx
    utils/
    styles/
  perspectives/
    content.ts                  # loads authored Meditation chapters
    carouselAssets.ts           # supplies the current visual theme
    index.ts                    # perspective registry
    PerspectiveStage.tsx        # shared interior shell
    01-opening/
      Perspective.tsx
      views/
        overview.tsx
        your-exposition.tsx
        mathematical-explanation.tsx
```

**Outer carousel:** one entry per perspective. Its base mesh (sphere by default), background, lighting, any number of element meshes, titles, subtitles and destinations are injected rather than hard-coded. Double-click a mesh or activate the accessible Enter button to enter its interior. Views are **not shown on the outer carousel**.

**Perspective interior:** `Perspective.tsx` mounts the appropriate view from its `views/` folder. Each view defaults to rendering its Markdown section but can be replaced with immersive 3D, mathematics, interaction or other React UI. Escape/Back returns to the outer carousel. Direct links use `?perspective=01-opening&view=your-exposition`.

## Generate and enforce

```bash
npm ci
npm run generate:perspectives      # manifest + missing Perspective.tsx/views/*.tsx
npm run check:constraints         # strict structure check, no dependency install required
npm run check                     # constraints + tests + typecheck + build
npm run dev
```

The CLI supports `node scripts/skiplet.mjs generate perspectives`, `generate pages` (compatibility alias), `check constraints`, and `check all`. The generator preserves authored components; after removing or renaming a chapter/view, remove obsolete entry files yourself. The check command intentionally rejects stale generated metadata, missing views, orphan perspective folders, legacy layout, more than 200 authored lines per source file, off-palette colors and perspective-specific imports in the reusable carousel.

The reusable component is under `src/libraries/components/Carousel3D/`; project-specific assets are supplied from `src/perspectives/carouselAssets.ts`. New agents must follow `AGENTS.md` and run `npm run check:constraints` before finalizing.

This template uses no compulsory authentication, backend or database, and promotion to Floks, Kloks or Skipo is never automatic. Keep generated GitHub repositories **private** and verify any release independently.
