import { useEffect, useRef, useState } from 'react';

interface Props {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
  duration?: number;
}

// Dismisses itself after `duration`, but waits while the pointer or keyboard focus is on it,
// so nobody loses the Undo button halfway through reaching for it.
export default function Toast({ message, onUndo, onDismiss, duration = 6000 }: Props) {
  const [held, setHeld] = useState(false);
  const dismiss = useRef(onDismiss);
  useEffect(() => { dismiss.current = onDismiss; });

  useEffect(() => {
    if (held) return;
    const timer = setTimeout(() => dismiss.current(), duration);
    return () => clearTimeout(timer);
  }, [held, duration]);

  return (
    <div className="toast" role="status"
      onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)} onBlur={() => setHeld(false)}>
      <span>{message}</span>
      <button type="button" onClick={onUndo}>Undo</button>
    </div>
  );
}
