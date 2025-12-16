// @ts-nocheck
import { useEffect, useMemo, useState, useCallback } from "react";
import { Play, Square, Mic, Loader2, CheckCircle, Download, Copy, Brain, Stethoscope, ClipboardList, ChevronsRight, AlertCircle, UploadCloud, Paperclip, X, FileText } from "lucide-react";
import type { WhisperSupportedLanguage } from "../services/OpenAIWhisperService";
import { useSharedWorkflowState } from "../hooks/useSharedWorkflowState";
import { useNiagaraProcessor } from "../hooks/useNiagaraProcessor";
import { useTranscript } from "../hooks/useTranscript";
import { useTimer } from "../hooks/useTimer";
import sessionService from "../services/sessionService";
import type { ClinicalAnalysis } from "../utils/cleanVertexResponse";
import type { SOAPNote } from "../types/vertex-ai";
import { ClinicalAnalysisResults } from "../components/ClinicalAnalysisResults";
import ClinicalAttachmentService, { ClinicalAttachment } from "../services/clinicalAttachmentService";
import { matchTestName } from "@/core/msk-tests/matching/fuzzyMatch";
import { SOAPEditor, type SOAPStatus } from "../components/SOAPEditor";
import { buildSOAPContext, detectVisitType, validateSOAPContext, type VisitType } from "../core/soap/SOAPContextBuilder";
import { generateSOAPNote as generateSOAPNoteFromService } from "../services/vertex-ai-soap-service";
import { buildPhysicalExamResults, buildPhysicalEvaluationSummary } from "../core/soap/PhysicalExamResultBuilder";
import { organizeSOAPData, validateUnifiedData, createDataSummary, type UnifiedClinicalData } from "../core/soap/SOAPDataOrganizer";
import { AnalyticsService } from "../services/analyticsService";
import type { ValueMetricsEvent } from "../services/analyticsService";
import { CrossBorderAIConsentService } from "../services/crossBorderAIConsentService";
import type { CrossBorderAIConsent } from "../services/crossBorderAIConsentService";
import { CrossBorderAIConsentModal } from "../components/consent/CrossBorderAIConsentModal";
import { FeedbackWidget } from "../components/feedback/FeedbackWidget";
import { FeedbackService } from "../services/feedbackService";
import {
  MSK_TEST_LIBRARY,
  regions,
  regionLabels,
  type MSKRegion,
  type MskTestDefinition,
  type PhysicalTest,
  type TestFieldDefinition,
  hasFieldDefinitions,
  getTestDefinition,
} from "@/core/msk-tests/library/mskTestLibrary";

type ActiveTab = "analysis" | "evaluation" | "soap";

type EvaluationResult = "normal" | "positive" | "negative" | "inconclusive";

type EvaluationTestEntry = {
  id: string;
  name: string;
  region: MSKRegion | null;
  source: "ai" | "manual" | "custom";
  description?: string;
  result: EvaluationResult;
  notes: string;
  values?: Record<string, number | string | boolean | null>; // NEW: specific field values
  _prefillDefaults?: Record<string, number | null>; // Internal: track pre-filled normal values
};

const demoPatient = {
  id: "CA-TEST-001",
  name: "Sofia Bennett",
  email: "sofia.bennett@example.com",
  province: "Ontario",
  specialty: "Physiotherapy",
};

const RESULT_LABELS: Record<EvaluationResult, string> = {
  normal: "Normal",
  positive: "Positive",
  negative: "Negative",
  inconclusive: "Inconclusive",
};

const RESULT_OPTIONS: EvaluationResult[] = ["normal", "positive", "negative", "inconclusive"];

const isValidResult = (value: any): value is EvaluationResult =>
  value === "normal" || value === "positive" || value === "negative" || value === "inconclusive";

const sanitizeSource = (value: any): EvaluationTestEntry["source"] =>
  value === "ai" || value === "custom" ? value : "manual";

const sanitizeEvaluationEntry = (
  entry: Partial<EvaluationTestEntry> & { id: string; name: string }
): EvaluationTestEntry => ({
  id: entry.id,
  name: entry.name,
  region: entry.region ?? null,
  source: sanitizeSource(entry.source),
  description: entry.description,
  result: isValidResult(entry.result) ? entry.result : "normal",
  notes: entry.notes ?? "",
  values: entry.values ?? {}, // Initialize empty if not present
});

const TEMP_USER_ID = "temp-user";

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

const ProfessionalWorkflowPage = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>("analysis");
  const [selectedEntityIds, setSelectedEntityIds] = useState<string[]>([]);
  const [localSoapNote, setLocalSoapNote] = useState<SOAPNote | null>(null);
  const [soapStatus, setSoapStatus] = useState<SOAPStatus>('draft');
  const [visitType, setVisitType] = useState<VisitType>('initial');
  const [isGeneratingSOAP, setIsGeneratingSOAP] = useState(false);
  const [savingSession, setSavingSession] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<ClinicalAttachment[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
  const [removingAttachmentId, setRemovingAttachmentId] = useState<string | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  
  // Value Metrics Tracking - Timestamps
  const [sessionStartTime] = useState<Date>(new Date());
  const [transcriptionStartTime, setTranscriptionStartTime] = useState<Date | null>(null);
  const [transcriptionEndTime, setTranscriptionEndTime] = useState<Date | null>(null);
  const [soapGenerationStartTime, setSoapGenerationStartTime] = useState<Date | null>(null);
  
  // Cross-Border AI Consent - PHIPA s. 18 compliance
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [pendingAIAction, setPendingAIAction] = useState<(() => Promise<void>) | null>(null);
  
  const { sharedState, updatePhysicalEvaluation } = useSharedWorkflowState();
  const [evaluationTests, setEvaluationTests] = useState<EvaluationTestEntry[]>(() =>
    (sharedState.physicalEvaluation?.selectedTests ?? []).map(sanitizeEvaluationEntry)
  );
  const [customTestName, setCustomTestName] = useState("");
  const [customTestRegion, setCustomTestRegion] = useState<MSKRegion | "other">("shoulder");
  const [customTestResult, setCustomTestResult] = useState<EvaluationResult | "">("");
  const [customTestNotes, setCustomTestNotes] = useState("");
  const [isCustomFormOpen, setIsCustomFormOpen] = useState(false);
  const [dismissedSuggestionKeys, setDismissedSuggestionKeys] = useState<number[]>([]);
  useEffect(() => {
    if (sharedState.physicalEvaluation?.selectedTests) {
      setEvaluationTests(sharedState.physicalEvaluation.selectedTests.map(sanitizeEvaluationEntry));
    }
  }, [sharedState.physicalEvaluation?.selectedTests]);

  const persistEvaluation = useCallback((next: EvaluationTestEntry[]) => {
    const sanitized = next.map(sanitizeEvaluationEntry);
    setEvaluationTests(sanitized);
    updatePhysicalEvaluation(sanitized);
  }, [updatePhysicalEvaluation]);

  const normalizeName = (value: string) => value.toLowerCase().trim();

  const resetCustomForm = useCallback(() => {
    setCustomTestName("");
    setCustomTestNotes("");
    setCustomTestResult("");
    setCustomTestRegion("shoulder");
  }, []);

  const addEvaluationTest = useCallback(
    (entry: EvaluationTestEntry) => {
      const exists = evaluationTests.some(
        (test) => test.id === entry.id || normalizeName(test.name) === normalizeName(entry.name)
      );
      if (exists) return;
      persistEvaluation([...evaluationTests, entry]);
    },
    [evaluationTests, persistEvaluation]
  );

  const removeEvaluationTest = useCallback(
    (id: string) => {
      const next = evaluationTests.filter((test) => test.id !== id);
      persistEvaluation(next);
    },
    [evaluationTests, persistEvaluation]
  );

  const updateEvaluationTest = useCallback(
    (id: string, updates: Partial<EvaluationTestEntry>) => {
      const next = evaluationTests.map((test) => (test.id === id ? { ...test, ...updates } : test));
      persistEvaluation(next);
    },
    [evaluationTests, persistEvaluation]
  );

  const createEntryFromLibrary = useCallback(
    (
      test: PhysicalTest | MskTestDefinition,
      source: "ai" | "manual"
    ): EvaluationTestEntry => {
      const definition = getTestDefinition(test.id);
      const hasFields = definition && hasFieldDefinitions(definition);
      
      // Initialize values for tests with fields - PREfill numeric values (ROM, Strength) with normal ranges
      // If physio changes these values, it means they don't match normal ranges
      // NOTE: Units (kg, etc.) will be subject to geolocation or physical practice location
      // to respect locally used measurement units (future enhancement)
      const initialValues: Record<string, number | string | boolean | null> = {};
      const prefillDefaults: Record<string, number | null> = {}; // Track pre-filled defaults
      
      if (hasFields && definition.fields) {
        definition.fields.forEach((field) => {
          if (field.kind === 'angle_bilateral' || field.kind === 'angle_unilateral') {
            // PREfill ROM and strength measurements with normal range max (optimal value)
            if (field.normalRange) {
              const normalValue = field.normalRange.max; // Use max of normal range as prefill
              initialValues[field.id] = normalValue;
              prefillDefaults[field.id] = normalValue; // Store for comparison
            } else if (field.unit === 'kg' || field.unit === 'cm') {
              // For measurements without normal range, leave empty for manual entry
              initialValues[field.id] = null;
              prefillDefaults[field.id] = null;
            } else {
              initialValues[field.id] = null;
              prefillDefaults[field.id] = null;
            }
          } else if (field.kind === 'yes_no') {
            // Checkboxes default to false (unchecked)
            initialValues[field.id] = false;
          } else if (field.kind === 'score_0_10') {
            // Score fields default to 0 (no pain)
            initialValues[field.id] = 0;
          } else {
            // Text fields default to empty string
            initialValues[field.id] = '';
          }
        });
      }

      return {
        id: test.id,
        name: test.name,
        region: test.region,
        source,
        description: test.description,
        result: "normal",
        notes: "", // Do not prefill written text - leave empty for manual entry
        values: hasFields ? initialValues : undefined,
        _prefillDefaults: hasFields ? prefillDefaults : undefined, // Internal: track pre-filled values
      };
    },
    []
  );

  const createCustomEntry = (
    name: string,
    source: "ai" | "manual" | "custom",
    region: MSKRegion | null = null
  ): EvaluationTestEntry => ({
    id:
      source === "custom"
        ? `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
        : `ai-${normalizeName(name)}`,
    name,
    region,
    source,
    result: "normal",
    notes: "",
  });

  const isTestAlreadySelected = useCallback(
    (id: string, name: string) =>
      evaluationTests.some(
        (test) => test.id === id || normalizeName(test.name) === normalizeName(name)
      ),
    [evaluationTests]
  );

  const handleAddCustomTest = useCallback(() => {
    if (!customTestName.trim()) return;
    const region = customTestRegion === "other" ? null : customTestRegion;
    const entry = {
      ...createCustomEntry(customTestName.trim(), "custom", region),
      result: customTestResult || "normal",
      notes: customTestNotes.trim(),
    };
    addEvaluationTest(entry);
    resetCustomForm();
    setIsCustomFormOpen(false);
  }, [
    addEvaluationTest,
    createCustomEntry,
    customTestName,
    customTestNotes,
    customTestResult,
    customTestRegion,
    resetCustomForm,
  ]);

  const { 
    transcript, 
    isRecording, 
    isTranscribing,
    error: transcriptError,
    languagePreference,
    setLanguagePreference,
    mode,
    setMode,
    meta: transcriptMeta,
    audioStream,
    startRecording, 
    stopRecording,
    setTranscript,
  } = useTranscript();

  const { time: recordingTime } = useTimer(isRecording);

  const {
    processText,
    generateSOAPNote,
    runVoiceSummary,
    runVoiceClinicalInfoQuery,
    niagaraResults,
    soapNote,
    isProcessing,
  } = useNiagaraProcessor();

  useEffect(() => {
    if (soapNote) {
      setLocalSoapNote(soapNote);
    }
  }, [soapNote]);

  useEffect(() => {
    setSelectedEntityIds([]);
  }, [niagaraResults?.motivo_consulta]);

  // Track transcription timestamps
  useEffect(() => {
    // Capture start when recording starts or transcript first appears
    if ((isRecording || (transcript && transcript.trim().length > 0)) && !transcriptionStartTime) {
      setTranscriptionStartTime(new Date());
    }
    
    // Capture end when transcript has content and recording stopped
    if (transcript && transcript.trim().length > 0 && !isRecording && !transcriptionEndTime && transcriptionStartTime) {
      setTranscriptionEndTime(new Date());
    }
  }, [isRecording, transcript, transcriptionStartTime, transcriptionEndTime]);

  const resolveVoiceLanguage = useCallback((): 'en' | 'es' | 'fr' => {
    if (languagePreference !== 'auto') {
      return languagePreference as 'en' | 'es' | 'fr';
    }
    const detected = transcriptMeta?.detectedLanguage?.toLowerCase() ?? '';
    if (detected.startsWith('es')) return 'es';
    if (detected.startsWith('fr')) return 'fr';
    return 'en';
  }, [languagePreference, transcriptMeta?.detectedLanguage]);

  useEffect(() => {
    setDismissedSuggestionKeys([]);
  }, [niagaraResults?.evaluaciones_fisicas_sugeridas]);

  const aiSuggestions = useMemo(() => {
    if (!niagaraResults?.evaluaciones_fisicas_sugeridas) return [];
    return niagaraResults.evaluaciones_fisicas_sugeridas.map((test: any, index: number) => {
      if (!test) {
        return {
          key: index,
          rawName: `Suggested test ${index + 1}`,
          displayName: `Suggested test ${index + 1}`,
          match: null,
        };
      }
      if (typeof test === "string") {
        const trimmed = test.trim();
        return {
          key: index,
          rawName: trimmed,
          displayName: trimmed,
          match: matchTestName(trimmed),
        };
      }
      const name = test.test || test.name || `Suggested test ${index + 1}`;
      const objective = test.objetivo || test.indicacion || "";
      const description = objective || test.justificacion || "";
      return {
        key: index,
        rawName: name,
        displayName: description ? `${name} — ${description}` : name,
        match: matchTestName(name),
      };
    });
  }, [niagaraResults]);

  const pendingAiSuggestions = useMemo(() => {
    const toKey = (value: string) => value?.toLowerCase().trim() ?? "";
    return aiSuggestions.filter((item) => {
      const candidateName = item.match ? item.match.name : item.rawName || item.displayName || "";
      const candidateId = item.match ? item.match.id : `ai-${toKey(candidateName)}`;
      const alreadySelected = evaluationTests.some(
        (test) => test.id === candidateId || toKey(test.name) === toKey(candidateName)
      );
      const isDismissed = dismissedSuggestionKeys.includes(item.key);
      return !alreadySelected && !isDismissed;
    });
  }, [aiSuggestions, evaluationTests, dismissedSuggestionKeys]);

  const interactiveResults = useMemo(() => {
    if (!niagaraResults) return null;

    const rawTests = niagaraResults.evaluaciones_fisicas_sugeridas || [];
    const physicalTests = rawTests
      .map((test: any, index: number) => {
        if (!test) return null;

        if (typeof test === "string") {
          return {
            name: test,
            sensitivity: undefined,
            specificity: undefined,
            indication: "",
            justification: ""
          };
        }

        return {
          name: test.test || test.name || "Physical test",
          sensitivity:
            test.sensibilidad !== undefined
              ? Number(test.sensibilidad)
              : test.sensitivity !== undefined
                ? Number(test.sensitivity)
                : undefined,
          specificity:
            test.especificidad !== undefined
              ? Number(test.especificidad)
              : test.specificity !== undefined
                ? Number(test.specificity)
                : undefined,
          indication: test.objetivo || test.indicacion || "",
          justification: test.justificacion || ""
        };
      })
      .filter(Boolean) ?? [];

    const symptomEntities =
      (niagaraResults.hallazgos_clinicos || []).map((text: string, index: number) => ({
        id: `symptom-${index}`,
        text,
        type: "symptom" as const
      })) || [];

    const medicationEntities =
      (niagaraResults.medicacion_actual || []).map((text: string, index: number) => ({
        id: `medication-${index}`,
        text,
        type: "medication" as const
      })) || [];

    const historyEntities =
      (niagaraResults.antecedentes_medicos || []).map((text: string, index: number) => ({
        id: `history-${index}`,
        text,
        type: "history" as const
      })) || [];

    const psychosocial = niagaraResults.contexto_psicosocial || [];
    const occupational = niagaraResults.contexto_ocupacional || [];
    
    // Extract all biopsychosocial factors from the normalized results
    const biopsychosocial_psychological = niagaraResults.biopsychosocial_psychological || [];
    const biopsychosocial_social = niagaraResults.biopsychosocial_social || [];
    const biopsychosocial_occupational = niagaraResults.biopsychosocial_occupational || [];
    const biopsychosocial_protective = niagaraResults.biopsychosocial_protective || [];
    const biopsychosocial_functional_limitations = niagaraResults.biopsychosocial_functional_limitations || [];
    const biopsychosocial_patient_strengths = niagaraResults.biopsychosocial_patient_strengths || [];

    return {
      ...niagaraResults,
      entities: [...symptomEntities, ...medicationEntities, ...historyEntities],
      physicalTests,
      yellowFlags: [
        ...(niagaraResults.yellow_flags || []),
        ...psychosocial,
        ...occupational
      ],
      redFlags: niagaraResults.red_flags || [],
      biopsychosocial: {
        psychosocial,
        occupational
      },
      // Include all biopsychosocial factors for proper UI display
      biopsychosocial_psychological,
      biopsychosocial_social,
      biopsychosocial_occupational,
      biopsychosocial_protective,
      biopsychosocial_functional_limitations,
      biopsychosocial_patient_strengths
    };
  }, [niagaraResults]);

  const physicalExamResults = useMemo(
    () =>
      evaluationTests.map((entry) => {
        const definition = getTestDefinition(entry.id);
        const hasFields = definition && hasFieldDefinitions(definition);
        
        // Build rich notes from field values if available
        let enrichedNotes = entry.notes?.trim() || undefined;
        if (hasFields && entry.values && Object.keys(entry.values).length > 0) {
          const testDef = definition as MskTestDefinition;
          const valueParts: string[] = [];
          
          testDef.fields?.forEach((field) => {
            const value = entry.values?.[field.id];
            if (value !== null && value !== undefined && value !== '') {
              if (field.kind === 'angle_bilateral' || field.kind === 'angle_unilateral') {
                valueParts.push(`${field.label}: ${value}°`);
              } else if (field.kind === 'yes_no') {
                if (value === true) {
                  valueParts.push(`${field.label}: Sí`);
                }
              } else if (field.kind === 'score_0_10') {
                valueParts.push(`${field.label}: ${value}/10`);
              } else if (field.kind === 'text' && typeof value === 'string' && value.trim()) {
                valueParts.push(`${field.label}: ${value}`);
              }
            }
          });
          
          if (valueParts.length > 0) {
            enrichedNotes = valueParts.join('; ') + (entry.notes?.trim() ? ` — ${entry.notes.trim()}` : '');
          }
        }

        return {
          testName: entry.name,
          result: entry.result ?? "normal",
          notes: enrichedNotes,
          values: entry.values,
        };
      }),
    [evaluationTests]
  );

  const completedCount = useMemo(
    () => evaluationTests.filter((entry) => entry.result && entry.result !== "").length,
    [evaluationTests]
  );

  const handleAnalyzeWithVertex = async () => {
    if (!transcript?.trim()) return;
    try {
      const payload = {
        text: transcript,
        lang: transcriptMeta?.detectedLanguage ?? (languagePreference !== "auto" ? languagePreference : undefined),
        mode,
        timestamp: Date.now(),
      };
      await processText(payload);
      setAnalysisError(null);
    } catch (error: any) {
      const message = error?.message || 'Unable to analyze transcript with Vertex AI.';
      setAnalysisError(message);
      console.error('[Workflow] Vertex analysis failed:', message);
      
      // Submit error feedback automatically
      if (error instanceof Error) {
        FeedbackService.submitErrorFeedback(error, {
          workflowStep: 'Vertex AI analysis',
          hasTranscript: !!transcript?.trim(),
        }).catch((err) => {
          console.error('[Workflow] Failed to submit error feedback:', err);
        });
      }
      
      // Suggest fallback for network errors
      if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        setAnalysisError(
          message + ' Check your internet connection. You can still document manually.'
        );
      }
    }
  };

  const handleAttachmentUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    setAttachmentError(null);
    setIsUploadingAttachment(true);

    try {
      const uploads: ClinicalAttachment[] = [];
      for (const file of files) {
        const uploaded = await ClinicalAttachmentService.upload(file, TEMP_USER_ID);
        uploads.push(uploaded);
      }

      setAttachments((prev) => [...prev, ...uploads]);
      } catch (error) {
      console.error("Attachment upload failed", error);
      setAttachmentError(
        error instanceof Error
          ? error.message
          : "Failed to upload attachment. Try again."
      );
    } finally {
      setIsUploadingAttachment(false);
    }
  };

  const handleAttachmentRemove = async (attachment: ClinicalAttachment) => {
    if (!attachment) return;
    setAttachmentError(null);
    setRemovingAttachmentId(attachment.id);
    try {
      await ClinicalAttachmentService.delete(attachment.storagePath);
      setAttachments((prev) => prev.filter((item) => item.id !== attachment.id));
    } catch (error) {
      console.error("Failed to delete attachment", error);
      setAttachmentError(
        error instanceof Error
          ? error.message
          : "Unable to remove attachment right now."
      );
    } finally {
      setRemovingAttachmentId(null);
    }
  };

  const continueToEvaluation = () => {
    const additions: EvaluationTestEntry[] = [];

    const suggestionMap = new Map(aiSuggestions.map((item) => [item.key, item]));

    selectedEntityIds
      .filter((id) => id.startsWith("physical-"))
      .forEach((entityId) => {
        const index = parseInt(entityId.split("-")[1], 10);
        const suggestion = suggestionMap.get(index);
        if (!suggestion) return;
        if (suggestion.match) {
          additions.push(createEntryFromLibrary(suggestion.match, "ai"));
        } else {
          additions.push(createCustomEntry(suggestion.rawName, "ai"));
        }
      });

    if (additions.length > 0) {
      const merged = [...evaluationTests];
      additions.forEach((entry) => {
        const exists = merged.some(
          (test) => test.id === entry.id || normalizeName(test.name) === normalizeName(entry.name)
        );
        if (!exists) merged.push(entry);
      });
      persistEvaluation(merged);
    }

    const selectedKeys = new Set(
      selectedEntityIds
        .filter((id) => id.startsWith("physical-"))
        .map((id) => parseInt(id.split("-")[1], 10))
    );
    const newlyDismissed = aiSuggestions
      .filter((item) => !selectedKeys.has(item.key))
      .map((item) => item.key);

    setDismissedSuggestionKeys((prev) => Array.from(new Set([...prev, ...newlyDismissed])));

    setActiveTab("evaluation");
  };

  const handleLibrarySelect = useCallback(
    (event) => {
      const value = event.target.value;
      if (!value) return;
      const libraryTest = MSK_TEST_LIBRARY.find((test) => test.id === value);
      if (libraryTest) {
        addEvaluationTest(createEntryFromLibrary(libraryTest, "manual"));
      }
      event.target.value = "";
    },
    [addEvaluationTest, createEntryFromLibrary]
  );

  // Treatment reminder state
  const [treatmentReminder, setTreatmentReminder] = useState<string | null>(null);

  // Detect visit type on mount or when data changes
  useEffect(() => {
    // TODO: Check Firestore for previous SOAP notes
    // For now, default to initial assessment
    const detection = detectVisitType(false); // No previous SOAP for MVP
    setVisitType(detection.detectedType);
  }, []);

  // Load treatment reminder for follow-up visits
  useEffect(() => {
    if (visitType === 'follow-up') {
      const loadReminder = async () => {
        try {
          const { default: treatmentPlanService } = await import('../services/treatmentPlanService');
          const reminder = await treatmentPlanService.getTreatmentReminder(
            demoPatient.id,
            2 // Visit number (2 = second visit)
          );
          if (reminder) {
            setTreatmentReminder(reminder.reminderText);
          }
        } catch (error) {
          console.error('[Workflow] Failed to load treatment reminder:', error);
        }
      };
      loadReminder();
    } else {
      setTreatmentReminder(null);
    }
  }, [visitType]);

  const handleGenerateSoap = async () => {
    if (!niagaraResults) {
      console.warn('[SOAP] Cannot generate SOAP: no analysis results');
      return;
    }

    // ✅ NUEVO: Cross-Border AI Consent Gate (PHIPA s. 18 compliance)
    const hasConsent = CrossBorderAIConsentService.hasConsented(TEMP_USER_ID);
    if (!hasConsent) {
      // Store the action to retry after consent is given
      setPendingAIAction(() => async () => {
        await handleGenerateSoap();
      });
      setShowConsentModal(true);
      return; // Block AI processing until consent is given
    }

    try {
      // Capture SOAP generation start timestamp
      if (!soapGenerationStartTime) {
        setSoapGenerationStartTime(new Date());
      }
      
      setIsGeneratingSOAP(true);
      setAnalysisError(null);

      // Step 1: Organize unified data from Tab 1 and Tab 2
      const unifiedData: UnifiedClinicalData = {
        tab1: {
          transcript: transcript || '',
          analysis: niagaraResults,
          attachments: attachments,
        },
        tab2: {
          evaluationTests: evaluationTests,
          library: MSK_TEST_LIBRARY,
        },
        visit: {
          type: visitType,
          patientId: demoPatient.id,
          patientName: demoPatient.name,
        },
      };

      // Step 2: Validate unified data
      const validation = validateUnifiedData(unifiedData);
      if (!validation.isValid) {
        setAnalysisError(`Missing required data: ${validation.missingFields.join(', ')}`);
        setIsGeneratingSOAP(false);
        return;
      }

      // Log warnings if any
      if (validation.warnings.length > 0) {
        console.warn('[SOAP] Data validation warnings:', validation.warnings);
      }

      // Step 3: Organize all data into structured format for SOAP prompt
      const organized = organizeSOAPData(unifiedData);

      // Log data summary for debugging
      console.log('[SOAP] Data organization summary:', createDataSummary(organized));

      // Step 4: Generate SOAP using organized context
      const response = await generateSOAPNoteFromService(organized.context);
      
      if (!response || !response.soap) {
        throw new Error('Failed to generate SOAP note: empty response from Vertex AI');
      }

      // ✅ DÍA 2: Marcar como requiere review (CPO requirement: AI-generated content must be reviewed)
      const soapWithReviewFlags = {
        ...response.soap,
        requiresReview: true, // CPO requirement: AI-generated content must be reviewed
        isReviewed: false, // Aún no reviewado
        aiGenerated: true, // Flag para transparency
        aiProcessor: 'Google Vertex AI (Gemini 2.5 Flash)', // Para transparency report DÍA 3
        processedAt: new Date(), // Timestamp de cuando se procesó con AI
      };

      setLocalSoapNote(soapWithReviewFlags);
      setSoapStatus('draft');
      setActiveTab("soap");

      // Step 5: Save to session with all structured data
      await sessionService.createSession({
        userId: TEMP_USER_ID,
        patientName: demoPatient.name,
        patientId: demoPatient.id,
        transcript: transcript || "",
        soapNote: soapWithReviewFlags,
        physicalTests: organized.structuredData.physicalExamResults,
        status: "draft",
        transcriptionMeta: {
          lang: transcriptMeta?.detectedLanguage ?? (languagePreference !== "auto" ? languagePreference : null),
          languagePreference,
          mode,
          averageLogProb: transcriptMeta?.averageLogProb ?? null,
          durationSeconds: transcriptMeta?.durationSeconds,
          recordedAt: new Date().toISOString(),
        },
        attachments,
        // Store organized data for future reference
        organizedData: {
          metadata: organized.metadata,
          physicalEvaluationStructured: organized.structuredData.physicalEvaluationStructured,
        },
      });
    } catch (error: any) {
      console.error("[SOAP] Generation failed:", error);
      
      // Submit error feedback automatically
      if (error instanceof Error) {
        FeedbackService.submitErrorFeedback(error, {
          workflowStep: 'SOAP generation',
          hasConsent: CrossBorderAIConsentService.hasConsented(TEMP_USER_ID),
          hasAnalysis: !!niagaraResults,
        }).catch((err) => {
          console.error('[Workflow] Failed to submit error feedback:', err);
        });
      }
      
      // Set user-friendly error message
      const errorMessage = error?.message || 'Failed to generate SOAP note. Please try again.';
      setAnalysisError(errorMessage);
      
      // If error is network-related, suggest fallback
      if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        setAnalysisError(
          errorMessage + ' Check your internet connection. You can still create SOAP notes manually.'
        );
      }
    } finally {
      setIsGeneratingSOAP(false);
    }
  };

  // Helper function to clean undefined values from objects
  const cleanUndefined = (obj: any): any => {
    if (obj === null || obj === undefined) return null;
    if (Array.isArray(obj)) {
      return obj.map(cleanUndefined).filter(item => item !== null && item !== undefined);
    }
    if (typeof obj === 'object') {
      const cleaned: any = {};
      for (const key in obj) {
        if (obj[key] !== undefined) {
          cleaned[key] = cleanUndefined(obj[key]);
        }
      }
      return cleaned;
    }
    return obj;
  };

  // Calculate and track value metrics when SOAP is finalized
  const calculateAndTrackValueMetrics = useCallback(async (finalizedAt: Date) => {
    try {
      // Calculate times (in minutes)
      const transcriptionTime = transcriptionStartTime && transcriptionEndTime
        ? (transcriptionEndTime.getTime() - transcriptionStartTime.getTime()) / 1000 / 60
        : undefined;
      
      const aiGenerationTime = soapGenerationStartTime && transcriptionEndTime
        ? (new Date().getTime() - soapGenerationStartTime.getTime()) / 1000 / 60
        : undefined;
      
      const totalDocumentationTime = (finalizedAt.getTime() - sessionStartTime.getTime()) / 1000 / 60;
      
      const manualEditingTime = aiGenerationTime && transcriptionTime
        ? totalDocumentationTime - aiGenerationTime - (transcriptionTime || 0)
        : undefined;
      
      // Detect features used
      const featuresUsed = {
        transcription: !!(transcript && transcript.trim().length > 0),
        physicalTests: evaluationTests.length > 0,
        aiSuggestions: !!(sharedState.clinicalAnalysis?.physicalTests && sharedState.clinicalAnalysis.physicalTests.length > 0),
        soapGeneration: !!localSoapNote,
      };
      
      // Calculate quality metrics
      const soapSectionsCompleted = {
        subjective: !!(localSoapNote?.subjective && localSoapNote.subjective.trim().length > 0),
        objective: !!(localSoapNote?.objective && localSoapNote.objective.trim().length > 0),
        assessment: !!(localSoapNote?.assessment && localSoapNote.assessment.trim().length > 0),
        plan: !!(localSoapNote?.plan && localSoapNote.plan.trim().length > 0),
      };
      
      // For now, estimate suggestions offered/accepted/rejected from available data
      // TODO: Track these in real-time during workflow for more accurate metrics
      const suggestionsOffered = sharedState.clinicalAnalysis?.physicalTests?.length || 0;
      const suggestionsAccepted = evaluationTests.filter(test => test.source === 'ai').length;
      const suggestionsRejected = suggestionsOffered - suggestionsAccepted;
      
      // Estimate edits made to SOAP (for now, just check if SOAP was modified)
      // TODO: Track actual edits in real-time for more accurate metrics
      const editsMadeToSOAP = localSoapNote ? 1 : 0; // Placeholder - would need to track actual edits
      
      // Generate session ID (simple hash for now)
      const sessionId = `${TEMP_USER_ID}-${sessionStartTime.getTime()}`;
      
      // Prepare metrics event
      const metrics: Omit<ValueMetricsEvent, 'timestamp'> = {
        hashedUserId: TEMP_USER_ID, // Will be pseudonymized in AnalyticsService
        hashedSessionId: sessionId,
        timestamps: {
          sessionStart: sessionStartTime,
          transcriptionStart: transcriptionStartTime || undefined,
          transcriptionEnd: transcriptionEndTime || undefined,
          soapGenerationStart: soapGenerationStartTime || undefined,
          soapFinalized: finalizedAt,
        },
        calculatedTimes: {
          totalDocumentationTime,
          transcriptionTime: transcriptionTime || undefined,
          aiGenerationTime: aiGenerationTime || undefined,
          manualEditingTime: manualEditingTime || undefined,
        },
        featuresUsed,
        quality: {
          soapSectionsCompleted,
          suggestionsOffered,
          suggestionsAccepted,
          suggestionsRejected,
          editsMadeToSOAP,
        },
        sessionType: visitType,
        region: undefined, // TODO: Extract from patient data or session metadata
      };
      
      // Track metrics
      await AnalyticsService.trackValueMetrics(metrics);
      console.log('[VALUE METRICS] Metrics tracked successfully:', {
        totalTime: totalDocumentationTime,
        featuresUsed: Object.values(featuresUsed).filter(Boolean).length,
      });
    } catch (error) {
      console.error('❌ [VALUE METRICS] Error tracking value metrics:', error);
      // Don't throw - analytics should not break main flow
    }
  }, [
    sessionStartTime,
    transcriptionStartTime,
    transcriptionEndTime,
    soapGenerationStartTime,
    transcript,
    evaluationTests,
    sharedState.clinicalAnalysis,
    localSoapNote,
    visitType,
  ]);

  const handleSaveSOAP = async (soap: SOAPNote, status: SOAPStatus) => {
    // ✅ DÍA 2: CPO Review Gate - Bloquear finalización sin review
    if (status === 'finalized') {
      // Check si requiere review y no fue reviewado
      if (soap.requiresReview && !soap.isReviewed) {
        setAnalysisError(
          '❌ CPO Compliance: This SOAP note requires review before finalization. ' +
          'Please review and verify all AI-generated content before finalizing.'
        );
        return; // Bloquear finalización
      }
      
      // Si requiere review y fue reviewado, agregar metadata de review
      if (soap.requiresReview && soap.isReviewed && !soap.reviewed) {
        soap.reviewed = {
          reviewedBy: TEMP_USER_ID,
          reviewedAt: new Date(),
          reviewerName: 'Current User', // TODO: Get from auth
        };
      }
    }
    
    setLocalSoapNote(soap);
    setSoapStatus(status);
    
    // Clean SOAP note: replace undefined with null for Firestore compatibility
    const cleanSoap: SOAPNote = {
      subjective: soap.subjective || '',
      objective: soap.objective || '',
      assessment: soap.assessment || '',
      plan: soap.plan || '',
      ...(soap.referrals && { referrals: soap.referrals }),
      ...(soap.precautions && { precautions: soap.precautions }),
      ...(soap.additionalNotes && { additionalNotes: soap.additionalNotes }),
      ...(soap.followUp && { followUp: soap.followUp }),
      // ✅ DÍA 2: Incluir campos de review en saved SOAP
      ...(soap.requiresReview !== undefined && { requiresReview: soap.requiresReview }),
      ...(soap.isReviewed !== undefined && { isReviewed: soap.isReviewed }),
      ...(soap.reviewed && { reviewed: soap.reviewed }),
      ...(soap.aiGenerated !== undefined && { aiGenerated: soap.aiGenerated }),
      ...(soap.aiProcessor && { aiProcessor: soap.aiProcessor }),
      ...(soap.processedAt && { processedAt: soap.processedAt }),
    };
    
    // Clean transcriptionMeta to remove undefined values
    const cleanTranscriptionMeta = {
      lang: transcriptMeta?.detectedLanguage ?? (languagePreference !== "auto" ? languagePreference : null),
      languagePreference,
      mode,
      averageLogProb: transcriptMeta?.averageLogProb ?? null,
      durationSeconds: transcriptMeta?.durationSeconds ?? null,
      recordedAt: new Date().toISOString(),
    };
    
    // Remove undefined values from cleanTranscriptionMeta
    const finalTranscriptionMeta = cleanUndefined(cleanTranscriptionMeta);
    
    // Save to session
    try {
      await sessionService.createSession({
        userId: TEMP_USER_ID,
        patientName: demoPatient.name,
        patientId: demoPatient.id,
        transcript: transcript || "",
        soapNote: cleanSoap,
        physicalTests: physicalExamResults || [],
        status: status === 'finalized' ? 'completed' : 'draft',
        transcriptionMeta: finalTranscriptionMeta,
        attachments: attachments || [],
      });
      
      // Track value metrics when SOAP is finalized
      if (status === 'finalized') {
        await calculateAndTrackValueMetrics(new Date());
      }
    } catch (error) {
      console.error("[SOAP] Failed to save:", error);
    }
  };

  const handleUnfinalizeSOAP = async (soap: SOAPNote) => {
    // When unfinalizing, save as draft and create edit history
    console.log('[SOAP] Unfinalizing note for editing. Original note:', soap);
    // The actual unfinalization is handled by the component state
    // This handler can be used to log or track the unfinalization event
  };

  const handleFinalizeSOAP = async (soap: SOAPNote) => {
    await handleSaveSOAP(soap, 'finalized');
    
    // Save treatment plan for future reminders
    if (soap.plan) {
      try {
        const { default: treatmentPlanService } = await import('../services/treatmentPlanService');
        await treatmentPlanService.saveTreatmentPlan(
          demoPatient.id,
          demoPatient.name,
          TEMP_USER_ID,
          soap.plan,
          visitType
        );
        console.log('[SOAP] Treatment plan saved for reminders');
      } catch (error) {
        console.error('[SOAP] Failed to save treatment plan:', error);
        // Non-blocking: continue even if plan save fails
      }
    }
  };

  const handleRegenerateSOAP = async () => {
    // Regenerate with same context
    await handleGenerateSoap();
  };

  const copySoapToClipboard = async () => {
    if (!localSoapNote) return;
    const plain = [
      "Subjective:",
      localSoapNote.subjective || "Not documented.",
      "",
      "Objective:",
      localSoapNote.objective || "Not documented.",
      "",
      "Assessment:",
      localSoapNote.assessment || "Pending clinician review.",
      "",
      "Plan:",
      localSoapNote.plan || "To be defined with patient.",
    ].join("\n");

    await navigator.clipboard.writeText(plain);
  };

  const renderTranscriptArea = () => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-900">Clinical Conversation Capture</h2>
          <p className="text-sm text-slate-500">
            Use the built-in recorder or paste a transcript captured by OpenAI Whisper.
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
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-rose-200 to-rose-300 text-rose-800 shadow-sm hover:from-rose-300 hover:to-rose-400 transition"
            >
              <Square className="w-4 h-4" />
              Stop Recording
            </button>
          ) : (
            <button
              onClick={startRecording}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-[#dedef5] to-[#d3e6ff] text-slate-700 shadow-sm hover:from-[#cecdee] hover:to-[#c3dcfb] transition"
            >
              <Play className="w-4 h-4" />
              Start Recording
            </button>
          )}
        </div>
      </div>

      {/* Audio Waveform Visualization */}
      {isRecording && (
        <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
            <span className="text-sm font-medium text-sky-800">Listening...</span>
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
              <p className="text-sm font-medium text-amber-800">Processing audio...</p>
              <p className="text-xs text-amber-600 mt-0.5">Transcribing with Whisper AI</p>
            </div>
          </div>
        </div>
      )}

      {/* Processing Transcription Indicator */}
      {isProcessing && !isTranscribing && (
        <div className="mt-4 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <Brain className="h-5 w-5 text-indigo-600 animate-pulse" />
            <div className="flex-1">
              <p className="text-sm font-medium text-indigo-800">Analyzing transcript...</p>
              <p className="text-xs text-indigo-600 mt-0.5">Extracting clinical information with Vertex AI</p>
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
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
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
                className={`px-3 py-1.5 rounded-full text-sm transition ${
                  mode === key
                    ? 'bg-slate-900 text-white shadow'
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
        <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
          <p className="font-medium">Transcription error</p>
          <p>{transcriptError}</p>
        </div>
      )}

      <textarea
        className="mt-4 w-full min-h-[160px] rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-fuchsia-400 focus:border-transparent transition"
        placeholder="Paste the transcript or record directly from the browser..."
        value={transcript}
        onChange={(event) => setTranscript(event.target.value)}
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
          Whisper captures audio locally. No data is transmitted until you trigger the analysis.
        </p>
            <button
          onClick={handleAnalyzeWithVertex}
          disabled={isProcessing || !transcript?.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white bg-gradient-to-r from-[#6d28d9] via-[#7c3aed] to-[#2563eb] shadow-sm hover:from-[#5b21b6] hover:via-[#6d28d9] hover:to-[#1d4ed8] disabled:opacity-50 transition"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4" />
              Analyze with Vertex AI
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
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs text-slate-600 hover:bg-rose-50 hover:text-rose-600 transition disabled:opacity-50"
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

  const renderAnalysisTab = () => (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold text-slate-900">Professional Workflow</h1>
        <p className="text-sm text-slate-500">
          Market: Canada · Patient data stored under PHIPA/PIPEDA controls · Vertex AI integration verified.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">Patient</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{demoPatient.name}</p>
          <p className="text-sm text-slate-500">{demoPatient.email}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">Province</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{demoPatient.province}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <p className="text-xs uppercase tracking-wide text-slate-400">Specialty</p>
          <p className="mt-1 text-lg font-semibold text-slate-900">{demoPatient.specialty}</p>
        </div>
      </section>

      {renderTranscriptArea()}

      {isTranscribing && (
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          {mode === 'dictation' ? 'Processing dictation audio...' : 'Processing live audio sample...'}
        </div>
      )}

      {analysisError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <p className="font-semibold">Vertex AI returned an error</p>
          <p>{analysisError}</p>
          <p className="mt-1 text-xs text-rose-600">
            Retry in a few moments or switch to the production model if the quota is exhausted.
          </p>
        </div>
      )}

      {niagaraResults && interactiveResults ? (
        <>
          <div className="mt-4">
            <ClinicalAnalysisResults
              results={interactiveResults}
              selectedIds={selectedEntityIds}
              onSelectionChange={setSelectedEntityIds}
            />
          </div>
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            <div>
              <p className="text-sm text-slate-600">
                Select the physical tests you plan to perform. You can edit or add items before moving to the next step.
              </p>
            </div>
          <button
              onClick={continueToEvaluation}
              disabled={
                (interactiveResults.physicalTests?.length ?? 0) > 0 &&
                !selectedEntityIds.some((id) => id.startsWith("physical-"))
              }
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#1f2937] to-[#0f172a] text-white shadow-sm hover:from-[#111827] hover:to-[#0b1120] disabled:bg-slate-300 disabled:text-slate-100 disabled:shadow-none disabled:cursor-not-allowed transition"
            >
              <ChevronsRight className="w-4 h-4" />
              Continue to physical evaluation
            </button>
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
          Run the analysis to unlock AI insights, patient safety checks, and suggested physical evaluations.
        </div>
      )}
    </div>
  );

  // Generate dynamic summary from field values
  const generateTestSummary = useCallback((
    entry: EvaluationTestEntry,
    testDefinition: MskTestDefinition | null
  ): string => {
    if (!testDefinition?.fields || !entry.values) {
      return entry.notes || testDefinition?.normalTemplate || '';
    }

    const parts: string[] = [];
    let hasModifiedValues = false;

    // Build summary from actual values, only including meaningful data
    testDefinition.fields.forEach((field) => {
      const value = entry.values?.[field.id];
      
      if (value === null || value === undefined || value === '' || value === false) {
        return; // Skip empty/null values
      }

      // Check if this is a modified value (not just a pre-filled default)
      let isModified = true;
      if (field.kind === 'angle_bilateral' || field.kind === 'angle_unilateral') {
        // If value equals the pre-filled max and result is normal, it's likely unmodified
        if (field.normalRange && value === field.normalRange.max && entry.result === 'normal') {
          isModified = false;
        }
      }

      if (isModified) {
        hasModifiedValues = true;
        
        if (field.kind === 'angle_bilateral' || field.kind === 'angle_unilateral') {
          const unit = field.unit === 'deg' ? '°' : field.unit === 'kg' ? 'kg' : '';
          // Format more naturally for bilateral tests
          if (field.label.toLowerCase().includes('right') || field.label.toLowerCase().includes('left')) {
            parts.push(`${field.label}: ${value}${unit}`);
          } else {
            parts.push(`${field.label}: ${value}${unit}`);
          }
        } else if (field.kind === 'yes_no' && value === true) {
          parts.push(`${field.label}: positive`);
        } else if (field.kind === 'score_0_10') {
          parts.push(`${field.label}: ${value}/10`);
        } else if (field.kind === 'text' && typeof value === 'string' && value.trim()) {
          parts.push(`${field.label}: ${value.trim()}`);
        }
      }
    });

    // If result is not normal, always include it
    if (entry.result && entry.result !== 'normal') {
      parts.push(`Result: ${RESULT_LABELS[entry.result]}`);
    }

    // If we have modified values or abnormal result, return the generated summary
    if (hasModifiedValues || entry.result !== 'normal') {
      return parts.length > 0 ? parts.join('. ') : testDefinition.normalTemplate || '';
    }

    // Otherwise return empty (will use normalTemplate as placeholder)
    return '';
  }, []);

  // Render field input based on field kind
  const renderFieldInput = (
    field: TestFieldDefinition,
    value: number | string | boolean | null,
    onChange: (newValue: number | string | boolean | null) => void,
    entry?: EvaluationTestEntry,
    updateTest?: (id: string, updates: Partial<EvaluationTestEntry>) => void
  ) => {
    switch (field.kind) {
      case 'angle_bilateral':
      case 'angle_unilateral':
        return (
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-700">
              {field.label}
              {/* Only add unit if not already in label */}
              {field.unit === 'deg' && !field.label.includes('°') && !field.label.includes('deg') && ' (°)'}
              {/* NOTE: Units (kg, etc.) will be subject to geolocation/physical practice location in future */}
              {field.unit === 'kg' && !field.label.includes('(kg)') && !field.label.includes('kg)') && ' (kg)'}
            </label>
            <input
              type="number"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
              value={typeof value === 'number' ? value : ''}
              onChange={(e) => {
                const newValue = e.target.value === '' ? null : Number(e.target.value);
                onChange(newValue);
                
                // If value changed from pre-filled default, automatically mark as abnormal
                // This means the measurement doesn't match normal range
                if (entry && entry._prefillDefaults && updateTest && 
                    entry._prefillDefaults[field.id] !== null && 
                    entry._prefillDefaults[field.id] !== undefined) {
                  const prefillValue = entry._prefillDefaults[field.id];
                  if (newValue !== null && newValue !== prefillValue) {
                    // Value was changed from pre-filled normal → mark as positive/abnormal
                    // Clear prefill defaults since value was manually changed
                    const updatedPrefills = { ...entry._prefillDefaults };
                    updatedPrefills[field.id] = null; // Mark this field as manually changed
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
              className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
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
            <textarea
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
              rows={2}
              placeholder={field.notesPlaceholder}
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => onChange(e.target.value)}
            />
          </div>
        );
    }
  };

  const renderEvaluationTab = () => {
    const totalTests = evaluationTests.length;
    const progressPercent = totalTests === 0 ? 0 : Math.round((completedCount / totalTests) * 100);

    return (
      <div className="space-y-6">
        <header className="flex items-center gap-3">
          <Stethoscope className="w-6 h-6 text-emerald-600" />
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">Physical Evaluation</h2>
            <p className="text-sm text-slate-500">
              Select the tests you performed and record the outcome. These findings feed the SOAP draft.
            </p>
          </div>
        </header>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="space-y-6">
            {pendingAiSuggestions.length > 0 && (
              <section className="rounded-3xl border border-slate-200 bg-white px-4 py-5 shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800">Suggested Tests (AI)</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Matches from Vertex analysis. Click to add to your evaluation.
                </p>
                <div className="mt-3 space-y-2">
                  {pendingAiSuggestions.map((item) => {
                    const matched = item.match;
                    const displayName = matched ? matched.name : item.rawName;
                    return (
                      <div
                        key={`ai-${item.key}`}
                        className="flex items-start justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-slate-700">{displayName}</p>
                          <p className="text-[11px] text-slate-500">
                            {matched ? matched.description : 'Custom entry sourced from transcript.'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (matched) {
                              addEvaluationTest(createEntryFromLibrary(matched, "ai"));
                            } else {
                              addEvaluationTest(createCustomEntry(item.rawName, "ai"));
                            }
                          }}
                          className="ml-2 rounded-full bg-[#8b5cf6] px-3 py-1 text-xs text-white transition hover:bg-[#7c3aed]"
                        >
                          Add to evaluation
                        </button>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="rounded-3xl border border-slate-200 bg-white px-4 py-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Add Tests</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Choose from the library or add a custom test. Once added, tests appear on the right for documentation.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Library tests
                  </label>
                  <select
                    onChange={handleLibrarySelect}
                    defaultValue=""
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
                  >
                    <option value="">Select a test…</option>
                    {regions.map((region) => (
                      <optgroup key={region} label={regionLabels[region]}>
                        {MSK_TEST_LIBRARY.filter((test) => test.region === region).map((test) => {
                          const disabled = isTestAlreadySelected(test.id, test.name);
                          return (
                            <option key={test.id} value={test.id} disabled={disabled}>
                              {test.name}
                              {disabled ? " (added)" : ""}
                            </option>
                          );
                        })}
                      </optgroup>
                    ))}
                  </select>
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    Tests already in your evaluation are disabled in this list.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Custom test
                      </label>
                      <p className="mt-1 text-xs text-slate-500">
                        Log additional assessments not in the library.
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
                      Add custom test
                    </button>
                  </div>

                  {isCustomFormOpen && (
                    <div className="mt-3 space-y-3">
                      <input
                        value={customTestName}
                        onChange={(event) => setCustomTestName(event.target.value)}
                        placeholder="Test name"
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
                          <option value="other">Other / General</option>
                        </select>
                        <select
                          value={customTestResult}
                          onChange={(event) => setCustomTestResult(event.target.value as EvaluationResult | '')}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
                        >
                          <option value="">Result (optional)</option>
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
                        placeholder="Notes (optional)"
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
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleAddCustomTest}
                          className="rounded-full bg-[#7c3aed] px-4 py-2 text-xs font-semibold text-white hover:bg-[#6d28d9]"
                        >
                          Save custom test
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-slate-800">Selected Tests</p>
                <span className="text-xs text-slate-500">{evaluationTests.length} selected</span>
              </div>
              {evaluationTests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
                  Add or select tests to document your findings.
                </div>
              ) : (
                <div className="space-y-4">
                  {evaluationTests.map((entry) => {
                    const definition = getTestDefinition(entry.id);
                    const hasFields = definition && hasFieldDefinitions(definition);
                    const testDefinition = hasFields ? definition as MskTestDefinition : null;

                    return (
                      <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 space-y-3 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-800">{entry.name}</p>
                            <p className="text-[11px] text-slate-500">
                              {entry.region ? regionLabels[entry.region] : 'General'} · Source: {entry.source.toUpperCase()}
                            </p>
                            {entry.description && (
                              <p className="mt-1 text-[11px] text-slate-500">{entry.description}</p>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeEvaluationTest(entry.id)}
                            className="text-xs text-slate-400 hover:text-rose-500"
                          >
                            Remove
                          </button>
                        </div>

                        {/* Render specific fields if test has field definitions */}
                        {hasFields && testDefinition?.fields && testDefinition.fields.length > 0 ? (
                          <div className="space-y-4">
                            {/* Test-specific fields */}
                            <div className="space-y-3 bg-white rounded-lg p-3 border border-slate-100">
                              {testDefinition.fields.map((field) => (
                                <div key={field.id}>
                                  {renderFieldInput(
                                    field,
                                    entry.values?.[field.id] ?? null,
                                    (newValue) => {
                                      const updatedValues = { ...(entry.values ?? {}), [field.id]: newValue };
                                      updateEvaluationTest(entry.id, { values: updatedValues });
                                    },
                                    entry,
                                    updateEvaluationTest
                                  )}
                                </div>
                              ))}
                            </div>
                            
                            {/* Result selection section */}
                            <div className="space-y-3 pt-2 border-t border-slate-200">
                              <div className="flex flex-wrap items-center gap-3">
                                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600">
                                  Status: {RESULT_LABELS[entry.result] || "Pending"}
                                </span>
                                <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                                  <input
                                    type="checkbox"
                                    checked={entry.result === "positive" || entry.result === "abnormal"}
                                    onChange={(event) =>
                                      updateEvaluationTest(entry.id, {
                                        result: event.target.checked ? "positive" : "normal",
                                      })
                                    }
                                    className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                  />
                                  Abnormal result
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
                                        ? 'bg-sky-600 text-white shadow-sm'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:border-sky-300 hover:bg-sky-50'
                                    }`}
                                  >
                                    {RESULT_LABELS[option]}
                                  </button>
                                ))}
                              </div>
                            </div>
                            
                            {/* Add Notes field - always available for manual entry, will be considered for second Vertex call */}
                            <div className="pt-2 border-t border-slate-200">
                              <label className="block text-xs font-medium text-slate-700 mb-1.5">
                                Add Notes
                              </label>
                              <textarea
                                value={entry.notes || ''}
                                onChange={(event) => updateEvaluationTest(entry.id, { notes: event.target.value })}
                                rows={2}
                                placeholder="Additional clinical notes, observations, or findings..."
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                              />
                              <p className="mt-1 text-[10px] text-slate-400">
                                Notes will be included in the second Vertex AI call for SOAP generation.
                              </p>
                            </div>
                          </div>
                        ) : (
                          /* Fallback: generic form for tests without fields */
                          <>
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600">
                                Status: {RESULT_LABELS[entry.result] || "Pending"}
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
                                  className="h-3.5 w-3.5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                                />
                                Abnormal result
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
                                      ? 'bg-sky-600 text-white shadow'
                                      : 'bg-white border border-slate-200 text-slate-600 hover:border-sky-200'
                                  }`}
                                >
                                  {RESULT_LABELS[option]}
                                </button>
                              ))}
                            </div>
                            <textarea
                              value={entry.notes}
                              onChange={(event) => updateEvaluationTest(entry.id, { notes: event.target.value })}
                              rows={3}
                              placeholder="Clinical notes, pain provocation, mobility restrictions..."
                              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
                            />
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
            Progress: {completedCount} of {totalTests} tests documented ({progressPercent}%)
          </div>
          <button
            onClick={handleGenerateSoap}
            disabled={evaluationTests.length === 0 || isGeneratingSOAP}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white hover:from-sky-600 hover:to-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {isGeneratingSOAP ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating SOAP Note...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Generate SOAP Note
              </>
            )}
          </button>
        </div>
      </div>
    );
  };

  const renderSoapTab = () => {

    return (
      <div className="space-y-6">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-slate-900" />
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">SOAP Note Generation</h2>
              <p className="text-sm text-slate-500">
                Generate professional SOAP notes from your clinical data. AI-assisted documentation.
              </p>
            </div>
          </div>
        </header>

        {/* Visit Type Selector */}
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Visit Type
              </label>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="visitType"
                    value="initial"
                    checked={visitType === 'initial'}
                    onChange={(e) => setVisitType(e.target.value as VisitType)}
                    className="h-4 w-4 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="text-sm text-slate-700">Initial Assessment</span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="visitType"
                    value="follow-up"
                    checked={visitType === 'follow-up'}
                    onChange={(e) => setVisitType(e.target.value as VisitType)}
                    className="h-4 w-4 text-sky-600 focus:ring-sky-500"
                  />
                  <span className="text-sm text-slate-700">Follow-up Visit</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Treatment Reminder for Follow-up */}
        {treatmentReminder && visitType === 'follow-up' && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                  <ClipboardList className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-blue-900 mb-1">
                  Treatment Plan Reminder
                </h3>
                <p className="text-sm text-blue-800">
                  {treatmentReminder}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Context Summary */}
        {niagaraResults && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Context Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-slate-500">Transcript</p>
                <p className="text-sm font-medium text-slate-900">{(transcript || '').split(/\s+/).filter(Boolean).length} words</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Red Flags</p>
                <p className="text-sm font-medium text-slate-900">{niagaraResults.red_flags?.length || 0} identified</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Physical Tests</p>
                <p className="text-sm font-medium text-slate-900">{physicalExamResults.length} completed</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Medications</p>
                <p className="text-sm font-medium text-slate-900">{niagaraResults.medicacion_actual?.length || 0} documented</p>
              </div>
            </div>
          </div>
        )}

        {/* Generate Button or SOAP Editor */}
        {!localSoapNote ? (
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-sm text-slate-600 mb-2">No SOAP note generated yet</p>
              <p className="text-xs text-slate-500 mb-6">
                Complete the analysis and physical evaluation tabs, then generate a SOAP note
              </p>
              <button
                onClick={handleGenerateSoap}
                disabled={!niagaraResults || physicalExamResults.length === 0 || isGeneratingSOAP}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-gradient-to-r from-sky-600 to-sky-700 text-white font-medium shadow-sm hover:from-sky-700 hover:to-sky-800 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isGeneratingSOAP ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating SOAP Note...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4" />
                    Generate SOAP Note
                  </>
                )}
              </button>
              {analysisError && (
                <div className="mt-4 p-3 rounded-lg bg-rose-50 border border-rose-200">
                  <p className="text-xs text-rose-800">{analysisError}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <SOAPEditor
            soap={localSoapNote}
            status={soapStatus}
            visitType={visitType}
            isGenerating={isGeneratingSOAP}
            onSave={handleSaveSOAP}
            onRegenerate={handleRegenerateSOAP}
            onFinalize={handleFinalizeSOAP}
            onUnfinalize={handleUnfinalizeSOAP}
            onPreview={(soap) => {
              // Preview is handled internally by SOAPEditor component
              console.log('[SOAP] Preview requested', soap);
            }}
          />
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-400">AiDuxCare</p>
            <p className="text-sm font-semibold text-slate-800">Clinical Workflow — Canada</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            Email verified · Access granted
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 py-10 space-y-10">
        <nav className="flex flex-wrap gap-2">
          {[
            { id: "analysis", label: "1 · Initial Analysis" },
            { id: "evaluation", label: "2 · Physical Evaluation" },
            { id: "soap", label: "3 · SOAP Report" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              className={`rounded-full px-4 py-2 text-sm transition ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white shadow"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === "analysis" && renderAnalysisTab()}
        {activeTab === "evaluation" && renderEvaluationTab()}
        {activeTab === "soap" && renderSoapTab()}
      </div>

      {/* Cross-Border AI Consent Modal - PHIPA s. 18 compliance */}
      <CrossBorderAIConsentModal
        open={showConsentModal}
        userId={TEMP_USER_ID}
        onConsent={async (consent: CrossBorderAIConsent) => {
          console.log('[CROSS-BORDER CONSENT] Consent accepted:', consent);
          setShowConsentModal(false);
          
          // Retry pending AI action after consent is given
          if (pendingAIAction) {
            setPendingAIAction(null);
            await pendingAIAction();
          }
        }}
        onReject={() => {
          console.log('[CROSS-BORDER CONSENT] Consent declined');
          setShowConsentModal(false);
          setPendingAIAction(null);
          
          // Show message that manual entry is available
          setAnalysisError('AI processing declined. You can still use manual documentation entry.');
        }}
        onClose={() => {
          setShowConsentModal(false);
          // Don't clear pending action on close (user might reopen)
        }}
      />

      {/* Feedback Widget - Always visible for beta testing */}
      <FeedbackWidget />
    </div>
  );
};

export default ProfessionalWorkflowPage;
