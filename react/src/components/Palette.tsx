import { KeyboardEvent, useEffect, useState } from 'react';

export interface PaletteItem {
  id: string;
  label: string;
  run: () => void;
}

interface Props {
  items: PaletteItem[];
  onClose: () => void;
}

export default function Palette({ items, onClose }: Props) {
  const [q, setQ] = useState('');
  const [index, setIndex] = useState(0);

  const filtered = items.filter((x) => x.label.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8);

  useEffect(() => { setIndex(0); }, [q]);

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') onClose();
    if (e.key === 'ArrowDown') { e.preventDefault(); setIndex(Math.min(index + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setIndex(Math.max(index - 1, 0)); }
    if (e.key === 'Enter') {
      const item = filtered[index];
      if (item) { onClose(); item.run(); }
    }
  }

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="palette" role="dialog" aria-label="Command palette">
        <input autoFocus type="text" placeholder="Type a command or task name" aria-label="Command" value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} />
        <ul>
          {filtered.map((item, i) => (
            <li key={item.id} className={i === index ? 'active' : ''}
              onMouseEnter={() => setIndex(i)}
              onClick={() => { onClose(); item.run(); }}>
              {item.label}
            </li>
          ))}
          {filtered.length === 0 && <li className="none">No matches</li>}
        </ul>
      </div>
    </>
  );
}
