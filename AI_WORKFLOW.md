# How I built this with AI

This project was built with AI assistance (Claude). This doc shows how I directed it and what I did to make sure the result actually works.

## 1. Starting prompt
> _Paste your real first prompt here, including the assignment text you gave it._

## 2. How I steered it
- Decision: _e.g. "Started with vanilla JS, then asked for a React + TypeScript version once I saw the job needed it."_
- Decision: _e.g. "Asked for the state logic to be a pure reducer so it could be unit tested."_
- Follow-up prompts that changed the output: _list 2-3 real ones._

## 3. What I verified myself
Not trusting a single pass from the AI:
- [ ] Ran `npm test` and read the tests, to check they assert real behaviour and aren't just passing
- [ ] Ran `npm run build` and fixed type errors
- [ ] Manually tested: add, edit, delete, filter, refresh persistence, empty input, very long input
- [ ] Tried to break it: _what did you try?_

## 4. Bugs and problems I found
| Problem | How I found it | How it was fixed |
|---|---|---|
| _real bug 1_ | _e.g. browser console, failing test_ | _prompt or manual fix_ |
| _real bug 2_ | | |

## 5. What I changed by hand
_Anything you edited yourself rather than prompting: styling, copy, logic._

## 6. What I'd do differently
_One or two honest points._

## Claude enhancement pass (Claude Fable 5.2)
A second AI pass over the finished app, run in Claude Code. It diagnosed first, then fixed. This section is a factual record of that pass. Sections 1 to 6 above are still mine to fill in.

**What it did**
- Upgraded React 18 → 19.3, Vite 5 → 8.3, Vitest 2 → 5.1, TypeScript 5.5 → 7.0, `@vitejs/plugin-react` 4 → 6.3, and the CI workflow to Node 26 LTS, `npm ci`, and the latest actions.
- Replaced the indigo palette with the red + yellow brand in both versions, and added `npm run contrast` (60 token pairs, all pass WCAG AA). Lists are told apart by a grey monogram (red for the active list) instead of extra colours.
- Fixed the bugs below. Tests went from 25 to 140. The new tests were written first and run against the old code: 68 of them failed, and one file could not load because its modules did not exist yet.
- Checked the production build in a real browser with Playwright (light and dark, 1280px and 375px).

**Bugs found and fixed**

| # | Problem | Where | Fix | Test |
|---|---|---|---|---|
| 1 | Un-completing a recurring task left its next occurrence behind (two active copies) | `reducer.ts` | The completed task records the id it spawned; undoing removes that occurrence unless it is already done | `reducer.test.ts`, `App.test.tsx` |
| 2 | Monthly repeats drifted for good: Jan 31 → Feb 28 → Mar 28 | `dates.ts`, `reducer.ts` | The series keeps its original day (`repeatDay`) and clamps per month: Feb 28 → Mar 31 | `dates.test.ts`, `reducer.test.ts` |
| 3 | Completing an overdue recurring task created another overdue one | `dates.ts` | `nextDueFrom` skips occurrences that are already in the past | `dates.test.ts`, `reducer.test.ts` |
| 4 | Junk in localStorage (`[null]`, wrong types) crashed the app on load | `storage.ts` | Stored tasks and lists are rebuilt field by field; unusable entries are skipped | `storage.test.ts`, `App.test.tsx` |
| 5 | JSON import spread unvalidated fields: a numeric `dueDate` or non-array `subtasks` crashed rendering; duplicate ids and dangling list ids passed through | `storage.ts` | Import uses the same sanitiser, removes duplicate ids, and unassigns lists that do not exist | `storage.test.ts` |
| 6 | Importing a backup with zero lists brought the default lists back | `storage.ts`, `App.tsx` | Defaults are used only when the `lists` key is missing | `storage.test.ts` |
| 7 | Quick add read "tomorrow" inside a phrase ("Plan tomorrow's meeting") as a due date | `quickadd.ts` | Date words must be standalone; the last one wins | `quickadd.test.ts` |
| 8 | Quick add removed only the first `!priority` and ignored `!medium` | `quickadd.ts` | All priority tokens are removed, the last wins, `!medium` is accepted | `quickadd.test.ts` |
| 9 | Years 0–99 became 19xx, and invalid dates rendered "Invalid Date" | `dates.ts` | Strict `parseISO`; dates are built with `setFullYear` | `dates.test.ts` |
| 10 | A finished task that had been late still said "12 days overdue" | `dates.ts` | Done tasks show the plain date | `dates.test.ts`, `components.test.tsx` |
| 11 | Today/Overdue, the header date and the greeting went stale when the tab stayed open past midnight | `App.tsx` | `useClock` re-checks every 30s and when the tab regains focus | `App.test.tsx` |
| 12 | Escape in the command palette also closed the drawer underneath | `Drawer.tsx`, `Palette.tsx` | Dialogs share a stack; only the top one handles Escape | `components.test.tsx` |
| 13 | `n` and `/` shortcuts moved focus behind an open dialog | `App.tsx` | Single-key shortcuts are ignored while a dialog is open | `App.test.tsx` |
| 14 | Drawer title was lost when closing with Escape; Enter did nothing | `Drawer.tsx` | Every way of closing saves the title first; Enter saves | `components.test.tsx` |
| 15 | Focus was lost after an inline edit | `TaskItem.tsx` | Focus returns to the task title; an edit is finished exactly once | `components.test.tsx` |
| 16 | Keyboard reorder dropped focus when moving down, worked only from the title, and failed silently when sorted | `App.tsx`, `TaskItem.tsx` | Focus is restored after the move, the shortcut works from the whole row, and the result is announced | `App.test.tsx`, `components.test.tsx` |
| 17 | Drop highlight flickered over child elements, and any dragged text or file counted as a task | `TaskItem.tsx` | Enter/leave counter and a private drag type | `components.test.tsx` |
| 18 | A task added in Today, Upcoming or Overdue did not appear there | `App.tsx`, `views.ts` | Today gives it today's date; otherwise the view switches to All tasks | `views.test.ts`, `App.test.tsx` |
| 19 | "Clear completed" could not be undone | `App.tsx` | It shares the undo toast and restores tasks to their old positions | `reducer.test.ts`, `App.test.tsx` |
| 20 | Custom accents always used white text (2.3:1 on orange); the stored accent was applied unvalidated | `App.tsx`, `color.ts` | Ink is derived from the accent's luminance; only hex colours are accepted | `color.test.ts`, `App.test.tsx` |
| 21 | Dark-mode users saw a light flash on load | `index.html` | The theme is set by an inline script before first paint | Checked in the browser |
| 22 | Notes textarea rendered in monospace | `index.css` | `textarea` added to the font reset | Checked in screenshots |
| 23 | Lists could not be deleted on mobile | `index.css` | The delete button is always visible on touch screens | Checked in screenshots |
| 24 | Repeat could be set without a due date and showed a "Repeats" label that did nothing | `Drawer.tsx`, `reducer.ts` | The select is disabled without a date; removing the date removes the repeat | `reducer.test.ts`, `components.test.tsx` |
| 25 | `crypto.randomUUID()` had no fallback outside secure contexts | `uid.ts`, `vanilla/script.js` | Fallback id generator | `views.test.ts`, `vanilla.test.ts` |
| 26 | Vanilla: junk in localStorage crashed `render()` | `vanilla/script.js` | Entries are validated on load | `vanilla.test.ts` |
| 27 | Vanilla: every change rebuilt the list and dropped keyboard focus | `vanilla/script.js` | Focus is restored to the same control, or the nearest task | `vanilla.test.ts` |
| 28 | Vanilla: `required` hid the custom error message, and the error never cleared | `vanilla/index.html`, `script.js` | `novalidate`, `aria-invalid`, cleared on input | `vanilla.test.ts` |
| 29 | Drawer and palette had no focus trap, no `aria-modal`, no focus restore, and the page scrolled behind them | `hooks.ts` | One `useDialog` hook used by the drawer, the palette and the mobile menu | `components.test.tsx`, `App.test.tsx` |
| 30 | Palette results had no listbox semantics | `Palette.tsx` | Combobox with `aria-activedescendant` | `components.test.tsx` |
| 31 | `aria-live` on the whole list re-read it on every change | `App.tsx`, `vanilla/index.html` | One status region with short messages | `App.test.tsx`, `vanilla.test.ts` |
| 32 | Several chips failed contrast (3.6–3.7:1) | `index.css` | New tokens, checked by `npm run contrast` | `scripts/contrast.mjs` |
| 33 | Vanilla: priority was a coloured border only | `vanilla/script.js`, `style.css` | Labelled pills | `vanilla.test.ts` |
| 34 | Accent swatches were labelled with hex codes | `Sidebar.tsx` | Colour names | `App.test.tsx` |
| 35 | Form error was not linked to its field and never cleared | `TaskForm.tsx` | `aria-invalid`, `aria-describedby`, cleared on typing | `App.test.tsx` |
| 36 | New-list form had no submit button and allowed duplicate names | `Sidebar.tsx`, `App.tsx` | Add button; a duplicate name opens the existing list | `App.test.tsx` |
| 37 | Undo toast vanished while hovered or focused | `Toast.tsx` | The timer waits while the toast is hovered or focused | `App.test.tsx` |

**Found while fixing (not in the first diagnosis)**
- Restoring focus from a layout-effect cleanup did nothing when the dialog stays mounted (the mobile menu), because React puts focus back on the previously focused element at the end of a commit. The hook uses a passive effect instead.
- Deleting a task and the status region both announced "Task deleted". The toast is already a status region, so it is now announced once.

**Tests changed after they were written, and why**
- Two palette queries used `getByRole('combobox')`. A `<select>` also has that role, so the queries hit the sort and drawer selects as well and threw "multiple elements". They now ask for the palette input by name; the assertions are the same.
- The drag-highlight test sent `dragleave` with a `relatedTarget`, which tied it to one implementation. That value did not reach the handler in jsdom, so the test failed even against an implementation built on it. The code moved to an enter/leave counter, and the test now sends the enter/leave sequence a browser fires. The expected results (highlighted, still highlighted, cleared) are unchanged. This test was rewritten together with the code, not because its intent was wrong.
- Three other drag tests gained a `dragenter` event, because the highlight now starts there. Without it the "not a task" and "sorting is on" tests would pass without exercising anything. No assertion was removed; the app-level drag test gained two.

## Design-skills polish pass (Claude Opus 5.5)
A third pass, run after design rulebooks were installed: Emil Kowalski (emil-design-eng), Jakub Krehel (make-interfaces-feel-better) and ibelick (fixing-accessibility), plus a worst-case data test (break-ui). The look stays the same: same palette, type, layout and signature. Only the details changed.

**How it was checked**
- Playwright screenshots of the production build, before and after: 375px and 1280px, light and dark, realistic data and worst-case data (140+ tasks, 136-character words, an unbreakable email, Arabic and Japanese text, a 400-day-old due date, 12 long subtasks).
- A scripted keyboard pass (45 Tab stops, each with a visible focus ring) and a hit-area scan of every button and checkbox.
- `npm test` (140 → 143), `npm run contrast`, `npm run build`, `npm audit` (0 vulnerabilities).

**What changed**

| Before | After | Why |
| --- | --- | --- |
| Rows animated in on every render | No row entry animation | Rows re-mount on each view switch and keyboard reorder; motion on frequent actions feels slow |
| Command palette faded and rose in | Opens instantly | Opened from the keyboard many times a day |
| Check-off bounced to 125% | 180ms settle from 85%, no bounce | Seen tens of times a day: feedback, not a show |
| Drawer and overlay closed with `ease-in` played in reverse | Separate exit keyframes, `ease-out`, faster than the entry | `ease-in` feels slow at the moment the user watches |
| Built-in easings | `--ease-out` and an iOS-style `--ease-drawer` curve | Built-in curves are too weak |
| Toast entered with keyframes | CSS transition with `@starting-style` | Transitions can be interrupted when toasts arrive quickly |
| Press scale 0.97, no transition | 0.96 with a 160ms ease-out | Krehel: always 0.96 |
| Hover styles on all devices | Only for `(hover: hover) and (pointer: fine)` | Taps left stuck hover states on phones |
| Reduced motion removed every transition | Removes movement only; fades stay | Reduced motion means fewer animations, not no feedback |
| Row buttons 34px, checkboxes 24px, swatches 24px, list delete 32px, links 20px tall | At least 40px (44px on touch), with invisible hit areas where the look must stay small | Minimum hit area |
| Changing counts in proportional digits | `tabular-nums` on counts, badges and the ring | Numbers no longer shift the layout |
| Headings and body wrapped unevenly | `text-wrap: balance` on headings, `pretty` on text | No single-word last lines |
| At 375px, "Medium priority" and the date showed cut off | The two fields stack when there is no room | Found with worst-case data |
| "400 days overdue" | "Overdue since Oct 6, 2025" after one week | A large day count is hard to read |
| "Imported 1 tasks", "All 1 tasks done" | `Intl.PluralRules` through a `count()` helper | Correct plurals |
| Commands button labelled "Open command palette" | Name comes from the visible text "Commands" | WCAG 2.5.3: the visible label must be part of the name |
| Menu button had no link to the sidebar | `aria-controls="sidebar"` | Screen readers can tell what it opens |
| Date field had no focus ring | All fields show a focus ring | Keyboard pass found it |
| No Content Security Policy | Build-time CSP meta tag with hashed inline scripts | Harden; checked in a browser with no violations |
| CI ran only on `main`, and every run deployed | CI on every push and PR; only `main` deploys; write permissions only in the deploy job | Least privilege; branches get tested without shipping |

**Tests changed after they were written, and why**
- `dates.test.ts` expected "9 days overdue" for Oct 24 → Nov 2. That case also checked day counting across a clock change. The new rule shows a date after 7 days, so the case became two 6-day cases. One crosses the US clock change and one crosses the EU clock change, so the clock-change check is kept. A new test covers the 7-day boundary and the year in old dates.

**Left as is, on purpose**
- Borders on cards and inputs stay. They are structure, and the bold ink border is part of this design.
- The completion "cheer" on the progress ring keeps its overshoot. It happens rarely, and a rare celebration may have some delight.
- The vanilla version is a separate, no-build reference app. This pass changed only the React app that is deployed.

## Takeaways
- Diagnose first, then fix: I list what's wrong before asking the AI to change anything.
- A passing test means nothing if the AI weakened the assertion to get it green, so I read the diffs.
- Summarise progress before continuing a long session, so the AI doesn't drift.
