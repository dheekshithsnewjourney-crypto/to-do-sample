import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import Drawer from './components/Drawer';
import Filters from './components/Filters';
import Palette from './components/Palette';
import ProgressRing from './components/ProgressRing';
import Sidebar from './components/Sidebar';
import TaskForm from './components/TaskForm';
import TaskItem from './components/TaskItem';
import Toast from './components/Toast';
import { greeting, todayISO } from './dates';
import { tasksReducer } from './reducer';
import { DEFAULT_LISTS, loadLists, loadTasks, parseBackup, saveLists, saveTasks } from './storage';
import type { Filter, List, Sort, Task, View } from './types';

type Theme = 'light' | 'dark';
const THEME_KEY = 'todo-theme';
const ACCENT_KEY = 'todo-accent';
const RANK = { high: 0, med: 1, low: 2 } as const;
const PALETTE = ['#5b5bd6', '#e5a000', '#2f9e6e', '#e5484d', '#0ea5e9', '#c026d3'];
const VIEW_TITLES: Record<string, string> = { all: 'All tasks', today: 'Today', upcoming: 'Upcoming', overdue: 'Overdue' };

const EMPTY: Record<Filter, string> = {
  all: 'Nothing here yet. Add your first task above.',
  active: 'All caught up. No active tasks.',
  done: 'Nothing completed yet.',
};

function inView(t: Task, view: View, today: string): boolean {
  if (view === 'all') return true;
  if (view === 'today') return !!t.dueDate && (t.dueDate === today || (!t.done && t.dueDate < today));
  if (view === 'upcoming') return !!t.dueDate && t.dueDate > today;
  if (view === 'overdue') return !t.done && !!t.dueDate && t.dueDate < today;
  return t.listId === view.slice(5);
}

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* storage blocked */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function App() {
  const [tasks, dispatch] = useReducer(tasksReducer, undefined, loadTasks);
  const [lists, setLists] = useState<List[]>(loadLists);
  const [view, setView] = useState<View>('all');
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('manual');
  const [query, setQuery] = useState('');
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [openId, setOpenId] = useState<string | null>(null);
  const [undo, setUndo] = useState<{ task: Task; index: number } | null>(null);
  const [palette, setPalette] = useState(false);
  const [accent, setAccent] = useState<string | null>(() => {
    try { return localStorage.getItem(ACCENT_KEY); } catch { return null; }
  });
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => saveTasks(tasks), [tasks]);
  useEffect(() => saveLists(lists), [lists]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* ignore */ }
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    if (accent) {
      root.style.setProperty('--accent', accent);
      root.style.setProperty('--accent-ink', '#ffffff');
    } else {
      root.style.removeProperty('--accent');
      root.style.removeProperty('--accent-ink');
    }
    try {
      if (accent) localStorage.setItem(ACCENT_KEY, accent);
      else localStorage.removeItem(ACCENT_KEY);
    } catch { /* ignore */ }
  }, [accent]);

  useEffect(() => {
    if (!undo) return;
    const timer = setTimeout(() => setUndo(null), 5000);
    return () => clearTimeout(timer);
  }, [undo]);

  // Keyboard shortcuts: "/" search, "n" new task
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette(true);
        return;
      }
      const tag = (e.target as HTMLElement).tagName;
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === '/') { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'n') { e.preventDefault(); document.getElementById('new-task')?.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const today = todayISO();
  const scoped = useMemo(() => tasks.filter((t) => inView(t, view, today)), [tasks, view, today]);

  const counts: Record<Filter, number> = {
    all: scoped.length,
    active: scoped.filter((t) => !t.done).length,
    done: scoped.filter((t) => t.done).length,
  };

  const viewCounts: Record<string, number> = {};
  (['all', 'today', 'upcoming', 'overdue'] as View[]).forEach((v) => {
    viewCounts[v] = tasks.filter((t) => !t.done && inView(t, v, today)).length;
  });
  lists.forEach((l) => { viewCounts[`list:${l.id}`] = tasks.filter((t) => !t.done && t.listId === l.id).length; });

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = scoped.filter((t) => {
      if (filter === 'active' && t.done) return false;
      if (filter === 'done' && !t.done) return false;
      return !q || t.text.toLowerCase().includes(q);
    });
    if (sort === 'due') list = [...list].sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999'));
    if (sort === 'priority') list = [...list].sort((a, b) => RANK[a.priority] - RANK[b.priority]);
    return list;
  }, [scoped, filter, sort, query]);

  const overdue = viewCounts.overdue;
  const allActive = viewCounts.all;
  const totalDone = tasks.filter((t) => t.done).length;
  const sub =
    tasks.length === 0 ? 'Add a task to get started.'
    : allActive === 0 ? 'Everything is done. Nice work.'
    : `${allActive} to do${overdue ? `, ${overdue} overdue` : ''}`;

  const currentListId = view.startsWith('list:') ? view.slice(5) : undefined;
  const viewTitle = VIEW_TITLES[view] ?? lists.find((l) => l.id === currentListId)?.name ?? 'List';
  const canDrag = sort === 'manual' && !query.trim();
  const openTask = tasks.find((t) => t.id === openId);

  function handleAdd(text: string, priority: Task['priority'], dueDate?: string) {
    dispatch({ type: 'add', id: crypto.randomUUID(), text, priority, dueDate, listId: currentListId });
    setQuery('');                      // so the new task is never hidden by a leftover search
    if (filter === 'done') setFilter('all');
  }

  function handleDelete(id: string) {
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return;
    setUndo({ task: tasks[index], index });
    if (openId === id) setOpenId(null);
    dispatch({ type: 'delete', id });
  }

  function handleUndo() {
    if (!undo) return;
    dispatch({ type: 'restore', task: undo.task, index: undo.index });
    setUndo(null);
  }

  function nudge(id: string, dir: -1 | 1) {
    if (!canDrag) return;
    const i = visible.findIndex((t) => t.id === id);
    const other = visible[i + dir];
    if (i >= 0 && other) dispatch({ type: 'move', from: id, to: other.id });
  }

  const paletteItems = [
    { id: 'new', label: 'New task', run: () => { setTimeout(() => document.getElementById('new-task')?.focus(), 0); } },
    { id: 'search', label: 'Search tasks', run: () => { setTimeout(() => searchRef.current?.focus(), 0); } },
    { id: 'v-all', label: 'Go to All tasks', run: () => setView('all') },
    { id: 'v-today', label: 'Go to Today', run: () => setView('today') },
    { id: 'v-up', label: 'Go to Upcoming', run: () => setView('upcoming') },
    { id: 'v-over', label: 'Go to Overdue', run: () => setView('overdue') },
    ...lists.map((l) => ({ id: `l-${l.id}`, label: `Go to list: ${l.name}`, run: () => setView(`list:${l.id}` as View) })),
    { id: 'theme', label: `Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`, run: () => setTheme(theme === 'dark' ? 'light' : 'dark') },
    { id: 'export', label: 'Export backup', run: () => exportData() },
    ...(totalDone > 0 ? [{ id: 'clear', label: 'Clear completed tasks', run: () => dispatch({ type: 'clearDone' }) }] : []),
    ...tasks.map((t) => ({ id: `t-${t.id}`, label: `Open task: ${t.text}`, run: () => setOpenId(t.id) })),
  ];

  function addList(name: string) {
    setLists([...lists, { id: crypto.randomUUID(), name, color: PALETTE[lists.length % PALETTE.length] }]);
  }

  function deleteList(id: string) {
    const list = lists.find((l) => l.id === id);
    if (!list || !window.confirm(`Delete the list "${list.name}"? Its tasks will be kept without a list.`)) return;
    dispatch({ type: 'unassignList', listId: id });
    setLists(lists.filter((l) => l.id !== id));
    if (currentListId === id) setView('all');
  }

  function exportData() {
    const blob = new Blob([JSON.stringify({ version: 1, tasks, lists }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tasks-backup-${today}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importData(file: File) {
    const parsed = parseBackup(await file.text());
    if (!parsed) { window.alert('That file is not a valid backup.'); return; }
    if (!window.confirm(`Replace your current data with ${parsed.tasks.length} imported tasks?`)) return;
    dispatch({ type: 'replaceAll', tasks: parsed.tasks });
    setLists(parsed.lists.length ? parsed.lists : DEFAULT_LISTS);
    setView('all');
    setOpenId(null);
  }

  return (
    <div className="shell">
      <Sidebar
        view={view} onView={setView} counts={viewCounts} lists={lists}
        onAddList={addList} onDeleteList={deleteList} onExport={exportData} onImport={importData}
        accent={accent} onAccent={setAccent}
      />

      <main className="app">
        <div className="topbar">
          <p className="date">{new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <button className="cmd" type="button" onClick={() => setPalette(true)} aria-label="Open command palette">
            Commands <kbd>Ctrl K</kbd>
          </button>
          <button className="icon-btn" type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
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
          <ProgressRing done={totalDone} total={tasks.length} />
        </header>

        <TaskForm onAdd={handleAdd} />

        <section className="panel">
          <h2 className="view-title">{viewTitle}</h2>
          <Filters filter={filter} counts={counts} onFilter={setFilter} query={query} onQuery={setQuery}
            sort={sort} onSort={setSort} searchRef={searchRef} />
          <ul className="list" aria-live="polite">
            {visible.map((t) => (
              <TaskItem
                key={t.id}
                task={t}
                list={currentListId ? undefined : lists.find((l) => l.id === t.listId)}
                draggable={canDrag}
                onToggle={(id) => dispatch({ type: 'toggle', id, nextId: crypto.randomUUID() })}
                onDelete={handleDelete}
                onEdit={(id, text) => dispatch({ type: 'edit', id, text })}
                onOpen={setOpenId}
                onMove={(from, to) => dispatch({ type: 'move', from, to })}
                onNudge={nudge}
              />
            ))}
          </ul>
          {visible.length === 0 && (
            <div className="empty">
              <svg viewBox="0 0 64 64" width="56" height="56" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="12" y="10" width="40" height="44" rx="8" /><path d="M22 28l5 5 10-11M22 44h20" />
              </svg>
              <p>{query.trim() ? `No tasks match "${query.trim()}".` : EMPTY[filter]}</p>
            </div>
          )}
          <footer className="foot">
            <span>N new task, / search, Ctrl+K commands. Alt+Up/Down reorders.</span>
            {totalDone > 0 && (
              <button className="link" type="button" onClick={() => dispatch({ type: 'clearDone' })}>Clear completed</button>
            )}
          </footer>
        </section>
      </main>

      {openTask && (
        <Drawer
          key={openTask.id}
          task={openTask}
          lists={lists}
          onClose={() => setOpenId(null)}
          onUpdate={(patch) => dispatch({ type: 'update', id: openTask.id, patch })}
          onAddSub={(text) => dispatch({ type: 'addSub', taskId: openTask.id, id: crypto.randomUUID(), text })}
          onToggleSub={(subId) => dispatch({ type: 'toggleSub', taskId: openTask.id, subId })}
          onDeleteSub={(subId) => dispatch({ type: 'deleteSub', taskId: openTask.id, subId })}
          onDelete={() => handleDelete(openTask.id)}
        />
      )}
      {undo && <Toast message="Task deleted" onUndo={handleUndo} />}
      {palette && <Palette items={paletteItems} onClose={() => setPalette(false)} />}
    </div>
  );
}
