/**
 * TranscriptArea Component
 *
 * Extracted from ProfessionalWorkflowPage for better code organization.
 * Handles transcript capture, recording, and attachment management.
 *
 * @compliance PHIPA-aware (design goal); Spain pilot: RGPD-compliant strings
 */

import React, { useCallback, useRef, useState, useEffect } from 'react';
import { Play, Square, Mic, Loader2, Brain, Paperclip, UploadCloud, X, AlertCircle } from 'lucide-react';
import type { WhisperSupportedLanguage } from '../../services/OpenAIWhisperService';
import { AudioWaveform } from '../AudioWaveform';
import type { ClinicalAttachment } from '../../services/clinicalAttachmentService';
import { useDebouncedCallback } from '../../hooks/useDebounce';
import { ClinicalAttachmentCard } from '../ClinicalAttachmentCard';
import { isSpainPilot } from '@/core/pilotDetection';

// ─── Pilot-aware UI strings (module-level to avoid React.memo re-renders) ──────
const esPilot = isSpainPilot();

const UI = esPilot
  ? {
      title: 'Captura de conversación clínica',
      subtitle: 'Pega tu transcripción o usa el área de texto para introducir notas clínicas.',
      recordingAvailableLabel: 'La grabación de voz ya está disponible.',
      recordingAvailableBody:
        'Pulsa "Iniciar grabación" para capturar audio, o pega tu transcripción en el área de texto. AiDuxCare detecta automáticamente el idioma.',
      stopRecording: 'Detener grabación',
      startRecording: 'Iniciar grabación',
      startRecordingTitle: 'Iniciar grabación de voz para capturar la conversación clínica',
      listening: 'Escuchando…',
      processingAudioTitle: 'Procesando audio…',
      processingAudioBody: 'Transcribiendo audio. Puede tardar unos momentos en grabaciones largas.',
      processingAudioTip: '💡 Consejo: Para mejores resultados, mantén las grabaciones por debajo de 15 minutos',
      analyzingFollowUp: 'Generando nota de seguimiento…',
      analyzingInitial: 'Analizando transcripción…',
      analyzingFollowUpBody: 'Procesando actualización clínica con historial de sesión…',
      analyzingInitialBody: 'Analizando datos clínicos con nuestros métodos de IA especializados',
      languageLabel: 'Idioma',
      modeLabel: 'Modo',
      transcriptPlaceholder: 'Pega la transcripción o graba directamente desde el navegador…',
      transcriptionError: 'Error de transcripción',
      audioLocalNote: 'El audio se captura localmente. No se transmiten datos hasta que inicias el análisis.',
      attachmentsTitle: 'Archivos clínicos adjuntos',
      uploading: 'Subiendo…',
      addFiles: 'Añadir archivos',
      uploadingFileTitle: 'Subiendo archivo…',
      uploadingFileBody: 'Espera mientras subimos y procesamos tu archivo',
      attachmentsEmpty: 'Adjunta analíticas, informes de imagen o fotos del paciente. Los archivos se almacenan cifrados.',
      analyzingBtnFollowUp: 'Generando nota de seguimiento…',
      analyzingBtnInitial: 'Analizando…',
      analyzeBtnFollowUp: 'Generar nota de seguimiento',
      analyzeBtnInitial: 'Analizar con AiduxCare IA',
      analyzeHintBoth: 'Analizar transcripción y archivos adjuntos',
      analyzeHintTranscript: 'Analizar transcripción con IA',
      analyzeHintAttachments: 'Analizar archivos adjuntos con IA',
      analyzeHintEmpty: 'Introduce una transcripción o sube archivos para analizar',
      detectedLang: (v: string | null | undefined) => {
        if (!v) return 'No detectado';
        const n = v.toLowerCase();
        if (n.startsWith('en')) return 'Detectado: Inglés';
        if (n.startsWith('fr')) return 'Detectado: Francés';
        if (n.startsWith('es')) return 'Detectado: Español';
        return `Detectado: ${v}`;
      },
      avgLogProb: 'Probabilidad media logarítmica:',
      duration: 'Duración:',
      mode: 'Modo:',
    }
  : {
      title: 'Clinical Conversation Capture',
      subtitle: 'Paste your transcript below or use the text area to enter clinical notes.',
      recordingAvailableLabel: 'Voice recording is now available.',
      recordingAvailableBody:
        'Click "Start Recording" to capture audio, or paste your transcript in the text area below. AiDuxCare automatically detects English, Canadian French, or Spanish.',
      stopRecording: 'Stop Recording',
      startRecording: 'Start Recording',
      startRecordingTitle: 'Start voice recording to capture clinical conversation',
      listening: 'Listening...',
      processingAudioTitle: 'Processing audio...',
      processingAudioBody: 'Transcribing audio. This may take a few moments for longer recordings.',
      processingAudioTip: '💡 Tip: For best results, keep recordings under 15 minutes',
      analyzingFollowUp: 'Generating follow-up note...',
      analyzingInitial: 'Analyzing transcript...',
      analyzingFollowUpBody: 'Processing clinical update with session history...',
      analyzingInitialBody: 'Analyzing clinical data with our specialized AI methods',
      languageLabel: 'Language',
      modeLabel: 'Mode',
      transcriptPlaceholder: 'Paste the transcript or record directly from the browser...',
      transcriptionError: 'Transcription error',
      audioLocalNote: 'Audio is captured locally. No data is transmitted until you trigger the analysis.',
      attachmentsTitle: 'Clinical attachments',
      uploading: 'Uploading…',
      addFiles: 'Add files',
      uploadingFileTitle: 'Uploading file...',
      uploadingFileBody: 'Please wait while we upload and process your file',
      attachmentsEmpty: 'Attach lab work, imaging reports, or patient-provided photos. Files stay in encrypted Firebase Storage.',
      analyzingBtnFollowUp: 'Generating follow-up note...',
      analyzingBtnInitial: 'Analyzing...',
      analyzeBtnFollowUp: 'Generate Follow-up Note',
      analyzeBtnInitial: 'Analyze with AiduxCare AI',
      analyzeHintBoth: 'Analyze transcript and attachments together',
      analyzeHintTranscript: 'Analyze transcript with AI',
      analyzeHintAttachments: 'Analyze uploaded attachments with AI',
      analyzeHintEmpty: 'Enter a transcript or upload attachments to analyze',
      detectedLang: (v: string | null | undefined) => {
        if (!v) return 'Not detected';
        const n = v.toLowerCase();
        if (n.startsWith('en')) return 'Detected: English';
        if (n.startsWith('fr')) return 'Detected: French';
        if (n.startsWith('es')) return 'Detected: Spanish';
        return `Detected: ${v}`;
      },
      avgLogProb: 'Average log-probability:',
      duration: 'Duration:',
      mode: 'Mode:',
    };

const LANGUAGE_OPTIONS: Array<{ value: WhisperSupportedLanguage; label: string }> = esPilot
  ? [
      { value: 'auto', label: 'Detección automática' },
      { value: 'es', label: 'Español' },
      { value: 'en', label: 'English (EN)' },
      { value: 'fr', label: 'Français' },
    ]
  : [
      { value: 'auto', label: 'Auto-detect' },
      { value: 'en', label: 'English (EN-CA)' },
      { value: 'es', label: 'Español (LatAm)' },
      { value: 'fr', label: 'Français (Canada)' },
    ];

const MODE_LABELS: Record<'live' | 'dictation', string> = esPilot
  ? { live: 'Sesión en vivo', dictation: 'Dictado' }
  : { live: 'Live session', dictation: 'Dictation' };

const formatFileSize = (bytes: number) => {
  if (!Number.isFinite(bytes)) return '';
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
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
  isGeneratingSOAP?: boolean;
  audioStream: MediaStream | null;

  // Analysis handler
  handleAnalyzeWithVertex: () => Promise<void>;
  visitType?: string;

  // Attachments
  attachments: ClinicalAttachment[];
  isUploadingAttachment: boolean;
  attachmentError: string | null;
  removingAttachmentId: string | null;
  handleAttachmentUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleAttachmentRemove: (attachment: ClinicalAttachment) => Promise<void>;
  /** When true, hide Vertex analyze CTA and related processing UI (capture-only surfaces). */
  hideAnalyzeButton?: boolean;
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
  isGeneratingSOAP,
  audioStream,
  handleAnalyzeWithVertex,
  visitType,
  attachments,
  isUploadingAttachment,
  attachmentError,
  removingAttachmentId,
  handleAttachmentUpload,
  handleAttachmentRemove,
  hideAnalyzeButton = false,
}) => {
  const [localTranscript, setLocalTranscript] = useState(transcript);
  const isPastingRef = useRef(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isPastingRef.current) setLocalTranscript(transcript);
  }, [transcript]);

  const debouncedSetTranscript = useDebouncedCallback((value: string) => {
    isPastingRef.current = false;
    setTranscript(value);
  }, 300);

  const handleChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    setLocalTranscript(newValue);
    debouncedSetTranscript(newValue);
  }, [debouncedSetTranscript]);

  const readTranscriptSafe = useCallback((textarea: HTMLTextAreaElement | null): string => {
    return textarea?.value ?? '';
  }, []);

  const handlePaste = useCallback((event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    isPastingRef.current = true;
    const textarea = event.currentTarget;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      const newValue = readTranscriptSafe(textarea);
      if (newValue !== '') {
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
          <h2 className="text-xl font-medium text-slate-900 font-apple mb-2">{UI.title}</h2>
          <p className="text-[15px] text-slate-500 font-light font-apple">
            {UI.subtitle}
          </p>
          <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700 max-w-md">
            <AlertCircle className="mt-0.5 h-4 w-4 text-blue-600" />
            <p>
              <span className="font-medium">{UI.recordingAvailableLabel}</span>{' '}
              {UI.recordingAvailableBody}
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
              {UI.stopRecording}
            </button>
          ) : (
            <button
              onClick={startRecording}
              disabled={isProcessing || isTranscribing}
              title={UI.startRecordingTitle}
              className="inline-flex items-center gap-2 px-5 py-3 min-h-[48px] rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium shadow-sm hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-apple text-[15px]"
            >
              <Play className="w-4 h-4" />
              {UI.startRecording}
            </button>
          )}
        </div>
      </div>

      {/* Audio Waveform Visualization */}
      {isRecording && (
        <div className="mt-4 rounded-lg border border-primary-blue/20 bg-primary-blue/5 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-primary-blue animate-pulse" />
            <span className="text-sm font-medium text-primary-blue font-apple">{UI.listening}</span>
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
              <p className="text-sm font-medium text-amber-800 font-apple">{UI.processingAudioTitle}</p>
              <p className="text-xs text-amber-600 mt-0.5 font-apple font-light">
                {UI.processingAudioBody}
              </p>
              <p className="text-xs text-amber-500 mt-1 font-apple font-light">
                {UI.processingAudioTip}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Processing Transcription Indicator (Vertex / SOAP generation — hidden in capture-only mode) */}
      {!hideAnalyzeButton && (isProcessing || isGeneratingSOAP) && !isTranscribing && (
        <div className="mt-4 rounded-lg border border-primary-blue/20 bg-primary-blue/5 px-4 py-3">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-primary-blue animate-pulse" />
            <div className="flex-1">
              <p className="text-sm font-medium text-primary-blue font-apple">
                {visitType === 'follow-up' ? UI.analyzingFollowUp : UI.analyzingInitial}
              </p>
              <p className="text-xs text-primary-blue/80 mt-0.5 font-apple font-light">
                {visitType === 'follow-up' ? UI.analyzingFollowUpBody : UI.analyzingInitialBody}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
          <span className="font-medium text-slate-700">{UI.languageLabel}</span>
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
          <span className="font-medium text-slate-700">{UI.modeLabel}</span>
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
          <p className="font-medium">{UI.transcriptionError}</p>
          <p>{transcriptError}</p>
        </div>
      )}

      <textarea
        key="transcript-textarea"
        className="mt-4 w-full min-h-[160px] rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-transparent transition"
        placeholder={UI.transcriptPlaceholder}
        value={localTranscript}
        onChange={handleChange}
        onPaste={handlePaste}
        onKeyDown={(event) => {
          if (!hideAnalyzeButton && event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            event.preventDefault();
            handleAnalyzeWithVertex();
          }
        }}
      />

      {transcriptMeta && (
        <div className="mt-2 text-xs text-slate-500 flex flex-wrap items-center gap-3">
          <span>{UI.detectedLang(transcriptMeta.detectedLanguage)}</span>
          {typeof transcriptMeta.averageLogProb === 'number' && (
            <span>{UI.avgLogProb} {transcriptMeta.averageLogProb.toFixed(2)}</span>
          )}
          {typeof transcriptMeta.durationSeconds === 'number' && (
            <span>{UI.duration} {transcriptMeta.durationSeconds.toFixed(1)}s</span>
          )}
          <span>{UI.mode} {MODE_LABELS[mode]}</span>
        </div>
      )}

      <div className="mt-4">
        <p className="text-xs text-slate-500">{UI.audioLocalNote}</p>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <Paperclip className="w-4 h-4 text-slate-500" />
            {UI.attachmentsTitle}
          </div>
          <label className="inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-600 hover:border-slate-400 hover:bg-slate-100 cursor-pointer transition">
            <UploadCloud className="w-4 h-4" />
            {isUploadingAttachment ? UI.uploading : UI.addFiles}
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

        {isUploadingAttachment && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-900 font-apple">{UI.uploadingFileTitle}</p>
                <p className="text-xs text-blue-700 mt-0.5 font-apple font-light">{UI.uploadingFileBody}</p>
              </div>
            </div>
          </div>
        )}

        {attachments.length === 0 && !isUploadingAttachment ? (
          <p className="text-xs text-slate-500">{UI.attachmentsEmpty}</p>
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

        {!hideAnalyzeButton ? (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <button
              onClick={handleAnalyzeWithVertex}
              disabled={isProcessing || isGeneratingSOAP || (!transcript?.trim() && attachments.every(att => !att.extractedText))}
              className="inline-flex items-center gap-2 px-5 py-3 min-h-[48px] rounded-lg bg-gradient-primary hover:bg-gradient-primary-hover text-white shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition font-apple text-[15px] font-medium"
            >
              {(isProcessing || isGeneratingSOAP) ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {visitType === 'follow-up' ? UI.analyzingBtnFollowUp : UI.analyzingBtnInitial}
                </>
              ) : (
                <>
                  <Brain className="w-4 h-4" />
                  {visitType === 'follow-up' ? UI.analyzeBtnFollowUp : UI.analyzeBtnInitial}
                </>
              )}
            </button>
            <p className="mt-2 text-xs text-slate-500">
              {transcript?.trim() && attachments.some(att => att.extractedText)
                ? UI.analyzeHintBoth
                : transcript?.trim()
                  ? UI.analyzeHintTranscript
                  : attachments.some(att => att.extractedText)
                    ? UI.analyzeHintAttachments
                    : UI.analyzeHintEmpty}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.transcript === nextProps.transcript &&
    prevProps.isRecording === nextProps.isRecording &&
    prevProps.isTranscribing === nextProps.isTranscribing &&
    prevProps.isProcessing === nextProps.isProcessing &&
    prevProps.isGeneratingSOAP === nextProps.isGeneratingSOAP &&
    prevProps.transcriptError === nextProps.transcriptError &&
    prevProps.languagePreference === nextProps.languagePreference &&
    prevProps.mode === nextProps.mode &&
    prevProps.attachments.length === nextProps.attachments.length &&
    prevProps.isUploadingAttachment === nextProps.isUploadingAttachment &&
    prevProps.attachmentError === nextProps.attachmentError &&
    prevProps.hideAnalyzeButton === nextProps.hideAnalyzeButton
  );
});

TranscriptArea.displayName = 'TranscriptArea';

export default TranscriptArea;
