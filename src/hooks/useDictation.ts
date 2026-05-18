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

const DICTATION_LOG_PREFIX = '[Dictation]';
let activeDictationStop: (() => void) | null = null;

function logDictation(event: string, metadata?: Record<string, unknown>) {
  if (typeof console === 'undefined') return;
  console.info(`${DICTATION_LOG_PREFIX} ${event}`, metadata ?? {});
}

export function useDictation(options?: { lang?: string; onResult?: (text: string) => void }) {
  const [isDictating, setIsDictating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<DictationRecognitionInstance | null>(null);
  const resultCallbackRef = useRef<((text: string) => void) | null>(null);
  const lastInterimRef = useRef<string>('');
  const keepAliveRef = useRef(false);
  const restartTimerRef = useRef<number | null>(null);
  const manualStopRef = useRef(false);
  const sessionIdRef = useRef(0);
  const restartCountRef = useRef(0);

  const isAvailable = !!SpeechRecognitionAPI;

  const clearRestartTimer = useCallback(() => {
    if (restartTimerRef.current != null) {
      window.clearTimeout(restartTimerRef.current);
      restartTimerRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    const sessionId = sessionIdRef.current;
    manualStopRef.current = true;
    keepAliveRef.current = false;
    if (activeDictationStop === stop) {
      activeDictationStop = null;
    }
    clearRestartTimer();
    const rec = recognitionRef.current;
    if (rec) {
      try {
        rec.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    resultCallbackRef.current = null;
    lastInterimRef.current = '';
    setIsDictating(false);
    logDictation('stop', { sessionId });
  }, [clearRestartTimer]);

  const start = useCallback(
    (onResult?: (text: string) => void) => {
      if (!SpeechRecognitionAPI) {
        setError('Speech recognition not supported in this browser.');
        return;
      }
      setError(null);
      if (activeDictationStop && activeDictationStop !== stop) {
        activeDictationStop();
      }
      stop();
      activeDictationStop = stop;

      const callback = onResult ?? options?.onResult ?? null;
      resultCallbackRef.current = callback;
      lastInterimRef.current = '';

      sessionIdRef.current += 1;
      const sessionId = sessionIdRef.current;
      manualStopRef.current = false;
      keepAliveRef.current = true;
      restartCountRef.current = 0;
      logDictation('start-requested', { sessionId, lang: options?.lang ?? 'en-CA' });

      const startRecognition = () => {
        if (!SpeechRecognitionAPI || !keepAliveRef.current) return;

        clearRestartTimer();
        const rec = new SpeechRecognitionAPI();
        recognitionRef.current = rec;
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = options?.lang ?? 'en-CA';
        const restartCount = restartCountRef.current;
        logDictation('recognition-starting', { sessionId, restartCount, lang: rec.lang });

        rec.onresult = (event: SpeechRecognitionEvent) => {
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i];
            const text = (result[0]?.transcript ?? '').trim();
            if (!text) continue;
            if (result.isFinal) {
              logDictation('result-final', { sessionId, length: text.length });
              resultCallbackRef.current?.(text);
              lastInterimRef.current = '';
            } else {
              logDictation('result-interim', { sessionId, length: text.length });
              lastInterimRef.current = text;
            }
          }
        };

        rec.onend = () => {
          const pending = lastInterimRef.current.trim();
          const shouldRestart = keepAliveRef.current && !manualStopRef.current;
          logDictation('end', {
            sessionId,
            restartCount: restartCountRef.current,
            shouldRestart,
            pendingLength: pending.length,
          });
          if (pending) {
            resultCallbackRef.current?.(pending);
            lastInterimRef.current = '';
          }
          recognitionRef.current = null;

          if (shouldRestart) {
            restartCountRef.current += 1;
            restartTimerRef.current = window.setTimeout(startRecognition, 250);
            setIsDictating(true);
            return;
          }

          resultCallbackRef.current = null;
          setIsDictating(false);
        };

        rec.onerror = (e: SpeechRecognitionErrorEvent) => {
          logDictation('error', { sessionId, error: e.error, restartCount: restartCountRef.current });
          if (e.error === 'aborted') return;
          if (e.error === 'no-speech') {
            return;
          }
          keepAliveRef.current = false;
          clearRestartTimer();
          setError(e.error === 'not-allowed' ? 'Microphone access denied.' : `Recognition error: ${e.error}`);
          recognitionRef.current = null;
          setIsDictating(false);
        };

        try {
          rec.start();
          setIsDictating(true);
          logDictation('started', { sessionId, restartCount });
        } catch (err) {
          keepAliveRef.current = false;
          const message = err instanceof Error ? err.message : 'Failed to start dictation.';
          setError(message);
          recognitionRef.current = null;
          if (activeDictationStop === stop) {
            activeDictationStop = null;
          }
          setIsDictating(false);
          logDictation('start-failed', { sessionId, message });
        }
      };

      startRecognition();
    },
    [clearRestartTimer, options?.lang, options?.onResult, stop]
  );

  useEffect(() => () => stop(), [stop]);

  return { isAvailable, isDictating, start, stop, error };
}
