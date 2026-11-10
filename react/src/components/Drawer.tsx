import { type FormEvent, useRef, useState } from 'react';
import { useDialog } from '../hooks';
import type { List, Task } from '../types';
import { CloseIcon, TrashIcon } from './icons';

interface Props {
  task: Task;
  lists: List[];
  onClose: () => void;
  onUpdate: (patch: Partial<Omit<Task, 'id'>>) => void;
  onAddSub: (text: string) => void;
  onToggleSub: (subId: string) => void;
  onDeleteSub: (subId: string) => void;
  onDelete: () => void;
}

const CLOSE_MS = 180; // matches the .closing animation in index.css

export default function Drawer({ task, lists, onClose, onUpdate, onAddSub, onToggleSub, onDeleteSub, onDelete }: Props) {
  const [title, setTitle] = useState(task.text);
  const [sub, setSub] = useState('');
  const [closing, setClosing] = useState(false);
  const ref = useRef<HTMLElement>(null);

  // Saves the title field. An empty title is not allowed, so it snaps back instead.
  function commitTitle() {
    const next = title.trim();
    if (!next) setTitle(task.text);
    else if (next !== task.text) onUpdate({ text: next });
  }

  // Every way of closing (Escape, overlay, button) saves the title first, then plays the
  // slide-out before unmounting. The wait is skipped when the user prefers reduced motion.
  function close() {
    if (closing) return;
    commitTitle();
    setClosing(true);
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    setTimeout(onClose, still ? 0 : CLOSE_MS);
  }

  useDialog(ref, true, close);

  function addSub(e: FormEvent) {
    e.preventDefault();
    if (!sub.trim()) return;
    onAddSub(sub);
    setSub('');
  }

  const subs = task.subtasks ?? [];
  const closingClass = closing ? ' closing' : '';

  return (
    <>
      <div className={`overlay${closingClass}`} onClick={close} />
      <aside ref={ref} className={`drawer${closingClass}`} role="dialog" aria-modal="true" aria-labelledby="drawer-title" tabIndex={-1}>
        <div className="drawer-head">
          <h2 id="drawer-title">Task details</h2>
          <button className="icon-btn" type="button" onClick={close} aria-label="Close details"><CloseIcon /></button>
        </div>

        <label htmlFor="d-title">Title</label>
        <input id="d-title" type="text" maxLength={120} value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') commitTitle(); }}
          onBlur={commitTitle} />

        <div className="grid2">
          <div>
            <label htmlFor="d-due">Due date</label>
            <input id="d-due" type="date" value={task.dueDate ?? ''} onChange={(e) => onUpdate({ dueDate: e.target.value || undefined })} />
          </div>
          <div>
            <label htmlFor="d-prio">Priority</label>
            <select id="d-prio" value={task.priority} onChange={(e) => onUpdate({ priority: e.target.value as Task['priority'] })}>
              <option value="low">Low</option>
              <option value="med">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>

        <label htmlFor="d-list">List</label>
        <select id="d-list" value={task.listId ?? ''} onChange={(e) => onUpdate({ listId: e.target.value || undefined })}>
          <option value="">No list</option>
          {lists.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
        </select>

        <label htmlFor="d-repeat">Repeat</label>
        <select id="d-repeat" value={task.repeat ?? ''} disabled={!task.dueDate} aria-describedby={task.dueDate ? undefined : 'd-repeat-hint'}
          onChange={(e) => onUpdate({ repeat: (e.target.value || undefined) as Task['repeat'] })}>
          <option value="">Does not repeat</option>
          <option value="daily">Every day</option>
          <option value="weekly">Every week</option>
          <option value="monthly">Every month</option>
        </select>
        {!task.dueDate && <p className="hint" id="d-repeat-hint">Set a due date first. Repeats count from it.</p>}

        <label htmlFor="d-notes">Notes</label>
        <textarea id="d-notes" rows={4} placeholder="Add details, links, anything" value={task.notes ?? ''} onChange={(e) => onUpdate({ notes: e.target.value })} />

        <p className="label" id="d-subs">Subtasks {subs.length > 0 && `(${subs.filter((s) => s.done).length}/${subs.length})`}</p>
        <ul className="subs" aria-labelledby="d-subs">
          {subs.map((s) => (
            <li key={s.id} className={s.done ? 'done' : ''}>
              <input className="check small" type="checkbox" checked={s.done} onChange={() => onToggleSub(s.id)} aria-label={`Mark "${s.text}" as ${s.done ? 'not done' : 'done'}`} />
              <span>{s.text}</span>
              <button type="button" className="x" aria-label={`Delete subtask "${s.text}"`} onClick={() => onDeleteSub(s.id)}><CloseIcon size={15} /></button>
            </li>
          ))}
        </ul>
        <form onSubmit={addSub} className="sub-form">
          <label className="sr-only" htmlFor="d-sub">New subtask</label>
          <input id="d-sub" type="text" placeholder="Add a subtask and press Enter" maxLength={100} value={sub} onChange={(e) => setSub(e.target.value)} />
        </form>

        <button type="button" className="danger" onClick={onDelete}><TrashIcon size={16} />Delete task</button>
      </aside>
    </>
  );
}
