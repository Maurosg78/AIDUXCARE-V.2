import { useState } from 'react';
import { Card } from '../shared/ui';
import type { ClinicalAnalysisResponse, PhysicalExamResult } from '../types/vertex-ai';

interface SelectableFindingsProps {
  findings: ClinicalAnalysisResponse;
  onSelectionChange: (selectedIds: string[]) => void;
  onExamResultsChange: (results: PhysicalExamResult[]) => void;
}

export const SelectableFindings: React.FC<SelectableFindingsProps> = ({
  findings,
  onSelectionChange,
  onExamResultsChange
}) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Separar entidades por tipo
  const symptoms = findings.entities.filter(e => e.type === 'symptom');
  const history = findings.entities.filter(e => e.type === 'history');
  const medications = findings.entities.filter(e => e.type === 'medication');
  const warnings = findings.entities.filter(e => e.type === 'other' && e.text.startsWith('⚠️'));
  const tests = findings.entities.filter(e => e.type === 'other' && e.text.startsWith('📋'));
  
  const handleToggle = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
    onSelectionChange(Array.from(newSelected));
  };
  
  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Columna 1: Síntomas Actuales y Antecedentes */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 text-green-700">✓ Hallazgos Clínicos</h3>
        
        {symptoms.length > 0 && (
          <>
            <h4 className="text-sm font-medium text-gray-600 mb-2">Síntomas Actuales:</h4>
            <div className="space-y-2 mb-4">
              {symptoms.map((entity) => (
                <label key={entity.id} className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.has(entity.id)}
                    onChange={() => handleToggle(entity.id)}
                    className="mt-1"
                  />
                  <span className="text-sm">{entity.text}</span>
                </label>
              ))}
            </div>
          </>
        )}
        
        {(history.length > 0 || medications.length > 0) && (
          <div className="border-t pt-3 mt-3">
            <h4 className="text-sm font-medium text-gray-500 mb-2">Información de contexto (no seleccionable):</h4>
            {history.map((entity) => (
              <p key={entity.id} className="text-xs text-gray-500 mb-1">• {entity.text}</p>
            ))}
            {medications.map((entity) => (
              <p key={entity.id} className="text-xs text-gray-500 mb-1">💊 {entity.text}</p>
            ))}
          </div>
        )}
        
        {symptoms.length === 0 && (
          <p className="text-sm text-gray-500">No se detectaron síntomas actuales</p>
        )}
      </Card>
      
      {/* Columna 2: Advertencias */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 text-yellow-700">⚠ Advertencias</h3>
        {warnings.length > 0 ? (
          <div className="space-y-2">
            {warnings.map((entity) => (
              <label key={entity.id} className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.has(entity.id)}
                  onChange={() => handleToggle(entity.id)}
                  className="mt-1"
                />
                <span className="text-sm">{entity.text.replace('⚠️ ', '')}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No se detectaron advertencias</p>
        )}
      </Card>
      
      {/* Columna 3: Evaluación Física Propuesta */}
      <Card className="p-4">
        <h3 className="font-semibold mb-3 text-blue-700">📋 Evaluación Física Propuesta</h3>
        {tests.length > 0 ? (
          <div className="space-y-2">
            {tests.map((entity) => (
              <label key={entity.id} className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.has(entity.id)}
                  onChange={() => handleToggle(entity.id)}
                  className="mt-1"
                />
                <span className="text-sm">{entity.text.replace('📋 ', '')}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No hay tests sugeridos</p>
        )}
      </Card>
    </div>
  );
};
