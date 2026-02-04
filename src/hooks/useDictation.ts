/**
 * useDictation — Web Speech API (built-in browser, no cost).
 * Use for text fields in intake forms (chief complaint, clinical notes, etc.).
 * Does NOT use Whisper or any external service.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? (window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition)
    : null;

export function useDictation(options?: { lang?: string; onResult?: (text: string) => void }) {
  const [isDictating, setIsDictating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<InstanceType<NonNullable<typeof SpeechRecognitionAPI>> | null>(null);

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

      const rec = new SpeechRecognitionAPI();
      recognitionRef.current = rec;
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = options?.lang ?? 'en-CA';

      rec.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const text = (result[0]?.transcript ?? '').trim();
          if (!text || !result.isFinal) continue;
          (onResult ?? options?.onResult)?.(text);
        }
      };

      rec.onend = () => {
        recognitionRef.current = null;
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
