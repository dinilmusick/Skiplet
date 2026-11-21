# Skiplet — canonical public Meditation scaffold

Skiplet is the PUBLIC template for all MDT-* interactive Meditations. Every new Meditation repository created from it must remain PRIVATE. Do not publish project-specific chapters, images, assets or secrets in the template.

## Mandatory source structure

- meditation/NN-slug.md contains authored perspectives. Each numbered chapter is exactly one outer carousel perspective; each H2 heading creates one interior view. Prose before the first H2 is Overview.
- src/App.tsx is the navigation/composition root; src/main.tsx is the bootstrap. No other source files belong in src/ root.
- src/libraries/components holds reusable React and Three.js components; src/libraries/utils contains data structures, math, audio and pure utilities; src/libraries/styles contains shared CSS.
- src/perspectives/<slug>/Perspective.tsx and views/<view-slug>.tsx own topic-specific experiences. Generated metadata lives only in src/generated/perspectives.json.
- Never recreate exposition/, src/scene/, src/components/, or src/exposition.ts.

## Reusable interactive abstractions

The outer Carousel3D accepts arbitrary elements with titles, subtitles, mesh factories and activation destinations, and injected base mesh, background, placement, camera and lighting. Double-click enters the selected perspective. Its 2D/Canvas3D fallback must remain usable.

Within a perspective, DirectionalCarousel3D moves between views along any angle, with 90 degrees vertical by default. Each entry is an Annotated3DScene with its own 3D scene, particles, lighting, audio, and an arbitrary number of gem landmarks. Text is hidden until a gem is selected, then appears directly over the visual without a panel. Generate one landmark for every Markdown bulleted line (with indented equations or pictures belonging to that line). The user must be able to orbit the scene separately from swiping the carousel; closing a landmark returns to the default scene view. Keep the icon-only controls accessible, reduced-motion-safe, and disposal-safe.

No perspective count, chapter title, artwork or private model may be hardcoded inside reusable library components. Keep the UI palette entirely defined by meditations.config.json, and authored source files to 200 lines or fewer.

## Verification workflow

1. Read meditations.config.json and existing chapter/view definitions before editing.
2. Run npm run generate:perspectives after editing chapters or H2 headings. It creates missing React entrypoints without overwriting authored components; remove obsolete files intentionally.
3. Run npm run check:constraints and npm run check to validate the CLI contract, tests, TypeScript, palette, line count and production build.
4. Run browser verification including WebGL-disabled fallback, keyboard navigation, gems and 3D orbit controls. Document any unrun checks honestly.
5. When extracting a reusable component in a Meditation, synchronize the generic libraries, tests, stack versions and lockfiles back to this template. Never copy private thesis/artwork/credentials into public Skiplet.

Use stable React, TypeScript, Vite, minimal dependencies, and no mandatory backend, authentication or database. Promotion into Floks, Kloks or Skipo is separate, explicit and verified.
