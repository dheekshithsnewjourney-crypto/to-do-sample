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
  const [leaving, setLeaving] = useState(false);
  const dismiss = useRef(onDismiss);
  useEffect(() => { dismiss.current = onDismiss; });

  useEffect(() => {
    if (held) return;
    // Fade out (160ms) before removal; skip the wait when the user prefers reduced motion.
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let exit: ReturnType<typeof setTimeout> | undefined;
    const timer = setTimeout(() => {
      setLeaving(true);
      exit = setTimeout(() => dismiss.current(), still ? 0 : 160);
    }, duration);
    return () => { clearTimeout(timer); clearTimeout(exit); };
  }, [held, duration]);

  return (
    <div className={`toast${leaving ? ' leaving' : ''}`} role="status"
      onMouseEnter={() => setHeld(true)} onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)} onBlur={() => setHeld(false)}>
      <span>{message}</span>
      <button type="button" onClick={onUndo}>Undo</button>
    </div>
  );
}
