/**
 * Enterprise consent logging: structured, no PHI, correlation-friendly.
 */

const PREFIX = '[CONSENT]';

export const consentLogger = {
  info: (event: string, meta?: Record<string, unknown>) => {
    console.log(`${PREFIX} ${event}`, meta ?? {});
  },
  warn: (event: string, meta?: Record<string, unknown>) => {
    console.warn(`${PREFIX} ${event}`, meta ?? {});
  },
  error: (event: string, meta?: Record<string, unknown>) => {
    console.error(`${PREFIX} ${event}`, meta ?? {});
  },
};
