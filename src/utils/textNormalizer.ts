/**
 * Text normalization utilities for SMS and external communications
 * Removes accents/diacritics for SMS compatibility (GSM 03.38 charset)
 */

/**
 * Remove accents from text (e.g., "Gavilán" → "Gavilan")
 * SMS systems often don't support accented characters
 */
export function removeAccents(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x00-\x7F]/g, '');
}

/**
 * Sanitize text for SMS (keep only GSM 03.38 safe characters)
 */
export function sanitizeForSMS(text: string): string {
  return removeAccents(text)
    .replace(/[^\w\s.,!?@$&()-]/g, '')
    .trim();
}

/**
 * Normalize patient name for SMS
 */
export function normalizeNameForSMS(name: string): string {
  return removeAccents(name).trim();
}
