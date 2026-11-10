(() => {
  'use strict';

  const STORAGE_KEY = 'todo-app:v1';
  const PRIORITY_LABEL = { low: 'Low', med: 'Medium', high: 'High' };
  const $ = (id) => document.getElementById(id);
  const els = {
    form: $('add-form'), input: $('new-task'), priority: $('priority'),
    list: $('list'), empty: $('empty'), emptyTitle: $('empty-title'), emptyText: $('empty-text'),
    count: $('count'), clear: $('clear'), error: $('error'), today: $('today'), status: $('status'),
    filters: document.querySelectorAll('[data-filter]'),
  };

  let tasks = load();
  let filter = 'all';

  // ---------- storage ----------
  // Stored data is never trusted: anything that is not a usable task is skipped, and the fields
  // this app reads are repaired. Other fields (written by the React version) are kept as they are.
  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (!Array.isArray(data)) return [];
      const seen = new Set();
      return data
        .filter((t) => t && typeof t === 'object' && typeof t.id === 'string' && t.id
          && typeof t.text === 'string' && t.text.trim() && !seen.has(t.id) && seen.add(t.id))
        .map((t) => ({ ...t, text: t.text.trim(), priority: PRIORITY_LABEL[t.priority] ? t.priority : 'med', done: t.done === true }));
    } catch {
      return []; // corrupted or blocked storage: start fresh
    }
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); } catch { /* storage full/blocked */ }
  }
  // crypto.randomUUID needs a secure context (https or localhost), so keep a fallback.
  function uid() {
    return crypto.randomUUID ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
  }

  // ---------- state changes ----------
  function addTask(text, priority) {
    tasks.unshift({ id: uid(), text, priority, done: false });
    commit({ newId: tasks[0].id, say: `Added "${text}"` });
  }
  function toggleTask(id) {
    const t = tasks.find((t) => t.id === id);
    if (!t) return;
    t.done = !t.done;
    commit({ tickedId: t.done ? id : null, say: `"${t.text}" ${t.done ? 'completed' : 'marked as not done'}` });
  }
  function deleteTask(id) {
    const t = tasks.find((t) => t.id === id);
    tasks = tasks.filter((t) => t.id !== id);
    commit({ say: t ? `Deleted "${t.text}"` : '' });
  }
  function updateText(id, text) {
    const t = tasks.find((t) => t.id === id);
    if (t && text) t.text = text;
    commit({ focus: { id, part: 'text' } });
  }
  function commit(opts = {}) {
    save();
    render(opts);
    if (opts.say) els.status.textContent = opts.say;
  }

  // ---------- rendering ----------
  function visibleTasks() {
    if (filter === 'active') return tasks.filter((t) => !t.done);
    if (filter === 'done') return tasks.filter((t) => t.done);
    return tasks;
  }

  // The list is rebuilt on every change, which would drop keyboard focus. So remember which
  // control of which task had focus, and give it back afterwards (or to the nearest neighbour).
  function focusedPart() {
    const el = document.activeElement;
    const li = el && el.closest ? el.closest('#list .item') : null;
    if (!li) return null;
    return { id: li.dataset.id, part: el.className.split(' ')[0], index: [...els.list.children].indexOf(li) };
  }
  function restoreFocus(target) {
    if (!target) return;
    const rows = [...els.list.children];
    const row = rows.find((li) => li.dataset.id === target.id) || rows[Math.min(target.index ?? 0, rows.length - 1)];
    const el = row ? row.querySelector(`.${target.part}`) || row.querySelector('.text') : els.input;
    el.focus();
  }

  function render({ newId, tickedId, focus } = {}) {
    const target = focus || focusedPart();
    const visible = visibleTasks();
    els.list.replaceChildren(...visible.map((t) => buildItem(t, t.id === newId, t.id === tickedId)));

    const left = tasks.filter((t) => !t.done).length;
    els.count.textContent = `${left} ${left === 1 ? 'task' : 'tasks'} left`;
    els.clear.hidden = !tasks.some((t) => t.done);

    const msgs = {
      all: ['A clean slate', 'Add your first task above.'],
      active: ['All caught up', 'No active tasks left.'],
      done: ['Nothing completed yet', 'Tick a task off and it shows up here.'],
    };
    els.empty.hidden = visible.length > 0;
    [els.emptyTitle.textContent, els.emptyText.textContent] = msgs[filter];
    restoreFocus(target);
  }

  const SVG_NS = 'http://www.w3.org/2000/svg';
  function crossIcon() {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 20 20');
    svg.setAttribute('width', '18');
    svg.setAttribute('height', '18');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', 'M5 5l10 10M15 5L5 15');
    path.setAttribute('stroke', 'currentColor');
    path.setAttribute('stroke-width', '1.8');
    path.setAttribute('stroke-linecap', 'round');
    svg.append(path);
    return svg;
  }

  // Built with DOM APIs + textContent so user input is never parsed as HTML (no XSS).
  function buildItem(task, isNew, isTicked) {
    const li = document.createElement('li');
    li.className = 'item' + (task.done ? ' done' : '') + (isNew ? ' enter' : '') + (isTicked ? ' ticked' : '');
    li.dataset.id = task.id;

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.className = 'check';
    box.checked = task.done;
    box.setAttribute('aria-label', `Mark "${task.text}" as ${task.done ? 'not done' : 'done'}`);
    box.addEventListener('change', () => toggleTask(task.id));

    const text = document.createElement('span');
    text.className = 'text';
    text.textContent = task.text;
    text.tabIndex = 0;
    text.addEventListener('dblclick', () => startEdit(li, task));
    text.addEventListener('keydown', (e) => { if (e.key === 'F2') startEdit(li, task); });

    // Priority is written out as a labelled pill, so colour never carries the meaning alone.
    const pill = document.createElement('span');
    pill.className = `pill prio-${task.priority}`;
    pill.textContent = PRIORITY_LABEL[task.priority];

    const body = document.createElement('div');
    body.className = 'body';
    body.append(text, pill);

    const del = document.createElement('button');
    del.className = 'del';
    del.type = 'button';
    del.append(crossIcon());
    del.setAttribute('aria-label', `Delete "${task.text}"`);
    del.addEventListener('click', () => deleteTask(task.id));

    li.append(box, body, del);
    return li;
  }

  function startEdit(li, task) {
    const textEl = li.querySelector('.text');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'edit';
    input.value = task.text;
    input.maxLength = 120;
    input.setAttribute('aria-label', 'Edit task');
    textEl.replaceWith(input);
    input.focus();
    input.select();

    let finished = false;
    const finish = (saveIt, viaKeyboard) => {
      if (finished) return;
      finished = true;
      const focus = viaKeyboard ? { id: task.id, part: 'text' } : null;
      saveIt ? updateText(task.id, input.value.trim()) : render({ focus });
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') finish(true, true);
      if (e.key === 'Escape') finish(false, true);
    });
    input.addEventListener('blur', () => finish(true, false));
  }

  // ---------- events ----------
  function showError(message) {
    els.error.textContent = message;
    els.error.hidden = !message;
    if (message) els.input.setAttribute('aria-invalid', 'true');
    else els.input.removeAttribute('aria-invalid');
  }

  els.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = els.input.value.trim();
    if (!text) {
      showError('Enter a task before adding it.');
      els.input.focus();
      return;
    }
    showError('');
    addTask(text, els.priority.value);
    els.input.value = '';
    els.input.focus();
  });
  els.input.addEventListener('input', () => showError(''));

  els.filters.forEach((btn) =>
    btn.addEventListener('click', () => {
      filter = btn.dataset.filter;
      els.filters.forEach((b) => {
        const on = b === btn;
        b.classList.toggle('on', on);
        b.setAttribute('aria-pressed', String(on));
      });
      render();
    })
  );

  els.clear.addEventListener('click', () => {
    const cleared = tasks.filter((t) => t.done).length;
    tasks = tasks.filter((t) => !t.done);
    commit({ say: `${cleared} completed ${cleared === 1 ? 'task' : 'tasks'} cleared` });
    els.input.focus(); // the button hides itself, so move focus somewhere that still exists
  });

  // ---------- init ----------
  els.today.textContent = new Date().toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  render();
})();
