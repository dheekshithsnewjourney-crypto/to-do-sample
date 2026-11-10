import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import Drawer from './components/Drawer';
import EmptyState, { type EmptyKind } from './components/EmptyState';
import Filters from './components/Filters';
import Palette from './components/Palette';
import ProgressRing from './components/ProgressRing';
import Sidebar from './components/Sidebar';
import TaskForm from './components/TaskForm';
import TaskItem from './components/TaskItem';
import Toast from './components/Toast';
import { MenuIcon, MoonIcon, SunIcon } from './components/icons';
import { accentVars, parseHex } from './color';
import { parseISO } from './dates';
import { isDialogOpen, useClock } from './hooks';
import { tasksReducer } from './reducer';
import { loadLists, loadTasks, parseBackup, saveLists, saveTasks } from './storage';
import type { Filter, List, Sort, Task, View } from './types';
import { uid } from './uid';
import { dueForNewTask, inView } from './views';

type Theme = 'light' | 'dark';
interface Undo { id: string; message: string; items: { task: Task; index: number }[] }

const THEME_KEY = 'todo-theme';
const ACCENT_KEY = 'todo-accent';
const RANK = { high: 0, med: 1, low: 2 } as const;
const LIST_COLORS = ['#D62839', '#FFC53D', '#8A8A8A'];
const VIEW_TITLES: Record<string, string> = { all: 'All tasks', today: 'Today', upcoming: 'Upcoming', overdue: 'Overdue' };
const MOD_KEY = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';

function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch { /* storage blocked */ }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export default function App() {
  const [lists, setLists] = useState<List[]>(loadLists);
  const [tasks, dispatch] = useReducer(tasksReducer, lists, loadTasks);
  const [view, setView] = useState<View>('all');
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<Sort>('manual');
  const [query, setQuery] = useState('');
  const [theme, setTheme] = useState<Theme>(initialTheme);
  const [openId, setOpenId] = useState<string | null>(null);
  const [undo, setUndo] = useState<Undo | null>(null);
  const [palette, setPalette] = useState(false);
  const [menu, setMenu] = useState(false);
  const [status, setStatus] = useState(''); // read out by screen readers
  const [accent, setAccent] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem(ACCENT_KEY);
      return parseHex(saved) ? saved : null; // never trust stored strings as CSS
    } catch { return null; }
  });
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const focusAfterMove = useRef<string | null>(null);
  const { today, hello } = useClock(); // stays correct when the tab is left open past midnight

  useEffect(() => saveTasks(tasks), [tasks]);
  useEffect(() => saveLists(lists), [lists]);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* ignore */ }
  }, [theme]);

  useEffect(() => {
    // A custom accent gets its ink from its own luminance, and a text-safe variant for this theme.
    const root = document.documentElement;
    ['--accent', '--accent-ink', '--accent-text'].forEach((name) => root.style.removeProperty(name));
    const css = getComputedStyle(root);
    const surfaces = [css.getPropertyValue('--bg'), css.getPropertyValue('--surface')];
    const vars = accent ? accentVars(accent, surfaces, theme === 'dark') : null;
    if (vars) Object.entries(vars).forEach(([name, value]) => root.style.setProperty(name, value));
    try {
      if (accent) localStorage.setItem(ACCENT_KEY, accent);
      else localStorage.removeItem(ACCENT_KEY);
    } catch { /* ignore */ }
  }, [accent, theme]);

  // Global shortcuts: Ctrl/Cmd+K palette, "/" search, "n" new task
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPalette((open) => !open);
        return;
      }
      const el = e.target as HTMLElement;
      const typing = ['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName) || el.isContentEditable;
      // Single-key shortcuts must not reach behind an open dialog
      if (typing || isDialogOpen() || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === '/') { e.preventDefault(); searchRef.current?.focus(); }
      if (e.key === 'n') { e.preventDefault(); document.getElementById('new-task')?.focus(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // The off-canvas menu only exists on narrow screens: close it if the window grows.
  useEffect(() => {
    const wide = window.matchMedia?.('(min-width: 821px)');
    const onChange = () => { if (wide?.matches) setMenu(false); };
    wide?.addEventListener('change', onChange);
    return () => wide?.removeEventListener('change', onChange);
  }, []);

  // After a keyboard reorder the moved row is re-inserted in the DOM, which drops focus: restore it.
  useEffect(() => {
    const id = focusAfterMove.current;
    if (!id) return;
    focusAfterMove.current = null;
    const row = [...(listRef.current?.children ?? [])].find((li) => (li as HTMLElement).dataset.id === id);
    row?.querySelector<HTMLElement>('.text')?.focus();
  }, [tasks]);

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

  const currentListId = view.startsWith('list:') ? view.slice(5) : undefined;
  const viewTitle = VIEW_TITLES[view] ?? lists.find((l) => l.id === currentListId)?.name ?? 'List';
  // Which empty state fits: a search miss, a filter that hides everything, or a truly empty view.
  const emptyKind: EmptyKind =
    query.trim() ? 'search'
    : scoped.length > 0 ? (filter === 'done' ? 'noneDone' : 'allDone')
    : currentListId ? 'list'
    : (view as EmptyKind);
  const canDrag = sort === 'manual' && !query.trim();
  const openTask = tasks.find((t) => t.id === openId);

  function handleAdd(text: string, priority: Task['priority'], explicitDue?: string) {
    const task: Task = { id: uid(), text, priority, done: false, dueDate: dueForNewTask(view, today, explicitDue), listId: currentListId };
    dispatch({ type: 'add', ...task });
    if (!inView(task, view, today)) setView('all'); // e.g. an undated task added from Overdue
    setQuery('');                                   // so the new task is never hidden by a leftover search
    if (filter === 'done') setFilter('all');
    setStatus(`Added "${text}"`);
  }

  function handleToggle(id: string) {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    dispatch({ type: 'toggle', id, nextId: uid(), today });
    setStatus(`"${task.text}" ${task.done ? 'marked as not done' : 'completed'}`);
  }

  function removeWithUndo(items: Undo['items'], message: string) {
    if (!items.length) return;
    setUndo({ id: uid(), message, items }); // the toast is itself a status region, so it is announced once
  }

  function handleDelete(id: string) {
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) return;
    removeWithUndo([{ task: tasks[index], index }], 'Task deleted');
    if (openId === id) setOpenId(null);
    dispatch({ type: 'delete', id });
  }

  function clearCompleted() {
    const items = tasks.map((task, index) => ({ task, index })).filter((x) => x.task.done);
    removeWithUndo(items, `${items.length} completed ${items.length === 1 ? 'task' : 'tasks'} cleared`);
    dispatch({ type: 'clearDone' });
  }

  function handleUndo() {
    if (!undo) return;
    // Restoring in ascending index order puts every task back in its old slot.
    undo.items.forEach(({ task, index }) => dispatch({ type: 'restore', task, index }));
    setUndo(null);
    setStatus('Restored');
  }

  function nudge(id: string, dir: -1 | 1) {
    if (!canDrag) {
      setStatus('Reordering is off while the list is sorted or searched. Switch to "My order" and clear the search to move tasks.');
      return;
    }
    const i = visible.findIndex((t) => t.id === id);
    const other = visible[i + dir];
    if (i < 0 || !other) return;
    focusAfterMove.current = id;
    dispatch({ type: 'move', from: id, to: other.id });
    setStatus(`Moved "${visible[i].text}" to position ${i + dir + 1} of ${visible.length}`);
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
    ...(totalDone > 0 ? [{ id: 'clear', label: 'Clear completed tasks', run: clearCompleted }] : []),
    ...tasks.map((t) => ({ id: `t-${t.id}`, label: `Open task: ${t.text}`, run: () => setOpenId(t.id) })),
  ];

  function addList(name: string) {
    const existing = lists.find((l) => l.name.toLowerCase() === name.toLowerCase());
    const list = existing ?? { id: uid(), name, color: LIST_COLORS[lists.length % LIST_COLORS.length] };
    if (!existing) setLists([...lists, list]);
    setView(`list:${list.id}`); // a duplicate name just takes you to the list that already exists
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
    const parsed = parseBackup(await file.text().catch(() => ''));
    if (!parsed) { window.alert('That file is not a valid backup. Nothing was changed.'); return; }
    if (!window.confirm(`Replace your current data with ${parsed.tasks.length} imported tasks?`)) return;
    dispatch({ type: 'replaceAll', tasks: parsed.tasks });
    setLists(parsed.lists);
    setView('all');
    setOpenId(null);
    setUndo(null);
    setStatus(`Imported ${parsed.tasks.length} tasks`);
  }

  return (
    <div className="shell">
      <Sidebar
        view={view} onView={setView} counts={viewCounts} lists={lists}
        onAddList={addList} onDeleteList={deleteList} onExport={exportData} onImport={importData}
        accent={accent} onAccent={setAccent} open={menu} onClose={() => setMenu(false)}
      />

      <main className="app">
        <div className="topbar">
          <button className="icon-btn menu-btn" type="button" onClick={() => setMenu(true)} aria-label="Open menu" aria-expanded={menu}>
            <MenuIcon />
          </button>
          <p className="date">
            <span className="date-long">{parseISO(today)?.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            <span className="date-short" aria-hidden="true">{parseISO(today)?.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
          </p>
          <button className="cmd" type="button" onClick={() => setPalette(true)} aria-label="Open command palette">
            Commands <kbd>{MOD_KEY} K</kbd>
          </button>
          <button className="icon-btn" type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>

        <header className="hero">
          <div>
            <h1>{hello}</h1>
            <p className="sub">
              {tasks.length === 0 ? 'Add a task to get started.'
                : allActive === 0 ? 'Everything is done. Nice work.'
                : <>{allActive} to do{overdue > 0 && <>, <strong>{overdue} overdue</strong></>}</>}
            </p>
          </div>
          <ProgressRing done={totalDone} total={tasks.length} />
        </header>

        <TaskForm onAdd={handleAdd} />

        <section className="panel" aria-labelledby="view-title">
          <div className="panel-head">
            <h2 className="view-title" id="view-title">{viewTitle}</h2>
            <span className={`badge${view === 'today' && viewCounts.today > 0 ? ' sun' : ''}`}>
              {viewCounts[view] ?? 0}<span className="sr-only"> to do</span>
            </span>
          </div>
          <Filters filter={filter} counts={counts} onFilter={setFilter} query={query} onQuery={setQuery}
            sort={sort} onSort={setSort} searchRef={searchRef} />
          <ul className="list" ref={listRef}>
            {visible.map((t) => (
              <TaskItem
                key={t.id}
                task={t}
                list={currentListId ? undefined : lists.find((l) => l.id === t.listId)}
                query={query}
                draggable={canDrag}
                onToggle={handleToggle}
                onDelete={handleDelete}
                onEdit={(id, text) => dispatch({ type: 'edit', id, text })}
                onOpen={setOpenId}
                onMove={(from, to) => dispatch({ type: 'move', from, to })}
                onNudge={nudge}
              />
            ))}
          </ul>
          {visible.length === 0 && (
            <EmptyState kind={emptyKind} listName={currentListId ? viewTitle : undefined}
              query={query.trim()} onClearSearch={() => setQuery('')} />
          )}
          <footer className="foot">
            <span className="keys"><kbd>N</kbd> new task · <kbd>/</kbd> search · <kbd>Alt</kbd> <kbd>↑↓</kbd> reorder</span>
            {totalDone > 0 && <button className="link" type="button" onClick={clearCompleted}>Clear completed</button>}
          </footer>
        </section>
        <p className="sr-only" role="status">{status}</p>
      </main>

      {openTask && (
        <Drawer
          key={openTask.id}
          task={openTask}
          lists={lists}
          onClose={() => setOpenId(null)}
          onUpdate={(patch) => dispatch({ type: 'update', id: openTask.id, patch })}
          onAddSub={(text) => dispatch({ type: 'addSub', taskId: openTask.id, id: uid(), text })}
          onToggleSub={(subId) => dispatch({ type: 'toggleSub', taskId: openTask.id, subId })}
          onDeleteSub={(subId) => dispatch({ type: 'deleteSub', taskId: openTask.id, subId })}
          onDelete={() => handleDelete(openTask.id)}
        />
      )}
      {undo && <Toast key={undo.id} message={undo.message} onUndo={handleUndo} onDismiss={() => setUndo(null)} />}
      {palette && <Palette items={paletteItems} onClose={() => setPalette(false)} />}
    </div>
  );
}
