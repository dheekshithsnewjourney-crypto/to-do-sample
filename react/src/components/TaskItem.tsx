import { type DragEvent, type KeyboardEvent, useEffect, useRef, useState } from 'react';
import { dueInfo } from '../dates';
import type { List, Task } from '../types';
import { AlertIcon, MoreIcon, RepeatIcon, TrashIcon } from './icons';

interface Props {
  task: Task;
  list?: List;
  query?: string;
  draggable: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string, text: string) => void;
  onOpen: (id: string) => void;
  onMove: (from: string, to: string) => void;
  onNudge: (id: string, dir: -1 | 1) => void;
  when?: string;   // the "when" rail label (Overdue, Today, Thu 13 Nov…), shown on the first row of each run
  first?: boolean; // first row of a run: the rail label shows and a heavy rule opens the group
}

const PRIORITY_LABEL = { low: 'Low', med: 'Medium', high: 'High' } as const;
// A private drag type, so dropped files, links or selected text are never mistaken for a task.
const DRAG_TYPE = 'application/x-task';
const isTaskDrag = (e: DragEvent) => [...e.dataTransfer.types].includes(DRAG_TYPE);

// Wraps every case-insensitive match of the search query in <mark>.
function Highlight({ text, query }: { text: string; query?: string }) {
  const q = query?.trim();
  if (!q) return <>{text}</>;
  const parts = text.split(new RegExp(`(${q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
  return <>{parts.map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part))}</>;
}

export default function TaskItem({ task, list, query, draggable, onToggle, onDelete, onEdit, onOpen, onMove, onNudge, when, first }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.text);
  const [over, setOver] = useState(false);
  const [dragging, setDragging] = useState(false);
  const textRef = useRef<HTMLSpanElement>(null);
  const refocus = useRef(false);
  const open = useRef(false);
  const dragDepth = useRef(0);
  const due = task.dueDate ? dueInfo(task.dueDate, task.done) : null;
  const subs = task.subtasks ?? [];

  // After an inline edit, hand focus back to the title so keyboard users keep their place.
  useEffect(() => {
    if (!editing && refocus.current) {
      refocus.current = false;
      textRef.current?.focus();
    }
  }, [editing]);

  function startEdit() {
    setDraft(task.text);
    setEditing(true);
    open.current = true;
  }
  // Enter or Escape is followed by a blur in some browsers: the `open` flag makes sure an edit
  // is finished exactly once, and that Escape can never be turned into a save by that blur.
  function finish(save: boolean, viaKeyboard = false) {
    if (!open.current) return;
    open.current = false;
    if (save && draft.trim() && draft.trim() !== task.text) onEdit(task.id, draft);
    refocus.current = viaKeyboard;
    setEditing(false);
  }

  function endHover() {
    dragDepth.current = 0;
    setOver(false);
  }

  // Row-level shortcuts, so they work from the checkbox and buttons too.
  function onRowKey(e: KeyboardEvent<HTMLLIElement>) {
    if (editing) return;
    if (e.key === 'F2') { e.preventDefault(); startEdit(); }
    if (e.altKey && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault();
      onNudge(task.id, e.key === 'ArrowUp' ? -1 : 1);
    }
  }

  return (
    <li
      data-id={task.id}
      className={`item${task.done ? ' done' : ''}${first ? ' first' : ''}${over ? ' over' : ''}${draggable ? ' drag' : ''}${dragging ? ' dragging' : ''}`}
      draggable={draggable && !editing}
      onKeyDown={onRowKey}
      onDragStart={(e) => {
        e.dataTransfer.setData(DRAG_TYPE, task.id);
        e.dataTransfer.effectAllowed = 'move';
        setDragging(true);
      }}
      onDragEnd={() => { setDragging(false); endHover(); }}
      // dragenter/dragleave also fire for every child the pointer crosses (enter the child first,
      // then leave the parent). Counting them keeps the highlight steady until the row is really left.
      onDragEnter={(e) => {
        if (!draggable || !isTaskDrag(e)) return;
        dragDepth.current += 1;
        setOver(true);
      }}
      onDragOver={(e) => {
        if (!draggable || !isTaskDrag(e)) return;
        e.preventDefault(); // marks the row as a valid drop target
        e.dataTransfer.dropEffect = 'move';
      }}
      onDragLeave={() => {
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setOver(false);
      }}
      onDrop={(e) => {
        endHover();
        if (!draggable || !isTaskDrag(e)) return;
        e.preventDefault();
        const from = e.dataTransfer.getData(DRAG_TYPE);
        if (from && from !== task.id) onMove(from, task.id);
      }}
    >
      {/* The rail repeats the due information that the meta row already gives screen readers. */}
      <span className="when" aria-hidden="true">{first ? when : ''}</span>
      <input
        className="check"
        type="checkbox"
        checked={task.done}
        onChange={() => onToggle(task.id)}
        aria-label={`Mark "${task.text}" as ${task.done ? 'not done' : 'done'}`}
      />
      <div className="body">
        {editing ? (
          <input className="edit" type="text" dir="auto" autoFocus maxLength={120} value={draft} aria-label="Edit task"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') finish(true, true);
              if (e.key === 'Escape') finish(false, true);
            }}
            onBlur={() => finish(true)} />
        ) : (
          <span ref={textRef} className="text" dir="auto" tabIndex={0} title="Double-click or press F2 to rename" aria-keyshortcuts="F2" onDoubleClick={startEdit}>
            <Highlight text={task.text} query={query} />
          </span>
        )}
        <div className="meta">
          <span className={`pill prio-${task.priority}`}><span className="sr-only">Priority: </span>{PRIORITY_LABEL[task.priority]}</span>
          {due?.tone === 'today' && <span className="pill due-today"><span className="sr-only">Due </span>Today</span>}
          {due?.tone === 'overdue' && <span className="tag overdue"><AlertIcon size={14} />{due.label}</span>}
          {due?.tone === 'later' && <span className="tag">{due.label}</span>}
          {list && <span className="tag">{list.name}</span>}
          {subs.length > 0 && <span className="tag">{subs.filter((s) => s.done).length}/{subs.length} steps</span>}
          {task.notes && <span className="tag">Note</span>}
          {task.repeat && task.dueDate && <span className="tag"><RepeatIcon size={13} />Repeats {task.repeat}</span>}
        </div>
      </div>
      <button className="act" type="button" onClick={() => onOpen(task.id)} aria-label={`Open details for "${task.text}"`}>
        <MoreIcon />
      </button>
      <button className="act del" type="button" onClick={() => onDelete(task.id)} aria-label={`Delete "${task.text}"`}>
        <TrashIcon />
      </button>
    </li>
  );
}
