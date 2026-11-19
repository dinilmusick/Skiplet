# Skiplet — Meditations Template

A ready-to-edit **React + TypeScript + Vite + Three.js** starting point for spatial, interactive exhibitions. New meditation repositories are named `MDT-<Concept>` and must be private.

## What a new repository displays

Open the app and immediately see a responsive exhibition stage with an illuminated **procedural 3D sculpture**, stars, title, concept and editorial framing. No model files, textures, proprietary assets, authentication, backend or database are needed to boot. The sculpture is **starter art**, not an exhibit thesis; replace it with the meditation's own interaction and art direction.

The displayed title, concept, document title, and palette come from `meditations.config.json`. Set `id`, `title` and `concept` when creating a new project. Set truth, emotion and art tags, explicit color scheme, materials and textures before producing exhibition-specific art.

## Architecture

- `src/main.tsx` — React root only.
- `src/App.tsx` — semantic, accessible starter title page and non-WebGL fallback.
- `src/scene/ExhibitionCanvas.tsx` — Three.js renderer lifecycle, resize, cleanup, WebGL failure and reduced-motion handling.
- `src/scene/createStarterScene.ts` — replaceable procedural scene with palette-based lighting and geometry.
- `src/style.css` — responsive, palette-derived exhibition layout.
- `meditations.config.json` — single canonical title/art-direction/palette source.

Every authored source file must remain **at most 200 lines**. All visible UI/scene colors must be derived from the configured palette. The React scene can be replaced or extended without modifying the React root.

## Start and validate

```bash
npm install
npm run dev
npm run check
```

`npm run check` validates file lengths, palette, configuration, TypeScript, and a production build. The first load needs WebGL for the 3D sculpture; on failure, the same title page remains available with a CSS-only illustration. Reduced-motion users receive a static 3D frame.

This starter uses modern browser-native APIs, with no mandatory network calls at runtime. Follow `AGENTS.md` for coding and art-direction boundaries. Reusable components/services may later be reviewed for promotion into Floks/Kloks/Skipo; nothing is promoted automatically.

**Template safety:** Configure GitHub's template setting on `Skiplet`. When generating `MDT-*` projects, ensure **private** repository visibility. Do not copy exposition, assets, or project-specific geometry from another meditation.
