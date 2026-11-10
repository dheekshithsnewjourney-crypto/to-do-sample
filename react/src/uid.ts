// crypto.randomUUID only exists in secure contexts (https or localhost), so keep a fallback.
export function uid(): string {
  return globalThis.crypto?.randomUUID?.()
    ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}
