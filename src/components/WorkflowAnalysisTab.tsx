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
  physicalExamResults: unknown[];
  handleExamResultsChange: (results: unknown[]) => void;
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
  
//   
  // Adaptar estructura de datos para componente legacy
  console.log("niagaraResults estructura:", JSON.stringify(niagaraResults, null, 2));
  const adaptedResults = niagaraResults ? {
    ...niagaraResults,
    yellowFlags: niagaraResults.yellow_flags || [],    physicalTests: (niagaraResults.evaluaciones_fisicas_sugeridas || []).map(t => {
      if (typeof t === "string") return t;
      if (typeof t === "object" && t.test) return String(t.test);
      return String(t);
    }),
    entities: [
      ...(niagaraResults.hallazgos_relevantes || []).filter(h => !h.includes("Uso actual")).map((h, i) => ({
        id: `symptom-${i}`,
        text: h,
        type: "symptom"
      })),
      ...(niagaraResults.hallazgos_relevantes || []).filter(h => h.includes("Uso actual")).map((h, i) => ({
        id: `medication-${i}`,
        text: h.replace("Uso actual de ", ""),
        type: "medication"
      }))
    ],
    redFlags: niagaraResults.red_flags || [],
    diagnoses: niagaraResults.diagnosticos_probables || []
  } : null;
  return (
    <>
      <LoadingOverlay isLoading={isAnalyzing || isProcessing} />

      <PatientHeader 
        patientData={{
          name: selectedPatient?.nombre || "María González", 
          age: selectedPatient?.edad || 44, 
          id: selectedPatient?.id || "PAC-TEST-001",
          condition: selectedPatient?.diagnostico || "Dolor cervical irradiado",
          medications: selectedPatient?.medicamentos || [],
          allergies: selectedPatient?.alergias || [],
          sessionType: "PRIMERA CONSULTA",
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
              Elementos seleccionados: <strong>{selectedIds.length}</strong>
            </span>
            <div className="flex gap-2">
              <button
                onClick={selectQuickValidation}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Selección rápida
              </button>
              <button
                onClick={selectCriticalOnly}
                className="text-xs text-red-600 hover:text-red-800 underline"
              >
                Solo críticos
              </button>
              <button
                onClick={clearSelection}
                className="text-xs text-gray-600 hover:text-gray-800 underline"
              >
                Limpiar
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
export default WorkflowAnalysisTab;
