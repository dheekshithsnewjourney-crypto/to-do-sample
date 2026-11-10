import { type RefObject, useEffect, useRef, useState } from 'react';
import { greeting, todayISO } from './dates';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type=hidden]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
const focusable = (root: HTMLElement) => [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((el) => !el.hidden);

// Open dialogs, top-most last. Only the top one reacts to Escape and Tab, so closing the
// command palette does not also close the drawer underneath it.
const stack: HTMLElement[] = [];
export const isDialogOpen = () => stack.length > 0;

/**
 * Modal behaviour for a dialog element while `active`:
 * moves focus in, keeps Tab inside, closes on Escape, locks page scroll,
 * and puts focus back where it came from when the dialog goes away.
 */
export function useDialog(ref: RefObject<HTMLElement | null>, active: boolean, onClose: () => void): void {
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; });

  // A passive effect on purpose: React puts focus back on the previously focused element at the
  // end of a commit, which would undo a focus change made from a layout-effect cleanup.
  useEffect(() => {
    const node = ref.current;
    if (!active || !node) return;
    const opener = document.activeElement as HTMLElement | null;
    stack.push(node);
    document.body.classList.add('locked');
    (focusable(node)[0] ?? node).focus();

    const onKey = (e: KeyboardEvent) => {
      if (stack[stack.length - 1] !== node) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        close.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = focusable(node);
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      const leaving = e.shiftKey ? current === first : current === last;
      if (!first || leaving || !node.contains(current)) {
        e.preventDefault();
        (e.shiftKey ? last : first)?.focus();
      }
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      stack.splice(stack.indexOf(node), 1);
      if (!stack.length) document.body.classList.remove('locked');
      // The opener may be gone (its task was just deleted): fall back to a stable element.
      const target = opener?.isConnected && opener !== document.body
        ? opener
        : document.querySelector<HTMLElement>('[data-focus-fallback]');
      target?.focus();
    };
  }, [active, ref]);
}

/**
 * Today's date and greeting, kept current while the tab stays open:
 * re-checked every 30 seconds and whenever the tab becomes visible again.
 */
export function useClock(): { today: string; hello: string } {
  const read = () => `${todayISO()}|${greeting()}`;
  const [value, setValue] = useState(read);
  useEffect(() => {
    const tick = () => setValue(read());
    const timer = setInterval(tick, 30_000);
    document.addEventListener('visibilitychange', tick);
    window.addEventListener('focus', tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
      window.removeEventListener('focus', tick);
    };
  }, []);
  const [today, hello] = value.split('|');
  return { today, hello };
}
