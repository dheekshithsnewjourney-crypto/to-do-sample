import type { ReactNode } from 'react';

export type EmptyKind = 'all' | 'today' | 'upcoming' | 'overdue' | 'list' | 'search' | 'allDone' | 'noneDone';

interface Props {
  kind: EmptyKind;
  listName?: string;
  query?: string;
  onClearSearch?: () => void;
}

// Swiss poster geometry: flat circles, squares and bars in red, yellow and ink. No line icons.
const ART: Record<EmptyKind, ReactNode> = {
  all: <><rect className="fill-ink" x="8" y="14" width="56" height="6" /><rect className="fill-ink" x="8" y="30" width="40" height="6" /><circle className="fill-red" cx="54" cy="52" r="12" /></>,
  today: <><circle className="fill-sun" cx="36" cy="36" r="24" /><rect className="fill-ink" x="8" y="60" width="56" height="6" /></>,
  upcoming: <><rect className="fill-ink" x="8" y="8" width="16" height="56" /><rect className="fill-ink" x="30" y="24" width="16" height="40" /><rect className="fill-sun" x="52" y="40" width="12" height="24" /></>,
  overdue: <><circle className="fill-red" cx="36" cy="36" r="26" /><rect className="fill-paper" x="22" y="33" width="28" height="6" /></>,
  list: <><rect className="fill-ink" x="8" y="8" width="56" height="56" /><circle className="fill-sun" cx="36" cy="36" r="14" /></>,
  search: <><circle className="fill-ink" cx="30" cy="30" r="20" /><rect className="fill-red" x="44" y="44" width="20" height="20" /></>,
  allDone: <><circle className="fill-sun" cx="36" cy="36" r="26" /><rect className="fill-red" x="6" y="33" width="60" height="6" /></>,
  noneDone: <><circle className="fill-ink" cx="36" cy="36" r="26" /><circle className="fill-paper" cx="36" cy="36" r="18" /></>,
};

export default function EmptyState({ kind, listName, query, onClearSearch }: Props) {
  const copy: Record<EmptyKind, [string, string]> = {
    all: ['No tasks yet', 'Type one above. "Call Sam friday !high" sets the date and the priority.'],
    today: ['Nothing due today', 'Tasks you add from this view are due today.'],
    upcoming: ['Nothing upcoming', 'Tasks with a future due date appear here.'],
    overdue: ['Nothing overdue', 'No task is past its due date.'],
    list: [`${listName ?? 'This list'} is empty`, 'Add a task above and it goes straight into this list.'],
    search: ['No matches', `Nothing here matches "${query ?? ''}".`],
    allDone: ['All done in this view', 'Every task here is complete.'],
    noneDone: ['No completed tasks', 'Tick a task and it appears here.'],
  };
  const [title, text] = copy[kind];

  return (
    <div className="empty">
      <svg viewBox="0 0 72 72" width="72" height="72" aria-hidden="true">
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
