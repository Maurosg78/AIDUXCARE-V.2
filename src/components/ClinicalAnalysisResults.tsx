/* @ts-nocheck */
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
  visitType?: 'initial' | 'follow-up'; // WO-07: Para ocultar secciones innecesarias en follow-up
}

export const ClinicalAnalysisResults: React.FC<ClinicalAnalysisResultsProps> = ({
  results,
  selectedIds,
  onSelectionChange,
  visitType = 'initial'
}) => {
  const { editedResults, handleTextChange, addCustomItem } = useEditableResults(results);
  
  // ✅ FASE 1: Sort physical tests by importance and show ONLY top 5 in Phase 1
  // Tests 6+ will appear in sidebar in Phase 2 (EvaluationTab)
  const physicalTests = useMemo(() => {
    // ✅ CRITICAL: Use results.physicalTests (from interactiveResults) which is already limited to top 5
    // NOT results.evaluaciones_fisicas_sugeridas which contains all tests
    const rawTests = editedResults?.physicalTests || [];
    
    console.log('[ClinicalAnalysisResults] Raw physicalTests from editedResults:', {
      count: rawTests.length,
      tests: rawTests.map((t: any) => ({ 
        name: t.name || t.test, 
        originalIndex: t.originalIndex,
        sensitivity: t.sensitivity,
        specificity: t.specificity,
        sensitivityQualitative: t.sensitivityQualitative,
        specificityQualitative: t.specificityQualitative,
        evidence_level: t.evidence_level || t.evidencia
      }))
    });
    
    // ✅ NOTE: interactiveResults.physicalTests is already limited to top 5 in ProfessionalWorkflowPage
    // But we still need to sort them by importance (average score) in case they weren't sorted correctly
    const sorted = sortPhysicalTestsByImportance(rawTests);
    
    // ✅ FASE 1 FIX: Limit to top 5 tests for Phase 1 display
    // Tests 6+ will be available in sidebar during Phase 2 (EvaluationTab)
    const { topTests, remainingTests } = getTopPhysicalTests(sorted, 5);
    
    // ✅ CRITICAL: Ensure we have exactly 5 or fewer tests
    // Use slice to guarantee exactly 5 tests, even if getTopPhysicalTests returns more
    const finalTests = Array.isArray(topTests) ? topTests.slice(0, 5) : [];
    
    // ✅ VALIDATION: Ensure we have exactly 5 or fewer tests
    if (finalTests.length > 5) {
      console.error('[ClinicalAnalysisResults] ❌ ERROR: finalTests has more than 5 tests, forcing to exactly 5');
      finalTests.splice(5); // Force to exactly 5
    }
    
    console.log('[ClinicalAnalysisResults] Limited to top 5:', {
      totalTestsFromEditedResults: rawTests.length,
      topTestsCount: topTests.length,
      finalTestsCount: finalTests.length,
      remainingTestsCount: remainingTests.length,
      topTestsNames: finalTests.map((t: any) => ({ 
        name: t.name || t.test, 
        originalIndex: t.originalIndex,
        avgScore: t.sensitivity && t.specificity ? ((t.sensitivity + t.specificity) / 2).toFixed(2) : 'N/A'
      }))
    });
    
    // ✅ ASSERTION: Final validation before returning
    if (finalTests.length > 5) {
      console.error('[ClinicalAnalysisResults] ❌ CRITICAL ERROR: finalTests still has more than 5 tests after all validations!');
    }
    
    return finalTests;
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
        // ✅ FIX: physicalTests already contains only top 5 (from useMemo above)
        // So we can directly map all physicalTests - they're already the top 5
        idsToSelect = physicalTests.map((test) => {
          if (typeof test === "object" && test.originalIndex !== undefined) {
            return `physical-${test.originalIndex}`;
          }
          // Fallback: find index if originalIndex not available
          const index = physicalTests.findIndex(t => 
            (typeof t === 'string' && typeof test === 'string' && t === test) ||
            (typeof t === 'object' && typeof test === 'object' && t.name === test.name)
          );
          return `physical-${index >= 0 ? index : 0}`;
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
      
      {/* WO-07: Medico-legal Alerts - OCULTO en follow-up (ruido innecesario) */}
      {visitType !== 'follow-up' && (
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
      )}

      {/* WO-07: Conversation Highlights - OCULTO en follow-up (ruido innecesario) */}
      {visitType !== 'follow-up' && (
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
      )}

      {/* WO-07: Recommended Physical Tests - OCULTO en follow-up (ruido innecesario) */}
      {visitType !== 'follow-up' && (
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

              // ✅ FIX: Solo mostrar sensitivity si es un número válido (no NaN, no undefined, no null, no "unknown")
              const sensitivity = test.sensitivity || test.sensibilidad;
              // Bloque 6: Comparación corregida - sensitivity es number, no comparar con "unknown"
              if (sensitivity != null && 
                  typeof sensitivity === 'number' && 
                  !isNaN(sensitivity) && 
                  sensitivity >= 0 && 
                  sensitivity <= 1) {
                evidenceParts.push(`Sensitivity ${Math.round(sensitivity * 100)}%`);
              }
              
              // ✅ FIX: Solo mostrar specificity si es un número válido (no NaN, no undefined, no null, no "unknown")
              const specificity = test.specificity || test.especificidad;
              // Bloque 6: Comparación corregida - specificity es number, no comparar con "unknown"
              if (specificity != null && 
                  typeof specificity === 'number' && 
                  !isNaN(specificity) && 
                  specificity >= 0 && 
                  specificity <= 1) {
                evidenceParts.push(`Specificity ${Math.round(specificity * 100)}%`);
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
      )}

      {/* WO-07: Biopsychosocial Factors - OCULTO en follow-up (ruido innecesario) */}
      {visitType !== 'follow-up' && (
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
      )}
    </div>
  );
};


export default ClinicalAnalysisResults;
