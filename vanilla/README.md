# Tasks – a simple to-do app

A small, dependency-free to-do app built with **HTML, CSS and vanilla JavaScript**.
No build step, no frameworks: open `index.html` and it works.

**Live demo:** _add your GitHub Pages link here_

## Features
- Add, complete, edit (double-click or F2) and delete tasks
- Priority levels (low / medium / high) shown as a colour marker
- Filter by All / Active / Done, live "tasks left" counter, Clear completed
- Data persists in `localStorage` (with safe fallback if storage is blocked or corrupted)
- Input validation with an inline error message
- Responsive layout, automatic dark mode, keyboard accessible, ARIA labels, reduced-motion support

## Project structure
```
todo-app/
├── index.html   # markup
├── style.css    # styles, CSS variables, dark mode
├── script.js    # state, rendering, events
└── README.md
```

## Run locally
```bash
git clone <your-repo-url>
cd todo-app
# just open index.html, or serve it:
python -m http.server 8000
```

## Design and code decisions
- **Security:** tasks are rendered with `textContent` and DOM APIs, never `innerHTML`, so user input can't inject HTML/scripts.
- **Single source of truth:** one `tasks` array; every change goes through `commit()` which saves then re-renders.
- **Resilience:** `JSON.parse` and `localStorage` access are wrapped in `try/catch`.
- **Accessibility:** real `<label>`s, `aria-live` list, `aria-pressed` filters, visible focus styles.

## Debugging task
A broken snippet and its fix, to show the debugging approach.

**Broken:**
```js
const todos = ["Buy milk", "Study JS"];
for (var i = 0; i <= todos.length; i++) {
  setTimeout(() => console.log(todos[i].toUpperCase()), 100);
}
```
**Problems:**
1. `i <= todos.length` runs one step too far, so `todos[2]` is `undefined`.
2. `var` is function-scoped, so every callback sees the final `i`.
3. The result is `TypeError: Cannot read properties of undefined`.

**Fixed:**
```js
const todos = ["Buy milk", "Study JS"];
todos.forEach((todo) => {
  setTimeout(() => console.log(todo.toUpperCase()), 100);
});
```
`forEach` removes the off-by-one and gives each callback its own `todo`.

## Enhancement ideas for a basic static page
1. **Dark mode + theme toggle:** CSS variables plus `prefers-color-scheme`, as used in this app.
2. **Accessibility and performance pass:** semantic landmarks, alt text, contrast checks, lazy-loaded images, a Lighthouse score above 90.
3. **Micro-interactions and a contact form:** subtle scroll reveals and validated form feedback instead of a bare `mailto:` link.

## Possible next steps
Drag-and-drop reordering, due dates, search, export/import JSON, unit tests with Vitest.

## License
MIT
