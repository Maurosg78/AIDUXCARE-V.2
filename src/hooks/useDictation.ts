/**
 * useDictation — Web Speech API (built-in browser, no cost).
 * Use for text fields in intake forms (chief complaint, clinical notes, etc.).
 * Does NOT use Whisper or any external service.
 * Persists session by restarting when the browser ends recognition (e.g. silence);
 * emits both interim and final results so transcription appears while speaking.
 */

import { useState, useCallback, useRef, useEffect } from 'react';

const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? (window.SpeechRecognition || (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition)
    : null;

export type DictationResultCallback = (text: string, isFinal: boolean) => void;

export function useDictation(options?: { lang?: string; onResult?: (text: string) => void }) {
  const [isDictating, setIsDictating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<InstanceType<NonNullable<typeof SpeechRecognitionAPI>> | null>(null);
  const userStoppedRef = useRef(false);
  const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef<DictationResultCallback | null>(null);
  const langRef = useRef(options?.lang ?? 'en-CA');
  langRef.current = options?.lang ?? 'en-CA';

  const isAvailable = !!SpeechRecognitionAPI;

  const stop = useCallback(() => {
    userStoppedRef.current = true;
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.abort();
      } catch {
        try {
          rec.stop();
        } catch {
          // ignore
        }
      }
      recognitionRef.current = null;
    }
    setIsDictating(false);
  }, []);

  const startRecognition = useCallback(() => {
    if (!SpeechRecognitionAPI || !callbackRef.current) return;
    const rec = new SpeechRecognitionAPI();
    recognitionRef.current = rec;
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = langRef.current;

    rec.onresult = (event: SpeechRecognitionEvent) => {
      const cb = callbackRef.current;
      if (!cb) return;
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = (result[0]?.transcript ?? '').trim();
        if (!text) continue;
        cb(text, result.isFinal);
      }
    };

    rec.onend = () => {
      recognitionRef.current = null;
      if (userStoppedRef.current) {
        setIsDictating(false);
        return;
      }
      // Browser ended the session (e.g. silence); restart to keep dictation active
      restartTimeoutRef.current = setTimeout(() => {
        restartTimeoutRef.current = null;
        if (userStoppedRef.current) return;
        try {
          startRecognition();
        } catch {
          setIsDictating(false);
        }
      }, 150);
    };

    rec.onerror = (e: SpeechRecognitionErrorEvent) => {
      if (e.error === 'aborted' || e.error === 'no-speech') return;
      userStoppedRef.current = true;
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
  }, []);

  const start = useCallback(
    (onResult?: (text: string, isFinal?: boolean) => void) => {
      if (!SpeechRecognitionAPI) {
        setError('Speech recognition not supported in this browser.');
        return;
      }
      setError(null);
      userStoppedRef.current = false;
      stop();

      callbackRef.current = (text: string, isFinal: boolean) => {
        (onResult ?? options?.onResult)?.(text, isFinal);
      };

      startRecognition();
    },
    [options?.lang, options?.onResult, startRecognition, stop]
  );

  useEffect(() => {
    callbackRef.current = null;
    return () => {
      stop();
    };
  }, [stop]);

  return { isAvailable, isDictating, start, stop, error };
}
