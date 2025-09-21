import { t } from "../utils/translations";
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
  
//   
  // Adaptar estructura de datos para componente legacy
  console.log("niagaraResults estructura:", JSON.stringify(niagaraResults, null, 2));
  // Adaptar estructura de datos para componente legacy
  console.log("niagaraResults estructura:", JSON.stringify(niagaraResults, null, 2));
  
  // Función helper para categorizar hallazgos
  const categorizeHallazgo = (hallazgo: string) => {
    const lower = hallazgo.toLowerCase();
    
    // Patrones para medicación
    const medicationPatterns = [
      'medicación', 'medicamento', 'fármaco', 'antiinflamatorio',
      'analgésico', 'relajante', 'toma', 'prescri', 'dosis',
      'ibuprofeno', 'enantyum', 'paracetamol', 'tramadol',
      'diclofenaco', 'naproxeno', 'mg', 'gramos'
    ];
    
    // Patrones para contexto psicosocial
    const psychosocialPatterns = [
      'ocupación', 'trabajo', 'profesión', 'actividad física',
      'deporte', 'ejercicio', 'hábito', 'fuma', 'bebe', 'alcohol',
      'tabaco', 'estilo de vida', 'social', 'estrés', 'ansiedad',
      'sueño', 'descanso', 'hobby', 'conductor', 'músico'
    ];
    
    // Patrones para factores agravantes/aliviantes
    const factorPatterns = [
      'factor agravante', 'factor aliviante', 'empeora', 'mejora',
      'alivia', 'aumenta', 'disminuye', 'provoca', 'calma'
    ];
    
    // Patrones para antecedentes médicos
    const medicalHistoryPatterns = [
      'antecedente médico', 'diabetes', 'hipertensión', 'cardíaco',
      'cirugía', 'hospitalización', 'alergia', 'patología previa'
    ];
    
    // Clasificar
    if (medicationPatterns.some(pattern => lower.includes(pattern))) {
      return 'medication';
    }
    
    if (psychosocialPatterns.some(pattern => lower.includes(pattern)) && 
        !lower.includes('dolor') && !lower.includes('molestia')) {
      return 'psychosocial';
    }
    
    if (factorPatterns.some(pattern => lower.includes(pattern))) {
      return 'factor';
    }
    
    if (medicalHistoryPatterns.some(pattern => lower.includes(pattern))) {
      return 'history';
    }
    
    // Por defecto, si menciona dolor o síntomas físicos, es síntoma
    if (lower.includes('dolor') || lower.includes('molestia') || 
        lower.includes('tensión') || lower.includes('rigidez') ||
        lower.includes('hormigueo') || lower.includes('adormecimiento') ||
        lower.includes('debilidad') || lower.includes('mareo')) {
      return 'symptom';
    }
    
    // Si no encaja en ninguna categoría clara, decidir por contexto
    return 'general';
  };
  const adaptedResults = niagaraResults ? {
    ...niagaraResults,
    physicalTests: (niagaraResults.evaluaciones_fisicas_sugeridas || []).map(test => {
      if (typeof test === 'string') return test;
      return {
        name: test.test || test.nombre || 'Test físico',
        sensitivity: test.sensibilidad,
        specificity: test.especificidad,
        indication: test.indicacion,
        justification: test.justificacion
      };
    }),
    entities: [
      // Síntomas físicos - directo de hallazgos_clinicos
      ...(niagaraResults.hallazgos_clinicos || [])
        .map((h, i) => ({
          id: `symptom-${i}`,
          text: h,
          type: 'symptom' as const
        })),
      // Medicación - directo de medicacion_actual
      ...(niagaraResults.medicacion_actual || [])
        .map((h, i) => ({
          id: `medication-${i}`,
          text: h,
          type: 'medication' as const
        }))
    ],
    // Yellow flags combinando contextos y flags psicosociales
    yellowFlags: [
      ...(niagaraResults.yellow_flags || []),
      ...(niagaraResults.contexto_ocupacional || []),
      ...(niagaraResults.contexto_psicosocial || [])
    ],
    redFlags: niagaraResults.red_flags || [],
    diagnoses: niagaraResults.diagnosticos_probables || []
  } : null;
  return (
    <>
      <LoadingOverlay isLoading={isAnalyzing || isProcessing} />
      
      <div className="space-y-6">
        <PatientHeader patient={selectedPatient} />
        
        <TranscriptionArea
          transcript={transcript}
          setTranscript={setTranscript}
          isRecording={isRecording}
          startRecording={startRecording}
          stopRecording={stopRecording}
          recordingTime={recordingTime}
          isTranscribing={isTranscribing}
          onAnalyze={onAnalyze}
          isAnalyzing={isAnalyzing}
        />
        
        {niagaraResults && (
          <div className="mt-6">
            <ClinicalAnalysisResults
              results={niagaraResults}
              selectedIds={selectedIds}
              onSelectionChange={onSelectionChange}
            />
          </div>
        )}
      </div>
    </>
  );};
export default WorkflowAnalysisTab;
