// Checks every text/background token pair used by the UI against WCAG AA (4.5:1).
// Reads the tokens straight from the stylesheets, so it can never drift from the real CSS.
// Usage: npm run contrast   (exits 1 if any pair fails)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const FILES = ['../src/index.css', '../../vanilla/style.css'];
const MIN = 4.5;

// [text token, background token, where it is used]
const PAIRS = [
  ['ink', 'bg', 'body text on the page'],
  ['ink', 'surface', 'task text on cards'],
  ['ink', 'soft', 'inputs, badges'],
  ['muted', 'bg', 'sidebar labels, hovered task meta'],
  ['muted', 'surface', 'task meta, low-priority pill, list monogram'],
  ['muted', 'soft', 'inactive filter tabs'],
  ['bg', 'ink', 'active view, toast, active command'],
  ['accent-ink', 'accent', 'primary button, high-priority pill, checkmark, active list monogram'],
  ['accent-text', 'surface', 'overdue label'],
  ['accent-text', 'bg', 'overdue label on a hovered task, overdue count'],
  ['sun-ink', 'sun', 'medium pill, Today badge, search highlight, undo button'],
  ['danger', 'surface', 'delete button, form error'],
  ['danger', 'bg', 'delete icon on a hovered task'],
  ['danger', 'soft', 'delete icon hover'],
  ['danger-ink', 'danger', 'delete button hover'],
];

function luminance(hex) {
  const n = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => {
    const s = parseInt(n.slice(i, i + 2), 16) / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// The first :root block is the light theme, the second (dark) one overrides it.
function themes(css) {
  const blocks = [...css.matchAll(/:root[^{]*\{([^}]*)\}/g)].map((m) =>
    Object.fromEntries([...m[1].matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\b/g)].map((t) => [t[1], t[2]])));
  if (blocks.length < 2) throw new Error('expected a light and a dark :root block');
  return { light: blocks[0], dark: { ...blocks[0], ...blocks[1] } };
}

let failures = 0;
for (const file of FILES) {
  const css = readFileSync(fileURLToPath(new URL(file, import.meta.url)), 'utf8');
  for (const [theme, tokens] of Object.entries(themes(css))) {
    console.log(`\n${file.replace(/^(\.\.\/)+/, '')} (${theme})`);
    for (const [fg, bg, where] of PAIRS) {
      if (!tokens[fg] || !tokens[bg]) { console.log(`  MISSING  --${fg} / --${bg}`); failures++; continue; }
      const ratio = contrast(tokens[fg], tokens[bg]);
      const ok = ratio >= MIN;
      if (!ok) failures++;
      console.log(`  ${ok ? 'pass' : 'FAIL'}  ${ratio.toFixed(2).padStart(5)}:1  --${fg} ${tokens[fg]} on --${bg} ${tokens[bg]}  (${where})`);
    }
  }
}
console.log(failures ? `\n${failures} pair(s) below ${MIN}:1` : `\nAll pairs pass WCAG AA (${MIN}:1).`);
process.exit(failures ? 1 : 0);
