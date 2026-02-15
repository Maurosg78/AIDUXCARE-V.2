/**
 * WO-METRICS-00: Browser session ID (per-tab, stable for tab lifetime)
 */

const KEY = 'aidux_browser_session_id';

export function getOrCreateBrowserSessionId(): string {
  if (typeof sessionStorage === 'undefined') {
    return crypto.randomUUID();
  }
  const existing = sessionStorage.getItem(KEY);
  if (existing) return existing;

  const id = crypto.randomUUID();
  sessionStorage.setItem(KEY, id);
  return id;
}
