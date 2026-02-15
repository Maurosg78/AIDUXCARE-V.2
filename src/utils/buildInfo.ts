/**
 * WO-METRICS-00: Build info for metrics (appVersion, env)
 * Injected at build time via Vite define (__BUILD_SHA__) or VITE_BUILD_SHA env
 */

// Injected by Vite define at build time (BUILD_SHA, GITHUB_SHA)
declare const __BUILD_SHA__: string | undefined;
export const APP_VERSION =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_BUILD_SHA) ||
  (typeof __BUILD_SHA__ !== 'undefined' && __BUILD_SHA__) ||
  'dev';

export type AppEnv = 'pilot' | 'local' | 'uat';

export const APP_ENV: AppEnv = (() => {
  if (typeof window === 'undefined') return 'uat';
  const host = window.location.hostname;
  if (host === 'pilot.aiduxcare.com') return 'pilot';
  if (host === 'localhost' || host === '127.0.0.1') return 'local';
  return 'uat';
})();
