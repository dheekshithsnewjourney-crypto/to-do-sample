(() => {
  'use strict';

  const STORAGE_KEY = 'todo-app:v1';
  const $ = (id) => document.getElementById(id);
  const els = {
    form: $('add-form'), input: $('new-task'), priority: $('priority'),
    list: $('list'), empty: $('empty'), count: $('count'),
    clear: $('clear'), error: $('error'), today: $('today'),
    filters: document.querySelectorAll('[data-filter]'),
  };

  let tasks = load();
  let filter = 'all';

  // ---------- storage ----------
  function load() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
      return Array.isArray(data) ? data : [];
    } catch {
      return []; // corrupted or blocked storage: start fresh
    }
  }
  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); } catch { /* storage full/blocked */ }
  }

  // ---------- state changes ----------
  function addTask(text, priority) {
    tasks.unshift({ id: crypto.randomUUID(), text, priority, done: false });
    commit(tasks[0].id);
  }
  function toggleTask(id) {
    const t = tasks.find((t) => t.id === id);
    if (t) t.done = !t.done;
    commit();
  }
  function deleteTask(id) {
    tasks = tasks.filter((t) => t.id !== id);
    commit();
  }
  function updateText(id, text) {
    const t = tasks.find((t) => t.id === id);
    if (t && text) t.text = text;
    commit();
  }
  function commit(newId) {
    save();
    render(newId);
  }

  // ---------- rendering ----------
  function visibleTasks() {
    if (filter === 'active') return tasks.filter((t) => !t.done);
    if (filter === 'done') return tasks.filter((t) => t.done);
    return tasks;
  }

  function render(newId) {
    els.list.replaceChildren(...visibleTasks().map((t) => buildItem(t, t.id === newId)));

    const left = tasks.filter((t) => !t.done).length;
    els.count.textContent = `${left} ${left === 1 ? 'task' : 'tasks'} left`;
    els.clear.hidden = !tasks.some((t) => t.done);

    const msgs = {
      all: 'Nothing here yet. Add your first task above.',
      active: 'All caught up. No active tasks.',
      done: 'No completed tasks yet.',
    };
    els.empty.hidden = visibleTasks().length > 0;
    els.empty.textContent = msgs[filter];
  }

  // Built with DOM APIs + textContent so user input is never parsed as HTML (no XSS).
  function buildItem(task, isNew) {
    const li = document.createElement('li');
    li.className = 'item' + (task.done ? ' done' : '') + (isNew ? ' enter' : '');
    li.dataset.priority = task.priority;

    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = task.done;
    box.setAttribute('aria-label', `Mark "${task.text}" as ${task.done ? 'not done' : 'done'}`);
    box.addEventListener('change', () => toggleTask(task.id));

    const text = document.createElement('span');
    text.className = 'text';
    text.textContent = task.text;
    text.tabIndex = 0;
    text.addEventListener('dblclick', () => startEdit(li, task));
    text.addEventListener('keydown', (e) => { if (e.key === 'F2') startEdit(li, task); });

    const del = document.createElement('button');
    del.className = 'del';
    del.type = 'button';
    del.textContent = '×';
    del.setAttribute('aria-label', `Delete "${task.text}"`);
    del.addEventListener('click', () => deleteTask(task.id));

    li.append(box, text, del);
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
    const finish = (saveIt) => {
      if (finished) return;
      finished = true;
      saveIt ? updateText(task.id, input.value.trim()) : render();
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') finish(true);
      if (e.key === 'Escape') finish(false);
    });
    input.addEventListener('blur', () => finish(true));
  }

  // ---------- events ----------
  els.form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = els.input.value.trim();
    if (!text) {
      els.error.textContent = 'Enter a task before adding it.';
      els.error.hidden = false;
      els.input.focus();
      return;
    }
    els.error.hidden = true;
    addTask(text, els.priority.value);
    els.input.value = '';
    els.input.focus();
  });

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
    tasks = tasks.filter((t) => !t.done);
    commit();
  });

  // ---------- init ----------
  els.today.textContent = new Date().toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'long',
  });
  render();
})();
