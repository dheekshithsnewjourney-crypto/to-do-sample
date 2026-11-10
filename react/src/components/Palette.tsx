import { type KeyboardEvent, useRef, useState } from 'react';
import { useDialog } from '../hooks';

export interface PaletteItem {
  id: string;
  label: string;
  run: () => void;
}

interface Props {
  items: PaletteItem[];
  onClose: () => void;
}

// A combobox with a listbox popup: focus stays in the input, and the active option is
// announced through aria-activedescendant.
export default function Palette({ items, onClose }: Props) {
  const [q, setQ] = useState('');
  const [index, setIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  useDialog(ref, true, onClose);

  const filtered = items.filter((x) => x.label.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 8);
  const active = Math.min(index, filtered.length - 1);

  function choose(item: PaletteItem | undefined) {
    if (!item) return;
    onClose();
    item.run();
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIndex(Math.min(active + 1, filtered.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setIndex(Math.max(active - 1, 0)); }
    if (e.key === 'Enter') choose(filtered[active]);
  }

  return (
    <>
      <div className="overlay top" onClick={onClose} />
      <div ref={ref} className="palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <input type="text" role="combobox" aria-label="Command" aria-expanded="true" aria-controls="palette-list" aria-autocomplete="list"
          aria-activedescendant={filtered[active] ? `palette-${active}` : undefined}
          placeholder="Type a command or task name" value={q}
          onChange={(e) => { setQ(e.target.value); setIndex(0); }} onKeyDown={onKey} />
        <ul id="palette-list" role="listbox" aria-label="Commands">
          {filtered.map((item, i) => (
            <li key={item.id} id={`palette-${i}`} role="option" aria-selected={i === active} className={i === active ? 'active' : ''}
              onMouseEnter={() => setIndex(i)} onClick={() => choose(item)}>
              {item.label}
            </li>
          ))}
          {filtered.length === 0 && <li className="none" role="presentation">No matches</li>}
        </ul>
      </div>
    </>
  );
}
