import React, { useState } from 'react';
import { Card } from '../shared/ui';
import { AlertTriangle, Activity, ClipboardList, Brain, FileText, Shield } from 'lucide-react';

interface ClinicalAnalysisResultsProps {
  results: any;
  onSelectionChange: (selected: string[]) => void;
  selectedIds: string[];
}

export const ClinicalAnalysisResults: React.FC<ClinicalAnalysisResultsProps> = ({
  results,
  onSelectionChange,
  selectedIds
}) => {
  if (!results || !results.entities) {
    return null;
  }

  // Extraer tests físicos del rawResponse
  const physicalTests = [];
  if (results.rawResponse) {
    console.log('🔍 Extrayendo tests del rawResponse');
    try {
      const rawJson = JSON.parse(results.rawResponse.replace(/```json\n?/g, '').replace(/```/g, ''));
      if (rawJson.evaluaciones_fisicas_sugeridas && Array.isArray(rawJson.evaluaciones_fisicas_sugeridas)) {
        rawJson.evaluaciones_fisicas_sugeridas.forEach((test, index) => {
          physicalTests.push({
            id: `test-${index}`,
            text: typeof test === 'string' ? test : String(test),
            priority: index < 5 ? 'high' : 'normal'
          });
        });
      }
    } catch (e) {
      console.log('Error extrayendo tests:', e);
    }
  }

  // Agrupar entidades por tipo
  const groupedEntities = {
    symptom: results.entities.filter(e => e.type === 'symptom') || [],
    medication: results.entities.filter(e => e.type === 'medication') || [],
    condition: results.entities.filter(e => e.type === 'condition') || [],
    finding: results.entities.filter(e => e.type === 'finding') || [],
    other: results.entities.filter(e => !['symptom', 'medication', 'condition', 'finding'].includes(e.type)) || []
  };

  const toggleSelection = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(i => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  // Solo mostrar red flags si existen
  const hasRedFlags = results.redFlags && results.redFlags.length > 0;

  return (
    <div className="space-y-4">
      
      {/* Red Flags - Solo del backend */}
      {hasRedFlags && (
        <Card className="border-2 border-red-500 bg-red-50 p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h3 className="font-bold text-red-900">Alertas Críticas Detectadas</h3>
          </div>
          <div className="space-y-2">
            {results.redFlags.map((flag, idx) => (
              <div key={idx} className="bg-white p-3 rounded border border-red-300">
                <p className="font-semibold text-red-900">{flag.pattern || flag.description}</p>
                {flag.action && (
                  <p className="text-sm text-red-700 mt-1">Acción: {flag.action}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Grid de 3 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Columna 1: Advertencias (solo si vienen del backend) */}
        <Card className="h-fit">
          <div className="p-4 border-b bg-orange-50">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold">Observaciones</h3>
            </div>
          </div>
          <div className="p-4">
            {results.compliance_issues && results.compliance_issues.length > 0 ? (
              <div className="space-y-2">
                {results.compliance_issues.map((issue, idx) => (
                  <div key={idx} className="text-sm p-2 bg-orange-50 rounded">
                    • {issue.description || issue.text}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">Sin observaciones adicionales del análisis</p>
            )}
            
            {/* Documentación recomendada genérica */}
            <div className="mt-4 pt-3 border-t text-xs text-gray-600">
              <p className="font-semibold mb-1">Recordatorios:</p>
              <ul className="space-y-1">
                <li>✓ Documentar evaluación completa</li>
                <li>✓ Obtener consentimiento informado</li>
                <li>✓ Registrar todos los hallazgos</li>
              </ul>
            </div>
          </div>
        </Card>

        {/* Columna 2: Hallazgos Clínicos */}
        <Card className="h-fit">
          <div className="p-4 border-b bg-blue-50">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">Hallazgos Clínicos</h3>
            </div>
          </div>
          <div className="p-4 space-y-3">
            {/* Síntomas */}
            {groupedEntities.symptom.length > 0 && (
              <div>
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Síntomas Actuales</h4>
                <div className="space-y-1">
                  {groupedEntities.symptom.map((item, idx) => (
                    <label key={`symptom-${idx}`} className="flex items-start gap-2 text-sm cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id || `symptom-${idx}`)}
                        onChange={() => toggleSelection(item.id || `symptom-${idx}`)}
                        className="mt-0.5"
                      />
                      <span>{item.text}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Condiciones/Historia */}
            {groupedEntities.condition.length > 0 && (
              <div className="pt-2 border-t">
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Historial Médico</h4>
                <div className="space-y-1">
                  {groupedEntities.condition.map((item, idx) => (
                    <div key={idx} className="text-sm text-gray-600">
                      • {item.text}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Medicación */}
            {groupedEntities.medication.length > 0 && (
              <div className="pt-2 border-t">
                <h4 className="text-xs font-medium text-gray-500 uppercase mb-2">Medicación Actual</h4>
                <div className="space-y-1">
                  {groupedEntities.medication.map((item, idx) => (
                    <div key={idx} className="text-sm text-gray-600">
                      • {item.text}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Columna 3: Evaluación Física */}
        <Card className="h-fit">
          <div className="p-4 border-b bg-purple-50">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold">Evaluación Física Propuesta</h3>
            </div>
          </div>
          <div className="p-4 space-y-2 max-h-96 overflow-y-auto">
            {physicalTests.length > 0 ? (
              physicalTests.map((test, index) => (
                <label key={test.id} className="flex items-start gap-2 text-sm cursor-pointer p-1 hover:bg-gray-50 rounded">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(test.id)}
                    onChange={() => toggleSelection(test.id)}
                    className="mt-0.5"
                  />
                  <span>{index + 1}. {test.text}</span>
                </label>
              ))
            ) : (
              <p className="text-sm text-gray-500">
                El análisis sugerirá evaluaciones basadas en los hallazgos
              </p>
            )}
          </div>
        </Card>
      </div>

      {/* Factores Psicosociales */}
      {results.yellowFlags && results.yellowFlags.length > 0 && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-yellow-600" />
            <h3 className="font-semibold">Factores Psicosociales y Contexto Humano</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {results.yellowFlags.map((flag, index) => (
              <div key={index} className="p-2 bg-white rounded border border-yellow-300">
                <p className="text-sm">{typeof flag === 'string' ? flag : flag.text || flag.description || ''}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Botón de acción */}
      <div className="flex justify-between items-center pt-4">
        <div className="text-sm text-gray-500">
          {selectedIds.length} elementos seleccionados para evaluación
        </div>
        <button 
          className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          disabled={selectedIds.length === 0}
        >
          Continuar con evaluación física →
        </button>
      </div>
    </div>
  );
};
