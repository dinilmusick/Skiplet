# Skiplet agent contract

Skiplet is the ready-to-use React/TypeScript/Three.js template for Meditations. New `MDT-*` repositories must be generated private and independently verified private.

## Architecture

1. **Scene**: `src/scene/` is only the small shared stage assembly, renderer lifecycle and orbit/camera coordination. The app has one main scene.
2. **Components**: all singular reusable 2D and 3D components belong in `src/components/` (3D primitives specifically in `src/components/3d/`). Do not put component geometry or UI widgets inside the scene shell.
3. **Perspectives**: each numbered `exposition/NN-slug.md` chapter creates one perspective on the orbital carousel. The opening heading must match `# NN — Title`. Never call chapter stations "pages" in runtime UI.
4. **Views**: each H2 section (`## Title`) within the chapter creates one view of its perspective. Introductory prose before the first H2 is an Overview view; no H2s means a single Overview.
5. **Motion**: perspective changes rotate the levitating exhibit assembly anticlockwise about the sphere's Z axis; the camera stays stationary in presentation space. View changes pan/zoom camera targets within the selected perspective only.
6. **Generation**: run `skiplet generate perspectives` (older alias: `skiplet generate pages`) when chapter or section structures change. Never hand-edit `src/generated/perspectives.json` or hardcode counts/labels.

All artwork and UI colors must come from meditations.config.json palette. Preserve WebGL-unavailable 2D fallback, reduced-motion support, keyboard navigation, semantic UI, deep links, responsive layout and Three.js resource cleanup. Keep each source file to at most 200 lines. The default procedural geometry is replaceable starter artwork, not a mandatory aesthetic. No compulsory authentication, database, backend or downloaded asset.

Run `npm ci` and `npm run check` with browser interaction tests before reporting a verified release. Never claim tests passed when CI failed. Promotion to Floks/Kloks/Skipo is explicit, reviewed and independently verified, never automatic.
