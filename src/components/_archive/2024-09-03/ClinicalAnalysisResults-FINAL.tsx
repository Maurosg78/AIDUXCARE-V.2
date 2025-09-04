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

  // Funciones para selección masiva
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

  // Separar entidades por tipo
  const symptoms = results.entities?.filter(e => e.type === 'symptom') || [];
  const conditions = results.entities?.filter(e => e.type === 'condition') || [];
  const medications = results.entities?.filter(e => e.type === 'medication') || [];
  
  // Tests físicos - filtrar solo los que son del scope del fisioterapeuta
  const physicalTestsInScope = [
    "Examen neurológico completo",
    "Evaluación musculoesquelética", 
    "Evaluación de la marcha y el equilibrio",
    "Evaluación de la función cognitiva básica",
    "Examen de la piel",
    "Evaluación postural"
  ];
  
  const derivations = [
    "Evaluación de salud mental",
    "Revisión de medicación",
    "Considerar derivación a especialista"
  ];

  return (
    <div className="space-y-6">
      {/* Fila superior: 3 columnas principales */}
      <div className="grid grid-cols-3 gap-4">
        
        {/* Columna 1: Advertencias Médico-Legales */}
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-gray-800">Advertencias Médico-Legales</h3>
          </div>
          <ul className="space-y-2 text-sm">
            {results.redFlags?.map((flag, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-orange-600 mt-0.5">•</span>
                <span>{flag}</span>
              </li>
            ))}
            {medications.filter(m => 
              m.text?.toLowerCase().includes('sin receta') || 
              m.text?.toLowerCase().includes('ketamina')
            ).map((med, i) => (
              <li key={`med-${i}`} className="flex items-start gap-2 text-red-700 font-medium">
                <span className="text-red-600 mt-0.5">•</span>
                <span>{med.text}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 pt-3 border-t border-orange-200 text-xs text-gray-600">
            <p className="font-semibold mb-1">DOCUMENTACIÓN CRÍTICA:</p>
            <ul className="space-y-1">
              <li>✓ Obtener consentimiento informado</li>
              <li>✓ Documentar evaluación completa</li>
              <li>✓ Registrar todos los hallazgos</li>
              <li>✓ Justificar plan de tratamiento</li>
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
                Seleccionar todo
              </button>
              <button 
                onClick={() => handleClearSelection('symptoms')}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
              >
                Limpiar
              </button>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">SÍNTOMAS ACTUALES</p>
              <div className="space-y-1">
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
            
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">HISTORIAL MÉDICO</p>
              <ul className="space-y-1 text-sm">
                {conditions.map((condition, i) => (
                  <li key={i}>• {condition.text}</li>
                ))}
              </ul>
            </div>
            
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">MEDICACIÓN ACTUAL</p>
              <ul className="space-y-1 text-sm">
                {medications.map((med, i) => (
                  <li key={i} className={
                    med.text?.toLowerCase().includes('ketamina') || 
                    med.text?.toLowerCase().includes('sin receta')
                      ? 'text-red-700 font-medium' 
                      : ''
                  }>
                    • {med.text}
                  </li>
                ))}
              </ul>
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
                Seleccionar todo
              </button>
              <button 
                onClick={() => handleClearSelection('physical')}
                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
              >
                Limpiar
              </button>
            </div>
          </div>
          
          <div className="space-y-1">
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
              <p className="text-xs font-semibold text-gray-600 mb-2">DERIVACIONES SUGERIDAS</p>
              <ul className="space-y-1 text-sm text-gray-600">
                {derivations.map((der, i) => (
                  <li key={i}>• {der}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Fila inferior: Factores Psicosociales */}
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
        
        <div className="grid grid-cols-4 gap-3">
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
