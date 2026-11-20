# Skiplet — Meditations Template

A React + TypeScript + Vite + Three.js starter for spatial exhibitions. New MDT-* repositories must always be private.

## Canonical exhibition standard

**Scene → Perspectives → Views**, with reusable objects under src/components.

- **Scene**: one main 3D stage and React shell (src/scene and src/App.tsx). Scene files coordinate rendering, orbit rotation, camera targets, cleanup, and fallback, without defining the small reusable objects themselves.
- **Components**: all reusable 2D elements live in src/components; reusable Three.js objects live in src/components/3d (sphere, exhibit sculpture and lighting). They can be replaced by concept-specific exhibits.
- **Perspective**: one numbered Markdown chapter in exposition/; each perspective is a station on the rotating sphere, not a separate React route.
- **View**: each level-two Markdown section (## Heading) defines one camera view inside its perspective. An introductory paragraph becomes an Overview view. With no sections, the entire chapter becomes one Overview view.

The orbit rotates anticlockwise around the Z axis for next-perspective navigation, carrying levitating exhibits. The camera stays at its presentation station while the sphere turns, and the exhibits stay upright. Changing *views* pans and gently zooms the camera without changing the sphere's rotation.

## File organization

```text
exposition/
  01-opening.md
  02-context.md
  README.md
src/
  components/
    ChapterMarkdown.tsx
    PerspectiveNavigation.tsx
    ViewNavigation.tsx
    3d/
      OrbitSphere.ts
      ExhibitSculpture.ts
      SceneLighting.ts
  scene/
    ExhibitionCanvas.tsx
    createExhibitionScene.ts
    orbitMath.ts
  exposition.ts
  generated/perspectives.json
  App.tsx
```

Markdown chapters use the first line as the title, e.g. `# 01 — Opening`. Every `## Section title` becomes a separate view. The optional exposition README is an index only. Numbers must be unique and consecutive. Do not maintain a manual carousel page list.

## Generation and verification

```bash
npm ci
npm run generate:perspectives
npm run check:constraints  # source/layout/manifest invariants, no dependencies required
npm run check              # constraints + tests + TypeScript + production build
npm run dev
```

To enforce all source constraints via the CLI use `skiplet check constraints` (CI-friendly, nonzero exit on violations); use `skiplet check all` to run constraints, tests, typecheck and build.\n\nThe canonical CLI command is `skiplet generate perspectives`. The older `skiplet generate pages` remains a compatible alias and writes the **same** `src/generated/perspectives.json` registry. Run generation after adding/removing/renaming chapters or changing their section structure. Editing paragraph text alone does not require regeneration. `npm run check:pages` verifies the manifest is current.

Navigation: left/right arrow keys and perspective tabs change perspectives; up/down arrows and view tabs navigate inside a perspective. Deep links use `?perspective=01-opening&view=your-exposition`, and old `?chapter=01-opening` URLs remain readable. Browser history navigation is supported.

The starter scene uses procedural geometry so model assets are optional. The rendering lifecycle supports reduced motion, WebGL unavailability, resizing and resource cleanup. All colors are derived from meditations.config.json. Each authored source file is limited to 200 lines. Run `npm run check` for tests, typechecking, palette and config validation and production build; CI also runs the browser fallback smoke test. No required backend, authentication, or database.

See AGENTS.md for constraints and reusable-asset promotion rules.
