import { type FormEvent, useState } from 'react';
import { parseQuickAdd } from '../quickadd';
import type { Priority } from '../types';
import { AlertIcon } from './icons';

interface Props {
  onAdd: (text: string, priority: Priority, dueDate?: string) => void;
}

export default function TaskForm({ onAdd }: Props) {
  const [text, setText] = useState('');
  const [priority, setPriority] = useState<Priority>('med');
  const [due, setDue] = useState('');
  const [error, setError] = useState('');

  function submit(e: FormEvent) {
    e.preventDefault();
    const parsed = parseQuickAdd(text);
    if (!parsed.text) {
      setError('Enter a task before adding it.');
      return;
    }
    onAdd(parsed.text, parsed.priority ?? priority, parsed.dueDate ?? (due || undefined));
    setText('');
    setDue('');
  }

  return (
    <form className="composer" onSubmit={submit} autoComplete="off">
      <label className="sr-only" htmlFor="new-task">New task</label>
      <input
        id="new-task"
        className="title"
        type="text"
        placeholder='Try "Pay rent tomorrow !high"'
        maxLength={120}
        value={text}
        aria-required="true"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? 'new-task-error' : undefined}
        data-focus-fallback
        onChange={(e) => { setText(e.target.value); setError(''); }}
      />
      <div className="row">
        <label className="sr-only" htmlFor="due">Due date</label>
        <input id="due" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
        <label className="sr-only" htmlFor="priority">Priority</label>
        <select id="priority" value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
          <option value="low">Low priority</option>
          <option value="med">Medium priority</option>
          <option value="high">High priority</option>
        </select>
        <button type="submit" className="primary">Add task</button>
      </div>
      {error && <p className="error" id="new-task-error" role="alert"><AlertIcon size={16} />{error}</p>}
    </form>
  );
}
