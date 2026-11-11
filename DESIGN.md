---
version: alpha
name: Tasks · Grid
description: A personal to-do list set as a Swiss International Style poster.
colors:
  accent: "#D62839"
  accent-ink: "#FFFFFF"
  accent-text: "#C8202F"
  sun: "#FFC53D"
  sun-ink: "#111111"
  ink: "#111111"
  muted: "#636363"
  bg: "#FFFFFF"
  surface: "#FFFFFF"
  soft: "#F2F2F2"
  line: "#DCDCDC"
  danger: "#A4161A"
typography:
  sans:
    fontFamily: Hanken Grotesk
    fontWeight: 300 400 600 800 900
rounded:
  base: 2px
spacing:
  s1: 4px
  s2: 8px
  s3: 12px
  s4: 16px
  s5: 24px
  s6: 32px
  s7: 48px
  s8: 64px
---

# Design System: Tasks · Grid

## Overview

**Creative North Star: "The day as a Swiss poster."**

One red field states how many tasks remain, at poster scale, beside the date. Below it, a strict 12-column typographic sheet lists the tasks by when they are due. The sheet has no cards and no shadows: 3px ink rules open each group, 1px hairlines separate rows, and corners are square. The design refuses the sidebar-plus-cards shell that most to-do apps ship.

**Key Characteristics:**
- A full-bleed colour field holds navigation, the count numeral, the date and quick-add.
- A "when" rail (4 of 12 columns) labels each run of tasks: Overdue, Today, Tomorrow, a date, No date, Done.
- One type family in dramatic weights; tabular figures for every number.
- Yellow is a marker only, never a surface.

## Colors

Brand red and yellow on pure white and off-black.

### Primary
- **Field red** (#D62839): the whole top field, with white text. It follows the user's accent colour choice; the text colour is derived for 4.5:1.
- **Text-safe red** (#C8202F light, #FF5A68 dark): red text on white or grey (overdue labels, High priority).

### Secondary
- **Marker yellow** (#FFC53D, always with #111 text): the overdue count, the Today badge, search matches, selection, a completed count.

### Neutral
- **Ink** (#111111 / #F4F4F4 dark): text, rules, checks.
- **Muted** (#636363 / #A6A6A6): meta text.
- **Paper** (#FFFFFF / #0C0C0C): the sheet.
- **Soft** (#F2F2F2 / #1F1F1F): input wells and the hovered row.

### Named Rules
**The Marker Rule.** Yellow highlights a word or a count; it never fills a panel.
**The Red Text Rule.** Red text uses the text-safe red, never the field red.

## Themes

| Token | Light | Dark |
|---|---|---|
| bg | #FFFFFF | #0C0C0C |
| surface | #FFFFFF | #161616 |
| soft | #F2F2F2 | #1F1F1F |
| ink | #111111 | #F4F4F4 |
| muted | #636363 | #A6A6A6 |
| accent-text | #C8202F | #FF5A68 |

The field stays brand red in both themes.

## Typography

**Font:** Hanken Grotesk (system-ui fallback), weights 300 to 900.

### Hierarchy
- **Numeral** (900, clamp 7.5–13.5rem, line-height .8, tracking -0.04em): the remaining count; smaller for 3 and 4 digits.
- **Display** (800, clamp 2.25–3.5rem, line-height 1, tracking -0.035em): the date (h1).
- **Headline** (800, 2rem, tracking -0.03em): the view title (h2).
- **Title** (600, 1.0625rem, line-height 1.6): task titles and the "when" rail (800).
- **Body** (300–400, 1–1.1875rem): summary and empty-state text, max 44ch.
- **Meta** (600–800, .8125–.875rem): priority, dates, list names.

**The Tracking Rule.** Tracking tightens as size grows; body text stays at 0.

## Layout

12 columns on desktop (24px gutter, 40px margins, max 1240px), 4 columns on phones (16px). The count spans 4 columns, the date and quick-add 8. The top line is type only: brand at the left, views and a "Lists" button at the right; lists open as a second line. Quick-add is one line under one rule: the task, then date and priority as quiet cells, then Add. In the sheet, the "when" rail spans 4 columns and carries the view title, then each group label with its task count; the check circles align with the date above. Rows have three aligned columns: title, details, priority. The sheet opens sorted by day. On phones the rail becomes a line above each group, the view index becomes an off-canvas menu, and date and priority appear when the task line is in use.

## Elevation & Depth

The sheet is flat. Only the command palette carries a soft shadow, and the drawer a 1px ink edge.

## Shapes

Square: 2px radius on buttons and inputs, 0 on swatches and badges. Circles only for the check.

## Components

- **Rule:** 3px ink rule opens a group; inside a group a 1px hairline starts at the task column and leaves the rail clear; a red 3px rule marks a drag target.
- **Check:** 22px ink ring; done fills it with ink and draws a 2px red strike across the title, line by line.
- **Field controls:** transparent with a 1.5px current-colour border; the primary button inverts (white on red).
- **Tabs:** text with a 2px underline for the active one.

## Do's and Don'ts

- Do keep every number tabular.
- Don't add cards, rounded containers or a sidebar on desktop.
- Don't animate actions people repeat many times a day (the palette opens instantly).
- Don't use a coloured left border on rows; group with rules instead.
