interface Props {
  done: number;
  total: number;
}

export default function ProgressRing({ done, total }: Props) {
  const r = 30;
  const c = 2 * Math.PI * r;
  const pct = total ? done / total : 0;
  const complete = total > 0 && done === total;
  return (
    <div className={`ring${complete ? ' complete' : ''}`} role="img"
      aria-label={complete ? `All ${total} tasks done` : `${done} of ${total} tasks done`}>
      <svg viewBox="0 0 72 72" aria-hidden="true">
        <circle className="track" cx="36" cy="36" r={r} />
        <circle className="bar" cx="36" cy="36" r={r} strokeDasharray={c} strokeDashoffset={c * (1 - pct)} transform="rotate(-90 36 36)" />
      </svg>
      <span>{done}/{total}</span>
    </div>
  );
}
