/**
 * EvaluationTab Component
 * 
 * Extracted from ProfessionalWorkflowPage for better code organization.
 * Handles physical evaluation test selection and documentation.
 * 
 * @compliance PHIPA compliant, ISO 27001 auditable
 */

import React from 'react';
import { Stethoscope, Loader2, FileText } from 'lucide-react';
import type { MSKRegion, MskTestDefinition, TestFieldDefinition } from '../../../core/msk-tests/library/mskTestLibrary';
import { MSK_TEST_LIBRARY, regions, regionLabels, getTestDefinition, hasFieldDefinitions } from '../../../core/msk-tests/library/mskTestLibrary';
import type { WorkflowRoute } from '../../../services/workflowRouterService';

type EvaluationResult = "normal" | "positive" | "negative" | "inconclusive";

type EvaluationTestEntry = {
  id: string;
  name: string;
  region: MSKRegion | null;
  source: "ai" | "manual" | "custom";
  description?: string;
  result: EvaluationResult;
  notes: string;
  values?: Record<string, number | string | boolean | null>;
  _prefillDefaults?: Record<string, number | null>;
};

const RESULT_LABELS: Record<EvaluationResult, string> = {
  normal: "Normal",
  positive: "Positive",
  negative: "Negative",
  inconclusive: "Inconclusive",
};

const RESULT_OPTIONS: EvaluationResult[] = ["normal", "positive", "negative", "inconclusive"];

// Render field input based on field kind
const renderFieldInput = (
  field: TestFieldDefinition,
  value: number | string | boolean | null,
  onChange: (newValue: number | string | boolean | null) => void,
  entry?: EvaluationTestEntry,
  updateTest?: (id: string, updates: Partial<EvaluationTestEntry>) => void
) => {
  switch (field.kind) {
    case 'angle_bilateral':
    case 'angle_unilateral':
      return (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-700">
            {field.label}
            {field.unit === 'deg' && !field.label.includes('°') && !field.label.includes('deg') && ' (°)'}
            {field.unit === 'kg' && !field.label.includes('(kg)') && !field.label.includes('kg)') && ' (kg)'}
          </label>
          <input
            type="number"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
            value={typeof value === 'number' ? value : ''}
            onChange={(e) => {
              const newValue = e.target.value === '' ? null : Number(e.target.value);
              onChange(newValue);
              
              if (entry && entry._prefillDefaults && updateTest && 
                  entry._prefillDefaults[field.id] !== null && 
                  entry._prefillDefaults[field.id] !== undefined) {
                const prefillValue = entry._prefillDefaults[field.id];
                if (newValue !== null && newValue !== prefillValue) {
                  const updatedPrefills = { ...entry._prefillDefaults };
                  updatedPrefills[field.id] = null;
                  updateTest(entry.id, { 
                    result: "positive",
                    _prefillDefaults: updatedPrefills
                  });
                }
              }
            }}
          />
          {field.normalRange && (
            <p className="text-[11px] text-slate-500">
              Normal: {field.normalRange.min}–{field.normalRange.max} {field.unit === 'deg' ? '°' : field.unit === 'kg' ? 'kg' : ''}
            </p>
          )}
        </div>
      );
    case 'yes_no':
      return (
        <label className="inline-flex items-center gap-2 text-xs text-slate-700">
          <input
            type="checkbox"
            checked={value === true}
            onChange={(e) => onChange(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-slate-300 text-primary-blue focus:ring-primary-blue"
          />
          {field.label}
        </label>
      );
    case 'score_0_10':
      return (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-700">
            {field.label} (0–10)
          </label>
          <input
            type="number"
            min={0}
            max={10}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
            value={typeof value === 'number' ? value : ''}
            onChange={(e) =>
              onChange(e.target.value === '' ? null : Number(e.target.value))
            }
          />
        </div>
      );
    case 'text':
    default:
      return (
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-slate-700">
            {field.label}
          </label>
          <textarea
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
            rows={2}
            placeholder={field.notesPlaceholder}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      );
  }
};

export interface EvaluationTabProps {
  // Test management
  filteredEvaluationTests: EvaluationTestEntry[];
  evaluationTests: EvaluationTestEntry[];
  completedCount: number;
  detectedCaseRegion: MSKRegion | null;
  
  // AI suggestions
  pendingAiSuggestions: Array<{
    key: number;
    rawName: string;
    match?: MskTestDefinition | null;
  }>;
  
  // Test library
  isTestAlreadySelected: (id: string, name: string) => boolean;
  addEvaluationTest: (entry: EvaluationTestEntry) => void;
  removeEvaluationTest: (id: string) => void;
  updateEvaluationTest: (id: string, updates: Partial<EvaluationTestEntry>) => void;
  createEntryFromLibrary: (test: MskTestDefinition, source: "ai" | "manual" | "custom") => EvaluationTestEntry;
  createCustomEntry: (name: string, source: "ai" | "manual" | "custom") => EvaluationTestEntry;
  
  // Custom test form
  customTestName: string;
  customTestRegion: MSKRegion | "other";
  customTestResult: EvaluationResult | "";
  customTestNotes: string;
  isCustomFormOpen: boolean;
  setCustomTestName: (name: string) => void;
  setCustomTestRegion: (region: MSKRegion | "other") => void;
  setCustomTestResult: (result: EvaluationResult | "") => void;
  setCustomTestNotes: (notes: string) => void;
  setIsCustomFormOpen: (open: boolean) => void;
  resetCustomForm: () => void;
  handleAddCustomTest: () => void;
  handleLibrarySelect: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  
  // SOAP generation
  handleGenerateSoap: () => Promise<void>;
  isGeneratingSOAP: boolean;
  
  // Workflow
  sessionTypeFromUrl: 'initial' | 'followup' | 'wsib' | 'mva' | 'certificate' | null;
  workflowRoute: WorkflowRoute | null;
}

export const EvaluationTab: React.FC<EvaluationTabProps> = ({
  filteredEvaluationTests,
  evaluationTests,
  completedCount,
  detectedCaseRegion,
  pendingAiSuggestions,
  isTestAlreadySelected,
  addEvaluationTest,
  removeEvaluationTest,
  updateEvaluationTest,
  createEntryFromLibrary,
  createCustomEntry,
  customTestName,
  customTestRegion,
  customTestResult,
  customTestNotes,
  isCustomFormOpen,
  setCustomTestName,
  setCustomTestRegion,
  setCustomTestResult,
  setCustomTestNotes,
  setIsCustomFormOpen,
  resetCustomForm,
  handleAddCustomTest,
  handleLibrarySelect,
  handleGenerateSoap,
  isGeneratingSOAP,
  sessionTypeFromUrl,
  workflowRoute,
}) => {
  const totalTests = filteredEvaluationTests.length;
  const progressPercent = totalTests === 0 ? 0 : Math.round((completedCount / totalTests) * 100);

  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Stethoscope className="w-6 h-6 text-emerald-600" />
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Physical Evaluation</h2>
          <p className="text-sm text-slate-500">
            Select the tests you performed and record the outcome. These findings feed the SOAP draft.
          </p>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          {/* ✅ WORKFLOW OPTIMIZATION: Hide AI-suggested tests for follow-up visits */}
          {pendingAiSuggestions.length > 0 && !(sessionTypeFromUrl === 'followup' || workflowRoute?.type === 'follow-up') && (
            <section className="rounded-3xl border border-slate-200 bg-white px-4 py-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800">Suggested Tests (AI)</h3>
              <p className="mt-1 text-xs text-slate-500">
                Matches from Vertex analysis. Click to add to your evaluation.
              </p>
              <div className="mt-3 space-y-2">
                {pendingAiSuggestions.map((item) => {
                  const matched = item.match;
                  const displayName = matched ? matched.name : item.rawName;
                  return (
                    <div
                      key={`ai-${item.key}`}
                      className="flex items-start justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
                    >
                      <div className="flex-1">
                        <p className="font-semibold text-slate-700">{displayName}</p>
                        <p className="text-[11px] text-slate-500">
                          {matched ? matched.description : 'Custom entry sourced from transcript.'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (matched) {
                            addEvaluationTest(createEntryFromLibrary(matched, "ai"));
                          } else {
                            addEvaluationTest(createCustomEntry(item.rawName, "ai"));
                          }
                        }}
                        className="ml-2 rounded-full bg-[#8b5cf6] px-3 py-1 text-xs text-white transition hover:bg-[#7c3aed]"
                      >
                        Add to evaluation
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* ✅ WORKFLOW OPTIMIZATION: Hide test library for follow-ups */}
          {!(sessionTypeFromUrl === 'followup' || workflowRoute?.type === 'follow-up') && (
            <section className="rounded-3xl border border-slate-200 bg-white px-4 py-5 shadow-sm space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Add Tests</h3>
                <p className="mt-1 text-xs text-slate-500">
                  Choose from the library or add a custom test. Once added, tests appear on the right for documentation.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                    Library tests
                  </label>
                  <select
                    onChange={handleLibrarySelect}
                    defaultValue=""
                    className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
                  >
                    <option value="">Select a test…</option>
                    {regions.map((region) => (
                      <optgroup key={region} label={regionLabels[region]}>
                        {MSK_TEST_LIBRARY.filter((test) => test.region === region).map((test) => {
                          const disabled = isTestAlreadySelected(test.id, test.name);
                          return (
                            <option key={test.id} value={test.id} disabled={disabled}>
                              {test.name}
                              {disabled ? " (added)" : ""}
                            </option>
                          );
                        })}
                      </optgroup>
                    ))}
                  </select>
                  <p className="mt-1.5 text-[11px] text-slate-500">
                    Tests already in your evaluation are disabled in this list.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Custom test
                      </label>
                      <p className="mt-1 text-xs text-slate-500">
                        Log additional assessments not in the library.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        resetCustomForm();
                        setIsCustomFormOpen(true);
                      }}
                      disabled={isCustomFormOpen}
                      className="rounded-full bg-[#7c3aed] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#6d28d9] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                    >
                      Add custom test
                    </button>
                  </div>

                  {isCustomFormOpen && (
                    <div className="mt-3 space-y-3">
                      <input
                        value={customTestName}
                        onChange={(event) => setCustomTestName(event.target.value)}
                        placeholder="Test name"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <select
                          value={customTestRegion}
                          onChange={(event) => setCustomTestRegion(event.target.value as MSKRegion | 'other')}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
                        >
                          {Object.entries(regionLabels).map(([regionKey, label]) => (
                            <option key={regionKey} value={regionKey}>
                              {label}
                            </option>
                          ))}
                          <option value="other">Other / General</option>
                        </select>
                        <select
                          value={customTestResult}
                          onChange={(event) => setCustomTestResult(event.target.value as EvaluationResult | '')}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
                        >
                          <option value="">Result (optional)</option>
                          {RESULT_OPTIONS.map((option) => (
                            <option key={option} value={option}>
                              {RESULT_LABELS[option]}
                            </option>
                          ))}
                        </select>
                      </div>
                      <textarea
                        value={customTestNotes}
                        onChange={(event) => setCustomTestNotes(event.target.value)}
                        rows={2}
                        placeholder="Notes (optional)"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7c3aed]"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            resetCustomForm();
                            setIsCustomFormOpen(false);
                          }}
                          className="rounded-full border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleAddCustomTest}
                          className="rounded-full bg-[#7c3aed] px-4 py-2 text-xs font-semibold text-white hover:bg-[#6d28d9]"
                        >
                          Save custom test
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </section>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-3xl border border-slate-200 bg-white px-5 py-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-semibold text-slate-800">Selected Tests</p>
              <span className="text-xs text-slate-500">
                {filteredEvaluationTests.length} selected
                {detectedCaseRegion && filteredEvaluationTests.length !== evaluationTests.length && (
                  <span className="text-amber-600 ml-1">
                    ({evaluationTests.length - filteredEvaluationTests.length} filtered by region)
                  </span>
                )}
              </span>
            </div>
            {filteredEvaluationTests.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-500">
                {detectedCaseRegion 
                  ? `Add or select tests for ${regionLabels[detectedCaseRegion]} to document your findings.`
                  : 'Add or select tests to document your findings.'}
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEvaluationTests.map((entry) => {
                  const definition = getTestDefinition(entry.id);
                  const hasFields = definition && hasFieldDefinitions(definition);
                  const testDefinition = hasFields ? definition as MskTestDefinition : null;

                  return (
                    <div key={entry.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 space-y-3 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-800">{entry.name}</p>
                          <p className="text-[11px] text-slate-500">
                            {entry.region ? regionLabels[entry.region] : 'General'} · Source: {entry.source.toUpperCase()}
                          </p>
                          {entry.description && (
                            <p className="mt-1 text-[11px] text-slate-500">{entry.description}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeEvaluationTest(entry.id)}
                          className="text-xs text-slate-400 hover:text-rose-500"
                        >
                          Remove
                        </button>
                      </div>

                      {/* Render specific fields if test has field definitions */}
                      {hasFields && testDefinition?.fields && testDefinition.fields.length > 0 ? (
                        <div className="space-y-4">
                          {/* Test-specific fields */}
                          <div className="space-y-3 bg-white rounded-lg p-3 border border-slate-100">
                            {testDefinition.fields.map((field) => (
                              <div key={field.id}>
                                {renderFieldInput(
                                  field,
                                  entry.values?.[field.id] ?? null,
                                  (newValue) => {
                                    const updatedValues = { ...(entry.values ?? {}), [field.id]: newValue };
                                    
                                    // ✅ AUTO-RESULT: Detect changes that indicate abnormal results
                                    let newResult = entry.result;
                                    
                                    if (field.kind === 'yes_no') {
                                      if (newValue === true) {
                                        newResult = "positive";
                                      } else if (newValue === false) {
                                        const hasOtherAbnormalFindings = testDefinition.fields.some(f => {
                                          if (f.id === field.id) return false;
                                          const val = updatedValues[f.id];
                                          if (f.kind === 'yes_no' && val === true) return true;
                                          if (f.kind === 'score_0_10' && typeof val === 'number' && val > 0) return true;
                                          if ((f.kind === 'angle_bilateral' || f.kind === 'angle_unilateral') && 
                                              typeof val === 'number' && f.normalRange) {
                                            if (val < f.normalRange.min || val > f.normalRange.max) return true;
                                          }
                                          return false;
                                        });
                                        if (!hasOtherAbnormalFindings) {
                                          newResult = "normal";
                                        }
                                      }
                                    } else if (field.kind === 'score_0_10') {
                                      if (newValue !== null && typeof newValue === 'number' && newValue > 0) {
                                        newResult = "positive";
                                      } else if (newValue === 0 || newValue === null) {
                                        const hasOtherAbnormalFindings = testDefinition.fields.some(f => {
                                          if (f.id === field.id) return false;
                                          const val = updatedValues[f.id];
                                          if (f.kind === 'yes_no' && val === true) return true;
                                          if (f.kind === 'score_0_10' && typeof val === 'number' && val > 0) return true;
                                          if ((f.kind === 'angle_bilateral' || f.kind === 'angle_unilateral') && 
                                              typeof val === 'number' && f.normalRange) {
                                            if (val < f.normalRange.min || val > f.normalRange.max) return true;
                                          }
                                          return false;
                                        });
                                        if (!hasOtherAbnormalFindings) {
                                          newResult = "normal";
                                        }
                                      }
                                    }
                                    
                                    updateEvaluationTest(entry.id, { 
                                      values: updatedValues,
                                      result: newResult
                                    });
                                  },
                                  entry,
                                  updateEvaluationTest,
                                  testDefinition
                                )}
                              </div>
                            ))}
                          </div>
                          
                          {/* Result selection section */}
                          <div className="space-y-3 pt-2 border-t border-slate-200">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600">
                                Status: {RESULT_LABELS[entry.result] || "Pending"}
                              </span>
                              <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                                <input
                                  type="checkbox"
                                  checked={entry.result === "positive" || entry.result === "abnormal"}
                                  onChange={(event) =>
                                    updateEvaluationTest(entry.id, {
                                      result: event.target.checked ? "positive" : "normal",
                                    })
                                  }
                                  className="h-3.5 w-3.5 rounded border-slate-300 text-primary-blue focus:ring-primary-blue"
                                />
                                Abnormal result
                              </label>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {RESULT_OPTIONS.map((option) => (
                                <button
                                  key={option}
                                  type="button"
                                  onClick={() => updateEvaluationTest(entry.id, { result: option })}
                                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                                    entry.result === option
                                      ? 'bg-gradient-to-r from-primary-blue to-primary-purple text-white shadow-sm'
                                      : 'bg-white border border-slate-200 text-slate-600 hover:border-primary-blue/30 hover:bg-primary-blue/5'
                                  }`}
                                >
                                  {RESULT_LABELS[option]}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          {/* Add Notes field */}
                          <div className="pt-2 border-t border-slate-200">
                            <label className="block text-xs font-medium text-slate-700 mb-1.5">
                              Add Notes
                            </label>
                            <textarea
                              value={entry.notes || ''}
                              onChange={(event) => updateEvaluationTest(entry.id, { notes: event.target.value })}
                              rows={2}
                              placeholder="Additional clinical notes, observations, or findings..."
                              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400 bg-white"
                            />
                            <p className="mt-1 text-[10px] text-slate-400">
                              Notes will be included in the SOAP generation process.
                            </p>
                          </div>
                        </div>
                      ) : (
                        /* Fallback: generic form for tests without fields */
                        <>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600">
                              Status: {RESULT_LABELS[entry.result] || "Pending"}
                            </span>
                            <label className="inline-flex items-center gap-2 text-xs text-slate-600">
                              <input
                                type="checkbox"
                                checked={entry.result === "positive"}
                                onChange={(event) =>
                                  updateEvaluationTest(entry.id, {
                                    result: event.target.checked ? "positive" : "normal",
                                  })
                                }
                                className="h-3.5 w-3.5 rounded border-slate-300 text-primary-blue focus:ring-primary-blue"
                              />
                              Abnormal result
                            </label>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {RESULT_OPTIONS.map((option) => (
                              <button
                                key={option}
                                type="button"
                                onClick={() => updateEvaluationTest(entry.id, { result: option })}
                                className={`px-3 py-1.5 rounded-full text-xs transition ${
                                  entry.result === option
                                    ? 'bg-gradient-to-r from-primary-blue to-primary-purple text-white shadow'
                                    : 'bg-white border border-slate-200 text-slate-600 hover:border-sky-200'
                                }`}
                              >
                                {RESULT_LABELS[option]}
                              </button>
                            ))}
                          </div>
                          <textarea
                            value={entry.notes}
                            onChange={(event) => updateEvaluationTest(entry.id, { notes: event.target.value })}
                            rows={3}
                            placeholder="Clinical notes, pain provocation, mobility restrictions..."
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
                          />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <div className="text-sm text-slate-500">
          Progress: {completedCount} of {totalTests} tests documented ({progressPercent}%)
        </div>
        <button
          onClick={handleGenerateSoap}
          disabled={filteredEvaluationTests.length === 0 || isGeneratingSOAP}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white hover:from-sky-600 hover:to-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {isGeneratingSOAP ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating SOAP Note...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              Generate SOAP Note
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default EvaluationTab;

