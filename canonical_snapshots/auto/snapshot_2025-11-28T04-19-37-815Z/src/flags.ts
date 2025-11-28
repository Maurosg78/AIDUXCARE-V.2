/**
 * Progress Notes feature flag
 * Default: false (unless explicitly set to "true")
 */
export const isProgressNotesEnabled = (): boolean =>
  String(import.meta.env.VITE_FEATURE_PROGRESS_NOTES ?? '').toLowerCase() === 'true';
