# Framework parity: public Skiplet and private MDT-Compression-is-Intelligence

Skiplet is the public scaffold; dinilmusick/MDT-Compression-is-Intelligence is a private authored exhibit. Their portable library components under src/libraries/ should remain identical wherever a module exists in both repos. Different authored chapters, artistic textures, scene-specific presets and app composition under src/perspectives/ are expected.

Synchronized generic modules:
- Carousel3D, Canvas2DFallback, CarouselHud, starfield, camera, pointer and wheel input, ray picking, rendering and arbitrary-element contracts.
- DirectionalCarousel3D, directional vectors and swipe mathematics.
- Annotated3DScene, landmark types, focus cameras, navigation, particles and lighting/audio event coordination.
- Canvas3DRenderer, Canvas3D projector/shading, reusable mesh/glyph generators, sphere world with injected configuration, procedural particles and stage lighting.
- ChapterMarkdown, ViewNavigation, optional AudioToggleButton.
- Reusable audio engine, cues, ambient/long clips, spatial audio, landmark Markdown parsing, interaction events and palette helpers.

Both projects pin React 19, React DOM 19, Three.js 0.187, @types/three 0.187, Vite 6, and TypeScript 5 by equivalent package specs and resolved lockfile dependencies. Different project names, version fields and palette values are intentional.

Verification when both checkouts are available:
1. Run npm ci then npm run check in each checkout.
2. Run bash scripts/smoke-browser.sh in Skiplet to verify the normal and WebGL-disabled interior.
3. Compare corresponding generic src/libraries paths by blob hash, and compare their dependency specifications and resolved lock versions.
4. Ensure no module in src/libraries imports a project perspective, a private asset, or private authored chapters.
5. Record both exact commit SHAs; do not claim parity for untested downstream use.

Do not expose copyrighted/private art, authored monolith text, thesis chapters or credentials in the public template. Framework promotions into other libraries require separate approval.

## Hydrogen review integration

The fixes documented by the private Meditation's docs/CODE_REVIEW_HYDROGEN.md are reflected upstream. Vite deduplicates react/react-dom and prebundles react, react-dom/client, both JSX runtimes and three to avoid the invalid-hook-call/stale-hash incident. Default HMR is disabled; when a developer knows their WebSocket transport is stable, opt in with `npm run dev -- --mode dev-hmr`. Do not globally allow untrusted hosts. The generic annotated root receives non-passive wheel listeners while its parent carousel locks navigation during an open landmark. Scrollable text retains wheel events, landmark switching keeps the camera rig mounted and moves directly between poses, and software rendering is throttled. Timer calculations use performance.now, not deprecated THREE.Clock. The shared bare icon/audio control styles live in src/libraries/styles/controls.css.
