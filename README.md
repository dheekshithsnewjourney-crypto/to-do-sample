# Tasks – To-Do App (React + TypeScript)

A clean, accessible to-do app built twice to show range:

| Folder | Stack | Why |
|---|---|---|
| [`/react`](./react) | React 19, TypeScript 7, Vite 8, Vitest 5 | Component-based version with typed state and unit tests |
| [`/vanilla`](./vanilla) | HTML, CSS, JavaScript | Same app with no framework, proving the fundamentals |

**Live demo:** _paste your GitHub Pages URL here_ (the React version deploys automatically)

## Features
- **Lists and smart views:** custom lists (each with a monogram marker, red for the one you are in) plus All tasks, Today, Upcoming and Overdue, each with live counts
- **Task details drawer:** notes, subtasks with progress, due date, priority and list
- **Quick add:** type `Pay rent tomorrow !high` and the date and priority are filled in for you
- **Recurring tasks:** repeat daily, weekly or monthly. Completing one creates the next occurrence, un-completing it takes that occurrence back, monthly repeats keep their day across short months (Jan 31 → Feb 28 → Mar 31), and a task finished late skips the occurrences it missed
- **Command palette** (`Ctrl+K` / `⌘K`) to jump to any view, list or task, switch theme, or export
- **Drag and drop** to reorder, or `Alt+↑/↓` from the keyboard (focus stays on the task and the move is announced), plus sorting by due date or priority
- **Search** (press `/`) with highlighted matches, status filters, and **undo** for both delete and Clear completed
- **Backup:** export and import all data as JSON. Every field of an imported file is validated before it replaces anything
- **Themes:** light and dark, plus an accent colour picker that keeps text readable whatever colour you pick
- **Mobile:** below 820px the sidebar becomes an off-canvas menu. Tested at 375px with no horizontal scroll
- **Accessible:** focus-trapped dialogs that restore focus on close, labelled controls, a single status region for announcements, visible focus, and reduced-motion support

## Design
The day as a Swiss International Style poster. A red field at the top states how many tasks remain, at poster scale, next to the date. Below it, a 12-column typographic sheet lists the tasks by when they are due. Full rules and tokens: [DESIGN.md](./DESIGN.md).

- **Brand:** red `#D62839` (the field) and yellow `#FFC53D` (a marker only), on white and off-black.
- **Type:** one family, Hanken Grotesk, from 300 to 900. Every number uses tabular figures.
- **Layout:** no sidebar and no cards. The sheet opens sorted by day: Overdue first, then each day, undated tasks, and finished tasks last. A "when" rail labels each group with its name and task count. 3px ink rules open each group, and hairlines separate rows from the task column on. Title, details and priority sit in aligned columns. "My order" (drag, Alt+arrows, or Move up/down in the drawer) is one choice away in the sort menu. Lists open from a "Lists" button in the top line. On phones the views and lists move into a slide-out menu.
- **Signature:** the count re-sets with a short roll when it changes, and a finished task gets a red strike, line by line.
- **Red text** uses a text-safe red (`#C8202F`), so it reaches 4.5:1 even on the hover grey. Red never means danger by colour alone: overdue tasks also get an icon and words.

Every text/background pair is checked against WCAG AA (4.5:1) by a script that reads the tokens straight from both stylesheets:
```bash
cd react
npm run contrast
```
It also runs in CI, so a palette change that breaks contrast fails the build.

The prototype screenshot of the chosen direction is in [`prototypes/C-grid.png`](./prototypes/C-grid.png).

### Motion and touch
- Two custom curves: `--ease-out` for things that enter or leave, `--ease-drawer` for the drawer and the mobile menu. Exits are faster than entries.
- Actions you repeat many times a day do not animate: the command palette opens instantly, and task rows have no entry animation. The check-off is a short settle with no bounce.
- Buttons scale to 0.96 when pressed. Hover styles apply only to devices with a mouse, so a tap never leaves a stuck hover state.
- Every control has a hit area of at least 40px (44px on touch screens). Small visuals get an invisible larger target.
- With "reduce motion" turned on, nothing moves. Fades and colour changes stay, so feedback is not lost.

## Deploy and rollback
- CI runs on every push and pull request: dependency audit, tests, contrast check, type-check, build, and a CSP check of the built page.
- Only a push to `main` deploys to GitHub Pages. Branch runs never deploy.
- The production build adds a Content Security Policy. GitHub Pages cannot send headers, so it is a meta tag. Each inline script is allowed by its hash, which the build computes.

To roll back a bad release:
1. Find the bad commit: `git log --oneline`.
2. Revert it: `git revert <commit>`.
3. Push to `main`. CI tests the revert and deploys the previous version.

To redeploy a known good commit without new code, run the workflow by hand from the Actions tab ("Run workflow").

## Built with AI
This project was built with AI assistance. See [AI_WORKFLOW.md](./AI_WORKFLOW.md) for my prompts, how I verified the output, and the bugs I caught.

## Run locally
Needs Node 22.12 or newer (CI uses Node 26 LTS).
```bash
cd react
npm install
npm run dev        # development server
npm test           # unit and DOM tests (147)
npm run contrast   # WCAG AA check of the colour tokens
npm run build      # type-check + production build
npm run csp        # checks the built page's Content Security Policy
```
The vanilla version needs no setup: open `vanilla/index.html`.

## Structure
```
react/
├── scripts/contrast.mjs   # WCAG contrast check for both stylesheets
└── src/
    ├── App.tsx            # views, filters, wiring
    ├── reducer.ts         # pure state logic
    ├── dates.ts           # local-date maths: due labels, repeats
    ├── quickadd.ts        # natural-language parsing for new tasks
    ├── storage.ts         # localStorage + validation of stored and imported data
    ├── views.ts           # which tasks each view shows
    ├── color.ts           # contrast helpers for the accent picker
    ├── hooks.ts           # useDialog (focus trap), useClock (date rollover)
    ├── types.ts, uid.ts
    ├── *.test.ts(x)       # logic tests, plus App and vanilla tests in jsdom
    └── components/        # Sidebar, Drawer, Palette, TaskForm, TaskItem, EmptyState, ...
```

## Tests
140 tests across 9 files:
- **Logic** (`reducer`, `dates`, `quickadd`, `storage`, `views`, `color`): recurring tasks, month ends, daylight-saving days, quick-add edge cases, corrupted storage, import validation.
- **Components and app** (jsdom + Testing Library): focus trap and focus restore in the drawer, palette and mobile menu, keyboard reorder, drag and drop, undo, date rollover at midnight.
- **Vanilla** (`vanilla.test.ts`): loads the real `vanilla/index.html` and `script.js` into jsdom.

## Debugging task
**Broken:**
```js
const todos = ["Buy milk", "Study JS"];
for (var i = 0; i <= todos.length; i++) {
  setTimeout(() => console.log(todos[i].toUpperCase()), 100);
}
```
**Problems:** `<=` runs one step past the end (`undefined`), `var` shares one `i` across all callbacks, so the result is a `TypeError`.

**Fixed:**
```js
todos.forEach((todo) => setTimeout(() => console.log(todo.toUpperCase()), 100));
```

## Enhancement ideas for a basic static page
1. Dark mode with CSS variables and `prefers-color-scheme` (used in this app).
2. Accessibility and performance pass: semantic landmarks, contrast checks, lazy-loaded images, Lighthouse above 90.
3. Micro-interactions and a validated contact form instead of a bare `mailto:` link.

## Roadmap
- Reordering on touch screens (HTML drag and drop is mouse-only; the keyboard shortcut needs a keyboard)
- Self-hosted fonts, so the app works fully offline
- Search inside notes and subtasks

## License
MIT
