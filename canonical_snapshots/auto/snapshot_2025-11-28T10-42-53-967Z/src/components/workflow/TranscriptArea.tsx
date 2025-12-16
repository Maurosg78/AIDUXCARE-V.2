/**
 * TranscriptArea Component
 * 
 * Extracted from ProfessionalWorkflowPage for better code organization.
 * Handles transcript capture, recording, and attachment management.
 * 
 * @compliance PHIPA compliant
 */

import React from 'react';
import { Play, Square, Mic, Loader2, Brain, Paperclip, UploadCloud, Download, X, AlertCircle } from 'lucide-react';
import type { WhisperSupportedLanguage } from '../../services/OpenAIWhisperService';
import { AudioWaveform } from '../AudioWaveform';
import type { ClinicalAttachment } from '../../services/clinicalAttachmentService';

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

export const TranscriptArea: React.FC<TranscriptAreaProps> = ({
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
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-xl font-medium text-slate-900 font-apple mb-2">Clinical Conversation Capture</h2>
          <p className="text-[15px] text-slate-500 font-light font-apple">
            Use the built-in recorder or paste a transcript from your recording.
          </p>
          <div className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600 max-w-md">
            <AlertCircle className="mt-0.5 h-4 w-4 text-slate-400" />
            <p>
              AiDuxCare automatically detects English, Canadian French, or Spanish. Accents are supported, but clarity helps the medico-legal record.
            </p>
          </div>
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

      {/* Processing Audio Indicator */}
      {isTranscribing && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-amber-600 animate-spin" />
            <div className="flex-1">
              <p className="text-sm font-medium text-amber-800 font-apple">Processing audio...</p>
              <p className="text-xs text-amber-600 mt-0.5 font-apple font-light">
                Transcribing audio. This may take a few moments for longer recordings.
              </p>
              <p className="text-xs text-amber-500 mt-1 font-apple font-light">
                💡 Tip: For best results, keep recordings under 15 minutes
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
                className={`px-4 py-2.5 min-h-[44px] rounded-full text-sm font-apple transition ${
                  mode === key
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
        className="mt-4 w-full min-h-[160px] rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-transparent transition"
        placeholder="Paste the transcript or record directly from the browser..."
        value={transcript}
        onChange={(event) => {
          setTranscript(event.target.value);
        }}
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

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
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
          <ul className="space-y-2">
            {attachments.map((attachment) => (
              <li
                key={attachment.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-slate-700">{attachment.name}</span>
                  <span className="text-xs text-slate-500">
                    {formatFileSize(attachment.size)} · Uploaded {new Date(attachment.uploadedAt).toLocaleString("en-CA")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={attachment.downloadURL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    View
                  </a>
                  <button
                    type="button"
                    onClick={() => handleAttachmentRemove(attachment)}
                    disabled={removingAttachmentId === attachment.id}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-50 font-apple"
                  >
                    <X className="w-3.5 h-3.5" />
                    {removingAttachmentId === attachment.id ? 'Removing…' : 'Remove'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TranscriptArea;


