import type { ReactNode } from 'react';

export type EmptyKind = 'all' | 'today' | 'upcoming' | 'overdue' | 'list' | 'search' | 'allDone' | 'noneDone';

interface Props {
  kind: EmptyKind;
  listName?: string;
  query?: string;
  onClearSearch?: () => void;
}

// Flat line art in ink, with one yellow shape as the highlight.
const ART: Record<EmptyKind, ReactNode> = {
  all: <><rect className="fill-soft" x="14" y="10" width="44" height="52" rx="8" /><path d="M24 27h24M24 37h24M24 47h14" /><circle className="fill-sun" cx="54" cy="54" r="11" /><path className="on-sun" d="M54 49v10M49 54h10" /></>,
  today: <><circle className="fill-sun" cx="36" cy="36" r="14" /><path d="M36 8v7M36 57v7M8 36h7M57 36h7M16.2 16.2l5 5M50.8 50.8l5 5M16.2 55.8l5-5M50.8 21.2l5-5" /></>,
  upcoming: <><rect className="fill-soft" x="11" y="15" width="50" height="46" rx="8" /><path d="M11 29h50M24 9v11M48 9v11" /><rect className="fill-sun" x="39" y="39" width="12" height="12" rx="3" /></>,
  overdue: <><circle className="fill-sun" cx="36" cy="36" r="25" /><path className="on-sun" d="M24 37l8.5 8.5L49 28" /></>,
  list: <><path className="fill-soft" d="M9 20a6 6 0 0 1 6-6h13l6 7h23a6 6 0 0 1 6 6v25a6 6 0 0 1-6 6H15a6 6 0 0 1-6-6z" /><circle className="fill-sun" cx="36" cy="40" r="9" /><path className="on-sun" d="M36 36v8M32 40h8" /></>,
  search: <><circle className="fill-soft" cx="32" cy="32" r="19" /><path d="M46 46l15 15" /><path className="fill-sun" d="M24 29h16v6H24z" /></>,
  allDone: <><circle className="fill-sun" cx="36" cy="36" r="25" /><path className="on-sun" d="M24 37l8.5 8.5L49 28" /></>,
  noneDone: <><circle className="fill-soft" cx="36" cy="36" r="25" /><path d="M24 37l8.5 8.5L49 28" strokeDasharray="4 6" /></>,
};

export default function EmptyState({ kind, listName, query, onClearSearch }: Props) {
  const copy: Record<EmptyKind, [string, string]> = {
    all: ['A clean slate', 'Add your first task above. Dates and priorities can be typed right into it.'],
    today: ['Nothing due today', 'Enjoy the clear day, or add something and it lands here.'],
    upcoming: ['Nothing on the horizon', 'Tasks with a future due date show up here.'],
    overdue: ['Nothing overdue', 'You are on top of everything.'],
    list: [`${listName ?? 'This list'} is empty`, 'Add a task above and it goes straight into this list.'],
    search: ['No matches', `Nothing here matches "${query ?? ''}".`],
    allDone: ['All done here', 'Every task in this view is ticked off.'],
    noneDone: ['Nothing completed yet', 'Tick a task off and it shows up here.'],
  };
  const [title, text] = copy[kind];

  return (
    <div className="empty">
      <svg viewBox="0 0 72 72" width="84" height="84" fill="none" stroke="currentColor" strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {ART[kind]}
      </svg>
      <h3>{title}</h3>
      <p>{text}</p>
      {kind === 'search' && onClearSearch && (
        <button type="button" className="link" onClick={onClearSearch}>Clear search</button>
      )}
    </div>
  );
}
