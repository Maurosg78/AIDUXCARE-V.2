/**
 * Localiza el JSON de export más reciente (mtime) entre user_feedback_* y pending_*.
 */
const fs = require('fs');
const path = require('path');

function findLatestFeedbackJson(exportsDir) {
  if (!fs.existsSync(exportsDir)) return null;
  const names = fs.readdirSync(exportsDir).filter(
    (f) =>
      f.endsWith('.json') &&
      (f.startsWith('user_feedback_') || f.startsWith('pending_')),
  );
  if (names.length === 0) return null;
  let best = null;
  let bestMs = -1;
  for (const f of names) {
    const full = path.join(exportsDir, f);
    try {
      const ms = fs.statSync(full).mtimeMs;
      if (ms > bestMs) {
        bestMs = ms;
        best = full;
      }
    } catch {
      /* skip */
    }
  }
  return best;
}

module.exports = { findLatestFeedbackJson };
