export const safeLogger = {
  debug: (...args: unknown[]) => {
    if (import.meta?.env?.MODE !== 'production' && process?.env?.NODE_ENV !== 'production') {
      console.log(...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (import.meta?.env?.MODE !== 'production' && process?.env?.NODE_ENV !== 'production') {
      console.warn(...args);
    }
  },
  error: (...args: unknown[]) => {
    console.error(...args);
  }
};
