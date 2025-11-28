/* @ts-nocheck */
import React, { useMemo } from 'react';
import { AlertCircle, Heart, Brain, Activity, AlertTriangle } from 'lucide-react';
import { EditableCheckbox } from './EditableCheckbox';
import { AddCustomItemButton } from './AddCustomItemButton';
import { useEditableResults } from '../hooks/useEditableResults';

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
  const { editedResults, handleTextChange, addCustomItem } = useEditableResults(results);
  
  const physicalTests = useMemo(() => 
    editedResults?.physicalTests || [], 
    [editedResults?.physicalTests]
  );

  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(item => item !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  const handleSelectAll = (section: string) => {
    let idsToSelect: string[] = [];
    
    switch(section) {
      case 'alerts':
        const alertIds: string[] = [];
        editedResults?.redFlags?.forEach((_, i) => alertIds.push(`red-${i}`));
        editedResults?.entities?.filter(e => e.type === 'medication')
          .forEach(e => e.id && alertIds.push(e.id));
        idsToSelect = alertIds;
        break;
        
      case 'clinical':
        idsToSelect = editedResults?.entities?.map(e => e.id).filter(Boolean) || [];
        break;
        
      case 'physical':
        // ✅ PHASE 2 FIX: Use originalIndex if available, otherwise fallback to i
        idsToSelect = physicalTests.map((test, i) => {
          if (typeof test === "object" && test.originalIndex !== undefined) {
            return `physical-${test.originalIndex}`;
          }
          return `physical-${i}`;
        });
        break;
        
      case 'psychosocial':
        const psychosocialIds: string[] = [];
        editedResults?.biopsychosocial_occupational?.forEach((_, i) => psychosocialIds.push(`occupational-${i}`));
        editedResults?.biopsychosocial_protective?.forEach((_, i) => psychosocialIds.push(`protective-${i}`));
        editedResults?.biopsychosocial_functional_limitations?.forEach((_, i) => psychosocialIds.push(`functional-${i}`));
        editedResults?.biopsychosocial_psychological?.forEach((_, i) => psychosocialIds.push(`psychological-${i}`));
        editedResults?.biopsychosocial_social?.forEach((_, i) => psychosocialIds.push(`social-${i}`));
        editedResults?.biopsychosocial_patient_strengths?.forEach((_, i) => psychosocialIds.push(`strength-${i}`));
        // Fallback to yellowFlags if no structured factors
        if (psychosocialIds.length === 0) {
          editedResults?.yellowFlags?.forEach((_, i) => psychosocialIds.push(`yellow-${i}`));
        }
        idsToSelect = psychosocialIds;
        break;
    }
    
    const newSelection = [...new Set([...selectedIds, ...idsToSelect])];
    onSelectionChange(newSelection);
  };

  const handleSelectNone = (section: string) => {
    let idsToRemove: string[] = [];
    
    switch(section) {
      case 'alerts':
        idsToRemove = selectedIds.filter(id => 
          id.startsWith('red-') || 
          editedResults?.entities?.find(e => e.id === id && e.type === 'medication')
        );
        break;
        
      case 'clinical':
        idsToRemove = selectedIds.filter(id => 
          editedResults?.entities?.find(e => e.id === id)
        );
        break;
        
      case 'physical':
        // ✅ PHASE 2 FIX: Remove all physical test IDs (they use originalIndex)
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

  const criticalMeds = editedResults.entities?.filter(e => 
    e.type === 'medication' && e.text?.toLowerCase().includes('sin prescri')
  ) || [];

  return (
    <div className="flex flex-col gap-4">
      
      {/* Row 1: Medico-legal Alerts */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-500">
              <AlertCircle className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Medico-legal Alerts</h3>
              <p className="text-xs text-slate-500">Document high-risk findings and compliance notes.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleSelectAll('alerts')}
              className="px-3 py-1 text-xs rounded-lg bg-gradient-to-r from-[#e6ddff] to-[#d7ecff] text-slate-700 border border-transparent hover:shadow-sm"
            >
              Select all
            </button>
            <button
              onClick={() => handleSelectNone('alerts')}
              className="px-3 py-1 text-xs rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {criticalMeds.map((med) => (
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
          
          {editedResults.redFlags?.map((flag, i) => (
            <EditableCheckbox
              key={`red-${i}`}
              id={`red-${i}`}
              text={flag}
              checked={selectedIds.includes(`red-${i}`)}
              onToggle={handleToggle}
              onTextChange={handleTextChange}
              className="p-2 border border-slate-200 rounded-lg"
            />
          ))}
        </div>
        
        <div className="mt-3">
          <AddCustomItemButton
            onAdd={(text) => addCustomItem('redFlags', text)}
            placeholder="Add medico-legal alert..."
          />
        </div>
      </div>

      {/* Row 2: Conversation Highlights */}
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
              {editedResults.entities?.filter(e => e.type === 'symptom').map((entity) => (
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
              {editedResults.entities?.filter(e => e.type === 'medication' && !e.text?.toLowerCase().includes('sin prescri'))
                .map((entity) => (
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

      {/* Row 3: Recommended Physical Tests */}
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
          {physicalTests.map((test, i) => {
            const label =
              typeof test === "string" ? test : test.name || test.test || "Physical test";

            // ✅ PHASE 2 FIX: Use originalIndex if available, otherwise fallback to i
            const testIndex = (typeof test === "object" && test.originalIndex !== undefined) 
              ? test.originalIndex 
              : i;
            const testId = `physical-${testIndex}`;

            let evidenceDetail = "";
            if (typeof test === "object") {
              const evidenceParts: string[] = [];

              if (test.sensitivity != null) {
                evidenceParts.push(`Sensitivity ${Math.round(test.sensitivity * 100)}%`);
              }
              if (test.specificity != null) {
                evidenceParts.push(`Specificity ${Math.round(test.specificity * 100)}%`);
              }
              if (test.evidencia || test.evidence || test.evidence_level) {
                const level = test.evidencia || test.evidence || test.evidence_level;
                evidenceParts.push(`Evidence level: ${String(level)}`);
              }
              if (test.justificacion || test.justification) {
                evidenceParts.push(test.justificacion || test.justification);
              }

              evidenceDetail = evidenceParts.length > 0 ? ` (${evidenceParts.join(" · ")})` : "";
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

      {/* Row 4: Biopsychosocial Factors */}
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
          {/* Occupational factors */}
          {editedResults.biopsychosocial_occupational?.map((factor, i) => (
            <EditableCheckbox
              key={`occupational-${i}`}
              id={`occupational-${i}`}
              text={factor}
              checked={selectedIds.includes(`occupational-${i}`)}
              onToggle={handleToggle}
              onTextChange={handleTextChange}
            />
          ))}
          
          {/* Protective factors */}
          {editedResults.biopsychosocial_protective?.map((factor, i) => (
            <EditableCheckbox
              key={`protective-${i}`}
              id={`protective-${i}`}
              text={factor}
              checked={selectedIds.includes(`protective-${i}`)}
              onToggle={handleToggle}
              onTextChange={handleTextChange}
            />
          ))}
          
          {/* Functional limitations */}
          {editedResults.biopsychosocial_functional_limitations?.map((factor, i) => (
            <EditableCheckbox
              key={`functional-${i}`}
              id={`functional-${i}`}
              text={factor}
              checked={selectedIds.includes(`functional-${i}`)}
              onToggle={handleToggle}
              onTextChange={handleTextChange}
            />
          ))}
          
          {/* Psychological factors */}
          {editedResults.biopsychosocial_psychological?.map((factor, i) => (
            <EditableCheckbox
              key={`psychological-${i}`}
              id={`psychological-${i}`}
              text={factor}
              checked={selectedIds.includes(`psychological-${i}`)}
              onToggle={handleToggle}
              onTextChange={handleTextChange}
            />
          ))}
          
          {/* Social factors */}
          {editedResults.biopsychosocial_social?.map((factor, i) => (
            <EditableCheckbox
              key={`social-${i}`}
              id={`social-${i}`}
              text={factor}
              checked={selectedIds.includes(`social-${i}`)}
              onToggle={handleToggle}
              onTextChange={handleTextChange}
            />
          ))}
          
          {/* Patient strengths */}
          {editedResults.biopsychosocial_patient_strengths?.map((factor, i) => (
            <EditableCheckbox
              key={`strength-${i}`}
              id={`strength-${i}`}
              text={factor}
              checked={selectedIds.includes(`strength-${i}`)}
              onToggle={handleToggle}
              onTextChange={handleTextChange}
            />
          ))}
          
          {/* Fallback: yellow flags (for backward compatibility) */}
          {(!editedResults.biopsychosocial_occupational?.length && 
            !editedResults.biopsychosocial_protective?.length && 
            !editedResults.biopsychosocial_functional_limitations?.length &&
            !editedResults.biopsychosocial_psychological?.length &&
            !editedResults.biopsychosocial_social?.length &&
            !editedResults.biopsychosocial_patient_strengths?.length) &&
            editedResults.yellowFlags?.map((flag, i) => (
              <EditableCheckbox
                key={`yellow-${i}`}
                id={`yellow-${i}`}
                text={flag}
                checked={selectedIds.includes(`yellow-${i}`)}
                onToggle={handleToggle}
                onTextChange={handleTextChange}
              />
            ))
          }
        </div>
        
        <div className="mt-3">
          <AddCustomItemButton
            onAdd={(text) => {
              // Add to functional_limitations by default, but could be made smarter
              addCustomItem('biopsychosocial_functional_limitations', text);
            }}
            placeholder="Add biopsychosocial factor..."
          />
        </div>
      </div>
    </div>
  );
};


export default ClinicalAnalysisResults;
