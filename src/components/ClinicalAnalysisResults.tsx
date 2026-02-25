import React, { useMemo } from 'react';
import { AlertCircle, Heart, Brain, Activity, AlertTriangle } from 'lucide-react';
import { EditableCheckbox } from './EditableCheckbox';
import { AddCustomItemButton } from './AddCustomItemButton';
import { useEditableResults } from '../hooks/useEditableResults';
import { sortPhysicalTestsByImportance, getTopPhysicalTests } from '../utils/sortPhysicalTestsByImportance';

interface ClinicalAnalysisResultsProps {
  results: any;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  visitType?: 'initial' | 'follow-up';
  /** WO-BUG-009: Resumen de solo lectura; red flags decididos en AnalysisTab */
  selectedRedFlagIds?: string[];
  redFlagsDetected?: Array<{ id: string; description: string; severity?: string }>;
}

export const ClinicalAnalysisResults: React.FC<ClinicalAnalysisResultsProps> = ({
  results,
  selectedIds,
  onSelectionChange,
  visitType = 'initial',
  selectedRedFlagIds,
  redFlagsDetected = [],
}) => {
  const { editedResults, handleTextChange, addCustomItem } = useEditableResults(results);

  const physicalTests = useMemo(() => {
    const rawTests = editedResults?.physicalTests || [];
    const sorted = sortPhysicalTestsByImportance(rawTests);
    const { topTests } = getTopPhysicalTests(sorted, 5);
    return Array.isArray(topTests) ? topTests.slice(0, 5) : [];
  }, [editedResults?.physicalTests]);

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(item => item !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = (section: string) => {
    let idsToSelect: string[] = [];

    switch (section) {
      case 'alerts':
        idsToSelect = editedResults?.entities?.filter((e: any) => e.type === 'medication').map((e: any) => e.id).filter(Boolean) || [];
        break;
      case 'clinical':
        idsToSelect = editedResults?.entities?.map((e: any) => e.id).filter(Boolean) || [];
        break;
      case 'physical':
        idsToSelect = physicalTests.map((test: any) => {
          if (typeof test === 'object' && test.originalIndex !== undefined) {
            return `physical-${test.originalIndex}`;
          }
          const index = physicalTests.findIndex((t: any) =>
            (typeof t === 'string' && typeof test === 'string' && t === test) ||
            (typeof t === 'object' && typeof test === 'object' && t.name === test.name)
          );
          return `physical-${index >= 0 ? index : 0}`;
        });
        break;
      case 'psychosocial':
        const psychosocialIds: string[] = [];
        editedResults?.biopsychosocial_occupational?.forEach((_: any, i: number) => psychosocialIds.push(`occupational-${i}`));
        editedResults?.biopsychosocial_protective?.forEach((_: any, i: number) => psychosocialIds.push(`protective-${i}`));
        editedResults?.biopsychosocial_functional_limitations?.forEach((_: any, i: number) => psychosocialIds.push(`functional-${i}`));
        editedResults?.biopsychosocial_psychological?.forEach((_: any, i: number) => psychosocialIds.push(`psychological-${i}`));
        editedResults?.biopsychosocial_social?.forEach((_: any, i: number) => psychosocialIds.push(`social-${i}`));
        editedResults?.biopsychosocial_patient_strengths?.forEach((_: any, i: number) => psychosocialIds.push(`strength-${i}`));
        if (psychosocialIds.length === 0) {
          editedResults?.yellowFlags?.forEach((_: any, i: number) => psychosocialIds.push(`yellow-${i}`));
        }
        idsToSelect = psychosocialIds;
        break;
    }

    const newSelection = [...new Set([...selectedIds, ...idsToSelect])];
    onSelectionChange(newSelection);
  };

  const handleSelectNone = (section: string) => {
    let idsToRemove: string[] = [];

    switch (section) {
      case 'alerts':
        idsToRemove = selectedIds.filter(id =>
          editedResults?.entities?.find((e: any) => e.id === id && e.type === 'medication')
        );
        break;
      case 'clinical':
        idsToRemove = selectedIds.filter(id =>
          editedResults?.entities?.find((e: any) => e.id === id)
        );
        break;
      case 'physical':
        idsToRemove = selectedIds.filter(id => id.startsWith('physical-'));
        break;
      case 'psychosocial':
        idsToRemove = selectedIds.filter(id =>
          id.startsWith('occupational-') ||
          id.startsWith('protective-') ||
          id.startsWith('functional-') ||
          id.startsWith('psychological-') ||
          id.startsWith('social-') ||
          id.startsWith('strength-') ||
          id.startsWith('yellow-')
        );
        break;
    }

    onSelectionChange(selectedIds.filter(id => !idsToRemove.includes(id)));
  };

  if (!editedResults) return null;

  // Follow-up: mostrar mensaje simple, sin secciones de análisis
  if (visitType === 'follow-up') {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-sm text-slate-600">
        Generate your SOAP note in the Documentation section below. Follow-up uses baseline, treatments, and clinical notes only — no separate analysis sections.
      </div>
    );
  }

  // A partir de aquí visitType === 'initial' — no necesitamos verificar de nuevo
  const criticalMeds = editedResults.entities?.filter((e: any) =>
    e.type === 'medication' && e.text?.toLowerCase().includes('sin prescri')
  ) || [];

  return (
    <div className="flex flex-col gap-4">

      {/* WO-BUG-009: Medico-legal Summary */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-500">
            <AlertCircle className="w-4 h-4" />
          </span>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Medico-legal Summary</h3>
            <p className="text-xs text-slate-500">Compliance notes and red flags selected in the analysis step.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {criticalMeds.map((med: any) => (
            <EditableCheckbox
              key={med.id}
              id={med.id}
              text={`⚠️ ${med.text}`}
              checked={selectedIds.includes(med.id)}
              onToggle={handleToggle}
              onTextChange={handleTextChange}
              className="p-2 bg-slate-50 border border-rose-200 rounded-lg"
            />
          ))}
        </div>

        {selectedRedFlagIds != null && selectedRedFlagIds.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-slate-600">
              {selectedRedFlagIds.length === 1
                ? '1 red flag selected in the analysis step above.'
                : `${selectedRedFlagIds.length} red flags selected in the analysis step above.`}
            </p>
          </div>
        )}
      </div>

      {/* Conversation Highlights */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-100 text-sky-500">
              <Heart className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Conversation Highlights</h3>
              <p className="text-xs text-slate-500">Capture chief complaint, key findings, and medication.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleSelectAll('clinical')}
              className="px-3 py-1 text-xs rounded-lg bg-gradient-to-r from-[#e6ddff] to-[#d7ecff] text-slate-700 border border-transparent hover:shadow-sm"
            >
              Select all
            </button>
            <button
              onClick={() => handleSelectNone('clinical')}
              className="px-3 py-1 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <h4 className="font-medium text-sm text-slate-700 mb-2">Chief complaint & key findings</h4>
            <div className="space-y-1">
              {editedResults.entities?.filter((e: any) => e.type === 'symptom').map((entity: any) => (
                <EditableCheckbox
                  key={entity.id}
                  id={entity.id}
                  text={entity.text}
                  checked={selectedIds.includes(entity.id)}
                  onToggle={handleToggle}
                  onTextChange={handleTextChange}
                />
              ))}
            </div>
            <div className="mt-2">
              <AddCustomItemButton
                onAdd={(text) => addCustomItem('symptoms', text)}
                placeholder="Add clinical highlight..."
              />
            </div>
          </div>

          <div>
            <h4 className="font-medium text-sm text-slate-700 mb-2">Current medication</h4>
            <div className="space-y-1">
              {editedResults.entities?.filter((e: any) => e.type === 'medication' && !e.text?.toLowerCase().includes('sin prescri'))
                .map((entity: any) => (
                  <EditableCheckbox
                    key={entity.id}
                    id={entity.id}
                    text={entity.text}
                    checked={selectedIds.includes(entity.id)}
                    onToggle={handleToggle}
                    onTextChange={handleTextChange}
                  />
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recommended Physical Tests */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-100 text-violet-500">
              <Activity className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Recommended Physical Tests</h3>
              <p className="text-xs text-slate-500">Select the assessments you plan to run in the evaluation tab.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleSelectAll('physical')}
              className="px-3 py-1 text-xs rounded-lg bg-gradient-to-r from-[#e6ddff] to-[#d7ecff] text-slate-700 border border-transparent hover:shadow-sm"
            >
              Select all
            </button>
            <button
              onClick={() => handleSelectNone('physical')}
              className="px-3 py-1 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {physicalTests.map((test: any, i: number) => {
            const label = typeof test === 'string' ? test : test.name || test.test || 'Physical test';
            const testIndex = (typeof test === 'object' && test.originalIndex !== undefined) ? test.originalIndex : i;
            const testId = `physical-${testIndex}`;

            let evidenceDetail = '';
            if (typeof test === 'object') {
              const evidenceParts: string[] = [];
              const sensitivity = test.sensitivity || test.sensibilidad;
              if (sensitivity != null && typeof sensitivity === 'number' && !isNaN(sensitivity) && sensitivity >= 0 && sensitivity <= 1) {
                evidenceParts.push(`Sensitivity ${Math.round(sensitivity * 100)}%`);
              }
              const specificity = test.specificity || test.especificidad;
              if (specificity != null && typeof specificity === 'number' && !isNaN(specificity) && specificity >= 0 && specificity <= 1) {
                evidenceParts.push(`Specificity ${Math.round(specificity * 100)}%`);
              }
              if (test.evidencia || test.evidence || test.evidence_level) {
                evidenceParts.push(`Evidence level: ${String(test.evidencia || test.evidence || test.evidence_level)}`);
              }
              if (test.justificacion || test.justification) {
                evidenceParts.push(test.justificacion || test.justification);
              }
              evidenceDetail = evidenceParts.length > 0 ? ` (${evidenceParts.join(' · ')})` : '';
            }

            return (
              <EditableCheckbox
                key={testId}
                id={testId}
                text={`${i + 1}. ${label}${evidenceDetail}`}
                checked={selectedIds.includes(testId)}
                onToggle={handleToggle}
                onTextChange={handleTextChange}
              />
            );
          })}
        </div>

        <div className="mt-3">
          <AddCustomItemButton
            onAdd={(text) => addCustomItem('physical', text)}
            placeholder="Add custom physical test..."
          />
        </div>
      </div>

      {/* Biopsychosocial Factors */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-500">
              <AlertTriangle className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Biopsychosocial Factors</h3>
              <p className="text-xs text-slate-500">Track psychosocial, occupational, and protective elements.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleSelectAll('psychosocial')}
              className="px-3 py-1 text-xs rounded-lg bg-gradient-to-r from-[#e6ddff] to-[#d7ecff] text-slate-700 border border-transparent hover:shadow-sm"
            >
              Select all
            </button>
            <button
              onClick={() => handleSelectNone('psychosocial')}
              className="px-3 py-1 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {editedResults.biopsychosocial_occupational?.map((factor: string, i: number) => (
            <EditableCheckbox key={`occupational-${i}`} id={`occupational-${i}`} text={factor}
              checked={selectedIds.includes(`occupational-${i}`)} onToggle={handleToggle} onTextChange={handleTextChange} />
          ))}
          {editedResults.biopsychosocial_protective?.map((factor: string, i: number) => (
            <EditableCheckbox key={`protective-${i}`} id={`protective-${i}`} text={factor}
              checked={selectedIds.includes(`protective-${i}`)} onToggle={handleToggle} onTextChange={handleTextChange} />
          ))}
          {editedResults.biopsychosocial_functional_limitations?.map((factor: string, i: number) => (
            <EditableCheckbox key={`functional-${i}`} id={`functional-${i}`} text={factor}
              checked={selectedIds.includes(`functional-${i}`)} onToggle={handleToggle} onTextChange={handleTextChange} />
          ))}
          {editedResults.biopsychosocial_psychological?.map((factor: string, i: number) => (
            <EditableCheckbox key={`psychological-${i}`} id={`psychological-${i}`} text={factor}
              checked={selectedIds.includes(`psychological-${i}`)} onToggle={handleToggle} onTextChange={handleTextChange} />
          ))}
          {editedResults.biopsychosocial_social?.map((factor: string, i: number) => (
            <EditableCheckbox key={`social-${i}`} id={`social-${i}`} text={factor}
              checked={selectedIds.includes(`social-${i}`)} onToggle={handleToggle} onTextChange={handleTextChange} />
          ))}
          {editedResults.biopsychosocial_patient_strengths?.map((factor: string, i: number) => (
            <EditableCheckbox key={`strength-${i}`} id={`strength-${i}`} text={factor}
              checked={selectedIds.includes(`strength-${i}`)} onToggle={handleToggle} onTextChange={handleTextChange} />
          ))}

          {/* Fallback yellowFlags */}
          {(!editedResults.biopsychosocial_occupational?.length &&
            !editedResults.biopsychosocial_protective?.length &&
            !editedResults.biopsychosocial_functional_limitations?.length &&
            !editedResults.biopsychosocial_psychological?.length &&
            !editedResults.biopsychosocial_social?.length &&
            !editedResults.biopsychosocial_patient_strengths?.length) &&
            editedResults.yellowFlags?.map((flag: string, i: number) => (
              <EditableCheckbox key={`yellow-${i}`} id={`yellow-${i}`} text={flag}
                checked={selectedIds.includes(`yellow-${i}`)} onToggle={handleToggle} onTextChange={handleTextChange} />
            ))
          }
        </div>

        <div className="mt-3">
          <AddCustomItemButton
            onAdd={(text) => addCustomItem('biopsychosocial_functional_limitations', text)}
            placeholder="Add biopsychosocial factor..."
          />
        </div>
      </div>

    </div>
  );
};

export default ClinicalAnalysisResults;