import { useDeferredValue, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import Colophon from './components/Colophon';
import Drawer from './components/Drawer';
import EmptyState, { type EmptyKind } from './components/EmptyState';
import Filters from './components/Filters';
import Palette from './components/Palette';
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
import { count, dueForNewTask, inView, whenLabel } from './views';

type Theme = 'light' | 'dark';
// `revert` undoes an edit (a new date, for example); without it, `items` are deleted tasks to put back.
interface Undo { id: string; message: string; items: { task: Task; index: number }[]; revert?: () => void }

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
  const [sort, setSort] = useState<Sort>('due'); // the sheet lists tasks by day; "My order" is one choice away
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
  const lastCount = useRef<number | null>(null); // the poster numeral rolls only when its value changes

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
    // The browser bar takes the field colour, so the red runs to the top edge on phones.
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', getComputedStyle(root).getPropertyValue('--accent').trim() || '#D62839');
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

  // The list filters on a deferred copy of the query, so the search field paints each keystroke first.
  const deferredQuery = useDeferredValue(query);
  const visible = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase();
    let list = scoped.filter((t) => {
      if (filter === 'active' && t.done) return false;
      if (filter === 'done' && !t.done) return false;
      return !q || t.text.toLowerCase().includes(q);
    });
    // By day: overdue first, then each day in order, then undated tasks, with finished tasks at the end.
    const dayKey = (t: Task) => (t.done ? 'z' : t.dueDate ?? '9999');
    if (sort === 'due') list = [...list].sort((a, b) => dayKey(a).localeCompare(dayKey(b)));
    if (sort === 'priority') list = [...list].sort((a, b) => RANK[a.priority] - RANK[b.priority]);
    return list;
  }, [scoped, filter, sort, deferredQuery]);

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
    removeWithUndo(items, `${count(items.length, 'completed task')} cleared`);
    dispatch({ type: 'clearDone' });
  }

  function handleUndo() {
    if (!undo) return;
    if (undo.revert) undo.revert();
    // Restoring in ascending index order puts every task back in its old slot.
    else undo.items.forEach(({ task, index }) => dispatch({ type: 'restore', task, index }));
    setUndo(null);
    setStatus('Restored');
  }

  // Sets new due dates and offers Undo, which puts the old dates back.
  function redate(changed: Task[], dueDate: string | undefined, message: string) {
    if (!changed.length) return;
    changed.forEach((t) => dispatch({ type: 'update', id: t.id, patch: { dueDate } }));
    setUndo({ id: uid(), message, items: [], revert: () => changed.forEach((t) => dispatch({ type: 'update', id: t.id, patch: { dueDate: t.dueDate } })) });
  }

  // One step for everything that slipped: late tasks become due today.
  function moveOverdueToToday() {
    const late = tasks.filter((t) => !t.done && !!t.dueDate && t.dueDate < today);
    redate(late, today, `${count(late.length, 'task')} moved to today`);
  }

  // In "By day" order, dropping a task on another task gives it that task's day.
  function reschedule(fromId: string, toId: string) {
    const from = tasks.find((t) => t.id === fromId);
    const to = tasks.find((t) => t.id === toId);
    if (!from || !to || from.done || to.done || from.dueDate === to.dueDate) return;
    if (to.dueDate && to.dueDate < today) { setStatus('A task cannot be moved into Overdue.'); return; }
    redate([from], to.dueDate, `"${from.text}" moved to ${whenLabel(to, today)}`);
  }

  // Single-key edits from a focused row: P steps the priority, T makes the task due today.
  function quick(id: string, action: 'priority' | 'today') {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;
    focusAfterMove.current = id; // the row may move to another group: keep focus on it
    if (action === 'priority') {
      const next = ({ low: 'med', med: 'high', high: 'low' } as const)[task.priority];
      dispatch({ type: 'update', id, patch: { priority: next } });
      setStatus(`Priority of "${task.text}" set to ${{ low: 'Low', med: 'Medium', high: 'High' }[next]}`);
    } else if (task.dueDate !== today) {
      redate([task], today, `"${task.text}" is due today`);
    }
  }

  // `refocus` is false when the move comes from the drawer: focus must stay inside the dialog.
  function nudge(id: string, dir: -1 | 1, refocus = true) {
    if (!canDrag) {
      setStatus('Reordering is off while the list is sorted or searched. Switch to "My order" and clear the search to move tasks.');
      return;
    }
    const i = visible.findIndex((t) => t.id === id);
    const other = visible[i + dir];
    if (i < 0 || !other) return;
    if (refocus) focusAfterMove.current = id;
    dispatch({ type: 'move', from: id, to: other.id });
    setStatus(`Moved "${visible[i].text}" to position ${i + dir + 1} of ${visible.length}`);
  }

  const paletteItems = [
    { id: 'new', label: 'New task', hint: 'N', run: () => { setTimeout(() => document.getElementById('new-task')?.focus(), 0); } },
    { id: 'search', label: 'Search tasks', hint: '/', run: () => { setTimeout(() => searchRef.current?.focus(), 0); } },
    ...(overdue > 0 ? [{ id: 'rollover', label: 'Move overdue tasks to today', run: moveOverdueToToday }] : []),
    { id: 's-day', label: 'Sort by day', run: () => setSort('due') },
    { id: 's-mine', label: 'Sort in my order', run: () => setSort('manual') },
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
    if (!window.confirm(`Replace your current data with ${count(parsed.tasks.length, 'imported task')}?`)) return;
    dispatch({ type: 'replaceAll', tasks: parsed.tasks });
    setLists(parsed.lists);
    setView('all');
    setOpenId(null);
    setUndo(null);
    setStatus(`Imported ${count(parsed.tasks.length, 'task')}`);
  }

  const remaining = viewCounts[view] ?? 0;
  const rolled = lastCount.current !== null && lastCount.current !== remaining;
  // Updated after paint, so the next render can tell whether the numeral changed.
  useEffect(() => { lastCount.current = remaining; });
  const allDone = tasks.length > 0 && allActive === 0;
  const whens = useMemo(() => visible.map((t) => whenLabel(t, today)), [visible, today]);
  const now = parseISO(today);
  const weekday = now?.toLocaleDateString(undefined, { weekday: 'long' }) ?? '';
  const dayMonth = now?.toLocaleDateString(undefined, { day: 'numeric', month: 'long' }) ?? '';
  // How many rows each run of the "when" rail has, keyed by the index of its first row.
  const runCounts = useMemo(() => {
    const map = new Map<number, number>();
    let start = 0;
    whens.forEach((w, i) => {
      if (i === 0 || whens[i - 1] !== w) start = i;
      map.set(start, (map.get(start) ?? 0) + 1);
    });
    return map;
  }, [whens]);

  return (
    <div className="poster">
      <header className="field">
        <div className="bar">
          <button className="icon-btn menu-btn" type="button" onClick={() => setMenu(true)} aria-label="Open menu" aria-expanded={menu} aria-controls="sidebar">
            <MenuIcon />
          </button>
          <span className="brand-sm" aria-hidden="true">Tasks</span>
          <Sidebar
            view={view} onView={setView} counts={viewCounts} lists={lists}
            onAddList={addList} onDeleteList={deleteList} open={menu} onClose={() => setMenu(false)}
          />
          {/* No aria-label: the visible word "Commands" must be part of the accessible name (WCAG 2.5.3). */}
          <button className="cmd" type="button" onClick={() => setPalette(true)} aria-haspopup="dialog" aria-keyshortcuts="Control+K Meta+K">
            Commands <kbd>{MOD_KEY} K</kbd>
          </button>
          <button className="icon-btn" type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>
        </div>

        <div className="masthead" inert={menu}>
          <p className={`count${allDone ? ' complete' : ''}`} role="img" data-len={String(remaining).length}
            aria-label={allDone ? `All ${count(tasks.length, 'task')} done` : `${count(remaining, 'task')} to do in ${viewTitle}`}>
            <span key={remaining} className={rolled ? 'roll' : undefined}>{remaining}</span>
          </p>
          <div className="head">
            <h1><span className="sr-only">Tasks, </span>{weekday}<br />{dayMonth}</h1>
            <p className="sub">
              {hello}.{' '}
              {tasks.length === 0 ? 'Add a task to get started.'
                : allActive === 0 ? 'Everything is done.'
                : <>{count(allActive, 'task')} to do{overdue > 0 && <>, <strong>{overdue} overdue</strong></>}.</>}
              {overdue > 0 && <>{' '}<button type="button" className="field-link" onClick={moveOverdueToToday}>Move to today</button></>}
            </p>
            <TaskForm onAdd={handleAdd} />
          </div>
        </div>
      </header>

      <main className="sheet" inert={menu}>
        <section className="panel" aria-labelledby="view-title">
          <div className="sheet-head">
          <div className="panel-head">
            <h2 className="view-title" id="view-title">{viewTitle}</h2>
            <span className={`badge${view === 'today' && viewCounts.today > 0 ? ' sun' : ''}`}>
              {remaining}<span className="sr-only"> to do</span>
            </span>
          </div>
          <Filters filter={filter} counts={counts} onFilter={setFilter} query={query} onQuery={setQuery}
            sort={sort} onSort={setSort} searchRef={searchRef} />
          </div>
          <ul className="list" ref={listRef}>
            {visible.map((t, i) => {
              const when = whens[i];
              const first = i === 0 || whens[i - 1] !== when;
              return (
                <TaskItem
                  key={t.id}
                  task={t}
                  when={when}
                  first={first}
                  whenCount={first ? count(runCounts.get(i) ?? 1, 'task') : undefined}
                  list={currentListId ? undefined : lists.find((l) => l.id === t.listId)}
                  query={deferredQuery}
                  draggable={canDrag || (sort === 'due' && !t.done)}
                  onToggle={handleToggle}
                  onDelete={handleDelete}
                  onEdit={(id, text) => dispatch({ type: 'edit', id, text })}
                  onOpen={setOpenId}
                  onMove={(from, to) => (sort === 'due' ? reschedule(from, to) : dispatch({ type: 'move', from, to }))}
                  onQuick={quick}
                  onNudge={nudge}
                />
              );
            })}
          </ul>
          {visible.length === 0 && (
            <EmptyState kind={emptyKind} listName={currentListId ? viewTitle : undefined}
              query={query.trim()} onClearSearch={() => setQuery('')} />
          )}
          {totalDone > 0 && (
            <div className="foot">
              <button className="link" type="button" onClick={clearCompleted}>Clear completed</button>
            </div>
          )}
        </section>
        <p className="sr-only" role="status">{status}</p>
      </main>

      <Colophon accent={accent} onAccent={setAccent} onExport={exportData} onImport={importData} modKey={MOD_KEY} inert={menu} />

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
          onMove={(dir) => nudge(openTask.id, dir, false)}
          canMove={canDrag}
        />
      )}
      {undo && <Toast key={undo.id} message={undo.message} onUndo={handleUndo} onDismiss={() => setUndo(null)} />}
      {palette && <Palette items={paletteItems} onClose={() => setPalette(false)} />}
    </div>
  );
}
