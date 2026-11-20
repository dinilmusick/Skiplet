# Exposition: perspectives and views

The **canonical** chapter source is the numbered Markdown files here. Each file is a perspective; its level-two Markdown sections are views within that perspective.

```md
# 01 — Opening

Optional introductory prose becomes the Overview view.

## Your exposition

The first named camera view.

## Mathematical explanation

The second named camera view.
```

If there are no H2 sections, the chapter has one Overview view. H3 and deeper headings stay within their parent view; headings inside fenced code blocks are not views.

`README.md` is an index only. Run `skiplet generate perspectives` (or legacy `skiplet generate pages`) after changing chapter/section structure. The generator writes `src/generated/perspectives.json` in numerical order. Do not edit generated metadata manually. Body text updates that keep the same headings do not require regeneration.
