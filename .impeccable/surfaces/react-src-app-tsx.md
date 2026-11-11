---
version: 1
slug: "react-src-app-tsx"
primary_target: "react/src/App.tsx"
related_targets: ["react/src/index.css"]
---

Scope: main app screen (React app, react/src). Visitor mode: operate.
Audience and job: one person, short bursts many times a day; see what is due, add in one line, tick off, undo.

## Direction contract
THESIS: The day as a Swiss poster: one red field states how many tasks remain, and a strict 12-column typographic sheet below lists them by when. Refuses the sidebar + card list shell every to-do app ships.
OWN-WORLD: Brand red #D62839 field (accent-driven), white/off-black sheet, yellow #FFC53D only as a marker (overdue count, today rail, search match). One superfamily, Hanken Grotesk, 300 to 900; tabular figures. 3px ink rules open each day group, 1px hairlines between rows, square corners, no shadows on the sheet.
STORY: The visitor reads the count and the date first, knows if anything slipped, adds a task in the field, works down the sheet, ticks tasks off and sees a red strike bar.
FIRST VIEWPORT: Top bar in the field: brand, view tabs (All, Today, Upcoming, Overdue), lists row, Commands, theme. Left 4 columns: the remaining count at poster scale. Right 8 columns: weekday and date (h1), summary line, quick-add with date, priority and Add. Below the field: toolbar (filter tabs, search, sort) and the sheet rows with a 3-column "when" rail.
FORM: Swiss International Style poster, list position 2, IMPECCABLE'S PICK. seed:4af622db1776e5dc
Signature interaction: the count re-sets with a short vertical roll when it changes; finishing a task draws a red strike bar across its title.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
