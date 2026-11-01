import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import Filters from './components/Filters';
import ProgressRing from './components/ProgressRing';
import TaskForm from './components/TaskForm';
import TaskItem from './components/TaskItem';
import Toast from './components/Toast';
import { greeting, todayISO } from './dates';
import { tasksReducer } from './reducer';
import { loadTasks, saveTasks } from './storage';
import type { Filter, Sort, Task } from './types';

type Theme = 'light' | 'dark';
const THEME_KEY = 'todo-theme';
const RANK = { high: 0, med: 1, low: 2 } as const;

const EMPTY: Record<Filter, string> = {
  all: 'Nothing here yet. Add your first task above.',
  active: 'All caught up. No active tasks.',
  done: 'Nothing completed yet.',
};

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* storage blocked */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function App() {
  const [tasks, dispatch] = useReducer(tasksReducer, undefined, loadTasks);
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('newest');
  const [query, setQuery] = useState('');
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [undo, setUndo] = useState<{ task: Task; index: number } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => saveTasks(tasks), [tasks]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* ignore */ }
  }, [theme]);

  // Undo toast disappears after 5 seconds
  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => setUndo(null), 5000);
    return () => clearTimeout(timer);
  }, [undo]);

  // Press "/" to jump to search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      if (e.key === '/' && tag !== 'INPUT' && tag !== 'SELECT' && tag !== 'TEXTAREA') {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const counts: Record<Filter, number> = {
    all: tasks.length,
    active: tasks.filter((t) => !t.done).length,
    done: tasks.filter((t) => t.done).length,
  };

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = tasks.filter((t) => {
      if (filter === 'active' && t.done) return false;
      if (filter === 'done' && !t.done) return false;
      return !q || t.text.toLowerCase().includes(q);
    });
    if (sort === 'due') {
      list = [...list].sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'));
    } else if (sort === 'priority') {
      list = [...list].sort((a, b) => RANK[a.priority] - RANK[b.priority]);
    }
    return list;
  }, [tasks, filter, sort, query]);

  const today = todayISO();
  const overdue = tasks.filter((t) => !t.done && t.dueDate && t.dueDate < today).length;
  const sub =
    tasks.length === 0 ? 'Add a task to get started.'
    : counts.active === 0 ? 'Everything is done. Nice work.'
    : `${counts.active} to do${overdue ? `, ${overdue} overdue` : ''}`;

  function handleDelete(id: string) {
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return;
    setUndo({ task: tasks[index], index });
    dispatch({ type: 'delete', id });
  }

  function handleUndo() {
    if (!undo) return;
    dispatch({ type: 'restore', task: undo.task, index: undo.index });
    setUndo(null);
  }

  return (
    <main className="app">
      <div className="topbar">
        <p className="date">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
        <button
          className="icon-btn"
          type="button"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
            </svg>
          )}
        </button>
      </div>

      <header className="hero">
        <div>
          <h1>{greeting()}</h1>
          <p className="sub">{sub}</p>
        </div>
        <ProgressRing done={counts.done} total={counts.all} />
      </header>

      <TaskForm onAdd={(text, priority, dueDate) => dispatch({ type: 'add', id: crypto.randomUUID(), text, priority, dueDate })} />

      <section className="panel">
        <Filters
          filter={filter} counts={counts} onFilter={setFilter}
          query={query} onQuery={setQuery} sort={sort} onSort={setSort} searchRef={searchRef}
        />
        <ul className="list" aria-live="polite">
          {visible.map((t) => (
            <TaskItem
              key={t.id}
              task={t}
              onToggle={(id) => dispatch({ type: 'toggle', id })}
              onDelete={handleDelete}
              onEdit={(id, text) => dispatch({ type: 'edit', id, text })}
            />
          ))}
        </ul>
        {visible.length === 0 && (
          <p className="empty">{query.trim() ? `No tasks match "${query.trim()}".` : EMPTY[filter]}</p>
        )}
        <footer className="foot">
          <span>Double-click or press F2 to edit. Esc cancels.</span>
          {counts.done > 0 && (
            <button className="link" type="button" onClick={() => dispatch({ type: 'clearDone' })}>
              Clear completed
            </button>
          )}
        </footer>
      </section>

      {undo && <Toast message="Task deleted" onUndo={handleUndo} />}
    </main>
  );
}
