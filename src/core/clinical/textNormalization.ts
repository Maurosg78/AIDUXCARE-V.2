/**
 * Basic clinical text normalization helper.
 *
 * - Flattens newlines
 * - Removes bullet prefixes like "-" or "•"
 * - Collapses multiple spaces
 * - Strips diacritical marks (Lasègue → Lasegue)
 */
export function normalizeClinicalText(text?: string): string {
  if (!text) return '';

  const withoutDiacritics = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  return withoutDiacritics
    .replace(/\n+/g, ' ')
    .replace(/^[\s-•]+/gm, '') // remove leading bullets per line
    .replace(/\s+/g, ' ')
    .trim();
}

