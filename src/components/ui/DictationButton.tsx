/**
 * DictationButton — mic button for text fields using Web Speech API (no cost).
 * Place next to input/textarea; on click toggles dictation and appends to value.
 * Language follows i18n by default so Spanish UI uses es-ES recognition for better accuracy.
 */

import React, { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Mic } from 'lucide-react';
import { useDictation } from '../../hooks/useDictation';

/** Map i18n language code to Web Speech API lang (improves recognition quality). */
function getSpeechLang(i18nLang: string, propLang?: string): string {
  if (propLang) return propLang;
  const code = (i18nLang || '').toLowerCase();
  if (code.startsWith('es')) return 'es-ES';
  if (code.startsWith('fr')) return 'fr-FR';
  if (code.startsWith('en')) return 'en-GB'; // or en-US; GB often better for medical terms
  return 'es-ES'; // pilot default
}

export interface DictationButtonProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  /** Override speech recognition language (e.g. 'es-ES'). If not set, follows i18n language. */
  lang?: string;
  className?: string;
  title?: string;
}

export const DictationButton: React.FC<DictationButtonProps> = ({
  value,
  onChange,
  disabled = false,
  lang: propLang,
  className = '',
  title = 'Dictate (microphone)',
}) => {
  const { i18n, t } = useTranslation();
  const speechLang = getSpeechLang(i18n.language, propLang);
  const { isAvailable, isDictating, start, stop } = useDictation({ lang: speechLang });
  const listeningLabel = t('dictation.listening');
  const accumulatedRef = useRef<string>('');

  const handleClick = () => {
    if (disabled) return;
    if (isDictating) {
      stop();
      return;
    }
    accumulatedRef.current = value;
    start((text) => {
      const prev = accumulatedRef.current.trim();
      const sep = prev ? ' ' : '';
      const next = prev + sep + text.trim();
      accumulatedRef.current = next;
      onChange(next);
    });
  };

  if (!isAvailable) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={isDictating ? listeningLabel : title}
      aria-label={isDictating ? listeningLabel : title}
      aria-live="polite"
      className={`rounded-lg border transition-colors flex items-center justify-center gap-1.5 min-w-[2.25rem] ${className} ${
        isDictating
          ? 'bg-red-100 border-red-300 text-red-700 px-2.5 py-2'
          : 'p-2 border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {isDictating ? (
        <>
          <span className="flex items-end gap-0.5 h-3" aria-hidden>
            {[1, 2, 3, 4, 5].map((i) => (
              <span key={i} className="dictation-equalizer-bar" />
            ))}
          </span>
          <span className="sr-only">{listeningLabel}</span>
        </>
      ) : (
        <Mic className="w-4 h-4" />
      )}
    </button>
  );
};
