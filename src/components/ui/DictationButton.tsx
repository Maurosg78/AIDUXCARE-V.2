/**
 * DictationButton — mic button for text fields using Web Speech API (no cost).
 * Place next to input/textarea; on click toggles dictation and appends to value.
 * Supports interim results: pass onInterim and display value+interim in the input so text appears as you speak.
 * When dictating, shows a small decibel bar next to the mic for feedback without text.
 */

import React, { useRef, useEffect, useState } from 'react';
import { Mic } from 'lucide-react';
import { useDictation } from '../../hooks/useDictation';

/** Small vertical bar that shows mic level (0–1) when active. Uses getUserMedia + AnalyserNode. */
function MicLevelBar({ isActive }: { isActive: boolean }) {
  const [level, setLevel] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  useEffect(() => {
    if (!isActive) {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      analyserRef.current = null;
      if (sourceRef.current && audioContextRef.current) {
        try {
          sourceRef.current.disconnect();
        } catch {}
        sourceRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setLevel(0);
      return;
    }

    let cancelled = false;
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    audioContextRef.current = ctx;

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const source = ctx.createMediaStreamSource(stream);
        sourceRef.current = source;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.6;
        analyser.minDecibels = -60;
        analyser.maxDecibels = -10;
        source.connect(analyser);
        analyserRef.current = analyser;
        const data = new Uint8Array(analyser.frequencyBinCount);

        const tick = () => {
          if (cancelled || !analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(data);
          let sum = 0;
          for (let i = 0; i < data.length; i++) sum += data[i];
          const avg = data.length > 0 ? sum / data.length : 0;
          setLevel(Math.min(1, avg / 128));
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      })
      .catch(() => {
        setLevel(0);
      });

    return () => {
      cancelled = true;
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      analyserRef.current = null;
      if (sourceRef.current && audioContextRef.current) {
        try {
          sourceRef.current.disconnect();
        } catch {}
        sourceRef.current = null;
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, [isActive]);

  if (!isActive) return null;

  const heightPct = level > 0 ? Math.max(4, Math.round(level * 100)) : 0;
  return (
    <div
      className="flex flex-col items-center justify-end w-1.5 h-6 rounded-full bg-slate-200 overflow-hidden"
      aria-hidden
    >
      <div
        className="w-full rounded-full bg-red-500 transition-all duration-75 ease-out"
        style={{ height: `${heightPct}%` }}
      />
    </div>
  );
}

export interface DictationButtonProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  lang?: string;
  className?: string;
  title?: string;
  /** When provided, interim transcription is sent here so the input can show value + interim */
  onInterim?: (text: string) => void;
}

export const DictationButton: React.FC<DictationButtonProps> = ({
  value,
  onChange,
  disabled = false,
  lang = 'en-CA',
  className = '',
  title = 'Dictate (microphone)',
  onInterim,
}) => {
  const valueRef = useRef(value);
  valueRef.current = value;
  const { isAvailable, isDictating, start, stop } = useDictation({ lang });

  useEffect(() => {
    if (!isDictating) onInterim?.('');
  }, [isDictating, onInterim]);

  const handleClick = () => {
    if (disabled) return;
    if (isDictating) {
      stop();
      onInterim?.('');
      return;
    }
    start((text, isFinal) => {
      const current = valueRef.current.trim();
      const sep = current ? ' ' : '';
      if (isFinal) {
        onChange(current + sep + text);
        onInterim?.('');
      } else {
        onInterim?.(text);
      }
    });
  };

  if (!isAvailable) return null;

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled}
        title={title}
        aria-label={title}
        className={`p-2 rounded-lg border transition-colors flex items-center justify-center shrink-0 ${className} ${
          isDictating
            ? 'bg-red-100 border-red-300 text-red-700'
            : 'border-slate-300 text-slate-600 hover:bg-slate-50 hover:border-slate-400'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <Mic className={`w-4 h-4 ${isDictating ? 'animate-pulse' : ''}`} />
      </button>
      <MicLevelBar isActive={isDictating} />
    </div>
  );
};
