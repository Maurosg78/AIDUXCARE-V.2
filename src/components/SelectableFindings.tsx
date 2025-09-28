// @ts-nocheck
import { useState, useEffect } from 'react';

import { Card } from '../shared/ui';
import type { ClinicalEntity, PhysicalExamResult } from '../types/vertex-ai';

interface SelectableFindingsProps {
  findings: ClinicalEntity[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onExamResultsChange: (results: PhysicalExamResult[]) => void;
}

export const SelectableFindings: React.FC<SelectableFindingsProps> = ({
  findings,
  selectedIds: externalSelectedIds,
  onSelectionChange,
  onExamResultsChange
}) => {
  const [localSelectedIds, setLocalSelectedIds] = useState<Set<string>>(
    new Set(externalSelectedIds)
  );

  useEffect(() => {
    setLocalSelectedIds(new Set(externalSelectedIds));
  }, [externalSelectedIds]);

  // Categorizar entidades por tipo y emoji
  const categorizeFindings = () => {
    const categorized = {
      symptoms: [] as ClinicalEntity[],
      conditions: [] as ClinicalEntity[],
      medications: [] as ClinicalEntity[],
      tests: [] as ClinicalEntity[],
      warnings: [] as ClinicalEntity[],
      history: [] as ClinicalEntity[],
      other: [] as ClinicalEntity[]
    };

    findings.forEach(entity => {
      const text = entity.text;
      
      // Categorizar por emojis o contenido
      if (text.includes('⚠️') || text.includes('Síntoma')) {
        categorized.symptoms.push(entity);
      } else if (text.includes('🏥') || text.includes('Condición') || text.includes('Diagnóstico')) {
        categorized.conditions.push(entity);
      } else if (text.includes('💊') || text.includes('Medicamento')) {
        categorized.medications.push(entity);
      } else if (text.includes('📋') || text.includes('Test') || text.includes('Evaluación')) {
        categorized.tests.push(entity);
      } else if (text.includes('🟡') || text.includes('Yellow')) {
        categorized.warnings.push(entity);
      } else if (text.includes('📅') || text.includes('Historia')) {
        categorized.history.push(entity);
      } else {
        categorized.other.push(entity);
      }
    });

    return categorized;
  };

  const categorized = categorizeFindings();

  const handleToggle = (id: string) => {
    const newSelected = new Set(localSelectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setLocalSelectedIds(newSelected);
    onSelectionChange(Array.from(newSelected));
  };

  const renderCheckbox = (entity: ClinicalEntity) => (
    <label key={entity.id} className="flex items-start gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
      <input
        type="checkbox"
        checked={localSelectedIds.has(entity.id)}
        onChange={() => handleToggle(entity.id)}
        className="mt-1 cursor-pointer"
      />
      <span className="text-xs">{entity.text.replace("⚠️", "").replace("��", "").replace("💊", "").replace("📋", "").replace("🟡", "").replace("📅", "").trim()}</span>
    </label>
  );

  return (
    <div className="space-y-3">
      {/* Columna 1: Hallazgos Clínicos */}
      <Card className="w-full p-3 bg-green-50 border-green-200">
        <h3 className="font-semibold mb-2 text-green-700 text-sm">
          🩺 Hallazgos Clínicos
        </h3>
        
        {categorized.symptoms.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-medium text-gray-600 mb-1">Síntomas:</h4>
            <div className="grid grid-cols-2 gap-2">
              {categorized.symptoms.map(renderCheckbox)}
            </div>
          </div>
        )}

        {categorized.conditions.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-medium text-gray-600 mb-1">{categorized.conditions.some(c => c.text.toLowerCase().includes("cáncer") || c.text.toLowerCase().includes("metástasis")) ? "🚨 Diagnósticos CRÍTICOS:" : "Diagnósticos:"}</h4>
            <div className="grid grid-cols-2 gap-2">
              {categorized.conditions.map(renderCheckbox)}
            </div>
          </div>
        )}

        {categorized.medications.length > 0 && (
          <div className="mb-3">
            <h4 className="text-xs font-medium text-gray-600 mb-1">Medicación:</h4>
            <div className="grid grid-cols-2 gap-2">
              {categorized.medications.map(renderCheckbox)}
            </div>
          </div>
        )}

        {categorized.history.length > 0 && (
          <div className="border-t pt-2 mt-2">
            <h4 className="text-xs font-medium text-gray-500 mb-1">Historia:</h4>
            {categorized.history.map(e => (
              <p key={e.id} className="text-xs text-gray-500">• {e.text}</p>
            ))}
          </div>
        )}
      </Card>

      {/* Columna 2: Advertencias y Banderas */}
      <Card className="w-full p-3 bg-yellow-50 border-yellow-200">
        <h3 className="font-semibold mb-2 text-yellow-700 text-sm">
          ⚡ Advertencias
        </h3>
        
        {categorized.warnings.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {categorized.warnings.map(renderCheckbox)}
          </div>
        ) : (
          <p className="text-xs text-gray-500">No se detectaron advertencias</p>
        )}

        {categorized.other.length > 0 && (
          <div className="mt-3 pt-2 border-t">
            <h4 className="text-xs font-medium text-gray-600 mb-1">Otros hallazgos:</h4>
            <div className="grid grid-cols-2 gap-2">
              {categorized.other.map(renderCheckbox)}
            </div>
          </div>
        )}
      </Card>

      {/* Columna 3: Evaluación Física Propuesta */}
      <Card className="w-full p-3 bg-blue-50 border-blue-200">
        <h3 className="font-semibold mb-2 text-blue-700 text-sm">
          📋 Evaluación Propuesta
        </h3>
        
        {categorized.tests.length > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {categorized.tests.map(renderCheckbox)}
          </div>
        ) : (
          <p className="text-xs text-gray-500">No se sugieren tests específicos</p>
        )}

        <div className="mt-3 p-2 bg-blue-100 rounded text-xs">
          <p className="font-medium text-blue-800 mb-1">Selecciona los tests a realizar:</p>
          <p className="text-blue-600">Los resultados se documentarán en el SOAP</p>
        </div>
      </Card>
    </div>
  );
};