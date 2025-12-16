// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Mic, MicOff, Brain, AlertCircle, User, Calendar, FileText } from 'lucide-react';
import { ClinicalAnalysisResults } from './ClinicalAnalysisResults';
import { TranscriptionArea } from "./TranscriptionArea";
import { PatientHeader } from "./PatientHeader";
import { LoadingOverlay } from "./LoadingOverlay";
import ValidationMetrics from "./ValidationMetrics";
import { useSession } from '../context/SessionContext';
import { useNiagaraProcessor } from "../hooks/useNiagaraProcessor";
import { useAutoSelection } from "../hooks/useAutoSelection";

interface WorkflowAnalysisTabProps {
  selectedPatient: any;
  transcript: string;
  setTranscript: (text: string) => void;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  recordingTime: string;
  isAnalyzing: boolean;
  isTranscribing: boolean;
  onAnalyze: () => void;
  niagaraResults: any;
  selectedFindings: string[];
  setSelectedFindings: (findings: string[]) => void;
  onGenerateSOAP: () => void;
  onContinueToEvaluation: () => void;
  physicalExamResults: any[];
  handleExamResultsChange: (results: any[]) => void;
}

export const WorkflowAnalysisTab: React.FC<WorkflowAnalysisTabProps> = ({
  selectedPatient,
  transcript,
  setTranscript,
  isRecording,
  startRecording,
  stopRecording,
  recordingTime,
  isAnalyzing,
  isTranscribing,
  onAnalyze,
  niagaraResults,
  selectedFindings,
  setSelectedFindings,
  onGenerateSOAP,
  onContinueToEvaluation,
  physicalExamResults,
  handleExamResultsChange
}) => {
  // Estados del contexto de sesión
  const { 
    selectedIds, 
    onSelectionChange,
    clearSelection 
  } = useSession();
  
  // Hook V2 con validación
  const { 
    processTranscript, 
    results, 
    validation, 
    metrics, 
    isProcessing, 
    error 
  } = useNiagaraProcessor();
  
  // Auto-selección basada en IA
  const { selectQuickValidation, selectCriticalOnly } = useAutoSelection(
    niagaraResults || results,
    onSelectionChange,
    { enabled: true }
  );
  
  // Sincronizar con props legacy si es necesario
  useEffect(() => {
    if (selectedFindings && selectedFindings.length > 0 && selectedIds.length === 0) {
      onSelectionChange(selectedFindings);
    }
  }, [selectedFindings, selectedIds, onSelectionChange]);
  
  // Sincronizar cambios hacia arriba
  useEffect(() => {
    if (setSelectedFindings) {
      setSelectedFindings(selectedIds);
    }
  }, [selectedIds, setSelectedFindings]);
  
  const adaptedResults = useMemo(() => {
    if (!niagaraResults) return null;

    const physicalTests = (niagaraResults.evaluaciones_fisicas_sugeridas || [])
      .map((test, idx) => {
        if (!test) return null;
        if (typeof test === "string") {
          return {
            id: `physical-${idx}`,
            name: test,
            sensitivity: 0.75,
            specificity: 0.8,
            indication: "",
            justification: ""
          };
        }

        return {
          id: `physical-${idx}`,
          name: test.test || test.name || "Physical test",
          sensitivity: test.sensibilidad ?? test.sensitivity ?? 0.75,
          specificity: test.especificidad ?? test.specificity ?? 0.8,
          indication: test.objetivo || test.indicacion || "",
          justification: test.justificacion || ""
        };
      })
      .filter(Boolean);

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

    return {
      ...niagaraResults,
      physicalTests,
      entities: [...symptomEntities, ...medicationEntities, ...historyEntities],
      yellowFlags: [
        ...(niagaraResults.yellow_flags || []),
        ...(niagaraResults.contexto_ocupacional || []),
        ...(niagaraResults.contexto_psicosocial || [])
      ],
      redFlags: niagaraResults.red_flags || [],
      diagnoses: niagaraResults.diagnosticos_probables || []
    };
  }, [niagaraResults]);
  return (
    <>
      <LoadingOverlay isLoading={isAnalyzing || isProcessing} />

      <PatientHeader 
        patientData={{
          name: selectedPatient?.nombre || "Sofia Bennett", 
          age: selectedPatient?.edad || 44, 
          id: selectedPatient?.id || "CA-TEST-001",
          condition: selectedPatient?.diagnostico || "Cervical pain with referral",
          medications: selectedPatient?.medicamentos || [],
          allergies: selectedPatient?.alergias || [],
          sessionType: "Initial consultation",
          lastVisit: null
        }}
      />

      <div className="flex flex-col gap-4">
        <TranscriptionArea 
          transcript={transcript}
          setTranscript={setTranscript}
          isRecording={isRecording}
          startRecording={startRecording}
          stopRecording={stopRecording}
          recordingTime={recordingTime}
          isTranscribing={isTranscribing}
          onAnalyze={onAnalyze}
        />
        
        {/* Métricas de validación - si existen */}
        {validation && metrics && (
          <ValidationMetrics
            validation={validation}
            metrics={metrics}
          />
        )}
        
        {/* Resultados del análisis */}
        {(niagaraResults || results) && (
          <div className="mt-4">
            <ClinicalAnalysisResults 
              results={adaptedResults || results}
              selectedIds={selectedIds}
              onSelectionChange={onSelectionChange}
            />
          </div>
        )}
        
        {/* Contador de selección si hay resultados */}
        {(niagaraResults || results) && selectedIds.length > 0 && (
          <div className="flex items-center justify-between px-3 py-2 bg-blue-50 rounded-lg">
            <span className="text-sm text-blue-700">
              Selected elements: <strong>{selectedIds.length}</strong>
            </span>
            <div className="flex gap-2">
              <button
                onClick={selectQuickValidation}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Quick select
              </button>
              <button
                onClick={selectCriticalOnly}
                className="text-xs text-red-600 hover:text-red-800 underline"
              >
                Critical only
              </button>
              <button
                onClick={clearSelection}
                className="text-xs text-gray-600 hover:text-gray-800 underline"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
export default WorkflowAnalysisTab;
