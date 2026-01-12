/**
 * TranscriptArea Component
 * 
 * Extracted from ProfessionalWorkflowPage for better code organization.
 * Handles transcript capture, recording, and attachment management.
 * 
 * @compliance PHIPA compliant
 */

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Play, Square, Mic, Loader2, Brain, Paperclip, UploadCloud, Download, X, AlertCircle } from 'lucide-react';
import type { WhisperSupportedLanguage } from '../../services/OpenAIWhisperService';
import { AudioWaveform } from '../AudioWaveform';
import type { ClinicalAttachment } from '../../services/clinicalAttachmentService';
import { useDebouncedCallback } from '../../hooks/useDebounce';
import { ClinicalAttachmentCard } from '../ClinicalAttachmentCard';

const LANGUAGE_OPTIONS: Array<{ value: WhisperSupportedLanguage; label: string }> = [
  { value: "auto", label: "Auto-detect" },
  { value: "en", label: "English (EN-CA)" },
  { value: "es", label: "Español (LatAm)" },
  { value: "fr", label: "Français (Canada)" }
];

const MODE_LABELS: Record<"live" | "dictation", string> = {
  live: "Live session",
  dictation: "Dictation",
};

const formatDetectedLanguage = (value: string | null | undefined) => {
  if (!value) return "Not detected";
  const normalized = value.toLowerCase();
  if (normalized.startsWith("en")) return "Detected: English";
  if (normalized.startsWith("fr")) return "Detected: French";
  if (normalized.startsWith("es")) return "Detected: Spanish";
  return `Detected: ${value}`;
};

const formatFileSize = (bytes: number) => {
  if (!Number.isFinite(bytes)) return "";
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  if (bytes >= 1024) {
    return `${(bytes / 1024).toFixed(0)} KB`;
  }
  return `${bytes} B`;
};

export interface TranscriptAreaProps {
  // Recording state
  recordingTime: string;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;

  // Transcript state
  transcript: string;
  setTranscript: (value: string) => void;
  transcriptError: string | null;
  transcriptMeta?: {
    detectedLanguage?: string | null;
    averageLogProb?: number;
    durationSeconds?: number;
  } | null;

  // Language and mode
  languagePreference: WhisperSupportedLanguage;
  setLanguagePreference: (lang: WhisperSupportedLanguage) => void;
  mode: 'live' | 'dictation';
  setMode: (mode: 'live' | 'dictation') => void;

  // Processing state
  isTranscribing: boolean;
  isProcessing: boolean;
  audioStream: MediaStream | null;

  // Analysis handler
  handleAnalyzeWithVertex: () => Promise<void>;

  // Attachments
  attachments: ClinicalAttachment[];
  isUploadingAttachment: boolean;
  attachmentError: string | null;
  removingAttachmentId: string | null;
  handleAttachmentUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleAttachmentRemove: (attachment: ClinicalAttachment) => Promise<void>;
}

export const TranscriptArea: React.FC<TranscriptAreaProps> = React.memo(({
  recordingTime,
  isRecording,
  startRecording,
  stopRecording,
  transcript,
  setTranscript,
  transcriptError,
  transcriptMeta,
  languagePreference,
  setLanguagePreference,
  mode,
  setMode,
  isTranscribing,
  isProcessing,
  audioStream,
  handleAnalyzeWithVertex,
  attachments,
  isUploadingAttachment,
  attachmentError,
  removingAttachmentId,
  handleAttachmentUpload,
  handleAttachmentRemove,
}) => {
  // Local state for immediate UI updates
  const [localTranscript, setLocalTranscript] = useState(transcript);
  const isPastingRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Sync local state with prop when it changes externally
  useEffect(() => {
    if (!isPastingRef.current) {
      setLocalTranscript(transcript);
    }
  }, [transcript]);

  // Debounced update to parent (300ms delay)
  const debouncedSetTranscript = useDebouncedCallback((value: string) => {
    isPastingRef.current = false;
    setTranscript(value);
  }, 300);

  // Handle input changes with immediate local update and debounced parent update
  const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    setLocalTranscript(newValue);
    debouncedSetTranscript(newValue);
  }, [debouncedSetTranscript]);

  // Safe read function for textarea value
  const readTranscriptSafe = useCallback((textarea: HTMLTextAreaElement | null): string => {
    return textarea?.value ?? "";
  }, []);

  // Handle paste events
  const handlePaste = useCallback((event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    isPastingRef.current = true;

    // Capture textarea reference before setTimeout (avoids event pooling issues)
    const textarea = event.currentTarget;

    // Clear any existing timeout
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }

    // Let the default paste behavior happen, then update state
    timerRef.current = window.setTimeout(() => {
      const newValue = readTranscriptSafe(textarea);

      // Only update if we got a valid value
      if (newValue !== "") {
        setLocalTranscript(newValue);
        debouncedSetTranscript(newValue);
      }
      isPastingRef.current = false;
    }, 0);
  }, [debouncedSetTranscript, readTranscriptSafe]);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-xl font-medium text-slate-900 font-apple mb-2">Clinical Conversation Capture</h2>
          <p className="text-[15px] text-slate-500 font-light font-apple">
            Paste your transcript below or use the text area to enter clinical notes.
          </p>
        </div>
        <div className="flex flex-col items-end gap-3">
          <span className="inline-flex items-center gap-2 text-sm text-slate-500">
            <Mic className="w-4 h-4 text-slate-400" />
            {recordingTime}
          </span>
          {isRecording ? (
            <button
              onClick={stopRecording}
              className="inline-flex items-center gap-2 px-5 py-3 min-h-[48px] rounded-lg bg-gradient-danger hover:bg-gradient-danger-hover text-white shadow-sm transition font-apple text-[15px] font-medium"
            >
              <Square className="w-4 h-4" />
              Stop Recording
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="inline-flex items-center gap-2 px-5 py-3 min-h-[48px] rounded-lg bg-gradient-to-r from-primary-blue to-primary-purple hover:from-primary-blue-hover hover:to-primary-purple-hover text-white font-medium shadow-sm hover:shadow-md transition-all duration-200 font-apple text-[15px]"
            >
              <Play className="w-4 h-4" />
              Start Recording
            </button>
          )}
        </div>
      </div>

      {/* Audio Waveform Visualization */}
      {isRecording && (
        <div className="mt-4 rounded-lg border border-primary-blue/20 bg-primary-blue/5 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-primary-blue animate-pulse" />
            <span className="text-sm font-medium text-primary-blue font-apple">Listening...</span>
          </div>
          <AudioWaveform isActive={isRecording} stream={audioStream} />
        </div>
      )}

      {/* FIX 3: Processing Audio Indicator - Only show AFTER recording stops */}
      {isTranscribing && !isRecording && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 font-apple">Transcribing your recording...</p>
              <p className="text-xs text-blue-700 mt-0.5 font-apple font-light">
                This typically takes just a few seconds
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Processing Transcription Indicator */}
      {isProcessing && !isTranscribing && (
        <div className="mt-4 rounded-lg border border-primary-blue/20 bg-primary-blue/5 px-4 py-3">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-primary-blue animate-pulse" />
            <div className="flex-1">
              <p className="text-sm font-medium text-primary-blue font-apple">Analyzing transcript...</p>
              <p className="text-xs text-primary-blue/80 mt-0.5 font-apple font-light">Analyzing clinical data with our specialized AI methods</p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span className="font-medium text-slate-700">Language</span>
          <select
            value={languagePreference}
            onChange={(event) => setLanguagePreference(event.target.value as WhisperSupportedLanguage)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-blue font-apple"
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span className="font-medium text-slate-700">Mode</span>
          <div className="inline-flex rounded-full border border-slate-300 bg-white p-1 shadow-sm">
            {(['live', 'dictation'] as Array<'live' | 'dictation'>).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setMode(key)}
                className={`px-4 py-2.5 min-h-[44px] rounded-full text-sm font-apple transition ${mode === key
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm hover:from-indigo-700 hover:to-purple-700'
                  : 'text-slate-600 hover:bg-slate-100'
                  }`}
              >
                {MODE_LABELS[key]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {transcriptError && (
        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 font-apple">
          <p className="font-medium">Transcription error</p>
          <p>{transcriptError}</p>
        </div>
      )}

      <textarea
        key="transcript-textarea"
        className="mt-4 w-full min-h-[160px] rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-transparent transition"
        placeholder="Paste the transcript or record directly from the browser..."
        value={localTranscript}
        onChange={handleChange}
        onPaste={handlePaste}
        onKeyDown={(event) => {
          // Allow Enter to work normally in textarea (create new lines)
          // Only prevent default if Ctrl/Cmd+Enter (for submit)
          if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            handleAnalyzeWithVertex();
          }
          // Otherwise, let Enter work normally
        }}
      />

      {transcriptMeta && (
        <div className="mt-2 text-xs text-slate-500 flex flex-wrap items-center gap-3">
          <span>{formatDetectedLanguage(transcriptMeta.detectedLanguage)}</span>
          {typeof transcriptMeta.averageLogProb === 'number' && (
            <span>Average log-probability: {transcriptMeta.averageLogProb.toFixed(2)}</span>
          )}
          {typeof transcriptMeta.durationSeconds === 'number' && (
            <span>Duration: {transcriptMeta.durationSeconds.toFixed(1)}s</span>
          )}
          <span>Mode: {MODE_LABELS[mode]}</span>
        </div>
      )}

      <div className="mt-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Paperclip className="w-4 h-4 text-slate-500" />
            Clinical attachments
          </div>
          <label className="inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600 hover:border-slate-400 hover:bg-slate-100 cursor-pointer transition">
            <UploadCloud className="w-4 h-4" />
            {isUploadingAttachment ? 'Uploading…' : 'Add files'}
            <input
              type="file"
              multiple
              accept="image/*,application/pdf,text/plain,.txt,.rtf,.doc,.docx"
              className="hidden"
              onChange={handleAttachmentUpload}
              disabled={isUploadingAttachment}
            />
          </label>
        </div>

        {attachmentError && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {attachmentError}
          </div>
        )}

        {attachments.length === 0 ? (
          <p className="text-xs text-slate-500">
            Attach lab work, imaging reports, or patient-provided photos. Files stay in encrypted Firebase Storage.
          </p>
        ) : (
          <div className="space-y-3">
            {attachments.map((attachment) => (
              <ClinicalAttachmentCard
                key={attachment.id}
                attachment={attachment}
                onDelete={() => handleAttachmentRemove(attachment)}
                isRemoving={removingAttachmentId === attachment.id}
              />
            ))}
          </div>
        )}
      </div>

      {/* WO-003: "Analyze with AiduxCare AI" button moved here (after PDF upload area) */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-slate-500">
          Audio is captured locally. No data is transmitted until you trigger the analysis.
        </p>
        <button
          onClick={handleAnalyzeWithVertex}
          disabled={isProcessing || !transcript?.trim()}
          className="inline-flex items-center gap-2 px-5 py-3 min-h-[48px] rounded-lg bg-gradient-primary hover:bg-gradient-primary-hover text-white shadow-sm disabled:opacity-50 transition font-apple text-[15px] font-medium"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4" />
              Analyze with AiduxCare AI
            </>
          )}
        </button>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  // Only re-render if these props actually change
  return (
    prevProps.transcript === nextProps.transcript &&
    prevProps.isRecording === nextProps.isRecording &&
    prevProps.isTranscribing === nextProps.isTranscribing &&
    prevProps.isProcessing === nextProps.isProcessing &&
    prevProps.transcriptError === nextProps.transcriptError &&
    prevProps.languagePreference === nextProps.languagePreference &&
    prevProps.mode === nextProps.mode &&
    prevProps.attachments.length === nextProps.attachments.length &&
    prevProps.isUploadingAttachment === nextProps.isUploadingAttachment &&
    prevProps.attachmentError === nextProps.attachmentError
  );
});

TranscriptArea.displayName = 'TranscriptArea';

export default TranscriptArea;


