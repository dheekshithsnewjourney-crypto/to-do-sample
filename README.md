# Tasks – To-Do App (React + TypeScript)

A clean, accessible to-do app built twice to show range:

| Folder | Stack | Why |
|---|---|---|
| [`/react`](./react) | React 18, TypeScript, Vite, Vitest | Component-based version with typed state and unit tests |
| [`/vanilla`](./vanilla) | HTML, CSS, JavaScript | Same app with no framework, proving the fundamentals |

**Live demo:** _paste your GitHub Pages URL here_ (the React version deploys automatically)

## Features
- Add, complete, edit (double-click or F2) and delete tasks
- Due dates with Today / Tomorrow / Overdue badges, and priority levels
- Daily progress ring with a time-based greeting
- Live search (press `/`), sorting by due date or priority, filters with counts
- Undo after delete, Clear completed
- Light and dark theme toggle that remembers your choice
- Persists in `localStorage` with safe fallbacks
- Validation with inline errors
- Responsive, automatic dark mode, keyboard accessible, ARIA labels, reduced-motion support

## Engineering highlights
- **Typed state:** `Task`, `Filter` and `Priority` are TypeScript types, so invalid states don't compile.
- **Pure reducer:** all state changes live in `reducer.ts` and are covered by unit tests (`npm test`).
- **Separated concerns:** UI components, state logic and storage are in separate files.
- **CI/CD:** every push to `main` runs tests, builds, and deploys to GitHub Pages via GitHub Actions.
- **Security:** React escapes rendered text by default, and the vanilla version uses `textContent` instead of `innerHTML`.

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
├── App.tsx            # layout, filter state, wiring
├── reducer.ts         # pure state logic
├── reducer.test.ts    # unit tests
├── storage.ts         # localStorage with error handling
├── types.ts
└── components/        # TaskForm, TaskItem, Filters
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
