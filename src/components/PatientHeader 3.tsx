import React, { useEffect, useState } from 'react';
import { User, Pill, Activity, AlertTriangle, Calendar } from 'lucide-react';

interface PatientHeaderProps {
  patientData: any;
  analysisResults?: any;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  previousSessions?: any[];
  isFirstVisit?: boolean;
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({ 
  patientData, 
  analysisResults,
  selectedIds = [],
  onSelectionChange = () => {},
  previousSessions,
  isFirstVisit = true 
}) => {
  const [patientInfo, setPatientInfo] = useState({
    name: '',
    age: '',
    diagnosis: '',
    medications: [],
    conditions: []
  });

  useEffect(() => {
    if (analysisResults?.entities) {
      const entities = analysisResults.entities;
      
      const meds = entities
        .filter(e => e.type === 'medication')
        .map(e => e.text);
      
      const conds = entities
        .filter(e => e.type === 'condition')
        .map(e => e.text);

      setPatientInfo(prev => ({
        ...prev,
        name: patientData?.name || 'María González',
        age: patientData?.age || '44',
        diagnosis: patientData?.diagnosis || 'Dolor cervical irradiado',
        medications: meds,
        conditions: conds
      }));
    }
  }, [analysisResults, patientData]);

  if (!analysisResults) return null;

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(sid => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  // Detectar medicación crítica
  const criticalMeds = patientInfo.medications.filter(med => 
    med.toLowerCase().includes('sin receta') || 
    med.toLowerCase().includes('no prescrit') ||
    med.toLowerCase().includes('ketamina')
  );

  // Obtener IDs de condiciones del análisis actual
  const conditionEntities = analysisResults?.entities?.filter(e => e.type === 'condition') || [];

  return (
    <div className="bg-gradient-to-r from-blue-50 via-white to-purple-50 border border-gray-200 rounded-lg shadow-sm p-5 mb-6">
      
      {/* Header Principal - Información básica NO clickeable */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-md">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {patientInfo.name}, {patientInfo.age} años
            </h1>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Dx:</span> {patientInfo.diagnosis} 
              <span className="mx-2">•</span>
              <span className="font-medium">ID:</span> {patientData?.id || 'PAC-TEST-001'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">
            Sesiones: <span className="font-bold text-lg">{previousSessions?.length || 1}</span>
          </p>
          <p className="text-sm">
            Estado: <span className="font-medium text-green-600">
              {isFirstVisit ? 'Evaluación inicial' : 'En tratamiento'}
            </span>
          </p>
        </div>
      </div>

      {/* Grid de información CLICKEABLE cuando es nueva */}
      <div className="grid grid-cols-3 gap-6">
        
        {/* Columna 1: Sesión */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Activity className="w-5 h-5 text-blue-500" />
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              {isFirstVisit ? 'Primera Consulta' : 'Última Sesión'}
            </h3>
          </div>
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-gray-600 italic">
              {isFirstVisit ? 'Registrando información inicial...' : 'Datos de sesión previa'}
            </p>
          </div>
        </div>

        {/* Columna 2: Farmacología - CLICKEABLE si es crítica y nueva */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Pill className="w-5 h-5 text-green-500" />
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              Farmacología Actual
            </h3>
          </div>
          <div className="space-y-2">
            {criticalMeds.length > 0 && (
              <div className="bg-red-100 border-l-4 border-red-500 p-3 rounded-r-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-bold text-red-700">
                    {criticalMeds[0]}
                  </p>
                </div>
              </div>
            )}
            <div className="bg-green-50 rounded-lg p-3 space-y-1">
              {patientInfo.medications.filter(m => !criticalMeds.includes(m)).slice(0, 3).map((med, i) => (
                <p key={i} className="text-sm text-gray-700">• {med}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Columna 3: Condiciones - CLICKEABLE si son nuevas */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-purple-500" />
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
              Condiciones Activas
            </h3>
          </div>
          <div className="bg-purple-50 rounded-lg p-3 space-y-1">
            {conditionEntities.map((condition) => (
              <label key={condition.id} className="flex items-start gap-2 cursor-pointer hover:bg-purple-100 p-1 rounded">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(condition.id)}
                  onChange={() => handleToggle(condition.id)}
                  className="mt-0.5"
                />
                <span className="text-sm text-gray-700">{condition.text}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
