import React, { useEffect, useState } from 'react';
import { AlertTriangle, Pill, Brain, AlertCircle } from 'lucide-react';
import { 
  normalizeClinicaAnalysis,
  initializeMedicalNormalization 
} from '../../utils/medicalNormalization';

interface EnhancedAnalysisProps {
  results: any;
}

export const AnalysisResultsEnhanced: React.FC<EnhancedAnalysisProps> = ({ results }) => {
  const [normalizedData, setNormalizedData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function normalize() {
      setLoading(true);
      
      // Inicializar sistema si es primera vez
      await initializeMedicalNormalization();
      
      // Normalizar todos los datos médicos
      const normalized = await normalizeClinicaAnalysis({
        medications: results.medicacion_actual || [],
        diagnoses: results.diagnosticos_probables || [],
        anatomy: results.hallazgos_clinicos || []
      });
      
      setNormalizedData(normalized);
      setLoading(false);
    }
    
    if (results) normalize();
  }, [results]);
  
  if (loading) return <div>Normalizando terminología médica...</div>;
  if (!normalizedData) return null;
  
  return (
    <div className="space-y-4">
      {/* Alertas de Interacciones Medicamentosas */}
      {normalizedData.drugInteractions.length > 0 && (
        <div className="bg-red-50 border-2 border-red-400 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <h3 className="font-bold text-red-900">⚠️ INTERACCIONES MEDICAMENTOSAS DETECTADAS</h3>
          </div>
          {normalizedData.drugInteractions.map((interaction, idx) => (
            <div key={idx} className="mb-2 p-2 bg-red-100 rounded">
              <div className="font-semibold text-red-800">
                {interaction.drug1} + {interaction.drug2}
              </div>
              <div className="text-sm text-red-700">
                Severidad: {interaction.severity.toUpperCase()}
              </div>
              <div className="text-xs text-red-600 mt-1">
                {interaction.description}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Medicamentos Normalizados con RxCUI */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Pill className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-blue-900">Medicación (Normalizada)</h3>
        </div>
        {normalizedData.medications.map((med, idx) => (
          <div key={idx} className="mb-2">
            <div className="font-semibold text-sm">
              {med.generic} {med.brand && `(${med.brand})`}
            </div>
            {med.drugClass && (
              <div className="text-xs text-blue-600">
                Clase: {med.drugClass}
              </div>
            )}
            {med.rxcui && (
              <div className="text-xs text-gray-500">
                RxCUI: {med.rxcui}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Diagnósticos con ICD-10 */}
      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-purple-600" />
          <h3 className="font-bold text-purple-900">Diagnósticos (ICD-10)</h3>
        </div>
        {normalizedData.diagnoses.map((dx, idx) => (
          <div key={idx} className="mb-2">
            <div className="font-semibold text-sm">
              {dx.name}
            </div>
            {dx.icd10 && (
              <div className="text-xs text-purple-600">
                ICD-10: {dx.icd10}
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Advertencias */}
      {normalizedData.warnings.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h3 className="font-bold text-yellow-900">Advertencias</h3>
          </div>
          {normalizedData.warnings.map((warning, idx) => (
            <div key={idx} className="text-sm text-yellow-700">
              • {warning}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnalysisResultsEnhanced;
