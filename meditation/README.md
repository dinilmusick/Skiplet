# Meditation: perspectives and views

The authored source is numbered Markdown chapters in this folder, one **perspective** per chapter. Each level-two `##` heading is a **view** inside that perspective. Introductory prose becomes `overview`; if there are no level-two headings, the chapter has only an Overview view.

Run `npm run generate:perspectives` to synchronize `src/generated/perspectives.json` with `src/perspectives/<chapter-slug>/Perspective.tsx` and `views/<view-slug>.tsx`. The generator creates missing starter files **without overwriting authored components**. When removing/renaming views, remove orphaned files manually before running `npm run check:constraints`.

Use the interactive carousel only for perspectives. Views are available **after entering** the selected perspective. Store shared rendering, components and utility functions under `src/libraries/`; keep concept-specific experiences in the corresponding `src/perspectives/<slug>/views/` component.
