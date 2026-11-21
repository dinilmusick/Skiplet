# Skiplet — Interactive Meditations starter

A public static React + TypeScript + Three.js + Vite scaffold for artistic interactive exhibits. New MDT-* repositories produced from Skiplet must be PRIVATE. No backend, database, or authentication is required.

## Framework structure

The authored book lives in meditation/NN-slug.md. Each chapter is one Perspective; each H2 section is a View, with its component at src/perspectives/<slug>/views/<view-slug>.tsx. The root src/ contains only App.tsx and main.tsx, plus directories for generated/, libraries/, and perspectives/.

Shared libraries:
- src/libraries/components/Carousel3D/: 3D perspective menu, injected central base mesh, scene background, arbitrary item meshes, title/destination, lighting/camera and Canvas3D/2D fallback
- src/libraries/components/DirectionalCarousel3D/: arbitrary-angle swipe/wheel view carousel
- src/libraries/components/Annotated3DScene/: world-space gem landmarks, hidden text, focused camera choreography, lighting/particle/audio events and orbit controls
- src/libraries/components/3d/: portable renderer, shading, particles, geometric assets and lighting
- src/libraries/utils/audio/: reusable audio engine, spatial sound, short cues and ambient clips
- src/libraries/utils/landmarkMarkdown.ts: one landmark for each Markdown bullet, including its indented equations and images
- src/libraries/styles/: shared visual treatments

Topic-specific mesh factories, presets, text and art stay in src/perspectives/ and meditation/. The starter has a neutral sphere with placeholder sculptures, a star background, and three interior views.

## Use

npm ci
npm run generate:perspectives
npm run check:constraints
npm run check
npm run dev

The Skiplet CLI creates missing Perspective and view entrypoints without overwriting authored React components. It rejects stale generated metadata, missing or orphan view files, legacy folders, non-palette colors, source files over 200 lines, and project-specific dependencies in the outer carousel.

To open a specific view directly, use ?perspective=01-opening&view=your-exposition. Scroll or swipe to change views, orbit their 3D scenes, and select a gem to reveal annotation text. Back and keyboard controls remain accessible. Disable WebGL to exercise the software fallback.

See AGENTS.md for mandatory rules and docs/FRAMEWORK_PARITY.md for synchronization with the private Meditations implementation.
