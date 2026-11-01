const pad = (n: number) => String(n).padStart(2, '0');

export function todayISO(d = new Date()): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export type DueTone = 'overdue' | 'today' | 'later';

export function dueInfo(iso: string, done: boolean): { label: string; tone: DueTone } {
  const [y, m, d] = iso.split('-').map(Number);
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diff = Math.round((new Date(y, m - 1, d).getTime() - start.getTime()) / 86400000);

  if (diff < 0) return { label: diff === -1 ? 'Yesterday' : `${-diff} days overdue`, tone: done ? 'later' : 'overdue' };
  if (diff === 0) return { label: 'Today', tone: done ? 'later' : 'today' };
  if (diff === 1) return { label: 'Tomorrow', tone: 'later' };
  return { label: new Date(y, m - 1, d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), tone: 'later' };
}

export function greeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

export function nextDue(iso: string, repeat: 'daily' | 'weekly' | 'monthly'): string {
  const [y, m, d] = iso.split('-').map(Number);
  const next =
    repeat === 'daily' ? new Date(y, m - 1, d + 1)
    : repeat === 'weekly' ? new Date(y, m - 1, d + 7)
    : new Date(y, m, d);
  if (repeat === 'monthly' && next.getDate() !== d) next.setDate(0); // Jan 31 -> Feb 28
  return todayISO(next);
}
