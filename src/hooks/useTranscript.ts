import { useRef } from "react";
import type { TranscriptionSegment } from "../core/audio/AudioCaptureService";
import { WebSpeechSTTService } from "../services/WebSpeechSTTService";
import { useState, useEffect, useCallback } from 'react';

export interface TranscriptState {
  transcript: string;
  loading: boolean;
  error: string | null;
  isRecording: boolean;
}

export interface UseTranscriptOptions {
  sessionId?: string;
  enableDemo?: boolean;
}

export const useTranscript = ({ enableDemo = false }: UseTranscriptOptions): TranscriptState & {
  startRecording: () => void;
  stopRecording: () => void;
  clearTranscript: () => void;
} => {
  const [transcript, setTranscript] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [sttService] = useState(() => new WebSpeechSTTService());
  // --- Rolling window (8s window, 2s overlap)
  const WINDOW_MS = 8000;
  const OVERLAP_MS = 2000;
  const chunkBufferRef = useRef<TranscriptionSegment[]>([]);
  const windowStartRef = useRef<number | null>(null);

  // Demo transcript for testing
  const demoTranscript = `El paciente refiere dolor cervical irradiado hacia el brazo derecho, con parestesias en los dedos índice y medio. El dolor se agrava con movimientos de flexión cervical y rotación hacia la derecha. No refiere traumatismo previo. El dolor comenzó hace 3 semanas de forma progresiva.`;

  const startRecording = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsRecording(true);
    
    if (enableDemo) {
      // Demo mode
      setTimeout(() => {
        setLoading(false);
        setTranscript(demoTranscript);
      }, 1000);
    } else {
      // Real audio capture
      try {
        await sttService.startRealtimeTranscription({
          onResult: (segment) => {
console.log("Segment received:", segment);

            // --- Push al buffer de ventana
            try {
              const tsMs = Date.parse(segment.timestamp);
              if (!Number.isFinite(tsMs)) {
                // Fallback por si algún navegador no trae ISO válido
                const now = Date.now();
                (segment as any)._tsMs = now;
              } else {
                (segment as any)._tsMs = tsMs;
              }
              chunkBufferRef.current.push(segment as any);
              if (windowStartRef.current == null) {
                windowStartRef.current = (segment as any)._tsMs as number;
              }
              const windowEnd = (windowStartRef.current as number) + WINDOW_MS;
              const nowMs = (segment as any)._tsMs as number;

              // Cerrar ventana si ya superamos el fin
              if (nowMs >= windowEnd) {
                const start = windowStartRef.current as number;
                const end = windowEnd;
                const inWindow = chunkBufferRef.current.filter(s => {
                  const ms = (s as any)._tsMs as number;
                  return ms >= start && ms < end;
                });
                const chunkText = inWindow.map(s => s.content).join(" ").trim();

                console.log("[Chunk 8s]", { id: `chunk_${start}_${end}`, len: chunkText.length, segs: inWindow.length, window: `${start}-${end}` });

                // Solo procesar si hay contenido significativo (>10 chars, >2 palabras)
                if (chunkText.length < 10 || chunkText.split(/\s+/).length < 2) {
                  console.log("[Chunk 8s][skip] Contenido insuficiente:", chunkText.length, "chars");
                  const nextStart = end - OVERLAP_MS;
                  chunkBufferRef.current = chunkBufferRef.current.filter(s => ((s as any)._tsMs as number) >= nextStart);
                  windowStartRef.current = nextStart;
                  return;
                }
                // Solo procesar si hay contenido significativo (>10 chars, >2 palabras)
                if (chunkText.length < 10 || chunkText.split(/\s+/).length < 2) {
                  console.log("[Chunk 8s][skip] Contenido insuficiente:", chunkText.length, "chars");
                  const nextStart = end - OVERLAP_MS;
                  chunkBufferRef.current = chunkBufferRef.current.filter(s => ((s as any)._tsMs as number) >= nextStart);
                  windowStartRef.current = nextStart;
                  return;
                }
                // Solape: conservar últimos 2s
                const nextStart = end - OVERLAP_MS;
                chunkBufferRef.current = chunkBufferRef.current.filter(s => ((s as any)._tsMs as number) >= nextStart);
                windowStartRef.current = nextStart;
              }
            } catch (e) {
              console.warn("[Chunking] error en ventana:", e);
            }

            // UI: seguimos actualizando el texto
            setTranscript(prev => (prev ? prev + "\n" : "") + (segment.content || ""));
            setLoading(false);
          },
          onError: (error) => {
            setError(error);
            setLoading(false);
            setIsRecording(false);
          },
          onStart: () => {
            console.log("🎤 Audio capture started");
            setLoading(false);
          }
        });
      } catch (err) {
        setError('Error iniciando grabación: ' + String(err));
        setLoading(false);
        setIsRecording(false);
      }
    }
  }, [enableDemo, demoTranscript, sttService]);

  const stopRecording = useCallback(async () => {
    setIsRecording(false);
    setLoading(false);
    
    if (!enableDemo) {
      await sttService.stopTranscription();
      // --- Flush de último chunk pendiente (si hay buffer)
      try {
        const buf = chunkBufferRef.current;
        const start = windowStartRef.current;
        if (buf && buf.length > 0 && start != null) {
          const lastTs = (buf[buf.length - 1] as any)._tsMs as number || Date.now();
          const inWindow = buf; /* remanente actual */
          const chunkText = inWindow.map((s:any) => s.content).join(" ").trim();
          console.log("[Chunk 8s][flush]", { id: `chunk_${start}_${lastTs}`, len: chunkText.length, segs: inWindow.length, window: `${start}-${lastTs}` });
          // Solo flush si hay contenido médico significativo
          if (chunkText.length < 10 || chunkText.split(/\s+/).length < 2) {
            console.log("[Chunk 8s][flush][skip] Contenido insuficiente");
            return;
          }        }
      } catch (e) {
        console.warn("[Chunking] flush error:", e);
      } finally {
        chunkBufferRef.current = [];
        windowStartRef.current = null;
      }    }
    
    if (!transcript) {
      setError('No se pudo capturar transcripción. Intente nuevamente.');
    }
  }, [transcript, enableDemo, sttService]);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setError(null);
    setIsRecording(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      setIsRecording(false);
    };
  }, []);

  return {
    transcript,
    loading,
    error,
    isRecording,
    startRecording,
    stopRecording,
    clearTranscript
  };
};

export default useTranscript;
