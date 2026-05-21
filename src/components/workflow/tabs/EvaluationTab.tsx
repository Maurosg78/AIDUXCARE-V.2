/**
 * EvaluationTab Component
 * 
 * Extracted from ProfessionalWorkflowPage for better code organization.
 * Handles physical evaluation test selection and documentation.
 * 
 * @compliance PHIPA-aware (design goal), security audit logging
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Stethoscope, Loader2, FileText, ChevronRight, Mic, Square } from 'lucide-react';
import type { MSKRegion, MskTestDefinition, TestFieldDefinition } from '../../../core/msk-tests/library/mskTestLibrary';
import { MSK_TEST_LIBRARY, regions, regionLabels, getTestDefinition, hasFieldDefinitions } from '../../../core/msk-tests/library/mskTestLibrary';
import { localizeMskTestForEs, regionLabelsEs } from '../../../core/msk-tests/library/mskTestLibrary.es';
import type { WorkflowRoute } from '../../../services/workflowRouterService';
import { getTopPhysicalTests } from '../../../utils/sortPhysicalTestsByImportance';
import { FirebaseWhisperService } from '../../../services/FirebaseWhisperService';

type EvaluationResult = "normal" | "positive" | "negative" | "inconclusive";
type TestCategoryKey = 'rom' | 'neuro' | 'inspection' | 'strength' | 'functional' | 'orthopedic' | 'general';
export type MageePillarKey = 'observation' | 'palpation' | 'rom' | 'strength';

type MageePillarDefinition = {
  readonly key: MageePillarKey;
  readonly labelEs: string;
  readonly labelEn: string;
};

const MAGEE_BASE_PILLARS: readonly MageePillarDefinition[] = [
  { key: 'observation', labelEs: 'Observación', labelEn: 'Observation' },
  { key: 'palpation', labelEs: 'Palpación', labelEn: 'Palpation' },
  { key: 'rom', labelEs: 'Rango de movimiento', labelEn: 'Range of Motion' },
  { key: 'strength', labelEs: 'Fuerza muscular', labelEn: 'Muscle Strength' },
];

export type MageePillarNotes = Record<MageePillarKey, string>;

const EMPTY_PILLAR_NOTES: MageePillarNotes = {
  observation: '',
  palpation: '',
  rom: '',
  strength: '',
};

type PhysicalTest = {
  id?: string;
  name?: string;
  test?: string;
  description?: string;
};

type EvaluationTestEntry = {
  id: string;
  name: string;
  region: MSKRegion | null;
  source: "ai" | "manual" | "custom";
  description?: string;
  result: EvaluationResult;
  notes: string;
  values?: Record<string, number | string | boolean | null>;
  _prefillDefaults?: Record<string, number | null>;
  sensitivity?: number;
  sensitivityQualitative?: string;
  specificity?: number;
  specificityQualitative?: string;
};

// RESULT_LABELS is defined inside the component so t() can be used (see below)

const RESULT_OPTIONS: EvaluationResult[] = ["normal", "positive", "negative", "inconclusive"];

const deriveTestCategory = (definition?: MskTestDefinition | null): TestCategoryKey => {
  const fallbackCategory = 'general';
  if (!definition) {
    return fallbackCategory;
  }

  const nameText = definition.name.toLowerCase();
  const descriptionText = definition.description.toLowerCase();
  const typicalUseText = (definition.typicalUse || '').toLowerCase();
  const combinedText = `${nameText} ${descriptionText} ${typicalUseText}`;
  const fields = definition.fields ?? [];
  const hasAngleField = fields.some((field) => field.kind === 'angle_bilateral' || field.kind === 'angle_unilateral');
  const hasStrengthField = fields.some((field) => field.unit === 'kg');
  const hasNeurologicalSignal = /neuro|neural|radicular|slump|straight leg raise|slr|sensation|reflex/i.test(combinedText);
  const hasInspectionSignal = /inspection|edema|swelling|scar|deformity|visual|skin/i.test(combinedText);
  const hasStrengthSignal = /strength|weakness|resisted|dynamometer|grip|pinch|empty can/i.test(combinedText);
  const hasFunctionalSignal = /functional|gait|balance|sit to stand|squat|step|reach/i.test(combinedText);
  const hasRomSignal = /range of motion|rom|rotation|flexion|extension|abduction|adduction|pronation|supination/i.test(combinedText);

  if (hasNeurologicalSignal) {
    return 'neuro';
  }
  if (hasInspectionSignal) {
    return 'inspection';
  }
  if (hasStrengthField || hasStrengthSignal) {
    return 'strength';
  }
  if (hasAngleField || hasRomSignal) {
    return 'rom';
  }
  if (hasFunctionalSignal) {
    return 'functional';
  }
  return 'orthopedic';
};

const isMskTest = (t: MskTestDefinition | PhysicalTest): t is MskTestDefinition =>
  'normalTemplate' in t;

const getFieldPreviewKey = (field: TestFieldDefinition): string => {
  if (field.kind === 'angle_bilateral') {
    return 'bilateralAngle';
  }
  if (field.kind === 'angle_unilateral') {
    return 'unilateralAngle';
  }
  if (field.kind === 'yes_no') {
    return 'yesNo';
  }
  if (field.kind === 'score_0_10') {
    return 'score';
  }
  return 'text';
};

type VoiceInputStatus = 'idle' | 'recording' | 'transcribing';

const VoiceInputButton: React.FC<{
  onTranscribedText: (text: string) => void;
}> = ({ onTranscribedText }) => {
  const [status, setStatus] = useState<VoiceInputStatus>('idle');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const stopTracks = () => {
    const activeStream = streamRef.current;
    if (activeStream) {
      const activeTracks = activeStream.getTracks();
      activeTracks.forEach((track) => track.stop());
    }
    streamRef.current = null;
  };

  const startRecording = async () => {
    const mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = mediaStream;
    chunksRef.current = [];

    const preferredTypes = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
    const supportedType = preferredTypes.find((type) => MediaRecorder.isTypeSupported(type));
    const recorderOptions = supportedType ? { mimeType: supportedType } : undefined;
    const mediaRecorder = recorderOptions ? new MediaRecorder(mediaStream, recorderOptions) : new MediaRecorder(mediaStream);
    recorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (event: BlobEvent) => {
      const eventBlob = event.data;
      if (eventBlob && eventBlob.size > 0) {
        chunksRef.current.push(eventBlob);
      }
    };

    mediaRecorder.onstop = async () => {
      setStatus('transcribing');
      try {
        const recordedChunks = chunksRef.current;
        const audioType = mediaRecorder.mimeType || 'audio/webm';
        const audioBlob = new Blob(recordedChunks, { type: audioType });
        const transcriptionResult = await FirebaseWhisperService.transcribe(audioBlob, {
          mode: 'dictation',
          languageHint: 'auto',
        });
        const transcribedText = transcriptionResult.text.trim();
        if (transcribedText) {
          onTranscribedText(transcribedText);
        }
      } catch (error) {
        console.error('[EvaluationTab] Voice dictation failed:', error);
      } finally {
        chunksRef.current = [];
        recorderRef.current = null;
        stopTracks();
        setStatus('idle');
      }
    };

    mediaRecorder.start();
    setStatus('recording');
  };

  const stopRecording = () => {
    const activeRecorder = recorderRef.current;
    if (activeRecorder && activeRecorder.state !== 'inactive') {
      activeRecorder.stop();
    }
  };

  const handleClick = async () => {
    if (status === 'transcribing') return;
    if (status === 'recording') {
      stopRecording();
      return;
    }
    try {
      await startRecording();
    } catch (error) {
      console.error('[EvaluationTab] Microphone start failed:', error);
      stopTracks();
      setStatus('idle');
    }
  };

  const isRecording = status === 'recording';
  const isTranscribing = status === 'transcribing';
  const isDisabled = isTranscribing;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className={`absolute right-2 top-2 inline-flex h-7 w-7 items-center justify-center rounded-md border ${
        isRecording
          ? 'border-red-300 bg-red-50 text-red-600'
          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
      } ${isDisabled ? 'cursor-not-allowed opacity-70' : ''}`}
      title={isRecording ? 'Detener dictado' : isTranscribing ? 'Transcribiendo...' : 'Dictar por voz'}
      aria-label={isRecording ? 'Detener dictado' : isTranscribing ? 'Transcribiendo' : 'Dictar por voz'}
    >
      {isTranscribing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : isRecording ? <Square className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
    </button>
  );
};

// Render field input based on field kind
// Bloque 6: Firma actualizada para aceptar testDefinition como parámetro opcional adicional
const renderFieldInput = (
  field: TestFieldDefinition,
  value: number | string | boolean | null,
  onChange: (newValue: number | string | boolean | null) => void,
  entry?: EvaluationTestEntry,
  updateTest?: (id: string, updates: Partial<EvaluationTestEntry>) => void,
  testDefinition?: MskTestDefinition | null
) => {
  switch (field.kind) {
    case 'angle_bilateral':
    case 'angle_unilateral':
      return (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-700">
            {field.label}
            {field.unit === 'deg' && !field.label.includes('°') && !field.label.includes('deg') && ' (°)'}
            {field.unit === 'kg' && !field.label.includes('(kg)') && !field.label.includes('kg)') && ' (kg)'}
          </label>
          <input
            type="number"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
            value={typeof value === 'number' ? value : ''}
            onChange={(e) => {
              const newValue = e.target.value === '' ? null : Number(e.target.value);
              onChange(newValue);
              
              if (entry && entry._prefillDefaults && updateTest && 
                  entry._prefillDefaults[field.id] !== null && 
                  entry._prefillDefaults[field.id] !== undefined) {
                const prefillValue = entry._prefillDefaults[field.id];
                if (newValue !== null && newValue !== prefillValue) {
                  const updatedPrefills = { ...entry._prefillDefaults };
                  updatedPrefills[field.id] = null;
                  updateTest(entry.id, { 
                    result: "positive",
                    _prefillDefaults: updatedPrefills
                  });
                }
              }
            }}
          />
          {field.normalRange && (
            <p className="text-[11px] text-slate-500">
              Normal: {field.normalRange.min}–{field.normalRange.max} {field.unit === 'deg' ? '°' : field.unit === 'kg' ? 'kg' : ''}
            </p>
          )}
        </div>
      );
    case 'yes_no':
      return (
        <label className="inline-flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-slate-300 text-primary-blue focus:ring-primary-blue"
          />
          {field.label}
        </label>
      );
    case 'score_0_10':
      return (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-700">
            {field.label} (0–10)
          </label>
          <input
            type="number"
            min={0}
            max={10}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
            value={typeof value === 'number' ? value : ''}
            onChange={(e) =>
              onChange(e.target.value === '' ? null : Number(e.target.value))
            }
          />
        </div>
      );
    case 'text':
    default:
      return (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-700">
            {field.label}
          </label>
          <div className="relative">
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-10 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
              rows={2}
              placeholder={field.notesPlaceholder}
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => onChange(e.target.value)}
            />
            <VoiceInputButton
              onTranscribedText={(transcribedText) => {
                const currentText = typeof value === 'string' ? value : '';
                const needsSpacer = currentText.trim().length > 0;
                const spacerText = needsSpacer ? ' ' : '';
                const nextText = `${currentText}${spacerText}${transcribedText}`;
                onChange(nextText);
              }}
            />
          </div>
        </div>
      );
  }
};

export interface EvaluationTabProps {
  // Visit type
  visitType?: 'initial' | 'follow-up';  // ✅ NEW: For follow-up selective re-evaluation
  
  // Test management
  filteredEvaluationTests: EvaluationTestEntry[];
  evaluationTests: EvaluationTestEntry[];
  completedCount: number;
  detectedCaseRegion: MSKRegion | null;
  
  // AI suggestions
  pendingAiSuggestions: Array<{
    key: number;
    rawName: string;
    match?: MskTestDefinition | null;
  }>;
  // ✅ NEW: All AI suggestions (not filtered by "already selected") for calculating top 5
  allAiSuggestions?: Array<{
    key: number;
    rawName: string;
    match?: MskTestDefinition | null;
  }>;
  
  // Test library
  isTestAlreadySelected: (id: string, name: string) => boolean;
  addEvaluationTest: (entry: EvaluationTestEntry) => void;
  removeEvaluationTest: (id: string) => void;
  updateEvaluationTest: (id: string, updates: Partial<EvaluationTestEntry>) => void;
  createEntryFromLibrary: (test: MskTestDefinition, source: "ai" | "manual" | "custom") => EvaluationTestEntry;
  createCustomEntry: (name: string, source: "ai" | "manual" | "custom") => EvaluationTestEntry;
  
  // Custom test form
  customTestName: string;
  customTestRegion: MSKRegion | "other";
  customTestResult: EvaluationResult | "";
  customTestNotes: string;
  isCustomFormOpen: boolean;
  setCustomTestName: (name: string) => void;
  setCustomTestRegion: (region: MSKRegion | "other") => void;
  setCustomTestResult: (result: EvaluationResult | "") => void;
  setCustomTestNotes: (notes: string) => void;
  setIsCustomFormOpen: (open: boolean) => void;
  resetCustomForm: () => void;
  handleAddCustomTest: () => void;
  handleLibrarySelect: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  
  // SOAP generation
  handleGenerateSoap: () => Promise<void>;
  isGeneratingSOAP: boolean;
  onPillarNotesChange?: (notes: MageePillarNotes) => void;
  
  // Workflow
  sessionTypeFromUrl: 'initial' | 'followup' | 'wsib' | 'mva' | 'certificate' | null;
  workflowRoute: WorkflowRoute | null;
}

export const EvaluationTab: React.FC<EvaluationTabProps> = ({
  visitType = 'initial',  // ✅ Default to 'initial' for backward compatibility
  filteredEvaluationTests,
  evaluationTests,
  completedCount,
  detectedCaseRegion,
  pendingAiSuggestions,
  allAiSuggestions, // ✅ NEW: All suggestions (not filtered) for top 5 calculation
  isTestAlreadySelected,
  addEvaluationTest,
  removeEvaluationTest,
  updateEvaluationTest,
  createEntryFromLibrary,
  createCustomEntry,
  customTestName,
  customTestRegion,
  customTestResult,
  customTestNotes,
  isCustomFormOpen,
  setCustomTestName,
  setCustomTestRegion,
  setCustomTestResult,
  setCustomTestNotes,
  setIsCustomFormOpen,
  resetCustomForm,
  handleAddCustomTest,
  handleLibrarySelect,
  handleGenerateSoap,
  isGeneratingSOAP,
  onPillarNotesChange,
  sessionTypeFromUrl,
  workflowRoute,
}) => {
  const { t, i18n } = useTranslation();
  const isSpanishLocale = i18n.language.toLowerCase().startsWith('es');
  const [pillarNotes, setPillarNotes] = useState<MageePillarNotes>(EMPTY_PILLAR_NOTES);
  const visibleRegionLabels = isSpanishLocale ? regionLabelsEs : regionLabels;
  const updatePillarNote = (
    pillarKey: MageePillarKey,
    noteValue: string
  ) => {
    setPillarNotes((currentNotes) => {
      const updatedNotes = {
        ...currentNotes,
        [pillarKey]: noteValue,
      };
      return updatedNotes;
    });
  };

  useEffect(() => {
    if (!onPillarNotesChange) {
      return;
    }

    onPillarNotesChange(pillarNotes);
  }, [onPillarNotesChange, pillarNotes]);
  const localizeTestForDisplay = (test: any) => {
    if (!isSpanishLocale) {
      return test;
    }

    const localizedTest = localizeMskTestForEs(test);
    return localizedTest;
  };
  const categoryLabels: Record<TestCategoryKey, string> = {
    rom: t('workflow.evaluation.categoryLabels.rom'),
    neuro: t('workflow.evaluation.categoryLabels.neuro'),
    inspection: t('workflow.evaluation.categoryLabels.inspection'),
    strength: t('workflow.evaluation.categoryLabels.strength'),
    functional: t('workflow.evaluation.categoryLabels.functional'),
    orthopedic: t('workflow.evaluation.categoryLabels.orthopedic'),
    general: t('workflow.evaluation.categoryLabels.general'),
  };
  const fieldPreviewLabels: Record<string, string> = {
    bilateralAngle: t('workflow.evaluation.fieldPreviewLabels.bilateralAngle'),
    unilateralAngle: t('workflow.evaluation.fieldPreviewLabels.unilateralAngle'),
    yesNo: t('workflow.evaluation.fieldPreviewLabels.yesNo'),
    score: t('workflow.evaluation.fieldPreviewLabels.score'),
    text: t('workflow.evaluation.fieldPreviewLabels.text'),
  };
  const sourceLabels: Record<EvaluationTestEntry['source'], string> = {
    ai: t('workflow.evaluation.sourceAi'),
    manual: t('workflow.evaluation.sourceManual'),
    custom: t('workflow.evaluation.sourceCustom'),
  };
  const RESULT_LABELS: Record<EvaluationResult, string> = {
    normal: t('workflow.evaluation.resultLabels.normal'),
    positive: t('workflow.evaluation.resultLabels.positive'),
    negative: t('workflow.evaluation.resultLabels.negative'),
    inconclusive: t('workflow.evaluation.resultLabels.inconclusive'),
  };
  const totalTests = filteredEvaluationTests.length;
  const progressPercent = totalTests === 0 ? 0 : Math.round((completedCount / totalTests) * 100);
  const isInitialEvaluation = visitType === 'initial' && !(sessionTypeFromUrl === 'followup' || workflowRoute?.type === 'follow-up');
  const pillarSectionTitle = isSpanishLocale
    ? 'Evaluación física base'
    : 'Base Physical Assessment';
  const pillarSectionDescription = isSpanishLocale
    ? 'Cuatro pilares documentales siempre disponibles para evaluación inicial. No son sugerencias ni pruebas obligatorias.'
    : 'Four documentary pillars always available for initial assessment. These are not suggestions or required tests.';
  const pillarPlaceholder = isSpanishLocale
    ? 'Hallazgos del fisioterapeuta...'
    : 'Clinician findings...';

  // ✅ FIX: Separate ALL AI suggestions into top 5 (phase 1) and additional tests (sidebar)
  // IMPORTANT: Calculate top 5 based on ALL suggestions (not filtered), then filter only top 5 for display
  // This ensures sidebar always shows additional tests even if top 5 are already added
  const { topTests: topAiSuggestions, remainingTests: additionalAiSuggestions } = useMemo(() => {
    // ✅ CRITICAL: Use allAiSuggestions (ALL suggestions, not filtered) if available
    // This ensures we calculate top 5 from ALL tests, not just pending ones
    const allSuggestions = allAiSuggestions && allAiSuggestions.length > 0 
      ? allAiSuggestions 
      : pendingAiSuggestions;
    
    console.log('[EvaluationTab] Calculating top 5 (memoized):', {
      allAiSuggestionsCount: allAiSuggestions?.length || 0,
      pendingAiSuggestionsCount: pendingAiSuggestions.length,
      usingAll: !!(allAiSuggestions && allAiSuggestions.length > 0),
      allSuggestionsCount: allSuggestions.length
    });
    
    if (allSuggestions.length === 0) {
      return { topTests: [], remainingTests: [] };
    }

    // Convert to format compatible with sortPhysicalTestsByImportance
    // Include sensitivityQualitative and specificityQualitative from match for score calculation
    const formattedSuggestions = allSuggestions.map((item) => {
      const match = item.match;
      const sensitivity = match?.sensitivity;
      const specificity = match?.specificity;
      const sensitivityQual = (match as any)?.sensitivityQualitative;
      const specificityQual = (match as any)?.specificityQualitative;
      
      return {
        name: match?.name || item.rawName,
        test: match?.name || item.rawName,
        // Bloque 6: evidence_level removido - no existe en MskTestDefinition, usar sensitivityQualitative/specificityQualitative si es necesario
        sensitivity: typeof sensitivity === 'number' ? sensitivity : undefined,
        specificity: typeof specificity === 'number' ? specificity : undefined,
        sensitivityQualitative: sensitivityQual || (typeof sensitivity === 'string' ? sensitivity : undefined),
        specificityQualitative: specificityQual || (typeof specificity === 'string' ? specificity : undefined),
        justification: match?.description || (match as any)?.rationale,
        originalIndex: item.key,
        match: match,
        rawName: item.rawName,
      };
    });

    // ✅ Sort by importance using average score (sensitivity + specificity) / 2
    // This determines the top 5 best tests based on clinical value
    const sortedAndSeparated = getTopPhysicalTests(formattedSuggestions, 5);
    
    console.log('[EvaluationTab] Top 5 calculated (memoized):', {
      topTestsCount: sortedAndSeparated.topTests.length,
      remainingTestsCount: sortedAndSeparated.remainingTests.length,
      topTests: sortedAndSeparated.topTests.map((t: any) => t.name || t.rawName),
      remainingTests: sortedAndSeparated.remainingTests.map((t: any) => t.name || t.rawName)
    });
    
    // ✅ FIX: Filter top 5 by "already selected" ONLY for phase 1 display
    // Phase 1 should only show top 5 tests that are NOT already added
    const topTestsFiltered = sortedAndSeparated.topTests.filter((test: any) => {
      const candidateName = test.match?.name || test.rawName || test.name || '';
      const candidateId = test.match?.id || `ai-${candidateName.toLowerCase().trim()}`;
      const alreadySelected = filteredEvaluationTests.some(
        (evaluationTest) => evaluationTest.id === candidateId || 
        evaluationTest.name.toLowerCase().trim() === candidateName.toLowerCase().trim()
      );
      return !alreadySelected;
    });
    
    // ✅ CRITICAL: Ensure remainingTests have the correct format (match, rawName, originalIndex) for sidebar rendering
    const remainingTestsFormatted = sortedAndSeparated.remainingTests.map((test: any) => {
      // Find the original suggestion from allSuggestions to preserve rawName, match, originalIndex
      const originalSuggestion = allSuggestions.find((item: any) => item.key === test.originalIndex);
      if (originalSuggestion) {
        // Return original format with additional formatted fields for sorting
        return {
          ...originalSuggestion, // Preserve original format (rawName, match, key, displayName)
          ...test, // Add formatted fields (name, test, evidence_level, sensitivity, etc.)
        };
      }
      // Fallback: return formatted test with required fields
      return {
        ...test,
        rawName: test.rawName || test.name || test.test,
        originalIndex: test.originalIndex,
        key: test.originalIndex,
        match: test.match,
      };
    });
    
    // ✅ FIX: Filter additional tests (6+) to exclude tests that are already selected
    // If a test from the sidebar is selected, it should disappear from the sidebar because it's now in Selected Tests
    // Use the same logic as isTestAlreadySelected: compare by id OR normalized name
    // IMPORTANT: Clean "Consider assessing" prefix from names to match how tests are created in continueToEvaluation
    const normalizeName = (value: string) => value.toLowerCase().trim();
    const cleanTestName = (name: string) => name.replace(/^Consider assessing\s+/i, '').trim();
    
    const additionalTestsFiltered = remainingTestsFormatted.filter((test: any) => {
      const rawCandidateName = test.match?.name || test.rawName || test.name || '';
      const candidateName = cleanTestName(rawCandidateName); // Clean prefix to match how tests are created
      const candidateId = test.match?.id || `ai-${normalizeName(candidateName)}`;
      
      // Use the same comparison logic as isTestAlreadySelected
      // Use evaluationTests (not filteredEvaluationTests) to match isTestAlreadySelected behavior
      const alreadySelected = evaluationTests.some(
        (evaluationTest) => {
          const testIdMatches = evaluationTest.id === candidateId;
          // Compare cleaned names to ensure consistency
          const testNameMatches = normalizeName(evaluationTest.name) === normalizeName(candidateName);
          return testIdMatches || testNameMatches;
        }
      );
      
      return !alreadySelected; // Only show tests that are NOT already selected
    });
    
    const finalResult = {
      topTests: topTestsFiltered,
      remainingTests: additionalTestsFiltered, // ✅ FIX: Filter out tests that are already in the main list
    };
    
    const sidebarShouldShow = finalResult.remainingTests.length > 0;
    const remainingTestsCount = finalResult.remainingTests.length;
    
    console.log('[EvaluationTab] Final result:', {
      topTestsCount: finalResult.topTests.length,
      remainingTestsCount,
      sidebarShouldShow,
      totalSuggestionsFromVertex: allSuggestions.length,
      reason: remainingTestsCount === 0 
        ? 'No sidebar: Vertex only suggested 5 tests (or fewer). Sidebar only shows tests 6+.' 
        : `Sidebar will show ${remainingTestsCount} additional test(s)`,
      remainingTestsDetails: finalResult.remainingTests.map((t: any) => ({
        originalIndex: t.originalIndex || t.key,
        rawName: t.rawName || t.name,
        hasMatch: !!t.match,
        matchName: t.match?.name
      }))
    });
    
    return finalResult;
  }, [allAiSuggestions, pendingAiSuggestions, filteredEvaluationTests]);
  const quickPickTests = useMemo(() => {
    const relevantRegion = detectedCaseRegion;
    const candidateTests = relevantRegion
      ? MSK_TEST_LIBRARY.filter((test) => test.region === relevantRegion)
      : MSK_TEST_LIBRARY;
    const limitedTests = candidateTests.slice(0, 6);
    return limitedTests;
  }, [detectedCaseRegion]);

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Stethoscope className="w-6 h-6 text-emerald-600" />
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">
            {visitType === 'follow-up' ? t('workflow.selectiveReevaluation') : t('workflow.physicalEvaluation')}
          </h2>
          <p className="text-sm text-slate-500">
            {visitType === 'follow-up' 
              ? t('workflow.evaluationSubtitleFollowup')
              : t('workflow.evaluationSubtitleInitial')}
          </p>
        </div>
      </header>

      {/* ✅ FOLLOW-UP: Banner explicativo para re-evaluación selectiva */}
      {visitType === 'follow-up' && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-sm font-semibold text-blue-900 mb-2">
            {t('workflow.evaluationBannerTitle')}
          </h3>
          <p className="text-sm text-blue-700 mb-2">
            {t('workflow.evaluationBannerBody')}
          </p>
          <ul className="text-xs text-blue-700 space-y-1 list-disc list-inside">
            <li>{t('workflow.evaluationBannerBullet1')}</li>
            <li>{t('workflow.evaluationBannerBullet2')}</li>
            <li>{t('workflow.evaluationBannerBullet3')}</li>
          </ul>
        </div>
      )}

      {isInitialEvaluation && (
        <section className="rounded-3xl border border-emerald-100 bg-emerald-50/40 px-5 py-5 shadow-sm">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              {pillarSectionTitle}
            </h3>
            <p className="mt-1 text-xs text-slate-600">
              {pillarSectionDescription}
            </p>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {MAGEE_BASE_PILLARS.map((pillar) => {
              const pillarLabel = isSpanishLocale ? pillar.labelEs : pillar.labelEn;
              const pillarNoteValue = pillarNotes[pillar.key];

              return (
                <div key={pillar.key} className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    {pillarLabel}
                  </label>
                  <textarea
                    value={pillarNoteValue}
                    onChange={(event) => {
                      const newValue = event.target.value;
                      updatePillarNote(pillar.key, newValue);
                    }}
                    placeholder={pillarPlaceholder}
                    rows={2}
                    className="w-full rounded-xl border border-emerald-100 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          {/* FASE 2: Additional AI-suggested tests (6+) in sidebar for deeper exploration */}
          {additionalAiSuggestions.length > 0 && !(sessionTypeFromUrl === 'followup' || workflowRoute?.type === 'follow-up') && (
            <section className="rounded-3xl border border-slate-200 bg-white px-4 py-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800">{t('workflow.additionalTests')}</h3>
              <p className="mt-1 text-xs text-slate-500">
                {t('workflow.evaluation.additionalTestsHint')}
              </p>
              <div className="mt-3 space-y-2 max-h-[400px] overflow-y-auto">
                {additionalAiSuggestions.length === 0 ? (
                  <p className="text-[11px] text-slate-500 text-center py-2">
                    {t('workflow.evaluation.additionalTestsEmpty')}
                  </p>
                ) : (
                  additionalAiSuggestions.map((item: any) => {
                    const matched = item.match;
                    const localizedMatched = matched ? localizeTestForDisplay(matched) : null;
                    const displayName = localizedMatched ? localizedMatched.name : item.rawName;
                    const categoryKey = deriveTestCategory(matched);
                    const categoryLabel = categoryLabels[categoryKey];
                    const fieldPreviewItems = (localizedMatched?.fields ?? []).slice(0, 3).map((field) => fieldPreviewLabels[getFieldPreviewKey(field)]);
                    return (
                      <div
                        key={`ai-additional-${item.originalIndex || item.key}`}
                        className="flex items-start justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                      >
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-700">{displayName}</p>
                            <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                              {categoryLabel}
                            </span>
                          </div>
                          <p className="mt-1 text-[11px] text-slate-500">
                            {localizedMatched ? localizedMatched.description : t('workflow.evaluation.customEntry')}
                          </p>
                          {localizedMatched?.typicalUse && (
                            <p className="mt-1 text-[11px] text-slate-600">
                              <span className="font-medium text-slate-700">{t('workflow.evaluation.typicalUseLabel')}:</span> {localizedMatched.typicalUse}
                            </p>
                          )}
                          {fieldPreviewItems.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                                {t('workflow.evaluation.expectedInputsLabel')}
                              </span>
                              {fieldPreviewItems.map((fieldPreview) => (
                                <span
                                  key={`${displayName}-${fieldPreview}`}
                                  className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-600"
                                >
                                  {fieldPreview}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (matched) {
                              addEvaluationTest(createEntryFromLibrary(matched, "ai"));
                            } else {
                              addEvaluationTest(createCustomEntry(item.rawName || item.name, "ai"));
                            }
                          }}
                          className="ml-2 rounded-full bg-[#8b5cf6] px-3 py-1 text-xs text-white transition hover:bg-[#7c3aed]"
                        >
                          {t('workflow.evaluation.addButton')}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </section>
          )}

          {/* ✅ WORKFLOW OPTIMIZATION: Hide test library for follow-ups */}
          {!(sessionTypeFromUrl === 'followup' || workflowRoute?.type === 'follow-up') && (
            <section className="rounded-3xl border border-slate-200 bg-white px-4 py-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">{t('workflow.evaluation.addTests')}</h3>
                <p className="mt-1 text-xs text-slate-500">
                  {t('workflow.evaluation.addTestsHint')}
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    {t('workflow.evaluation.libraryTests')}
                  </label>
                  {quickPickTests.length > 0 && (
                    <div className="mt-2 space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <div>
                        <p className="text-xs font-semibold text-slate-700">
                          {detectedCaseRegion
                            ? t('workflow.evaluation.quickPicksWithRegion', { region: visibleRegionLabels[detectedCaseRegion] })
                            : t('workflow.evaluation.quickPicks')}
                        </p>
                        <p className="mt-1 text-[11px] text-slate-500">
                          {t('workflow.evaluation.quickPicksHint')}
                        </p>
                      </div>
                      <div className="space-y-2">
                        {quickPickTests.map((test) => {
                          const localizedTest = localizeTestForDisplay(test);
                          const alreadySelected = isTestAlreadySelected(test.id, test.name);
                          const isLibraryTest = isMskTest(localizedTest);
                          const categorySource = isMskTest(test) ? test : null;
                          const categoryKey = deriveTestCategory(categorySource);
                          const categoryLabel = categoryLabels[categoryKey];
                          const fieldDefinitions = isLibraryTest ? (localizedTest.fields ?? []) : [];
                          const expectedFieldLabels = fieldDefinitions.map((field) => fieldPreviewLabels[getFieldPreviewKey(field)]);
                          const expectedFieldUniqueLabels = Array.from(new Set(expectedFieldLabels)) as string[];
                          const typicalUseText = isLibraryTest ? localizedTest.typicalUse : undefined;
                          const canCreateEntry = isLibraryTest;
                          return (
                            <div
                              key={`quick-pick-${test.id}`}
                              className="rounded-2xl border border-slate-200 bg-white px-3 py-3"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-semibold text-slate-800">{localizedTest.name}</p>
                                    <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                                      {categoryLabel}
                                    </span>
                                  </div>
                                  <p className="mt-1 text-[11px] text-slate-500">{localizedTest.description}</p>
                                  {typicalUseText && (
                                    <p className="mt-1 text-[11px] text-slate-600">
                                      <span className="font-medium text-slate-700">{t('workflow.evaluation.typicalUseLabel')}:</span> {typicalUseText}
                                    </p>
                                  )}
                                  {expectedFieldUniqueLabels.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                                        {t('workflow.evaluation.expectedInputsLabel')}
                                      </span>
                                      {expectedFieldUniqueLabels.map((fieldPreview) => (
                                        <span
                                          key={`${test.id}-${fieldPreview}`}
                                          className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] text-slate-600"
                                        >
                                          {fieldPreview}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  disabled={alreadySelected || !canCreateEntry}
                                  onClick={() => {
                                    if (!canCreateEntry) {
                                      return;
                                    }
                                    const nextEntry = createEntryFromLibrary(test as MskTestDefinition, 'manual');
                                    addEvaluationTest(nextEntry);
                                  }}
                                  className="rounded-full bg-[#7c3aed] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                                >
                                  {alreadySelected ? t('workflow.evaluation.alreadyAddedButton') : t('workflow.evaluation.addButton')}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <select
                    onChange={handleLibrarySelect}
                    defaultValue=""
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
                  >
                    <option value="">{t('workflow.evaluation.selectTestPlaceholder')}</option>
                    {regions.map((region) => (
                      <optgroup key={region} label={visibleRegionLabels[region]}>
                        {MSK_TEST_LIBRARY.filter((test) => test.region === region).map((test) => {
                          const localizedTest = localizeTestForDisplay(test);
                          const disabled = isTestAlreadySelected(test.id, test.name);
                          return (
                            <option key={test.id} value={test.id} disabled={disabled}>
                              {localizedTest.name}
                              {disabled ? t('workflow.evaluation.addedSuffix') : ""}
                            </option>
                          );
                        })}
                      </optgroup>
                    ))}
                  </select>
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    {t('workflow.evaluation.testsAlreadyAddedHint')}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        {t('workflow.evaluation.customTest')}
                      </label>
                      <p className="mt-1 text-xs text-slate-500">
                        {t('workflow.evaluation.customTestHint')}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        resetCustomForm();
                        setIsCustomFormOpen(true);
                      }}
                      disabled={isCustomFormOpen}
                      className="rounded-full bg-[#7c3aed] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                    >
                      {t('workflow.evaluation.addCustomTest')}
                    </button>
                  </div>

                  {isCustomFormOpen && (
                    <div className="mt-3 space-y-3">
                      <input
                        value={customTestName}
                        onChange={(event) => setCustomTestName(event.target.value)}
                        placeholder={t('workflow.evaluation.testNamePlaceholder')}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={customTestRegion}
                          onChange={(event) => setCustomTestRegion(event.target.value as MSKRegion | 'other')}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
                        >
                          {Object.entries(regionLabels).map(([regionKey, label]) => (
                            <option key={regionKey} value={regionKey}>
                              {label}
                            </option>
                          ))}
                          <option value="other">{t('workflow.evaluation.regionOther')}</option>
                        </select>
                        <select
                          value={customTestResult}
                          onChange={(event) => setCustomTestResult(event.target.value as EvaluationResult | '')}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
                        >
                          <option value="">{t('workflow.evaluation.resultOptional')}</option>
                          {RESULT_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {RESULT_LABELS[option]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <textarea
                        value={customTestNotes}
                        onChange={(event) => setCustomTestNotes(event.target.value)}
                        rows={2}
                        placeholder={t('workflow.evaluation.notesOptional')}
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            resetCustomForm();
                            setIsCustomFormOpen(false);
                          }}
                          className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                        >
                          {t('workflow.evaluation.cancel')}
                        </button>
                        <button
                          type="button"
                          onClick={handleAddCustomTest}
                          className="rounded-full bg-[#7c3aed] px-4 py-2 text-xs font-semibold text-white hover:bg-[#6d28d9]"
                        >
                          {t('workflow.evaluation.saveCustomTest')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>

        <div className="space-y-4">
          {/* ✅ NOTE: Top 5 Recommended Tests are shown in Phase 1 (AnalysisTab), not here in Phase 2 */}
          {/* Phase 2 (EvaluationTab) only shows "Selected Tests" for documentation */}

          <div className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-800">{t('workflow.evaluation.selectedTests')}</p>
              <span className="text-xs text-slate-500">
                {t('workflow.evaluation.selectedCount', { count: filteredEvaluationTests.length })}
                {detectedCaseRegion && filteredEvaluationTests.length !== evaluationTests.length && (
                  <span className="text-amber-600 ml-1">
                    ({t('workflow.evaluation.filteredByRegion', { count: evaluationTests.length - filteredEvaluationTests.length })})
                  </span>
                )}
              </span>
            </div>
            {filteredEvaluationTests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
                {detectedCaseRegion 
                  ? t('workflow.evaluation.emptyStateWithRegion', { region: visibleRegionLabels[detectedCaseRegion] })
                  : t('workflow.evaluation.emptyState')}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEvaluationTests.map((entry) => {
                  const definition = getTestDefinition(entry.id);
                  const hasFields = definition && hasFieldDefinitions(definition);
                  const testDefinition = hasFields ? definition as MskTestDefinition : null;
                  const localizedDefinition = testDefinition ? localizeTestForDisplay(testDefinition) : null;
                  const displayName = localizedDefinition?.name || entry.name;
                  const displayDescription = localizedDefinition?.description || entry.description;
                  const categoryKey = deriveTestCategory(testDefinition);
                  const categoryLabel = categoryLabels[categoryKey];
                  const expectedFieldLabels = (localizedDefinition?.fields ?? []).map((field) => fieldPreviewLabels[getFieldPreviewKey(field)]);
                  const expectedFieldUniqueLabels = Array.from(new Set(expectedFieldLabels)) as string[];

                  return (
                    <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 space-y-3 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-slate-800">{displayName}</p>
                            <span className="inline-flex items-center rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-medium text-violet-700">
                              {categoryLabel}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500">
                            {entry.region ? visibleRegionLabels[entry.region] : t('workflow.evaluation.regionGeneral')} · {t('workflow.evaluation.sourceLabel')}: {sourceLabels[entry.source]}
                          </p>
                          {displayDescription && (
                            <p className="mt-1 text-[11px] text-slate-500">{displayDescription}</p>
                          )}
                          {localizedDefinition?.typicalUse && (
                            <p className="mt-1 text-[11px] text-slate-600">
                              <span className="font-medium text-slate-700">{t('workflow.evaluation.typicalUseLabel')}:</span> {localizedDefinition.typicalUse}
                            </p>
                          )}
                          {expectedFieldUniqueLabels.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                                {t('workflow.evaluation.expectedInputsLabel')}
                              </span>
                              {expectedFieldUniqueLabels.map((fieldPreview) => (
                                <span
                                  key={`${entry.id}-${fieldPreview}`}
                                  className="inline-flex items-center rounded-full border border-slate-200 bg-white px-2 py-0.5 text-[10px] text-slate-600"
                                >
                                  {fieldPreview}
                                </span>
                              ))}
                            </div>
                          )}
                          {(entry.sensitivity !== undefined || entry.sensitivityQualitative || entry.specificity !== undefined || entry.specificityQualitative) && (
                            <div className="flex gap-2 mt-1 flex-wrap">
                              {(entry.sensitivity !== undefined || entry.sensitivityQualitative) && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                  Sn: {entry.sensitivity !== undefined ? `${Math.round(entry.sensitivity * 100)}%` : entry.sensitivityQualitative}
                                </span>
                              )}
                              {(entry.specificity !== undefined || entry.specificityQualitative) && (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                  Sp: {entry.specificity !== undefined ? `${Math.round(entry.specificity * 100)}%` : entry.specificityQualitative}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeEvaluationTest(entry.id)}
                          className="text-xs text-slate-400 hover:text-rose-500"
                        >
                          {t('workflow.evaluation.remove')}
                        </button>
                      </div>

                      {/* Render specific fields if test has field definitions */}
                      {hasFields && localizedDefinition?.fields && localizedDefinition.fields.length > 0 ? (
                        <div className="space-y-4">
                          {/* Test-specific fields */}
                          <div className="space-y-3 bg-white rounded-lg p-3 border border-slate-100">
                            {localizedDefinition.fields.map((field) => (
                              <div key={field.id}>
                                {renderFieldInput(
                                  field,
                                  entry.values?.[field.id] ?? null,
                                  (newValue) => {
                                    const updatedValues = { ...(entry.values ?? {}), [field.id]: newValue };
                                    
                                    // ✅ AUTO-RESULT: Detect changes that indicate abnormal results
                                    let newResult = entry.result;
                                    
                                    if (field.kind === 'yes_no') {
                                      if (newValue === true) {
                                        newResult = "positive";
                                      } else if (newValue === false) {
                                        const hasOtherAbnormalFindings = localizedDefinition.fields.some(f => {
                                          if (f.id === field.id) return false;
                                          const val = updatedValues[f.id];
                                          if (f.kind === 'yes_no' && val === true) return true;
                                          if (f.kind === 'score_0_10' && typeof val === 'number' && val > 0) return true;
                                          if ((f.kind === 'angle_bilateral' || f.kind === 'angle_unilateral') && 
                                              typeof val === 'number' && f.normalRange) {
                                            if (val < f.normalRange.min || val > f.normalRange.max) return true;
                                          }
                                          return false;
                                        });
                                        if (!hasOtherAbnormalFindings) {
                                          newResult = "normal";
                                        }
                                      }
                                    } else if (field.kind === 'score_0_10') {
                                      if (newValue !== null && typeof newValue === 'number' && newValue > 0) {
                                        newResult = "positive";
                                      } else if (newValue === 0 || newValue === null) {
                                        const hasOtherAbnormalFindings = localizedDefinition.fields.some(f => {
                                          if (f.id === field.id) return false;
                                          const val = updatedValues[f.id];
                                          if (f.kind === 'yes_no' && val === true) return true;
                                          if (f.kind === 'score_0_10' && typeof val === 'number' && val > 0) return true;
                                          if ((f.kind === 'angle_bilateral' || f.kind === 'angle_unilateral') && 
                                              typeof val === 'number' && f.normalRange) {
                                            if (val < f.normalRange.min || val > f.normalRange.max) return true;
                                          }
                                          return false;
                                        });
                                        if (!hasOtherAbnormalFindings) {
                                          newResult = "normal";
                                        }
                                      }
                                    }
                                    
                                    updateEvaluationTest(entry.id, { 
                                      values: updatedValues,
                                      result: newResult
                                    });
                                  },
                                  entry,
                                  updateEvaluationTest,
                                  testDefinition
                                )}
                              </div>
                            ))}
                          </div>
                          
                          {/* Result selection section */}
                          <div className="space-y-3 pt-2 border-t border-slate-200">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600">
                                {t('workflow.evaluation.statusLabel')}: {RESULT_LABELS[entry.result] || t('workflow.evaluation.statusPending')}
                              </span>
                              <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                                <input
                                  type="checkbox"
                                  // Bloque 6: Corregido - "abnormal" no existe en el tipo, solo "positive"
                                  checked={entry.result === "positive"}
                                  onChange={(event) =>
                                    updateEvaluationTest(entry.id, {
                                      result: event.target.checked ? "positive" : "normal",
                                    })
                                  }
                                  className="h-3.5 w-3.5 rounded border-slate-300 text-primary-blue focus:ring-primary-blue"
                                />
                                {t('workflow.evaluation.abnormalResult')}
                              </label>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {RESULT_OPTIONS.map((option) => (
                                <button
                                  key={option}
                                  type="button"
                                  onClick={() => updateEvaluationTest(entry.id, { result: option })}
                                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                                    entry.result === option
                                      ? 'bg-gradient-to-r from-primary-blue to-primary-purple text-white shadow-sm'
                                      : 'bg-white border border-slate-200 text-slate-600 hover:border-primary-blue/30 hover:bg-primary-blue/5'
                                  }`}
                                >
                                  {RESULT_LABELS[option]}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          {/* Add Notes field */}
                          <div className="pt-2 border-t border-slate-200">
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">
                              {t('workflow.evaluation.addNotes')}
                            </label>
                            <div className="relative">
                              <textarea
                                value={entry.notes || ''}
                                onChange={(event) => updateEvaluationTest(entry.id, { notes: event.target.value })}
                                rows={2}
                                placeholder={t('workflow.evaluation.notesPlaceholder')}
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-10 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                              />
                              <VoiceInputButton
                                onTranscribedText={(transcribedText) => {
                                  const currentNotes = entry.notes || '';
                                  const hasExistingNotes = currentNotes.trim().length > 0;
                                  const spacerText = hasExistingNotes ? ' ' : '';
                                  const nextNotes = `${currentNotes}${spacerText}${transcribedText}`;
                                  updateEvaluationTest(entry.id, { notes: nextNotes });
                                }}
                              />
                            </div>
                            <p className="mt-1 text-[10px] text-slate-400">
                              {t('workflow.evaluation.notesHelper')}
                            </p>
                          </div>
                        </div>
                      ) : (
                        /* Fallback: generic form for tests without fields */
                        <>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600">
                              {t('workflow.evaluation.statusLabel')}: {RESULT_LABELS[entry.result] || t('workflow.evaluation.statusPending')}
                            </span>
                            <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                              <input
                                type="checkbox"
                                checked={entry.result === "positive"}
                                onChange={(event) =>
                                  updateEvaluationTest(entry.id, {
                                    result: event.target.checked ? "positive" : "normal",
                                  })
                                }
                                className="h-3.5 w-3.5 rounded border-slate-300 text-primary-blue focus:ring-primary-blue"
                              />
                              {t('workflow.evaluation.abnormalResult')}
                            </label>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {RESULT_OPTIONS.map((option) => (
                              <button
                                key={option}
                                type="button"
                                onClick={() => updateEvaluationTest(entry.id, { result: option })}
                                className={`px-3 py-1.5 rounded-full text-xs transition ${
                                  entry.result === option
                                    ? 'bg-gradient-to-r from-primary-blue to-primary-purple text-white shadow'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:border-sky-200'
                                }`}
                              >
                                {RESULT_LABELS[option]}
                              </button>
                            ))}
                          </div>
                          <div className="relative">
                            <textarea
                              value={entry.notes}
                              onChange={(event) => updateEvaluationTest(entry.id, { notes: event.target.value })}
                              rows={3}
                              placeholder={t('workflow.evaluation.fallbackNotesPlaceholder')}
                              className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-10 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
                            />
                            <VoiceInputButton
                              onTranscribedText={(transcribedText) => {
                                const currentNotes = entry.notes || '';
                                const hasExistingNotes = currentNotes.trim().length > 0;
                                const spacerText = hasExistingNotes ? ' ' : '';
                                const nextNotes = `${currentNotes}${spacerText}${transcribedText}`;
                                updateEvaluationTest(entry.id, { notes: nextNotes });
                              }}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="text-sm text-slate-500">
          {t('workflow.evaluation.progressText', { completed: completedCount, total: totalTests, percent: progressPercent })}
        </div>
        <button
          onClick={() => {
            void handleGenerateSoap();
          }}
          disabled={filteredEvaluationTests.length === 0 || isGeneratingSOAP}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white hover:from-sky-600 hover:to-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {isGeneratingSOAP ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('workflow.evaluation.generatingSoap')}
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              {t('workflow.evaluation.generateSoap')}
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default EvaluationTab;
