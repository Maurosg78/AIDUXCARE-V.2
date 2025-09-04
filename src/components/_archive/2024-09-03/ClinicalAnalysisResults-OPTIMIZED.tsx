import React from 'react';
import { Heart, Activity, Brain, AlertCircle } from 'lucide-react';

interface ClinicalAnalysisResultsProps {
  results: any;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export const ClinicalAnalysisResults: React.FC<ClinicalAnalysisResultsProps> = ({
  results,
  selectedIds,
  onSelectionChange
}) => {
  if (!results) return null;

  const handleSelectAll = (type: string) => {
    let idsToSelect: string[] = [];
    
    switch(type) {
      case 'symptoms':
        idsToSelect = results.entities?.filter(e => e.type === 'symptom').map(e => e.id) || [];
        break;
      case 'physical':
        idsToSelect = results.physicalTests?.map((_, i) => `physical-${i}`) || [];
        break;
      case 'psychosocial':
        idsToSelect = results.yellowFlags?.map((_, i) => `psych-${i}`) || [];
        break;
    }
    
    const newSelection = new Set([...selectedIds, ...idsToSelect]);
    onSelectionChange(Array.from(newSelection));
  };

  const handleClearSelection = (type: string) => {
    const filtered = selectedIds.filter(id => {
      switch(type) {
        case 'symptoms':
          return !results.entities?.find(e => e.id === id && e.type === 'symptom');
        case 'physical':
          return !id.startsWith('physical-');
        case 'psychosocial':
          return !id.startsWith('psych-');
        default:
          return true;
      }
    });
    onSelectionChange(filtered);
  };

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(sid => sid !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  // Filtrar datos sin duplicación
  const symptoms = results.entities?.filter(e => e.type === 'symptom') || [];
  const medications = results.entities?.filter(e => e.type === 'medication') || [];
  const criticalMeds = medications.filter(m => 
    m.text?.toLowerCase().includes('sin prescri') || 
    m.text?.toLowerCase().includes('no prescrit') ||
    m.text?.toLowerCase().includes('ketamina')
  );

  // Tests físicos del scope del fisio (dinámico basado en la respuesta)
  const physicalTests = results.physicalTests || [];
  const physicalTestsInScope = physicalTests.filter((test, index) => 
    !test.toLowerCase().includes('salud mental') &&
    !test.toLowerCase().includes('medicación') &&
    !test.toLowerCase().includes('psiquiatr')
  );
  
  const derivations = physicalTests.filter(test => 
    test.toLowerCase().includes('derivación') ||
    test.toLowerCase().includes('consulta con') ||
    test.toLowerCase().includes('salud mental') ||
    test.toLowerCase().includes('psiquiatr')
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        
        {/* Columna 1: Alertas Críticas */}
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-gray-800">Alertas Críticas</h3>
          </div>
          
          {/* Solo mostrar medicación crítica si existe */}
          {criticalMeds.length > 0 && (
            <div className="mb-3 p-2 bg-red-100 border-l-4 border-red-500 rounded">
              {criticalMeds.map((med, i) => (
                <p key={i} className="text-sm font-medium text-red-700">
                  ⚠️ {med.text}
                </p>
              ))}
            </div>
          )}
          
          {/* Red flags del análisis */}
          {results.redFlags?.length > 0 && (
            <ul className="space-y-2 text-sm">
              {results.redFlags.map((flag, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-orange-600 mt-0.5">•</span>
                  <span>{flag}</span>
                </li>
              ))}
            </ul>
          )}
          
          <div className="mt-3 pt-3 border-t border-orange-200 text-xs text-gray-600">
            <p className="font-semibold mb-1">DOCUMENTACIÓN REQUERIDA:</p>
            <ul className="space-y-1">
              <li>✓ Consentimiento informado</li>
              <li>✓ Evaluación completa</li>
              <li>✓ Todos los hallazgos</li>
              <li>✓ Plan justificado</li>
            </ul>
          </div>
        </div>

        {/* Columna 2: Síntomas Actuales */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800">Síntomas Actuales</h3>
            </div>
            <div className="flex gap-1">
              <button 
                onClick={() => handleSelectAll('symptoms')}
                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                Todo
              </button>
              <button 
                onClick={() => handleClearSelection('symptoms')}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
              >
                Limpiar
              </button>
            </div>
          </div>
          
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {symptoms.map(symptom => (
              <label key={symptom.id} className="flex items-start gap-2 cursor-pointer hover:bg-blue-100 p-1 rounded">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(symptom.id)}
                  onChange={() => handleToggle(symptom.id)}
                  className="mt-0.5"
                />
                <span className="text-sm">{symptom.text}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Columna 3: Plan de Evaluación */}
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-800">Plan de Evaluación</h3>
            </div>
            <div className="flex gap-1">
              <button 
                onClick={() => handleSelectAll('physical')}
                className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
              >
                Todo
              </button>
              <button 
                onClick={() => handleClearSelection('physical')}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
              >
                Limpiar
              </button>
            </div>
          </div>
          
          <div className="space-y-1 max-h-64 overflow-y-auto">
            {physicalTestsInScope.map((test, i) => (
              <label key={`physical-${i}`} className="flex items-start gap-2 cursor-pointer hover:bg-purple-100 p-1 rounded">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(`physical-${i}`)}
                  onChange={() => handleToggle(`physical-${i}`)}
                  className="mt-0.5"
                />
                <span className="text-sm">{i + 1}. {test}</span>
              </label>
            ))}
          </div>
          
          {derivations.length > 0 && (
            <div className="mt-3 pt-3 border-t border-purple-200">
              <p className="text-xs font-semibold text-gray-600 mb-2">DERIVACIONES:</p>
              <ul className="space-y-1 text-xs text-gray-600">
                {derivations.map((der, i) => (
                  <li key={i}>• {der}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Factores Psicosociales */}
      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold text-gray-800">Factores Psicosociales</h3>
          </div>
          <div className="flex gap-1">
            <button 
              onClick={() => handleSelectAll('psychosocial')}
              className="px-2 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
            >
              Seleccionar todo
            </button>
            <button 
              onClick={() => handleClearSelection('psychosocial')}
              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
            >
              Limpiar
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          {results.yellowFlags?.map((flag, i) => (
            <label key={`psych-${i}`} className="bg-white p-3 rounded-lg border border-yellow-200 cursor-pointer hover:bg-yellow-100">
              <input
                type="checkbox"
                checked={selectedIds.includes(`psych-${i}`)}
                onChange={() => handleToggle(`psych-${i}`)}
                className="mr-2"
              />
              <span className="text-sm">{flag}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
