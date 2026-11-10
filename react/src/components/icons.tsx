import type { ReactNode } from 'react';

function Icon({ size = 18, children }: { size?: number; children: ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {children}
    </svg>
  );
}

type P = { size?: number };

export const MenuIcon = (p: P) => <Icon {...p}><path d="M4 7h16M4 12h16M4 17h16" /></Icon>;
export const CloseIcon = (p: P) => <Icon {...p}><path d="M6 6l12 12M18 6L6 18" /></Icon>;
export const PlusIcon = (p: P) => <Icon {...p}><path d="M12 5v14M5 12h14" /></Icon>;
export const CheckIcon = (p: P) => <Icon {...p}><path d="M5 12.5l4.5 4.5L19 7" /></Icon>;
export const MoreIcon = (p: P) => <Icon {...p}><path d="M5 12h.01M12 12h.01M19 12h.01" strokeWidth="3" /></Icon>;
export const TrashIcon = (p: P) => <Icon {...p}><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12M9 7V4h6v3" /></Icon>;
export const AlertIcon = (p: P) => <Icon {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5M12 16.2h.01" /></Icon>;
export const RepeatIcon = (p: P) => <Icon {...p}><path d="M17 3l4 4-4 4M3 11V9a2 2 0 0 1 2-2h16M7 21l-4-4 4-4M21 13v2a2 2 0 0 1-2 2H3" /></Icon>;
export const SunIcon = (p: P) => <Icon {...p}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></Icon>;
export const MoonIcon = (p: P) => <Icon {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></Icon>;
