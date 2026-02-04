/**
 * DictationButton — mic button for text fields using Web Speech API (no cost).
 * Place next to input/textarea; on click toggles dictation and appends to value.
 */

import React from 'react';
import { Mic } from 'lucide-react';
import { useDictation } from '../../hooks/useDictation';

export interface DictationButtonProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  lang?: string;
  className?: string;
  title?: string;
}

export const DictationButton: React.FC<DictationButtonProps> = ({
  value,
  onChange,
  disabled = false,
  lang = 'en-CA',
  className = '',
  title = 'Dictate (microphone)',
}) => {
  const { isAvailable, isDictating, start, stop } = useDictation({ lang });

  const handleClick = () => {
    if (disabled) return;
    if (isDictating) {
      stop();
      return;
    }
    start((text) => {
      const sep = value.trim() ? ' ' : '';
      onChange(value.trim() + sep + text);
    });
  };

  if (!isAvailable) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`p-2 rounded-lg border transition-colors flex items-center justify-center ${className} ${
        isDictating
          ? 'bg-red-100 border-red-300 text-red-700'
          : 'border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      <Mic className={`w-4 h-4 ${isDictating ? 'animate-pulse' : ''}`} />
    </button>
  );
};
