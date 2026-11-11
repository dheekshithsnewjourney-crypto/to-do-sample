import { useRef, useState } from 'react';
import { useDialog } from '../hooks';
import type { List, View } from '../types';
import { monogram } from '../views';
import { CheckIcon, CloseIcon, PlusIcon } from './icons';

const SMART: { id: View; label: string }[] = [
  { id: 'all', label: 'All tasks' },
  { id: 'today', label: 'Today' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'overdue', label: 'Overdue' },
];

interface Props {
  view: View;
  onView: (v: View) => void;
  counts: Record<string, number>;
  lists: List[];
  onAddList: (name: string) => void;
  onDeleteList: (id: string) => void;
  open: boolean; // only matters on narrow screens, where the sidebar is an off-canvas drawer
  onClose: () => void;
}

export default function Sidebar({ view, onView, counts, lists, onAddList, onDeleteList, open, onClose }: Props) {
  const [name, setName] = useState('');
  const ref = useRef<HTMLElement>(null);
  useDialog(ref, open, onClose); // focus trap, Escape and focus restore while it is a drawer

  function go(v: View) {
    onView(v);
    onClose();
  }

  return (
    <>
      {/* Always rendered, so it can fade out with the panel */}
      <div className={`scrim${open ? ' open' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside ref={ref} id="sidebar" className={`side${open ? ' open' : ''}`} aria-label="Views and lists"
        role={open ? 'dialog' : undefined} aria-modal={open ? true : undefined}>
        <div className="side-head">
          <p className="brand"><span className="brand-mark"><CheckIcon size={20} /></span>Tasks</p>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close menu"><CloseIcon /></button>
        </div>

        <nav className="views" aria-label="Views">
          {SMART.map((v) => {
            const n = counts[v.id] ?? 0;
            return (
              <button key={v.id} type="button" className={view === v.id ? 'on' : ''} aria-current={view === v.id ? 'page' : undefined} onClick={() => go(v.id)}>
                <span className="label">{v.label}</span>
                <span className={`n${v.id === 'today' && n > 0 ? ' sun' : ''}`}>{n}</span>
              </button>
            );
          })}
        </nav>

        <p className="side-title" id="lists-title">Lists</p>
        <nav className="views" aria-labelledby="lists-title">
          {lists.map((l) => {
            const id = `list:${l.id}` as View;
            return (
              <div key={l.id} className="list-row">
                <button type="button" className={view === id ? 'on' : ''} aria-current={view === id ? 'page' : undefined} onClick={() => go(id)}>
                  <span className="mark" aria-hidden="true">{monogram(l.name)}</span>
                  <span className="label" title={l.name}>{l.name}</span>
                  <span className="n">{counts[id] ?? 0}</span>
                </button>
                <button type="button" className="x" aria-label={`Delete list ${l.name}`} onClick={() => onDeleteList(l.id)}><CloseIcon size={16} /></button>
              </div>
            );
          })}
        </nav>

        <form className="new-list" onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onAddList(name.trim());
          setName('');
        }}>
          <label className="sr-only" htmlFor="new-list">New list name</label>
          <input id="new-list" type="text" placeholder="New list" maxLength={24} value={name} onChange={(e) => setName(e.target.value)} />
          <button type="submit" aria-label="Add list"><PlusIcon size={16} /></button>
        </form>

      </aside>
    </>
  );
}
