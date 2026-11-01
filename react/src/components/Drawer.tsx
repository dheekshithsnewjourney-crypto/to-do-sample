import { FormEvent, useEffect, useState } from 'react';
import type { List, Task } from '../types';

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

export default function Drawer({ task, lists, onClose, onUpdate, onAddSub, onToggleSub, onDeleteSub, onDelete }: Props) {
  const [title, setTitle] = useState(task.text);
  const [sub, setSub] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  function addSub(e: FormEvent) {
    e.preventDefault();
    if (!sub.trim()) return;
    onAddSub(sub);
    setSub('');
  }

  const subs = task.subtasks ?? [];

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <aside className="drawer" role="dialog" aria-label="Task details">
        <div className="drawer-head">
          <h2>Task details</h2>
          <button className="icon-btn" type="button" onClick={onClose} aria-label="Close details">×</button>
        </div>

        <label htmlFor="d-title">Title</label>
        <input id="d-title" type="text" maxLength={120} value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => { onUpdate({ text: title }); if (!title.trim()) setTitle(task.text); }} />

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

        <label htmlFor="d-repeat">Repeat (needs a due date)</label>
        <select id="d-repeat" value={task.repeat ?? ''} onChange={(e) => onUpdate({ repeat: (e.target.value || undefined) as Task['repeat'] })}>
          <option value="">Does not repeat</option>
          <option value="daily">Every day</option>
          <option value="weekly">Every week</option>
          <option value="monthly">Every month</option>
        </select>

        <label htmlFor="d-notes">Notes</label>
        <textarea id="d-notes" rows={4} placeholder="Add details, links, anything" value={task.notes ?? ''} onChange={(e) => onUpdate({ notes: e.target.value })} />

        <p className="label">Subtasks {subs.length > 0 && `(${subs.filter((s) => s.done).length}/${subs.length})`}</p>
        <ul className="subs">
          {subs.map((s) => (
            <li key={s.id} className={s.done ? 'done' : ''}>
              <input className="check small" type="checkbox" checked={s.done} onChange={() => onToggleSub(s.id)} aria-label={`Mark "${s.text}" as done`} />
              <span>{s.text}</span>
              <button type="button" className="x" aria-label={`Delete subtask "${s.text}"`} onClick={() => onDeleteSub(s.id)}>×</button>
            </li>
          ))}
        </ul>
        <form onSubmit={addSub} className="sub-form">
          <label className="sr-only" htmlFor="d-sub">New subtask</label>
          <input id="d-sub" type="text" placeholder="Add a subtask and press Enter" maxLength={100} value={sub} onChange={(e) => setSub(e.target.value)} />
        </form>

        <button type="button" className="danger" onClick={onDelete}>Delete task</button>
      </aside>
    </>
  );
}
