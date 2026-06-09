import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, Heart, Brain, Activity, AlertTriangle } from 'lucide-react';
import { EditableCheckbox } from './EditableCheckbox';
import { AddCustomItemButton } from './AddCustomItemButton';
import { useEditableResults } from '../hooks/useEditableResults';
import { sortPhysicalTestsByImportance, getTopPhysicalTests } from '../utils/sortPhysicalTestsByImportance';
import { isSpainPilot } from '@/core/pilotDetection';
import type { EvidenceRecommendation } from '@/core/clinical-reasoning/prioritizeEvidence';
import { AddMedicationModal } from '@/components/clinical-decisions/AddMedicationModal';
import {
  getPatientClinicalDecisions,
  saveClinicalDecision,
} from '@/core/clinical-decisions/clinicalDecisionService';
import type { ClinicalDecision, MedicationDecisionState } from '@/core/clinical-decisions/types';

interface ClinicalAnalysisResultsProps {
  results: any;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onEditedResultsChange?: (editedResults: any) => void;
  visitType?: 'initial' | 'follow-up';
  /** WO-BUG-009: Resumen de solo lectura; red flags decididos en AnalysisTab */
  selectedRedFlagIds?: string[];
  redFlagsDetected?: Array<{ id: string; description: string; severity?: string }>;
  currentUserId?: string | null;
  currentSessionId?: string | null;
  currentPatientId?: string | null;
}

type MedicationConfidence = 'high' | 'medium' | 'low';

type MedicationMentionStatus =
  | 'current'
  | 'previous'
  | 'stopped_adverse'
  | 'topical_or_supplement'
  | 'unclear';

interface StructuredMedicationData {
  original_text?: string;
  normalized_name?: string;
  confidence?: MedicationConfidence;
  requires_review?: boolean;
  mention_status?: MedicationMentionStatus;
  suggested_name?: string;
}

interface ClinicalEntity {
  id: string;
  text?: string;
  type?: string;
  medication_data?: StructuredMedicationData;
}

const TECHNICAL_SUFFIXES_TO_STRIP = [
  ' (no identificado)',
  ' (no confirmado)',
  ' (unidentified)',
  ' (not confirmed)',
  ' [nombre por confirmar]',
  ' [medicamento por confirmar]',
];

const stripTechnicalSuffix = (name: string): string => {
  let cleanName = name;
  for (const suffix of TECHNICAL_SUFFIXES_TO_STRIP) {
    if (cleanName.endsWith(suffix)) {
      cleanName = cleanName.slice(0, -suffix.length);
      break;
    }
  }
  return cleanName.trim();
};

export const ClinicalAnalysisResults: React.FC<ClinicalAnalysisResultsProps> = ({
  results,
  selectedIds,
  onSelectionChange,
  onEditedResultsChange,
  visitType = 'initial',
  selectedRedFlagIds,
  redFlagsDetected = [],
  currentUserId,
  currentSessionId,
  currentPatientId,
}) => {
  const [isAddMedicationModalOpen, setIsAddMedicationModalOpen] = useState(false);
  const [physioAddedMedications, setPhysioAddedMedications] = useState<ClinicalDecision[]>([]);
  const [medicationError, setMedicationError] = useState<string | null>(null);
  const esPilot = isSpainPilot();
  const ui = esPilot
    ? {
        followUpMessage: 'Genera la nota SOAP en la sección de documentación inferior. El seguimiento utiliza la línea basal, los tratamientos y las notas clínicas, sin bloques de análisis separados.',
        medicoLegalTitle: 'Resumen médico-legal',
        medicoLegalBody: 'Notas de cumplimiento y red flags seleccionados en el paso de análisis.',
        redFlagSingle: '1 red flag seleccionada en el paso de análisis anterior.',
        redFlagMultiple: (count: number) => `${count} red flags seleccionadas en el paso de análisis anterior.`,
        conversationTitle: 'Resumen de la conversación',
        conversationBody: 'Recoge motivo de consulta, hallazgos clave y medicación.',
        selectAll: 'Seleccionar todo',
        clear: 'Limpiar',
        chiefComplaintTitle: 'Motivo de consulta y hallazgos clave',
        addClinicalHighlight: 'Añadir hallazgo clínico...',
        currentMedicationTitle: 'Medicación actual',
        testsTitle: 'Pruebas físicas recomendadas',
        testsBody: 'Selecciona las valoraciones que planeas realizar en la pestaña de evaluación.',
      }
    : {
        followUpMessage: 'Generate your SOAP note in the Documentation section below. Follow-up uses baseline, treatments, and clinical notes only — no separate analysis sections.',
        medicoLegalTitle: 'Medico-legal Summary',
        medicoLegalBody: 'Compliance notes and red flags selected in the analysis step.',
        redFlagSingle: '1 red flag selected in the analysis step above.',
        redFlagMultiple: (count: number) => `${count} red flags selected in the analysis step above.`,
        conversationTitle: 'Conversation Highlights',
        conversationBody: 'Capture chief complaint, key findings, and medication.',
        selectAll: 'Seleccionar todo',
        clear: 'Limpiar',
        chiefComplaintTitle: 'Chief complaint & key findings',
        addClinicalHighlight: 'Add clinical highlight...',
        currentMedicationTitle: 'Current medication',
        testsTitle: 'Recommended Physical Tests',
        testsBody: 'Select the assessments you plan to run in the evaluation tab.',
      };
  const {
    editedResults,
    handleTextChange,
    addCustomItem,
    addMedicationDecisionToResults,
  } = useEditableResults(results);

  useEffect(() => {
    onEditedResultsChange?.(editedResults);
  }, [editedResults, onEditedResultsChange]);

  const physicalTests = useMemo(() => {
    const rawTests = editedResults?.physicalTests || [];
    const sorted = sortPhysicalTestsByImportance(rawTests);
    const { topTests } = getTopPhysicalTests(sorted, 5);
    return Array.isArray(topTests) ? topTests.slice(0, 5) : [];
  }, [editedResults?.physicalTests]);

  const evidenceRecommendations: EvidenceRecommendation[] = Array.isArray(editedResults?.evidence_recommendations)
    ? editedResults.evidence_recommendations
    : [];

  useEffect(() => {
    if (!currentPatientId) return;

    let cancelled = false;

    getPatientClinicalDecisions(currentPatientId)
      .then((decisions) => {
        if (cancelled) return;
        const medications = decisions.filter(
          (decision) =>
            decision.kind === 'medication' &&
            decision.source === 'physio_added' &&
            decision.status === 'active'
        );
        setPhysioAddedMedications(medications);
        medications.forEach((medication) => {
          addMedicationDecisionToResults({
            id: medication.id,
            name: medication.text,
            dose: medication.medicationDose,
            frequency: medication.medicationFrequency,
            state: medication.medicationState,
            note: medication.note,
          });
        });
      })
      .catch(() => {
        if (cancelled) return;
        setPhysioAddedMedications([]);
      });

    return () => {
      cancelled = true;
    };
  }, [addMedicationDecisionToResults, currentPatientId]);

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(item => item !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = (section: string) => {
    let idsToSelect: string[] = [];

    switch (section) {
      case 'alerts':
        idsToSelect = editedResults?.entities?.filter((e: any) => e.type === 'medication').map((e: any) => e.id).filter(Boolean) || [];
        break;
      case 'clinical':
        idsToSelect = editedResults?.entities?.map((e: any) => e.id).filter(Boolean) || [];
        break;
      case 'physical':
        idsToSelect = physicalTests.map((test: any) => {
          if (typeof test === 'object' && test.originalIndex !== undefined) {
            return `physical-${test.originalIndex}`;
          }
          const index = physicalTests.findIndex((t: any) =>
            (typeof t === 'string' && typeof test === 'string' && t === test) ||
            (typeof t === 'object' && typeof test === 'object' && t.name === test.name)
          );
          return `physical-${index >= 0 ? index : 0}`;
        });
        break;
      case 'psychosocial':
        const psychosocialIds: string[] = [];
        editedResults?.biopsychosocial_occupational?.forEach((_: any, i: number) => psychosocialIds.push(`occupational-${i}`));
        editedResults?.biopsychosocial_protective?.forEach((_: any, i: number) => psychosocialIds.push(`protective-${i}`));
        editedResults?.biopsychosocial_functional_limitations?.forEach((_: any, i: number) => psychosocialIds.push(`functional-${i}`));
        editedResults?.biopsychosocial_psychological?.forEach((_: any, i: number) => psychosocialIds.push(`psychological-${i}`));
        editedResults?.biopsychosocial_social?.forEach((_: any, i: number) => psychosocialIds.push(`social-${i}`));
        editedResults?.biopsychosocial_patient_strengths?.forEach((_: any, i: number) => psychosocialIds.push(`strength-${i}`));
        if (psychosocialIds.length === 0) {
          editedResults?.yellowFlags?.forEach((_: any, i: number) => psychosocialIds.push(`yellow-${i}`));
        }
        idsToSelect = psychosocialIds;
        break;
    }

    const newSelection = [...new Set([...selectedIds, ...idsToSelect])];
    onSelectionChange(newSelection);
  };

  const handleSelectNone = (section: string) => {
    let idsToRemove: string[] = [];

    switch (section) {
      case 'alerts':
        idsToRemove = selectedIds.filter(id =>
          editedResults?.entities?.find((e: any) => e.id === id && e.type === 'medication')
        );
        break;
      case 'clinical':
        idsToRemove = selectedIds.filter(id =>
          editedResults?.entities?.find((e: any) => e.id === id)
        );
        break;
      case 'physical':
        idsToRemove = selectedIds.filter(id => id.startsWith('physical-'));
        break;
      case 'psychosocial':
        idsToRemove = selectedIds.filter(id =>
          id.startsWith('occupational-') ||
          id.startsWith('protective-') ||
          id.startsWith('functional-') ||
          id.startsWith('psychological-') ||
          id.startsWith('social-') ||
          id.startsWith('strength-') ||
          id.startsWith('yellow-')
        );
        break;
    }

    onSelectionChange(selectedIds.filter(id => !idsToRemove.includes(id)));
  };

  if (!editedResults) return null;

  const handleAddMedication = async (medication: {
    name: string;
    dose?: string;
    frequency?: string;
    state: MedicationDecisionState;
    note?: string;
  }) => {
    if (!currentUserId || !currentSessionId || !currentPatientId) {
      setMedicationError('No se pudo registrar el medicamento: faltan datos de sesion.');
      return;
    }

    try {
      const saved = await saveClinicalDecision({
        kind: 'medication',
        status: 'active',
        source: 'physio_added',
        text: medication.name,
        decidedBy: currentUserId,
        decidedAt: new Date().toISOString(),
        sessionId: currentSessionId,
        patientId: currentPatientId,
        reason: null,
        ...(medication.dose ? { medicationDose: medication.dose } : {}),
        ...(medication.frequency ? { medicationFrequency: medication.frequency } : {}),
        medicationState: medication.state,
        ...(medication.note ? { note: medication.note } : {}),
      });
      setPhysioAddedMedications((prev) => [...prev, saved]);
      addMedicationDecisionToResults({
        id: saved.id,
        name: saved.text,
        dose: saved.medicationDose,
        frequency: saved.medicationFrequency,
        state: saved.medicationState,
        note: saved.note,
      });
      setMedicationError(null);
      setIsAddMedicationModalOpen(false);
    } catch (error) {
      console.error('[ClinicalAnalysisResults] Failed to persist medication clinical decision', error);
      setMedicationError('No se pudo registrar el medicamento. Intenta nuevamente.');
    }
  };

  // Follow-up: mostrar mensaje simple, sin secciones de análisis
  if (visitType === 'follow-up') {
    return (
      <>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600">
          <p>{ui.followUpMessage}</p>
          {medicationError && (
            <p className="mt-3 text-sm font-medium text-red-700">{medicationError}</p>
          )}
          {physioAddedMedications.length > 0 && (
            <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-left">
              <p className="mb-2 text-xs font-medium text-slate-600">
                Medicamentos registrados por el fisioterapeuta
              </p>
              {physioAddedMedications.map((medication) => (
                <div
                  key={medication.id}
                  className="flex items-center justify-between border-b border-slate-100 py-1 last:border-0"
                >
                  <span className="text-xs text-slate-700">{medication.text}</span>
                  <div className="flex items-center gap-2">
                    {medication.medicationState && (
                      <span className="text-xs text-slate-400">{medication.medicationState}</span>
                    )}
                    {medication.medicationDose && (
                      <span className="text-xs text-slate-400">{medication.medicationDose}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <AddMedicationModal
          isOpen={isAddMedicationModalOpen}
          onConfirm={(medication) => {
            void handleAddMedication(medication);
          }}
          onCancel={() => setIsAddMedicationModalOpen(false)}
        />
      </>
    );
  }

  // A partir de aquí visitType === 'initial' — no necesitamos verificar de nuevo
  const entities = Array.isArray(editedResults.entities)
    ? (editedResults.entities as ClinicalEntity[])
    : [];

  const isMedicationEntity = (entity: ClinicalEntity): boolean => {
    const entityType = entity.type;
    const isMedication = entityType === 'medication';
    return isMedication;
  };

  const hasPrescriptionPlaceholder = (entity: ClinicalEntity): boolean => {
    const rawText = entity.text || '';
    const normalizedText = rawText.toLowerCase();
    const includesPlaceholder = normalizedText.includes('sin prescri');
    return includesPlaceholder;
  };

  const isHighConfidenceMedication = (entity: ClinicalEntity): boolean => {
    const medicationData = entity.medication_data;
    const confidence = medicationData?.confidence;
    const hasHighConfidence = confidence === 'high';
    return hasHighConfidence;
  };

  const requiresMedicationReview = (entity: ClinicalEntity): boolean => {
    const medicationData = entity.medication_data;
    const requiresReview = medicationData?.requires_review === true;
    return requiresReview;
  };

  const isGenericMedicationCategory = (value: string): boolean => {
    const normalizedValue = value.trim().toLowerCase();
    const genericCategoryPattern = /^(medicamento|medicamentos|medicacion|medicación)\s+para\b/;
    const isGenericCategory = genericCategoryPattern.test(normalizedValue);
    return isGenericCategory;
  };

  const getMedicationDisplayName = (entity: ClinicalEntity): string => {
    const medicationData = entity.medication_data;
    const rawEntityText = entity.text;
    const entityTextRecord = typeof rawEntityText === 'object' && rawEntityText !== null
      ? rawEntityText as Record<string, unknown>
      : null;
    const entityTextNormalizedName = typeof entityTextRecord?.normalized_name === 'string'
      ? entityTextRecord.normalized_name
      : '';
    const entityTextOriginalText = typeof entityTextRecord?.original_text === 'string'
      ? entityTextRecord.original_text
      : '';
    const editedText = typeof rawEntityText === 'string'
      ? rawEntityText
      : entityTextOriginalText || entityTextNormalizedName;
    const normalizedName = medicationData?.normalized_name || '';
    const originalText = medicationData?.original_text || '';
    const safeEditedText = isGenericMedicationCategory(editedText) ? '' : editedText;
    const safeNormalizedName = isGenericMedicationCategory(normalizedName) ? '' : normalizedName;
    const rawDisplayName = originalText || safeEditedText || safeNormalizedName || normalizedName;
    const displayName = stripTechnicalSuffix(rawDisplayName);
    return displayName;
  };

  const getMedicationClarificationDisplayName = (entity: ClinicalEntity): string => {
    const medicationData = entity.medication_data;
    const normalizedName = medicationData?.normalized_name || '';
    const originalText = medicationData?.original_text || '';
    const rawEntityText = entity.text;
    const entityTextRecord = typeof rawEntityText === 'object' && rawEntityText !== null
      ? rawEntityText as Record<string, unknown>
      : null;
    const entityTextNormalizedName = typeof entityTextRecord?.normalized_name === 'string'
      ? entityTextRecord.normalized_name
      : '';
    const entityTextOriginalText = typeof entityTextRecord?.original_text === 'string'
      ? entityTextRecord.original_text
      : '';
    const editedText = typeof rawEntityText === 'string'
      ? rawEntityText
      : entityTextOriginalText || entityTextNormalizedName;
    const safeEditedText = isGenericMedicationCategory(editedText) ? '' : editedText;
    const safeNormalizedName = isGenericMedicationCategory(normalizedName) ? '' : normalizedName;
    const rawDisplayName = originalText || safeEditedText || safeNormalizedName || normalizedName;
    const displayName = stripTechnicalSuffix(rawDisplayName);
    return displayName;
  };

  const hasDifferentOriginalMedicationText = (entity: ClinicalEntity): boolean => {
    const medicationData = entity.medication_data;
    const originalText = medicationData?.original_text || '';
    const displayName = getMedicationClarificationDisplayName(entity);
    const hasOriginalText = originalText.length > 0;
    const isDifferent = originalText !== displayName;
    return hasOriginalText && isDifferent;
  };

  const normalizeForMatch = (text: string): string => {
    const decomposed = text.normalize('NFD');
    const withoutDiacritics = decomposed.replace(/[\u0300-\u036f]/g, '');
    const lowercased = withoutDiacritics.toLowerCase();
    const trimmed = lowercased.trim();
    return trimmed;
  };

  const redFlagTexts = (results?.red_flags ?? [])
    .map((flag: unknown) => {
      if (typeof flag === 'string') return normalizeForMatch(flag);
      const flagRecord = flag as { label?: string; text?: string };
      return normalizeForMatch(flagRecord?.label ?? flagRecord?.text ?? '');
    })
    .filter(Boolean);

  const isCoveredByRedFlag = (med: unknown): boolean => {
    const medRecord = med as { medication_data?: { normalized_name?: string; original_text?: string }; text?: string };
    const medName = normalizeForMatch(
      medRecord?.medication_data?.normalized_name ??
      medRecord?.medication_data?.original_text ??
      (typeof med === 'string' ? med : '') ??
      ''
    );
    if (!medName || medName.length < 4) return false;
    return redFlagTexts.some((flagText) =>
      flagText.includes(medName) || medName.includes(flagText.slice(0, Math.max(flagText.length - 2, 4)))
    );
  };

  const medicationEntities = entities.filter((entity) => {
    const isMedication = isMedicationEntity(entity);
    return isMedication;
  });

  const criticalMeds = medicationEntities.filter((entity) => {
    const isPlaceholder = hasPrescriptionPlaceholder(entity);
    return isPlaceholder;
  });

  const reviewableMeds = medicationEntities.filter((entity) => {
    const isPlaceholder = hasPrescriptionPlaceholder(entity);
    return !isPlaceholder;
  });

  const identifiedMeds = reviewableMeds.filter((entity) => {
    const hasHighConfidence = isHighConfidenceMedication(entity);
    const needsReview = requiresMedicationReview(entity);
    const isIdentified = hasHighConfidence && !needsReview;
    return isIdentified;
  });

  const clarificationMeds = reviewableMeds.filter((entity) => {
    const hasHighConfidence = isHighConfidenceMedication(entity);
    const needsReview = requiresMedicationReview(entity);
    const isIdentified = hasHighConfidence && !needsReview;
    return !isIdentified;
  });

  const medicationClarificationMeds = medicationEntities.filter((entity) => {
    const medicationData = entity.medication_data;
    if (!medicationData) {
      return false;
    }
    const confidence = medicationData.confidence;
    const needsReview = requiresMedicationReview(entity);
    const isHighConfidence = confidence === 'high';
    return needsReview || !isHighConfidence;
  });

  return (
    <div className="flex flex-col gap-4">

      {/* WO-BUG-009: Medico-legal Summary */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-500">
            <AlertCircle className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-slate-900">{ui.medicoLegalTitle}</h3>
            <p className="text-xs text-slate-500">{ui.medicoLegalBody}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {criticalMeds.map((med) => (
            <EditableCheckbox
              key={med.id}
              id={med.id}
              text={`⚠️ ${med.text}`}
              checked={selectedIds.includes(med.id)}
              onToggle={handleToggle}
              onTextChange={handleTextChange}
              className="p-2 bg-slate-50 border border-rose-200 rounded-lg"
            />
          ))}
        </div>

        {selectedRedFlagIds != null && selectedRedFlagIds.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-600">
              {selectedRedFlagIds.length === 1
                ? ui.redFlagSingle
                : ui.redFlagMultiple(selectedRedFlagIds.length)}
            </p>
          </div>
        )}
      </div>

      {/* Conversation Highlights */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-500">
              <Heart className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-900">{ui.conversationTitle}</h3>
              <p className="text-xs text-slate-500">{ui.conversationBody}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleSelectAll('clinical')}
              className="px-3 py-1 text-xs rounded-lg bg-gradient-to-r from-[#e6ddff] to-[#d7ecff] text-slate-700 border border-transparent hover:shadow-sm"
            >
              {ui.selectAll}
            </button>
            <button
              onClick={() => handleSelectNone('clinical')}
              className="px-3 py-1 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              {ui.clear}
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <h4 className="font-medium text-sm text-slate-700 mb-2">{ui.chiefComplaintTitle}</h4>
            <div className="space-y-1">
              {editedResults.entities?.filter((e: any) => e.type === 'symptom').map((entity: any) => (
                <EditableCheckbox
                  key={entity.id}
                  id={entity.id}
                  text={entity.text}
                  checked={selectedIds.includes(entity.id)}
                  onToggle={handleToggle}
                  onTextChange={handleTextChange}
                />
              ))}
            </div>
            <div className="mt-2">
              <AddCustomItemButton
                onAdd={(text) => addCustomItem('symptoms', text)}
                placeholder={ui.addClinicalHighlight}
              />
            </div>
          </div>

          {reviewableMeds.length > 0 && (
            <div>
              <h4 className="font-medium text-sm text-slate-700 mb-2">{ui.currentMedicationTitle}</h4>
              <div className="space-y-1">
                {identifiedMeds.map((entity) => (
                  <EditableCheckbox
                    key={entity.id}
                    id={entity.id}
                    text={getMedicationDisplayName(entity)}
                    checked={selectedIds.includes(entity.id)}
                    onToggle={handleToggle}
                    onTextChange={handleTextChange}
                  />
                ))}
                {clarificationMeds.map((entity) => {
                  const suggestion = entity.medication_data?.suggested_name;
                  const currentName = getMedicationDisplayName(entity);
                  return (
                    <div key={entity.id}>
                      <EditableCheckbox
                        id={entity.id}
                        text={`${currentName} [por confirmar]`}
                        checked={selectedIds.includes(entity.id)}
                        onToggle={handleToggle}
                        onTextChange={handleTextChange}
                      />
                      {suggestion && currentName !== suggestion && (
                        <div className="ml-6 mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                          <span>¿Quiso decir:</span>
                          <button
                            type="button"
                            onClick={() => handleTextChange(entity.id, suggestion)}
                            className="font-medium text-indigo-600 hover:underline"
                          >
                            {suggestion}
                          </button>
                          <span>?</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Recommended Physical Tests */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-500">
              <Activity className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-900">{ui.testsTitle}</h3>
              <p className="text-xs text-slate-500">{ui.testsBody}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleSelectAll('physical')}
              className="px-3 py-1 text-xs rounded-lg bg-gradient-to-r from-[#e6ddff] to-[#d7ecff] text-slate-700 border border-transparent hover:shadow-sm"
            >
              {ui.selectAll}
            </button>
            <button
              onClick={() => handleSelectNone('physical')}
              className="px-3 py-1 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              {ui.clear}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {physicalTests.map((test: any, i: number) => {
            const label = typeof test === 'string' ? test : test.name || test.test || 'Physical test';
            const testIndex = (typeof test === 'object' && test.originalIndex !== undefined) ? test.originalIndex : i;
            const testId = `physical-${testIndex}`;

            let evidenceDetail = '';
            if (typeof test === 'object') {
              const evidenceParts: string[] = [];
              const sensitivity = test.sensitivity || test.sensibilidad;
              if (sensitivity != null && typeof sensitivity === 'number' && !isNaN(sensitivity) && sensitivity >= 0 && sensitivity <= 1) {
                evidenceParts.push(`Sensitivity ${Math.round(sensitivity * 100)}%`);
              }
              const specificity = test.specificity || test.especificidad;
              if (specificity != null && typeof specificity === 'number' && !isNaN(specificity) && specificity >= 0 && specificity <= 1) {
                evidenceParts.push(`Specificity ${Math.round(specificity * 100)}%`);
              }
              if (test.evidencia || test.evidence || test.evidence_level) {
                evidenceParts.push(`Evidencia: ${String(test.evidencia || test.evidence || test.evidence_level)}`);
              }
              if (test.justificacion || test.justification) {
                evidenceParts.push(test.justificacion || test.justification);
              }
              evidenceDetail = evidenceParts.length > 0 ? ` (${evidenceParts.join(' · ')})` : '';
            }

            return (
              <EditableCheckbox
                key={testId}
                id={testId}
                text={`${i + 1}. ${label}${evidenceDetail}`}
                checked={selectedIds.includes(testId)}
                onToggle={handleToggle}
                onTextChange={handleTextChange}
              />
            );
          })}
        </div>

        <div className="mt-3">
          <AddCustomItemButton
            onAdd={(text) => addCustomItem('physical', text)}
            placeholder="Add custom physical test..."
          />
        </div>
      </div>

      {evidenceRecommendations.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-3">
            Opciones de tratamiento con evidencia curada
          </h3>
          <div className="space-y-3">
            {evidenceRecommendations.map((item) => (
              <div key={item.interventionId} className="border-b border-slate-100 pb-3 last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-slate-700 text-sm">
                    {item.interventionName}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    item.priority === 'high' ? 'bg-green-100 text-green-700' :
                    item.priority === 'medium' ? 'bg-blue-100 text-blue-700' :
                    item.priority === 'low' ? 'bg-slate-100 text-slate-600' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {item.priority === 'high' ? 'Alta prioridad' :
                     item.priority === 'medium' ? 'Prioridad media' :
                     item.priority === 'low' ? 'Prioridad baja' :
                     'Diferir'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-1">
                  Evidencia: {
                    item.evidenceLevel === 'high' ? 'alta' :
                    item.evidenceLevel === 'moderate' ? 'moderada' :
                    'baja'
                  } · {item.reason}
                </p>
                {item.warnings.length > 0 && (
                  <p className="text-xs text-yellow-700 bg-yellow-50 rounded px-2 py-1">
                    ⚠ {item.warnings.join(' · ')}
                  </p>
                )}
                {item.missingCapabilities.length > 0 && (
                  <p className="text-xs text-slate-400">
                    Requiere: {item.missingCapabilities.join(', ')}
                  </p>
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">
            Basado en evidencia revisada por CTO clínico — ADR-004
          </p>
        </div>
      )}

      {/* Biopsychosocial Factors */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-500">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Factores biopsicosociales</h3>
              <p className="text-xs text-slate-500">Factores psicosociales, ocupacionales y protectores.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleSelectAll('psychosocial')}
              className="px-3 py-1 text-xs rounded-lg bg-gradient-to-r from-[#e6ddff] to-[#d7ecff] text-slate-700 border border-transparent hover:shadow-sm"
            >
              Seleccionar todo
            </button>
            <button
              onClick={() => handleSelectNone('psychosocial')}
              className="px-3 py-1 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              Limpiar
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {editedResults.biopsychosocial_occupational?.map((factor: string, i: number) => (
            <EditableCheckbox key={`occupational-${i}`} id={`occupational-${i}`} text={factor}
              checked={selectedIds.includes(`occupational-${i}`)} onToggle={handleToggle} onTextChange={handleTextChange} />
          ))}
          {editedResults.biopsychosocial_protective?.map((factor: string, i: number) => (
            <EditableCheckbox key={`protective-${i}`} id={`protective-${i}`} text={factor}
              checked={selectedIds.includes(`protective-${i}`)} onToggle={handleToggle} onTextChange={handleTextChange} />
          ))}
          {editedResults.biopsychosocial_functional_limitations?.map((factor: string, i: number) => (
            <EditableCheckbox key={`functional-${i}`} id={`functional-${i}`} text={factor}
              checked={selectedIds.includes(`functional-${i}`)} onToggle={handleToggle} onTextChange={handleTextChange} />
          ))}
          {editedResults.biopsychosocial_psychological?.map((factor: string, i: number) => (
            <EditableCheckbox key={`psychological-${i}`} id={`psychological-${i}`} text={factor}
              checked={selectedIds.includes(`psychological-${i}`)} onToggle={handleToggle} onTextChange={handleTextChange} />
          ))}
          {editedResults.biopsychosocial_social?.map((factor: string, i: number) => (
            <EditableCheckbox key={`social-${i}`} id={`social-${i}`} text={factor}
              checked={selectedIds.includes(`social-${i}`)} onToggle={handleToggle} onTextChange={handleTextChange} />
          ))}
          {editedResults.biopsychosocial_patient_strengths?.map((factor: string, i: number) => (
            <EditableCheckbox key={`strength-${i}`} id={`strength-${i}`} text={factor}
              checked={selectedIds.includes(`strength-${i}`)} onToggle={handleToggle} onTextChange={handleTextChange} />
          ))}

          {/* Fallback yellowFlags */}
          {(!editedResults.biopsychosocial_occupational?.length &&
            !editedResults.biopsychosocial_protective?.length &&
            !editedResults.biopsychosocial_functional_limitations?.length &&
            !editedResults.biopsychosocial_psychological?.length &&
            !editedResults.biopsychosocial_social?.length &&
            !editedResults.biopsychosocial_patient_strengths?.length) &&
            editedResults.yellowFlags?.map((flag: string, i: number) => (
              <EditableCheckbox key={`yellow-${i}`} id={`yellow-${i}`} text={flag}
                checked={selectedIds.includes(`yellow-${i}`)} onToggle={handleToggle} onTextChange={handleTextChange} />
            ))
          }
        </div>

        <div className="mt-3">
          <AddCustomItemButton
            onAdd={(text) => addCustomItem('biopsychosocial_functional_limitations', text)}
            placeholder="Add biopsychosocial factor..."
          />
        </div>
      </div>

    </div>
  );
};

export default ClinicalAnalysisResults;
