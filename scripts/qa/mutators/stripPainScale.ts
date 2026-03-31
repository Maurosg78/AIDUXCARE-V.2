/**
 * Mutador v1: quita escalas numéricas tipo EVA/VAS y menciones explícitas,
 * para estudiar robustez cuando falta cuantificación de dolor.
 */
export const STRIP_PAIN_SCALE_ID = 'strip_pain_scale' as const;

export function stripPainScaleTranscript(transcript: string): string {
  let s = transcript;
  s = s.replace(/\b\d{1,2}\s*\/\s*10\b/gi, '[escala_numerica_removida]');
  s = s.replace(/\b\d{1,2}\s+out\s+of\s+10\b/gi, '[escala_numerica_removida]');
  s = s.replace(/\bEVA\b/gi, '');
  s = s.replace(/\bVAS\b/gi, '');
  s = s.replace(/\bescala\s+visual\s+anal[oó]gica\b/gi, '');
  s = s.replace(/\bescala\s+visual\b/gi, '');
  s = s.replace(/\s{2,}/g, ' ').trim();
  return s;
}
