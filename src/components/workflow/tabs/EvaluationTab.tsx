/**
 * EvaluationTab Component
 * 
 * Extracted from ProfessionalWorkflowPage for better code organization.
 * Handles physical evaluation test selection and documentation.
 * 
 * @compliance PHIPA compliant, ISO 27001 auditable
 */

import React, { useMemo } from 'react';
import { Stethoscope, Loader2, FileText, ChevronRight } from 'lucide-react';
import type { MSKRegion, MskTestDefinition, TestFieldDefinition } from '../../../core/msk-tests/library/mskTestLibrary';
import { MSK_TEST_LIBRARY, regions, regionLabels, getTestDefinition, hasFieldDefinitions } from '../../../core/msk-tests/library/mskTestLibrary';
import type { WorkflowRoute } from '../../../services/workflowRouterService';
import { getTopPhysicalTests } from '../../../utils/sortPhysicalTestsByImportance';

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
  // ✅ NEW: All AI suggestions (not filtered by "already selected") for calculating top 5
  allAiSuggestions?: Array<{
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
  allAiSuggestions, // ✅ NEW: All suggestions (not filtered) for top 5 calculation
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

  // ✅ FIX: Separate ALL AI suggestions into top 5 (phase 1) and additional tests (sidebar)
  // IMPORTANT: Calculate top 5 based on ALL suggestions (not filtered), then filter only top 5 for display
  // This ensures sidebar always shows additional tests even if top 5 are already added
  const { topTests: topAiSuggestions, remainingTests: additionalAiSuggestions } = useMemo(() => {
    // ✅ CRITICAL: Use allAiSuggestions (ALL suggestions, not filtered) if available
    // This ensures we calculate top 5 from ALL tests, not just pending ones
    const allSuggestions = allAiSuggestions && allAiSuggestions.length > 0 
      ? allAiSuggestions 
      : pendingAiSuggestions;
    
    console.log('[EvaluationTab] Calculating top 5 (memoized):', {
      allAiSuggestionsCount: allAiSuggestions?.length || 0,
      pendingAiSuggestionsCount: pendingAiSuggestions.length,
      usingAll: !!(allAiSuggestions && allAiSuggestions.length > 0),
      allSuggestionsCount: allSuggestions.length
    });
    
    if (allSuggestions.length === 0) {
      return { topTests: [], remainingTests: [] };
    }

    // Convert to format compatible with sortPhysicalTestsByImportance
    // Include sensitivityQualitative and specificityQualitative from match for score calculation
    const formattedSuggestions = allSuggestions.map((item) => {
      const match = item.match;
      const sensitivity = match?.sensitivity;
      const specificity = match?.specificity;
      const sensitivityQual = (match as any)?.sensitivityQualitative;
      const specificityQual = (match as any)?.specificityQualitative;
      
      return {
        name: match?.name || item.rawName,
        test: match?.name || item.rawName,
        evidence_level: match?.evidence_level,
        sensitivity: typeof sensitivity === 'number' ? sensitivity : undefined,
        specificity: typeof specificity === 'number' ? specificity : undefined,
        sensitivityQualitative: sensitivityQual || (typeof sensitivity === 'string' ? sensitivity : undefined),
        specificityQualitative: specificityQual || (typeof specificity === 'string' ? specificity : undefined),
        justification: match?.description || (match as any)?.rationale,
        originalIndex: item.key,
        match: match,
        rawName: item.rawName,
      };
    });

    // ✅ Sort by importance using average score (sensitivity + specificity) / 2
    // This determines the top 5 best tests based on clinical value
    const sortedAndSeparated = getTopPhysicalTests(formattedSuggestions, 5);
    
    console.log('[EvaluationTab] Top 5 calculated (memoized):', {
      topTestsCount: sortedAndSeparated.topTests.length,
      remainingTestsCount: sortedAndSeparated.remainingTests.length,
      topTests: sortedAndSeparated.topTests.map((t: any) => t.name || t.rawName),
      remainingTests: sortedAndSeparated.remainingTests.map((t: any) => t.name || t.rawName)
    });
    
    // ✅ FIX: Filter top 5 by "already selected" ONLY for phase 1 display
    // Phase 1 should only show top 5 tests that are NOT already added
    const topTestsFiltered = sortedAndSeparated.topTests.filter((test: any) => {
      const candidateName = test.match?.name || test.rawName || test.name || '';
      const candidateId = test.match?.id || `ai-${candidateName.toLowerCase().trim()}`;
      const alreadySelected = filteredEvaluationTests.some(
        (evaluationTest) => evaluationTest.id === candidateId || 
        evaluationTest.name.toLowerCase().trim() === candidateName.toLowerCase().trim()
      );
      return !alreadySelected;
    });
    
    // ✅ CRITICAL: Ensure remainingTests have the correct format (match, rawName, originalIndex) for sidebar rendering
    const remainingTestsFormatted = sortedAndSeparated.remainingTests.map((test: any) => {
      // Find the original suggestion from allSuggestions to preserve rawName, match, originalIndex
      const originalSuggestion = allSuggestions.find((item: any) => item.key === test.originalIndex);
      if (originalSuggestion) {
        // Return original format with additional formatted fields for sorting
        return {
          ...originalSuggestion, // Preserve original format (rawName, match, key, displayName)
          ...test, // Add formatted fields (name, test, evidence_level, sensitivity, etc.)
        };
      }
      // Fallback: return formatted test with required fields
      return {
        ...test,
        rawName: test.rawName || test.name || test.test,
        originalIndex: test.originalIndex,
        key: test.originalIndex,
        match: test.match,
      };
    });
    
    // ✅ FIX: Filter additional tests (6+) to exclude tests that are already selected
    // If a test from the sidebar is selected, it should disappear from the sidebar because it's now in Selected Tests
    // Use the same logic as isTestAlreadySelected: compare by id OR normalized name
    // IMPORTANT: Clean "Consider assessing" prefix from names to match how tests are created in continueToEvaluation
    const normalizeName = (value: string) => value.toLowerCase().trim();
    const cleanTestName = (name: string) => name.replace(/^Consider assessing\s+/i, '').trim();
    
    const additionalTestsFiltered = remainingTestsFormatted.filter((test: any) => {
      const rawCandidateName = test.match?.name || test.rawName || test.name || '';
      const candidateName = cleanTestName(rawCandidateName); // Clean prefix to match how tests are created
      const candidateId = test.match?.id || `ai-${normalizeName(candidateName)}`;
      
      // Use the same comparison logic as isTestAlreadySelected
      // Use evaluationTests (not filteredEvaluationTests) to match isTestAlreadySelected behavior
      const alreadySelected = evaluationTests.some(
        (evaluationTest) => {
          const testIdMatches = evaluationTest.id === candidateId;
          // Compare cleaned names to ensure consistency
          const testNameMatches = normalizeName(evaluationTest.name) === normalizeName(candidateName);
          return testIdMatches || testNameMatches;
        }
      );
      
      return !alreadySelected; // Only show tests that are NOT already selected
    });
    
    const finalResult = {
      topTests: topTestsFiltered,
      remainingTests: additionalTestsFiltered, // ✅ FIX: Filter out tests that are already in the main list
    };
    
    const sidebarShouldShow = finalResult.remainingTests.length > 0;
    const remainingTestsCount = finalResult.remainingTests.length;
    
    console.log('[EvaluationTab] Final result:', {
      topTestsCount: finalResult.topTests.length,
      remainingTestsCount,
      sidebarShouldShow,
      totalSuggestionsFromVertex: allSuggestions.length,
      reason: remainingTestsCount === 0 
        ? 'No sidebar: Vertex only suggested 5 tests (or fewer). Sidebar only shows tests 6+.' 
        : `Sidebar will show ${remainingTestsCount} additional test(s)`,
      remainingTestsDetails: finalResult.remainingTests.map((t: any) => ({
        originalIndex: t.originalIndex || t.key,
        rawName: t.rawName || t.name,
        hasMatch: !!t.match,
        matchName: t.match?.name
      }))
    });
    
    return finalResult;
  }, [allAiSuggestions, pendingAiSuggestions, filteredEvaluationTests]);

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
          {/* FASE 2: Additional AI-suggested tests (6+) in sidebar for deeper exploration */}
          {additionalAiSuggestions.length > 0 && !(sessionTypeFromUrl === 'followup' || workflowRoute?.type === 'follow-up') && (
            <section className="rounded-3xl border border-slate-200 bg-white px-4 py-5 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-800">Additional Tests</h3>
              <p className="mt-1 text-xs text-slate-500">
                Additional tests for deeper exploration. Click to add to your evaluation.
              </p>
              <div className="mt-3 space-y-2 max-h-[400px] overflow-y-auto">
                {additionalAiSuggestions.length === 0 ? (
                  <p className="text-[11px] text-slate-500 text-center py-2">
                    All additional tests have been added to your evaluation.
                  </p>
                ) : (
                  additionalAiSuggestions.map((item: any) => {
                    const matched = item.match;
                    const displayName = matched ? matched.name : item.rawName;
                    return (
                      <div
                        key={`ai-additional-${item.originalIndex || item.key}`}
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
                              addEvaluationTest(createCustomEntry(item.rawName || item.name, "ai"));
                            }
                          }}
                          className="ml-2 rounded-full bg-[#8b5cf6] px-3 py-1 text-xs text-white transition hover:bg-[#7c3aed]"
                        >
                          Add
                        </button>
                      </div>
                    );
                  })
                )}
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
          {/* ✅ NOTE: Top 5 Recommended Tests are shown in Phase 1 (AnalysisTab), not here in Phase 2 */}
          {/* Phase 2 (EvaluationTab) only shows "Selected Tests" for documentation */}

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

