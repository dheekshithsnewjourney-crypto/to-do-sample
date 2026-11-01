import { KeyboardEvent, useState } from 'react';
import { dueInfo } from '../dates';
import type { List, Task } from '../types';

interface Props {
  task: Task;
  list?: List;
  draggable: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onOpen: (id: string) => void;
  onMove: (from: string, to: string) => void;
  onNudge: (id: string, dir: -1 | 1) => void;
}

const PRIORITY_LABEL = { low: 'Low', med: 'Medium', high: 'High' } as const;

export default function TaskItem({ task, list, draggable, onToggle, onDelete, onEdit, onOpen, onMove, onNudge }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.text);
  const [over, setOver] = useState(false);
  const due = task.dueDate ? dueInfo(task.dueDate, task.done) : null;
  const subs = task.subtasks ?? [];

  function startEdit() {
    setDraft(task.text);
    setEditing(true);
  }
  function finish(save: boolean) {
    if (save) onEdit(task.id, draft);
    setEditing(false);
  }
  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') finish(true);
    if (e.key === 'Escape') finish(false);
  }

  return (
    <li
      className={`item${task.done ? ' done' : ''}${over ? ' over' : ''}${draggable ? ' drag' : ''}`}
      draggable={draggable && !editing}
      onDragStart={(e) => e.dataTransfer.setData('text/plain', task.id)}
      onDragOver={(e) => { if (draggable) { e.preventDefault(); setOver(true); } }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        const from = e.dataTransfer.getData('text/plain');
        if (from) onMove(from, task.id);
      }}
    >
      <input
        className="check"
        type="checkbox"
        checked={task.done}
        onChange={() => onToggle(task.id)}
        aria-label={`Mark "${task.text}" as ${task.done ? 'not done' : 'done'}`}
      />
      <div className="body">
        {editing ? (
          <input className="edit" type="text" autoFocus maxLength={120} value={draft} aria-label="Edit task"
            onChange={(e) => setDraft(e.target.value)} onKeyDown={onKey} onBlur={() => finish(true)} />
        ) : (
          <span className="text" tabIndex={0} onDoubleClick={startEdit} onKeyDown={(e) => {
            if (e.key === 'F2') startEdit();
            if (e.altKey && e.key === 'ArrowUp') { e.preventDefault(); onNudge(task.id, -1); }
            if (e.altKey && e.key === 'ArrowDown') { e.preventDefault(); onNudge(task.id, 1); }
          }}>
            {task.text}
          </span>
        )}
        <div className="meta">
          <span className={`chip prio-${task.priority}`}>{PRIORITY_LABEL[task.priority]}</span>
          {due && <span className={`chip due-${due.tone}`}>{due.label}</span>}
          {list && <span className="chip"><i className="dot" style={{ background: list.color }} />{list.name}</span>}
          {subs.length > 0 && <span className="chip">{subs.filter((s) => s.done).length}/{subs.length} steps</span>}
          {task.notes && <span className="chip">Note</span>}
          {task.repeat && <span className="chip">Repeats {task.repeat}</span>}
        </div>
      </div>
      <button className="del" type="button" onClick={() => onOpen(task.id)} aria-label={`Open details for "${task.text}"`}>
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" fill="currentColor">
          <circle cx="4" cy="10" r="1.6" /><circle cx="10" cy="10" r="1.6" /><circle cx="16" cy="10" r="1.6" />
        </svg>
      </button>
      <button className="del" type="button" onClick={() => onDelete(task.id)} aria-label={`Delete "${task.text}"`}>
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
          <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </li>
  );
}
