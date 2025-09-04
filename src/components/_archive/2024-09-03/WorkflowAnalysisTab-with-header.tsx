import React from 'react';
import { PatientInfoHeader } from './PatientInfoHeader';
import { ClinicalAnalysisResults } from './ClinicalAnalysisResults';

export const WorkflowAnalysisTab = ({ 
  niagaraResults, 
  patientData,
  onSelectionChange,
  selectedIds 
}) => {
  
  // Integrar información histórica con nueva
  const updatedPatientData = {
    ...patientData,
    // Agregar medicaciones detectadas
    medications: [
      ...(patientData.medications || []),
      ...(niagaraResults?.entities?.filter(e => e.type === 'medication').map(e => e.text) || [])
    ],
    // Agregar condiciones detectadas
    conditions: [
      ...(patientData.conditions || []),
      ...(niagaraResults?.entities?.filter(e => e.type === 'condition').map(e => e.text) || [])
    ]
  };

  return (
    <div>
      {/* Header con información actualizada del paciente */}
      <PatientInfoHeader 
        patientData={updatedPatientData}
        analysisResults={niagaraResults}
      />
      
      {/* Resultados del análisis con solo síntomas actuales */}
      <ClinicalAnalysisResults
        results={niagaraResults}
        onSelectionChange={onSelectionChange}
        selectedIds={selectedIds}
      />
    </div>
  );
};
