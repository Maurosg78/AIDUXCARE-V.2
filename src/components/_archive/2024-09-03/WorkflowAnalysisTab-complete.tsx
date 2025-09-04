import React, { useState, useEffect } from 'react';
import { ClinicalAnalysisResults } from './ClinicalAnalysisResults';
import { PatientInfoHeader } from './PatientInfoHeader';
import { Card } from '../shared/ui';
import { User, Calendar, Pill, AlertCircle } from 'lucide-react';

export const WorkflowAnalysisTab = ({
  niagaraResults,
  patientData,
  onSelectionChange,
  selectedIds
}) => {
  const [mergedPatientData, setMergedPatientData] = useState(patientData);

  useEffect(() => {
    if (niagaraResults?.entities) {
      // Extraer y combinar información sin duplicar
      const medications = new Set(mergedPatientData?.medications || []);
      const conditions = new Set(mergedPatientData?.conditions || []);
      
      niagaraResults.entities.forEach(entity => {
        if (entity.type === 'medication') {
          medications.add(entity.text);
        } else if (entity.type === 'condition') {
          conditions.add(entity.text);
        }
      });

      setMergedPatientData({
        ...mergedPatientData,
        medications: Array.from(medications),
        conditions: Array.from(conditions)
      });
    }
  }, [niagaraResults]);

  // Renderizar header solo si hay resultados
  if (!niagaraResults) {
    return <div>Esperando análisis...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Header con información actualizada del paciente */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold">
                {patientData?.name || 'Patricia Martínez'}
              </h2>
              <p className="text-sm text-gray-600">
                ID: {patientData?.id || 'PAC-TEST-001'} | 
                {patientData?.age || '38'} años | 
                Dx: {patientData?.diagnosis || 'Dolor neuropático'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
          {/* Historial Médico */}
          <Card className="p-3">
            <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Historial Médico
            </h3>
            <ul className="space-y-1 text-gray-600 text-xs">
              {mergedPatientData?.conditions?.map((condition, idx) => (
                <li key={idx}>• {condition}</li>
              ))}
            </ul>
          </Card>

          {/* Medicación Actual */}
          <Card className="p-3">
            <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <Pill className="w-4 h-4" />
              Medicación Actual
            </h3>
            <ul className="space-y-1 text-gray-600 text-xs">
              {mergedPatientData?.medications?.map((med, idx) => (
                <li key={idx}>• {med}</li>
              ))}
            </ul>
          </Card>

          {/* Información Importante */}
          <Card className="p-3">
            <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-1">
              <AlertCircle className="w-4 h-4" />
              Antecedentes
            </h3>
            <ul className="space-y-1 text-gray-600 text-xs">
              <li>• Familiar: Lupus, ELA, EM</li>
              <li>• Alergias: Ninguna conocida</li>
            </ul>
          </Card>
        </div>
      </div>

      {/* Resultados del análisis */}
      <ClinicalAnalysisResults
        results={niagaraResults}
        onSelectionChange={onSelectionChange}
        selectedIds={selectedIds}
      />
    </div>
  );
};
