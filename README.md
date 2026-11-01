# Tasks – To-Do App (React + TypeScript)

A clean, accessible to-do app built twice to show range:

| Folder | Stack | Why |
|---|---|---|
| [`/react`](./react) | React 18, TypeScript, Vite, Vitest | Component-based version with typed state and unit tests |
| [`/vanilla`](./vanilla) | HTML, CSS, JavaScript | Same app with no framework, proving the fundamentals |

**Live demo:** _paste your GitHub Pages URL here_ (the React version deploys automatically)

## Features
- **Lists and smart views:** custom coloured lists plus All tasks, Today, Upcoming and Overdue, each with live counts
- **Task details drawer:** notes, subtasks with progress, due date, priority and list
- **Quick add:** type `Pay rent tomorrow !high` and the date and priority are filled in for you
- **Recurring tasks:** repeat daily, weekly or monthly; completing one creates the next automatically
- **Command palette** (`Ctrl+K`) to jump to any view, list or task, switch theme, or export
- **Drag and drop** to reorder (or `Alt+Up/Down` from the keyboard), plus sorting by due date or priority
- **Accent colour picker** and a polished light and dark theme
- **Search** (press `/`), status filters, undo after delete, Clear completed
- **Backup:** export and import all data as JSON, validated before it replaces anything
- Progress ring, light and dark theme, `localStorage` persistence
- Responsive, keyboard shortcuts (`N` new task, `/` search, `Esc` closes the drawer), ARIA labels, reduced-motion support

## Built with AI
This project was built with AI assistance. See [AI_WORKFLOW.md](./AI_WORKFLOW.md) for my prompts, how I verified the output, and the bugs I caught.

## Run locally
```bash
cd react
npm install
npm run dev      # development server
npm test         # unit tests
npm run build    # type-check + production build
```
The vanilla version needs no setup: open `vanilla/index.html`.

## Structure
```
react/src/
├── App.tsx            # views, filters, wiring
├── reducer.ts         # pure state logic
├── reducer.test.ts    # unit tests (plus quickadd.test.ts, storage.test.ts)
├── quickadd.ts        # natural-language parsing for new tasks
├── storage.ts         # localStorage with error handling
├── types.ts
└── components/        # Sidebar, Drawer, TaskForm, TaskItem, Filters, ...
```

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
Drag-and-drop reordering, due dates, search, JSON export/import.

## License
MIT
