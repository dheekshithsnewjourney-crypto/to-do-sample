import type { RefObject } from 'react';
import type { Filter, Sort } from '../types';

const OPTIONS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'done', label: 'Done' },
];

interface Props {
  filter: Filter;
  counts: Record<Filter, number>;
  onFilter: (f: Filter) => void;
  query: string;
  onQuery: (q: string) => void;
  sort: Sort;
  onSort: (s: Sort) => void;
  searchRef: RefObject<HTMLInputElement | null>;
}

export default function Filters({ filter, counts, onFilter, query, onQuery, sort, onSort, searchRef }: Props) {
  return (
    <div className="toolbar">
      <div className="tabs" role="group" aria-label="Filter tasks">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            className={filter === o.value ? 'on' : ''}
            aria-pressed={filter === o.value}
            onClick={() => onFilter(o.value)}
          >
            {o.label} <span className="count">{counts[o.value]}</span>
          </button>
        ))}
      </div>
      <div className="tools">
        <label className="sr-only" htmlFor="search">Search tasks</label>
        <input
          id="search"
          ref={searchRef}
          type="search"
          placeholder="Search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
        />
        <label className="sr-only" htmlFor="sort">Sort tasks</label>
        <select id="sort" value={sort} onChange={(e) => onSort(e.target.value as Sort)}>
          <option value="due">By day</option>
          <option value="manual">My order</option>
          <option value="priority">Priority</option>
        </select>
      </div>
    </div>
  );
}
