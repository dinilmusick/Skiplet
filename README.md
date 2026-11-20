# Skiplet — Meditations Template

A ready-to-edit **React + TypeScript + Vite + Three.js** starting point for spatial, interactive exhibitions. New meditation repositories are named `MDT-<Concept>` and must be private.

## What a new repository displays

Open the app and see the first numbered Markdown chapter as a page in the responsive exhibition carousel, over an illuminated **procedural 3D sculpture**. No model files, textures, proprietary assets, authentication, backend or database are needed to boot. The sculpture is **starter art**, not an exhibit thesis; replace it with the meditation's own interaction and art direction.

The displayed title, concept, document title, and palette come from `meditations.config.json`. Set `id`, `title` and `concept` when creating a new project. Set truth, emotion and art tags, explicit color scheme, materials and textures before producing exhibition-specific art.

## Architecture

- `src/main.tsx` — React root only.
- `src/App.tsx` — semantic, accessible chapter carousel, deep links and non-WebGL fallback.
- `src/scene/ExhibitionCanvas.tsx` — Three.js renderer lifecycle, resize, cleanup, WebGL failure and reduced-motion handling.
- `src/scene/createStarterScene.ts` — replaceable procedural scene with palette-based lighting and geometry.
- `src/style.css` — responsive, palette-derived exhibition layout.
- `meditations.config.json` — single canonical title/art-direction/palette source.

Every authored source file must remain **at most 200 lines**. All visible UI/scene colors must be derived from the configured palette. The React scene can be replaced or extended without modifying the React root.

## Start and validate

```bash
npm ci
npm run dev
npm run check
```

`npm run check` validates file lengths, palette, configuration, TypeScript, and a production build. The committed npm lockfile makes installs deterministic on Node.js 22. The Vite dev server listens on port 3000; when an external hosted preview needs a custom hostname, configure Vite's allowed host for that environment rather than globally disabling host checks. The first load needs WebGL for the 3D sculpture; on failure, the same title page remains available with a CSS-only illustration. Reduced-motion users receive a static 3D frame.

This starter uses modern browser-native APIs, with no mandatory network calls at runtime. Follow `AGENTS.md` for coding and art-direction boundaries. Reusable components/services may later be reviewed for promotion into Floks/Kloks/Skipo; nothing is promoted automatically.

**Template safety:** Configure GitHub's template setting on `Skiplet`. When generating `MDT-*` projects, ensure **private** repository visibility. Do not copy exposition, assets, or project-specific geometry from another meditation.

## Canonical exposition and page generation

There is exactly one canonical `exposition/` directory. Each numbered `NN-slug.md` document becomes **one** main-UI carousel page; `exposition/README.md` is an optional index, not a page. Do not maintain a second manual page registry.

Every numbered file must start with its chapter number and title:

```md
# 01 — Opening

Your exposition goes here.
```

Chapter numbers must start at 01, be unique and consecutive. Names must begin with a two-or-more-digit prefix and a kebab-case slug. Titles come from the first Markdown heading, never from hardcoded React labels. Chapter pages appear in numerical order regardless of filesystem order.

From the repository root, run either:

```bash
npm run generate:pages
# Equivalent with the CLI installed or linked:
skiplet generate pages
# Validate that the committed registry is current:
npm run check:pages
```

The generator rewrites **only** `src/generated/pages.json`. The React app reads that index and imports chapter Markdown via Vite's raw file glob. Add, rename or delete chapter files, then rerun generation: the carousel gains, reorders or removes pages deterministically. The build check fails if chapter files and the generated index disagree. Changing Markdown body text alone does not require regeneration, because Vite imports the source content.

Chapter navigation supports previous/next, chapter tabs, keyboard arrows, Markdown links to other chapters, and deep links via `?chapter=NN-slug`. Without Markdown chapters, the app shows an accessible empty state rather than inventing pages. Chapter-specific 3D artwork is optional and may be layered on the stage separately; it **never** controls the page count.

The built-in lightweight Markdown display supports headings, paragraphs, basic emphasis and links, lists, blockquotes and fenced code. It treats raw HTML as text; advanced extensions such as mathematical typesetting are not part of the starter renderer. The generator adds no runtime dependencies.
