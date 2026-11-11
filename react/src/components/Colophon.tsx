import { useRef } from 'react';

// `null` is the brand red from the stylesheet.
const ACCENTS: { name: string; value: string | null; swatch: string }[] = [
  { name: 'Red (default)', value: null, swatch: '#D62839' },
  { name: 'Tangerine', value: '#E8590C', swatch: '#E8590C' },
  { name: 'Green', value: '#2B8A3E', swatch: '#2B8A3E' },
  { name: 'Blue', value: '#1C7ED6', swatch: '#1C7ED6' },
  { name: 'Violet', value: '#7048E8', swatch: '#7048E8' },
  { name: 'Pink', value: '#D6409F', swatch: '#D6409F' },
];

interface Props {
  accent: string | null;
  onAccent: (c: string | null) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  modKey: string;
  inert?: boolean; // set while the mobile menu is open
}

// The page's closing block, like the colophon of a printed poster: settings, backup and shortcuts.
export default function Colophon({ accent, onAccent, onExport, onImport, modKey, inert }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <footer className="colophon" inert={inert}>
      <div className="col-about">
        <p className="col-name">Tasks</p>
        <p>Your tasks are saved in this browser only. Nothing is uploaded unless you export it.</p>
      </div>

      <div className="col-block">
        <p className="col-title" id="accent-title">Accent colour</p>
        <div className="swatches" role="group" aria-labelledby="accent-title">
          {ACCENTS.map((a) => (
            <button key={a.name} type="button" className="swatch" style={{ background: a.swatch }}
              title={a.name} aria-label={a.name} aria-pressed={accent === a.value} onClick={() => onAccent(a.value)} />
          ))}
        </div>
      </div>

      <div className="col-block">
        <p className="col-title">Backup</p>
        <div className="data">
          <button type="button" className="link" onClick={onExport}>Export backup</button>
          <button type="button" className="link" onClick={() => fileRef.current?.click()}>Import backup</button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImport(f);
              e.target.value = '';
            }} />
        </div>
      </div>

      <div className="col-block keys">
        <p className="col-title">Keys</p>
        <dl>
          <dt><kbd>N</kbd></dt><dd>New task</dd>
          <dt><kbd>/</kbd></dt><dd>Search</dd>
          <dt><kbd>{modKey}</kbd> <kbd>K</kbd></dt><dd>Commands</dd>
          <dt><kbd>Alt</kbd> <kbd>↑↓</kbd></dt><dd>Reorder</dd>
          <dt><kbd>F2</kbd></dt><dd>Rename</dd>
          <dt><kbd>J</kbd> <kbd>K</kbd></dt><dd>Next, previous task</dd>
          <dt><kbd>P</kbd></dt><dd>Change priority</dd>
          <dt><kbd>T</kbd></dt><dd>Due today</dd>
          <dt><kbd>Enter</kbd></dt><dd>Open details</dd>
          <dt><kbd>Del</kbd></dt><dd>Delete</dd>
        </dl>
      </div>
    </footer>
  );
}
