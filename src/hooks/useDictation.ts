/**
 * useDictation — Web Speech API (built-in browser, no cost).
 * Use for text fields in intake forms (chief complaint, clinical notes, etc.).
 * Does NOT use Whisper or any external service.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

interface DictationRecognitionInstance {
  start(): void;
  stop(): void;
  abort(): void;
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
}

const SpeechRecognitionAPI: (new () => DictationRecognitionInstance) | null =
  typeof window !== 'undefined'
    ? (window as unknown as { SpeechRecognition?: new () => DictationRecognitionInstance; webkitSpeechRecognition?: new () => DictationRecognitionInstance }).SpeechRecognition
    || (window as unknown as { webkitSpeechRecognition?: new () => DictationRecognitionInstance }).webkitSpeechRecognition
    : null;

export function useDictation(options?: { lang?: string; onResult?: (text: string) => void }) {
  const [isDictating, setIsDictating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<DictationRecognitionInstance | null>(null);
  const resultCallbackRef = useRef<((text: string) => void) | null>(null);
  const lastInterimRef = useRef<string>('');

  const isAvailable = !!SpeechRecognitionAPI;

  const stop = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.stop();
        rec.abort();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    resultCallbackRef.current = null;
    lastInterimRef.current = '';
    setIsDictating(false);
  }, []);

  const start = useCallback(
    (onResult?: (text: string) => void) => {
      if (!SpeechRecognitionAPI) {
        setError('Speech recognition not supported in this browser.');
        return;
      }
      setError(null);
      stop();

      const callback = onResult ?? options?.onResult ?? null;
      resultCallbackRef.current = callback;
      lastInterimRef.current = '';

      const rec = new SpeechRecognitionAPI();
      recognitionRef.current = rec;
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = options?.lang ?? 'en-CA';

      rec.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = (result[0]?.transcript ?? '').trim();
          if (!text) continue;
          if (result.isFinal) {
            callback?.(text);
            lastInterimRef.current = '';
          } else {
            lastInterimRef.current = text;
          }
        }
      };

      rec.onend = () => {
        const pending = lastInterimRef.current.trim();
        if (pending) {
          resultCallbackRef.current?.(pending);
          lastInterimRef.current = '';
        }
        recognitionRef.current = null;
        resultCallbackRef.current = null;
        setIsDictating(false);
      };

      rec.onerror = (e: SpeechRecognitionErrorEvent) => {
        if (e.error === 'aborted' || e.error === 'no-speech') return;
        setError(e.error === 'not-allowed' ? 'Microphone access denied.' : `Recognition error: ${e.error}`);
        recognitionRef.current = null;
        setIsDictating(false);
      };

      try {
        rec.start();
        setIsDictating(true);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to start dictation.');
        setIsDictating(false);
      }
    },
    [options?.lang, options?.onResult, stop]
  );

  useEffect(() => () => stop(), [stop]);

  return { isAvailable, isDictating, start, stop, error };
}
