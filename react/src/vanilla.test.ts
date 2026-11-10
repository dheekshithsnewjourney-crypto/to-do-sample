// @vitest-environment jsdom
// The vanilla app has no build step, so it is tested here by loading its real HTML and script into jsdom.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';

const dir = resolve(process.cwd(), '../vanilla');
const html = readFileSync(resolve(dir, 'index.html'), 'utf8');
const script = readFileSync(resolve(dir, 'script.js'), 'utf8');

function boot(stored?: unknown) {
  localStorage.clear();
  if (stored !== undefined) localStorage.setItem('todo-app:v1', typeof stored === 'string' ? stored : JSON.stringify(stored));
  document.body.innerHTML = /<body>([\s\S]*)<script/.exec(html)![1];
  (0, eval)(script);
}
const $ = <T extends HTMLElement>(sel: string) => document.querySelector<T>(sel)!;
const texts = () => [...document.querySelectorAll('#list .text')].map((n) => n.textContent);
const submit = (value: string) => {
  $<HTMLInputElement>('#new-task').value = value;
  $<HTMLFormElement>('#add-form').dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
};

describe('vanilla app', () => {
  beforeEach(() => boot());

  it('adds a task and shows its priority as a text label, not only a colour', () => {
    $<HTMLSelectElement>('#priority').value = 'high';
    submit('Buy milk');
    expect(texts()).toEqual(['Buy milk']);
    expect($('#list .pill').textContent).toBe('High');
    expect($('#count').textContent).toBe('1 task left');
  });

  it('survives junk in localStorage instead of crashing on load', () => {
    expect(() => boot([null, 5, { id: 7, text: 'bad id' }, { id: 'a', text: 'Real', priority: 'urgent', done: 'yes' }])).not.toThrow();
    expect(texts()).toEqual(['Real']);
    expect($('#list .pill').textContent).toBe('Medium');
    expect($<HTMLInputElement>('#list .check').checked).toBe(false);
    expect(() => boot('{"not": "an array"}')).not.toThrow();
    expect(() => boot('{{{{')).not.toThrow();
    expect(texts()).toEqual([]);
  });

  it('keeps extra fields written by the React app when it saves', () => {
    boot([{ id: 'a', text: 'Shared', priority: 'low', done: false, dueDate: '2026-11-10', notes: 'keep me' }]);
    $<HTMLInputElement>('#list .check').click();
    expect(JSON.parse(localStorage.getItem('todo-app:v1')!)[0]).toEqual({ id: 'a', text: 'Shared', priority: 'low', done: true, dueDate: '2026-11-10', notes: 'keep me' });
  });

  it('shows the error for empty and whitespace-only input, and clears it on typing', () => {
    const error = $('#error');
    submit('');
    expect(error.hidden).toBe(false);
    expect(error.textContent).toMatch(/enter a task/i);
    expect($('#new-task').getAttribute('aria-invalid')).toBe('true');
    const input = $<HTMLInputElement>('#new-task');
    input.value = 'a';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(error.hidden).toBe(true);
    expect(input.hasAttribute('aria-invalid')).toBe(false);
    submit('   ');
    expect(error.hidden).toBe(false);
    expect(texts()).toEqual([]);
  });

  it('keeps keyboard focus on the checkbox after toggling a task', () => {
    boot([{ id: 'a', text: 'One', priority: 'med', done: false }, { id: 'b', text: 'Two', priority: 'med', done: false }]);
    const box = document.querySelectorAll<HTMLInputElement>('#list .check')[1];
    box.focus();
    box.click();
    const active = document.activeElement as HTMLInputElement;
    expect(active.className).toBe('check');
    expect(active.closest('li')!.textContent).toContain('Two');
    expect(active.checked).toBe(true);
  });

  it('moves focus to a neighbouring task after a delete, or to the input when the list is empty', () => {
    boot([{ id: 'a', text: 'One', priority: 'med', done: false }, { id: 'b', text: 'Two', priority: 'med', done: false }]);
    const del = document.querySelectorAll<HTMLButtonElement>('#list .del')[0];
    del.focus();
    del.click();
    expect(texts()).toEqual(['Two']);
    expect((document.activeElement as HTMLElement).className).toBe('del');
    (document.activeElement as HTMLButtonElement).click();
    expect(document.activeElement).toBe($('#new-task'));
  });

  it('returns focus to the task title after an edit', () => {
    boot([{ id: 'a', text: 'One', priority: 'med', done: false }]);
    const text = $('#list .text');
    text.focus();
    text.dispatchEvent(new KeyboardEvent('keydown', { key: 'F2', bubbles: true }));
    const edit = $<HTMLInputElement>('#list .edit');
    edit.value = 'One, edited';
    edit.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(texts()).toEqual(['One, edited']);
    expect((document.activeElement as HTMLElement).className).toBe('text');
  });

  it('announces changes through one status region instead of re-reading the list', () => {
    expect($('#list').hasAttribute('aria-live')).toBe(false);
    submit('Buy milk');
    expect($('#status').textContent).toMatch(/added/i);
    $<HTMLInputElement>('#list .check').click();
    expect($('#status').textContent).toMatch(/completed/i);
  });

  it('works without crypto.randomUUID', () => {
    const original = crypto.randomUUID;
    // @ts-expect-error simulating a non-secure context
    crypto.randomUUID = undefined;
    try {
      submit('First');
      submit('Second');
      const ids = JSON.parse(localStorage.getItem('todo-app:v1')!).map((t: { id: string }) => t.id);
      expect(new Set(ids).size).toBe(2);
    } finally {
      crypto.randomUUID = original;
    }
  });
});
