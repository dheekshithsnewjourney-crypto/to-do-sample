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
Red and yellow are the brand colours. Everything else is an untinted grey, so they are the only colour in the interface.

| Token | Light | Dark | Used for |
|---|---|---|---|
| `--bg` | `#FAFAFA` | `#0A0A0A` | Page |
| `--surface` | `#FFFFFF` | `#151515` | Cards, drawer |
| `--soft` | `#F2F2F2` | `#1F1F1F` | Inputs, badges |
| `--line` | `#E4E4E4` | `#2C2C2C` | Borders |
| `--ink` | `#111111` | `#F5F5F5` | Text |
| `--muted` | `#6B6B6B` | `#A3A3A3` | Secondary text |
| `--accent` / `--accent-ink` | `#D62839` / `#FFFFFF` | `#FF4D5E` / `#0A0A0A` | Brand red: primary button, checkmark, High priority |
| `--sun` / `--sun-ink` | `#FFC53D` / `#111111` | `#FFD166` / `#111111` | Brand yellow, always a fill with dark text on top |
| `--danger` / `--danger-ink` | `#A4161A` / `#FFFFFF` | `#FF6B6B` / `#0A0A0A` | Delete actions, always with an icon or label |

Because red is the brand, it never means "danger" by colour alone:
- **Priority** is a labelled pill: High is solid red, Medium is yellow, Low is an outlined grey.
- **Overdue** is red text with an icon and the words ("3 days overdue").
- **Delete** uses a deeper crimson and always has an icon or label.
- **Yellow** marks "today" and highlights: the Today badge, search matches, the focused task's left edge, and the progress ring when everything is done.

Headings use Bricolage Grotesque, body text uses Inter. Backgrounds are flat, with no gradients.

Every text/background pair is checked against WCAG AA (4.5:1) by a script that reads the tokens straight from both stylesheets:
```bash
cd react
npm run contrast
```
It also runs in CI, so a palette change that breaks contrast fails the build.

## Built with AI
This project was built with AI assistance. See [AI_WORKFLOW.md](./AI_WORKFLOW.md) for my prompts, how I verified the output, and the bugs I caught.

## Run locally
Needs Node 22.12 or newer (CI uses Node 26 LTS).
```bash
cd react
npm install
npm run dev        # development server
npm test           # unit and DOM tests (140)
npm run contrast   # WCAG AA check of the colour tokens
npm run build      # type-check + production build
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
