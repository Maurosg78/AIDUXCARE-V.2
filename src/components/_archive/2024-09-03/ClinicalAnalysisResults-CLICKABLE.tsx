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
      case 'alerts':
        // Seleccionar todas las alertas médico-legales
        idsToSelect = results.redFlags?.map((_, i) => `alert-${i}`) || [];
        const criticalMeds = results.entities?.filter(e => 
          e.type === 'medication' && (
            e.text?.toLowerCase().includes('sin prescri') || 
            e.text?.toLowerCase().includes('no prescrit') ||
            e.text?.toLowerCase().includes('ketamina')
          )
        ) || [];
        idsToSelect.push(...criticalMeds.map(m => m.id));
        break;
        
      case 'symptoms':
        // Solo síntomas actuales de la anamnesis
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
        case 'alerts':
          return !id.startsWith('alert-') && !results.entities?.find(e => e.id === id && e.type === 'medication');
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

  // Separar datos de la anamnesis actual
  const symptoms = results.entities?.filter(e => e.type === 'symptom') || [];
  const conditions = results.entities?.filter(e => e.type === 'condition') || [];
  const medications = results.entities?.filter(e => e.type === 'medication') || [];
  
  // Identificar medicación crítica
  const criticalMeds = medications.filter(m => 
    m.text?.toLowerCase().includes('sin prescri') || 
    m.text?.toLowerCase().includes('no prescrit') ||
    m.text?.toLowerCase().includes('ketamina')
  );

  // Tests físicos - todos seleccionables
  const physicalTests = results.physicalTests || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        
        {/* Columna 1: Alertas Médico-Legales (SELECCIONABLES) */}
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-gray-800">Alertas Médico-Legales</h3>
            </div>
            <div className="flex gap-1">
              <button 
                onClick={() => handleSelectAll('alerts')}
                className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200"
              >
                Todo
              </button>
              <button 
                onClick={() => handleClearSelection('alerts')}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
              >
                Limpiar
              </button>
            </div>
          </div>
          
          {/* Medicación crítica SELECCIONABLE */}
          {criticalMeds.map((med, i) => (
            <label key={med.id} className="flex items-start gap-2 mb-2 p-2 bg-red-100 border-l-4 border-red-500 rounded cursor-pointer hover:bg-red-200">
              <input
                type="checkbox"
                checked={selectedIds.includes(med.id)}
                onChange={() => handleToggle(med.id)}
                className="mt-0.5"
              />
              <span className="text-sm font-medium text-red-700">
                ⚠️ {med.text}
              </span>
            </label>
          ))}
          
          {/* Red flags SELECCIONABLES */}
          {results.redFlags?.map((flag, i) => (
            <label key={`alert-${i}`} className="flex items-start gap-2 mb-2 cursor-pointer hover:bg-orange-100 p-1 rounded">
              <input
                type="checkbox"
                checked={selectedIds.includes(`alert-${i}`)}
                onChange={() => handleToggle(`alert-${i}`)}
                className="mt-0.5"
              />
              <span className="text-sm">{flag}</span>
            </label>
          ))}
          
          <div className="mt-3 pt-3 border-t border-orange-200 text-xs text-gray-600">
            <p className="font-semibold mb-1">DOCUMENTACIÓN:</p>
            <ul className="space-y-1">
              <li>✓ Consentimiento informado</li>
              <li>✓ Evaluación completa</li>
              <li>✓ Todos los hallazgos</li>
              <li>✓ Plan justificado</li>
            </ul>
          </div>
        </div>

        {/* Columna 2: Hallazgos Clínicos */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800">Hallazgos Clínicos</h3>
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
          
          {/* SÍNTOMAS ACTUALES - SELECCIONABLES */}
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-600 mb-2">SÍNTOMAS ACTUALES</p>
            <div className="space-y-1 max-h-64 overflow-y-auto">
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
          
          {/* HISTORIAL - NO SELECCIONABLE (ya es historia previa) */}
          <div className="mb-3">
            <p className="text-xs font-semibold text-gray-600 mb-2">HISTORIAL MÉDICO</p>
            <div className="space-y-1 text-sm text-gray-600">
              {conditions.map((condition, i) => (
                <p key={i}>• {condition.text}</p>
              ))}
            </div>
          </div>
          
          {/* MEDICACIÓN - SELECCIONABLE (detectada en anamnesis actual) */}
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-2">MEDICACIÓN ACTUAL</p>
            <div className="space-y-1">
              {medications.filter(m => !criticalMeds.includes(m)).map(med => (
                <label key={med.id} className="flex items-start gap-2 cursor-pointer hover:bg-blue-100 p-1 rounded">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(med.id)}
                    onChange={() => handleToggle(med.id)}
                    className="mt-0.5"
                  />
                  <span className="text-sm">{med.text}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Columna 3: Evaluación Física Propuesta */}
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold text-gray-800">Evaluación Física Propuesta</h3>
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
          
          {/* TODOS los tests son SELECCIONABLES */}
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {physicalTests.map((test, i) => (
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
        </div>
      </div>

      {/* Factores Psicosociales - TODOS SELECCIONABLES */}
      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold text-gray-800">Factores Psicosociales y Contexto Humano</h3>
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
