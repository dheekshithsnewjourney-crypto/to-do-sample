import { FormEvent, useRef, useState } from 'react';
import type { List, View } from '../types';

const SMART: { id: View; label: string }[] = [
  { id: 'all', label: 'All tasks' },
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'overdue', label: 'Overdue' },
];

const ACCENTS = ['#5b5bd6', '#0ea5e9', '#10a37f', '#e5484d', '#d6409f', '#f08a00'];

interface Props {
  view: View;
  onView: (v: View) => void;
  counts: Record<string, number>;
  lists: List[];
  onAddList: (name: string) => void;
  onDeleteList: (id: string) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  accent: string | null;
  onAccent: (c: string | null) => void;
}

export default function Sidebar({ view, onView, counts, lists, onAddList, onDeleteList, onExport, onImport, accent, onAccent }: Props) {
  const [name, setName] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    onAddList(name.trim());
    setName('');
  }

  return (
    <aside className="side">
      <p className="brand">Tasks</p>

      <nav className="views" aria-label="Views">
        {SMART.map((v) => (
          <button key={v.id} className={view === v.id ? 'on' : ''} aria-current={view === v.id} onClick={() => onView(v.id)}>
            <span>{v.label}</span>
            <span className="n">{counts[v.id] ?? 0}</span>
          </button>
        ))}
      </nav>

      <p className="side-title">Lists</p>
      <nav className="views" aria-label="Lists">
        {lists.map((l) => {
          const id = `list:${l.id}` as View;
          return (
            <div key={l.id} className={`list-row${view === id ? ' on' : ''}`}>
              <button className={view === id ? 'on' : ''} aria-current={view === id} onClick={() => onView(id)}>
                <span><i className="dot" style={{ background: l.color }} />{l.name}</span>
                <span className="n">{counts[id] ?? 0}</span>
              </button>
              <button className="x" aria-label={`Delete list ${l.name}`} onClick={() => onDeleteList(l.id)}>×</button>
            </div>
          );
        })}
      </nav>

      <form className="new-list" onSubmit={submit}>
        <label className="sr-only" htmlFor="new-list">New list name</label>
        <input id="new-list" type="text" placeholder="New list" maxLength={24} value={name} onChange={(e) => setName(e.target.value)} />
      </form>

      <p className="side-title">Accent colour</p>
      <div className="swatches">
        {ACCENTS.map((c) => (
          <button
            key={c}
            type="button"
            className="swatch"
            style={{ background: c }}
            aria-label={`Accent colour ${c}`}
            aria-pressed={accent === c}
            onClick={() => onAccent(accent === c ? null : c)}
          />
        ))}
      </div>

      <div className="data">
        <button type="button" className="link" onClick={onExport}>Export backup</button>
        <button type="button" className="link" onClick={() => fileRef.current?.click()}>Import backup</button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImport(f);
            e.target.value = '';
          }}
        />
      </div>
    </aside>
  );
}
