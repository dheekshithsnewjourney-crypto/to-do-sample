// Small WCAG colour helpers, used to keep custom accent colours readable.

type RGB = [number, number, number];

export function parseHex(value: unknown): RGB | null {
  if (typeof value !== 'string') return null;
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(value.trim());
  if (!m) return null;
  const hex = m[1].length === 3 ? [...m[1]].map((c) => c + c).join('') : m[1];
  return [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as RGB;
}

const toHex = (rgb: RGB) => '#' + rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('').toUpperCase();

export function luminance(hex: string): number {
  const rgb = parseHex(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

// Black or white, whichever reads better on the given fill. One of them always reaches 4.5:1.
export function inkFor(fill: string): string {
  return contrast('#FFFFFF', fill) >= contrast('#000000', fill) ? '#FFFFFF' : '#000000';
}

// Nudges a colour towards `toward` until it reaches `min` contrast on every background.
export function readableOn(color: string, backgrounds: string[], toward: string, min = 4.5): string {
  const from = parseHex(color);
  const to = parseHex(toward);
  const bgs = backgrounds.filter((b) => parseHex(b));
  if (!from || !to) return color;
  for (let step = 0; step <= 20; step++) {
    const mixed = toHex(from.map((c, i) => c + ((to[i] - c) * step) / 20) as RGB);
    if (bgs.every((bg) => contrast(mixed, bg) >= min)) return mixed;
  }
  return toward;
}

// CSS variables for a custom accent: the fill, the text that sits on it, and a text-safe variant.
export function accentVars(accent: string, surfaces: string[], dark: boolean): Record<string, string> | null {
  if (!parseHex(accent)) return null;
  return {
    '--accent': accent,
    '--accent-ink': inkFor(accent),
    '--accent-text': readableOn(accent, surfaces, dark ? '#FFFFFF' : '#000000'),
  };
}
