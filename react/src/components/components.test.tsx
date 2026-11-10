// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Task } from '../types';
import Drawer from './Drawer';
import Palette from './Palette';
import TaskItem from './TaskItem';

const base: Task = { id: 't1', text: 'Write report', priority: 'high', done: false };
const noop = () => {};

beforeEach(() => {
  // "reduce" makes the drawer skip its closing animation, so tests do not wait for it
  vi.stubGlobal('matchMedia', (q: string) => ({ matches: q.includes('reduce'), addEventListener: noop, removeEventListener: noop }));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

function DrawerHarness({ task = base, onUpdate = noop }: { task?: Task; onUpdate?: (p: Partial<Task>) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>opener</button>
      <button>behind the overlay</button>
      {open && (
        <Drawer task={task} lists={[]} onClose={() => setOpen(false)} onUpdate={onUpdate}
          onAddSub={noop} onToggleSub={noop} onDeleteSub={noop} onDelete={noop} />
      )}
    </>
  );
}

function openDrawer(props?: Parameters<typeof DrawerHarness>[0]) {
  render(<DrawerHarness {...props} />);
  const opener = screen.getByText('opener');
  opener.focus();
  fireEvent.click(opener);
  return { opener, dialog: screen.getByRole('dialog') };
}

describe('Drawer focus management', () => {
  it('is a modal dialog and moves focus inside when it opens', () => {
    const { dialog } = openDrawer();
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('traps Tab and Shift+Tab inside the drawer', () => {
    const { dialog } = openDrawer();
    const first = screen.getByLabelText('Close details');
    const last = screen.getByText('Delete task');
    last.focus();
    fireEvent.keyDown(last, { key: 'Tab' });
    expect(document.activeElement).toBe(first);
    fireEvent.keyDown(first, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
    // focus that escaped (e.g. by a click on the page) is pulled back in on the next Tab
    screen.getByText('behind the overlay').focus();
    fireEvent.keyDown(document.activeElement!, { key: 'Tab' });
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('returns focus to the element that opened it', async () => {
    const { opener } = openDrawer();
    fireEvent.click(screen.getByLabelText('Close details'));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.activeElement).toBe(opener);
  });

  it('saves a title that is still being typed when Escape closes the drawer', async () => {
    const onUpdate = vi.fn();
    openDrawer({ onUpdate });
    const title = screen.getByLabelText('Title');
    fireEvent.change(title, { target: { value: 'Write the full report' } });
    fireEvent.keyDown(title, { key: 'Escape' });
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(onUpdate).toHaveBeenCalledWith({ text: 'Write the full report' });
  });

  it('saves the title on Enter', () => {
    const onUpdate = vi.fn();
    openDrawer({ onUpdate });
    const title = screen.getByLabelText('Title');
    fireEvent.change(title, { target: { value: 'Renamed' } });
    fireEvent.keyDown(title, { key: 'Enter' });
    expect(onUpdate).toHaveBeenCalledWith({ text: 'Renamed' });
  });

  it('only offers Repeat once the task has a due date', () => {
    openDrawer();
    expect((screen.getByLabelText(/^Repeat/) as HTMLSelectElement).disabled).toBe(true);
    cleanup();
    openDrawer({ task: { ...base, dueDate: '2026-11-10' } });
    expect((screen.getByLabelText(/^Repeat/) as HTMLSelectElement).disabled).toBe(false);
  });

  it('locks page scrolling while open and releases it afterwards', async () => {
    openDrawer();
    expect(document.body.classList.contains('locked')).toBe(true);
    fireEvent.click(screen.getByLabelText('Close details'));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.body.classList.contains('locked')).toBe(false);
  });
});

describe('Command palette', () => {
  const items = [
    { id: 'a', label: 'New task', run: vi.fn() },
    { id: 'b', label: 'Go to Today', run: vi.fn() },
    { id: 'c', label: 'Go to Overdue', run: vi.fn() },
  ];

  it('closes only itself on Escape when it is open on top of the drawer', async () => {
    const closeDrawer = vi.fn();
    const closePalette = vi.fn();
    render(
      <>
        <Drawer task={base} lists={[]} onClose={closeDrawer} onUpdate={noop} onAddSub={noop} onToggleSub={noop} onDeleteSub={noop} onDelete={noop} />
        <Palette items={items} onClose={closePalette} />
      </>,
    );
    fireEvent.keyDown(screen.getByRole('combobox', { name: 'Command' }), { key: 'Escape' });
    await act(() => new Promise((r) => setTimeout(r, 20)));
    expect(closePalette).toHaveBeenCalledTimes(1);
    expect(closeDrawer).not.toHaveBeenCalled();
  });

  it('exposes the results as a listbox and announces the active option', () => {
    render(<Palette items={items} onClose={noop} />);
    const input = screen.getByRole('combobox');
    expect(document.activeElement).toBe(input);
    const options = screen.getAllByRole('option');
    expect(options).toHaveLength(3);
    expect(input.getAttribute('aria-controls')).toBe(screen.getByRole('listbox').id);
    expect(input.getAttribute('aria-activedescendant')).toBe(options[0].id);
    expect(options[0].getAttribute('aria-selected')).toBe('true');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    expect(input.getAttribute('aria-activedescendant')).toBe(options[1].id);
    expect(options[1].getAttribute('aria-selected')).toBe('true');
    expect(options[0].getAttribute('aria-selected')).toBe('false');
  });

  it('keeps Tab inside and restores focus to the opener when closed', () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return <><button onClick={() => setOpen(true)}>opener</button>{open && <Palette items={items} onClose={() => setOpen(false)} />}</>;
    }
    render(<Harness />);
    const opener = screen.getByText('opener');
    opener.focus();
    fireEvent.click(opener);
    const input = screen.getByRole('combobox');
    fireEvent.keyDown(input, { key: 'Tab' });
    expect(document.activeElement).toBe(input);
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(document.activeElement).toBe(opener);
  });

  it('runs the chosen command on Enter and closes', () => {
    const onClose = vi.fn();
    render(<Palette items={items} onClose={onClose} />);
    const input = screen.getByRole('combobox');
    fireEvent.change(input, { target: { value: 'overdue' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(items[2].run).toHaveBeenCalledTimes(1);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('TaskItem', () => {
  const handlers = () => ({ onToggle: vi.fn(), onDelete: vi.fn(), onEdit: vi.fn(), onOpen: vi.fn(), onMove: vi.fn(), onNudge: vi.fn() });
  function renderItem(task: Task = base, extra: { query?: string; draggable?: boolean } = {}) {
    const h = handlers();
    const { container } = render(<ul><TaskItem task={task} draggable={extra.draggable ?? true} query={extra.query} {...h} /></ul>);
    return { h, li: container.querySelector('li')!, text: container.querySelector('.text') as HTMLElement };
  }
  const drag = (types: string[], data: Record<string, string> = {}) => ({
    dataTransfer: { types, getData: (t: string) => data[t] ?? '', setData: noop, effectAllowed: '', dropEffect: '' },
  });

  it('puts focus back on the task after an inline edit, and saves once', () => {
    const { h, text } = renderItem();
    text.focus();
    fireEvent.keyDown(text, { key: 'F2' });
    const input = screen.getByLabelText('Edit task');
    fireEvent.change(input, { target: { value: 'Write the report' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(h.onEdit).toHaveBeenCalledTimes(1);
    expect(h.onEdit).toHaveBeenCalledWith('t1', 'Write the report');
    expect(document.activeElement?.className).toBe('text');
  });

  it('cancels an inline edit on Escape without saving and keeps focus on the task', () => {
    const { h, text } = renderItem();
    fireEvent.doubleClick(text);
    const input = screen.getByLabelText('Edit task');
    fireEvent.change(input, { target: { value: 'Discard me' } });
    fireEvent.keyDown(input, { key: 'Escape' });
    expect(h.onEdit).not.toHaveBeenCalled();
    expect(screen.getByText('Write report')).toBe(document.activeElement);
  });

  it('reorders with Alt+Arrow from anywhere in the row, not only from the title', () => {
    const { h } = renderItem();
    fireEvent.keyDown(screen.getByRole('checkbox'), { key: 'ArrowDown', altKey: true });
    expect(h.onNudge).toHaveBeenLastCalledWith('t1', 1);
    fireEvent.keyDown(screen.getByLabelText('Delete "Write report"'), { key: 'ArrowUp', altKey: true });
    expect(h.onNudge).toHaveBeenLastCalledWith('t1', -1);
    fireEvent.keyDown(screen.getByRole('checkbox'), { key: 'ArrowDown' }); // no Alt: not a reorder
    expect(h.onNudge).toHaveBeenCalledTimes(2);
  });

  it('keeps the drop highlight steady while the pointer crosses child elements', () => {
    const { li, text } = renderItem();
    const task = drag(['application/x-task']);
    fireEvent.dragEnter(li, task);
    expect(li.classList.contains('over')).toBe(true);
    // the pointer moves from the row's padding onto its title: browsers fire enter(child), then leave(row)
    fireEvent.dragEnter(text, task);
    fireEvent.dragLeave(li, task);
    expect(li.classList.contains('over')).toBe(true);
    // and it only clears once the pointer has left the row altogether
    fireEvent.dragLeave(text, task);
    expect(li.classList.contains('over')).toBe(false);
  });

  it('ignores drags that are not tasks (files, selected text, links)', () => {
    const { h, li } = renderItem();
    fireEvent.dragEnter(li, drag(['Files']));
    fireEvent.dragOver(li, drag(['Files']));
    expect(li.classList.contains('over')).toBe(false);
    fireEvent.drop(li, drag(['text/plain'], { 'text/plain': 'some selected text' }));
    expect(h.onMove).not.toHaveBeenCalled();
  });

  it('moves the dragged task onto the drop target', () => {
    const { h, li } = renderItem();
    fireEvent.drop(li, drag(['application/x-task'], { 'application/x-task': 't9' }));
    expect(h.onMove).toHaveBeenCalledWith('t9', 't1');
    expect(li.classList.contains('over')).toBe(false);
  });

  it('does not accept drops while manual ordering is off', () => {
    const { h, li } = renderItem(base, { draggable: false });
    fireEvent.dragEnter(li, drag(['application/x-task']));
    fireEvent.dragOver(li, drag(['application/x-task']));
    expect(li.classList.contains('over')).toBe(false);
    fireEvent.drop(li, drag(['application/x-task'], { 'application/x-task': 't9' }));
    expect(h.onMove).not.toHaveBeenCalled();
  });

  it('marks overdue with an icon and words, never by colour alone', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 10, 12));
    const { li } = renderItem({ ...base, dueDate: '2026-11-07' });
    const chip = li.querySelector('.overdue')!;
    expect(chip.textContent).toBe('3 days overdue');
    expect(chip.querySelector('svg')).not.toBeNull();
    expect(li.textContent).toContain('High');
  });

  it('does not call a finished task overdue', () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 10, 10, 12));
    const { li } = renderItem({ ...base, done: true, dueDate: '2026-11-07' });
    expect(li.querySelector('.overdue')).toBeNull();
    expect(li.textContent).not.toMatch(/overdue/i);
  });

  it('only shows the repeat label when the task can actually repeat', () => {
    expect(renderItem({ ...base, repeat: 'weekly' }).li.textContent).not.toMatch(/repeats/i);
    cleanup();
    expect(renderItem({ ...base, repeat: 'weekly', dueDate: '2030-01-01' }).li.textContent).toMatch(/Repeats weekly/);
  });

  it('highlights search matches, including queries with regex characters', () => {
    const { li } = renderItem({ ...base, text: 'Pay rent (flat) + bills' }, { query: 'RENT' });
    expect(li.querySelector('mark')?.textContent).toBe('rent');
    cleanup();
    const special = renderItem({ ...base, text: 'Pay rent (flat) + bills' }, { query: '(flat) +' });
    expect(special.li.querySelector('mark')?.textContent).toBe('(flat) +');
    expect(special.li.querySelector('.text')?.textContent).toBe('Pay rent (flat) + bills');
  });
});
