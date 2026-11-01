import { KeyboardEvent, useState } from 'react';
import { dueInfo } from '../dates';
import type { Task } from '../types';

interface Props {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
}

const PRIORITY_LABEL = { low: 'Low', med: 'Medium', high: 'High' } as const;

export default function TaskItem({ task, onToggle, onDelete, onEdit }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.text);
  const due = task.dueDate ? dueInfo(task.dueDate, task.done) : null;

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
    <li className={`item${task.done ? ' done' : ''}`}>
      <input
        className="check"
        type="checkbox"
        checked={task.done}
        onChange={() => onToggle(task.id)}
        aria-label={`Mark "${task.text}" as ${task.done ? 'not done' : 'done'}`}
      />
      <div className="body">
        {editing ? (
          <input
            className="edit"
            type="text"
            autoFocus
            maxLength={120}
            value={draft}
            aria-label="Edit task"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKey}
            onBlur={() => finish(true)}
          />
        ) : (
          <span
            className="text"
            tabIndex={0}
            onDoubleClick={startEdit}
            onKeyDown={(e) => { if (e.key === 'F2') startEdit(); }}
          >
            {task.text}
          </span>
        )}
        <div className="meta">
          <span className={`chip prio-${task.priority}`}>{PRIORITY_LABEL[task.priority]}</span>
          {due && <span className={`chip due-${due.tone}`}>{due.label}</span>}
        </div>
      </div>
      <button className="del" type="button" onClick={() => onDelete(task.id)} aria-label={`Delete "${task.text}"`}>
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true">
          <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </li>
  );
}
