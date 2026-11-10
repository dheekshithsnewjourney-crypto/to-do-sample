import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_LISTS, loadLists, loadTasks, parseBackup, sanitizeLists, sanitizeTasks } from './storage';

describe('parseBackup', () => {
  it('accepts a valid backup and fills in defaults', () => {
    const out = parseBackup(JSON.stringify({ tasks: [{ id: 'a', text: 'Hi' }], lists: [{ id: 'l', name: 'Home' }] }));
    expect(out?.tasks[0]).toMatchObject({ id: 'a', priority: 'med', done: false });
    expect(out?.lists[0].color).toBeTruthy();
  });

  it('rejects malformed input', () => {
    expect(parseBackup('not json')).toBeNull();
    expect(parseBackup('{"tasks": 5}')).toBeNull();
    expect(parseBackup('{"tasks":[{"id":1}]}')).toBeNull();
  });

  it('rejects files that are not a backup object at all', () => {
    expect(parseBackup('null')).toBeNull();
    expect(parseBackup('[]')).toBeNull();
    expect(parseBackup('"tasks"')).toBeNull();
    expect(parseBackup('{"tasks":[null]}')).toBeNull();
    expect(parseBackup('{"tasks":[{"id":"a","text":"   "}]}')).toBeNull();
    expect(parseBackup('{"tasks":[{"id":"","text":"No id"}]}')).toBeNull();
  });

  it('cleans every field instead of trusting the file', () => {
    const out = parseBackup(JSON.stringify({
      tasks: [{
        id: 'a', text: '  Trim me  ', priority: 'urgent', done: 'yes', dueDate: 20261105, notes: { html: '<b>' },
        listId: 'l', repeat: 'hourly', subtasks: 'nope', __proto__pollution: true, onclick: 'alert(1)',
      }],
      lists: [{ id: 'l', name: 'Home' }],
    }));
    expect(out?.tasks).toEqual([{ id: 'a', text: 'Trim me', priority: 'med', done: false, listId: 'l' }]);
  });

  it('keeps valid optional fields', () => {
    const task = {
      id: 'a', text: 'Gym', priority: 'high', done: true, dueDate: '2026-11-05', notes: 'Bring towel', listId: 'l',
      repeat: 'weekly', subtasks: [{ id: 's1', text: 'Warm up', done: true }],
    };
    const out = parseBackup(JSON.stringify({ tasks: [task], lists: [{ id: 'l', name: 'Home', color: '#FFC53D' }] }));
    expect(out?.tasks[0]).toEqual(task);
    expect(out?.lists).toEqual([{ id: 'l', name: 'Home', color: '#FFC53D' }]);
  });

  it('drops impossible dates and broken subtasks but keeps the task', () => {
    const out = parseBackup(JSON.stringify({
      tasks: [{
        id: 'a', text: 'Trip', dueDate: '2026-02-30', repeat: 'daily',
        subtasks: [{ id: 's1', text: 'Pack', done: 1 }, null, { id: 's1', text: 'Duplicate id' }, { id: 's3', text: '' }, { text: 'No id' }],
      }],
    }));
    expect(out?.tasks[0]).toEqual({ id: 'a', text: 'Trip', priority: 'med', done: false, subtasks: [{ id: 's1', text: 'Pack', done: false }] });
  });

  it('removes duplicate task ids and list references that point nowhere', () => {
    const out = parseBackup(JSON.stringify({
      tasks: [{ id: 'a', text: 'First', listId: 'gone' }, { id: 'a', text: 'Second copy' }, { id: 'b', text: 'Other', listId: 'l' }],
      lists: [{ id: 'l', name: 'Home' }, { id: 'l', name: 'Same id again' }, { id: 7, name: 'Bad id' }, { id: 'x', name: '   ' }],
    }));
    expect(out?.tasks).toEqual([
      { id: 'a', text: 'First', priority: 'med', done: false },
      { id: 'b', text: 'Other', priority: 'med', done: false, listId: 'l' },
    ]);
    expect(out?.lists.map((l) => l.id)).toEqual(['l']);
  });

  it('never lets a list colour through that is not a plain hex colour', () => {
    const out = parseBackup(JSON.stringify({ tasks: [], lists: [{ id: 'l', name: 'Home', color: 'url(javascript:alert(1))' }] }));
    expect(out?.lists[0].color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('respects a backup with no lists, and falls back to the defaults only when the key is missing', () => {
    expect(parseBackup('{"tasks":[],"lists":[]}')?.lists).toEqual([]);
    expect(parseBackup('{"tasks":[]}')?.lists).toEqual(DEFAULT_LISTS);
  });
});

describe('sanitizeTasks / sanitizeLists', () => {
  it('returns an empty array for anything that is not an array', () => {
    for (const bad of [null, undefined, 5, 'x', {}, true]) {
      expect(sanitizeTasks(bad)).toEqual([]);
      expect(sanitizeLists(bad)).toEqual([]);
    }
  });
  it('skips entries that cannot be repaired', () => {
    expect(sanitizeTasks([null, 5, 'x', [], { id: 1, text: 'n' }, { id: 'ok', text: 'Keep' }, { id: 'no-text' }])).toEqual([
      { id: 'ok', text: 'Keep', priority: 'med', done: false },
    ]);
  });
});

describe('loading from localStorage', () => {
  let store: Record<string, string>;
  beforeEach(() => {
    store = {};
    vi.stubGlobal('localStorage', {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => { store[k] = v; },
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('starts empty with the default lists when nothing is stored', () => {
    expect(loadTasks()).toEqual([]);
    expect(loadLists()).toEqual(DEFAULT_LISTS);
  });

  it('survives corrupted JSON', () => {
    store['todo-app:v1'] = '{"oops';
    store['todo-lists:v1'] = 'undefined';
    expect(loadTasks()).toEqual([]);
    expect(loadLists()).toEqual(DEFAULT_LISTS);
  });

  it('survives arrays full of junk (this used to crash the app on load)', () => {
    store['todo-app:v1'] = JSON.stringify([null, { id: 1 }, 'x', { id: 'a', text: 'Real', dueDate: 5, subtasks: {} }]);
    store['todo-lists:v1'] = JSON.stringify([null, { id: 'l' }, { id: 'home', name: 'Home' }]);
    expect(loadTasks()).toEqual([{ id: 'a', text: 'Real', priority: 'med', done: false }]);
    expect(loadLists().map((l) => l.id)).toEqual(['home']);
  });

  it('loads data written by the first version of the app (id, text, priority, done only)', () => {
    store['todo-app:v1'] = JSON.stringify([{ id: 'old', text: 'From v1', priority: 'high', done: true }]);
    expect(loadTasks()).toEqual([{ id: 'old', text: 'From v1', priority: 'high', done: true }]);
  });

  it('keeps an intentionally empty list of lists', () => {
    store['todo-lists:v1'] = '[]';
    expect(loadLists()).toEqual([]);
  });

  it('unassigns tasks whose list no longer exists', () => {
    store['todo-app:v1'] = JSON.stringify([{ id: 'a', text: 'Orphan', listId: 'deleted' }, { id: 'b', text: 'Fine', listId: 'work' }]);
    const tasks = loadTasks(DEFAULT_LISTS);
    expect(tasks[0].listId).toBeUndefined();
    expect(tasks[1].listId).toBe('work');
  });

  it('falls back to memory when storage throws', () => {
    vi.stubGlobal('localStorage', { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('full'); } });
    expect(loadTasks()).toEqual([]);
    expect(loadLists()).toEqual(DEFAULT_LISTS);
  });
});
