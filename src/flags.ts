/**
 * Progress Notes feature flag
 * Default: false (unless explicitly set to "true")
 */
export const isProgressNotesEnabled = (): boolean =>
  String(import.meta.env.VITE_FEATURE_PROGRESS_NOTES ?? '').toLowerCase() === 'true';

/**
 * AI physical-test suggestions are safety-gated.
 * Default: false. Manual/library/custom test entry remains available.
 */
export const isAiPhysicalTestSuggestionsEnabled = (): boolean =>
  String(import.meta.env.VITE_FEATURE_AI_PHYSICAL_TEST_SUGGESTIONS ?? '').toLowerCase() === 'true';
