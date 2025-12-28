// src/test-watchdog.js
console.error('[WATCHDOG] loaded (sync)');

setTimeout(() => {
  // eslint-disable-next-line no-underscore-dangle
  const handles = (process._getActiveHandles && process._getActiveHandles()) || [];
  console.error(`[WATCHDOG] 5s handles=${handles.length}`);
}, 5000).unref?.();

