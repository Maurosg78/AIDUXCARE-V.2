/**
 * Physical Exam Result Builder
 * 
 * Converts EvaluationTestEntry[] to PhysicalExamResult[] with structured
 * findings text that can be used in SOAP generation.
 * 
 * Market: CA · en-CA · PHIPA/PIPEDA Ready
 */

import type { PhysicalExamResult } from '../../types/vertex-ai';
import type { MskTestDefinition } from '../msk-tests/library/mskTestLibrary';

// Extended interface for evaluation entries
// This should match the EvaluationTestEntry type used in ProfessionalWorkflowPage
export interface EvaluationTestEntry {
  id: string;
  testId?: string; // Optional for custom tests
  name: string;
  region: string | null;
  source: 'ai' | 'manual' | 'custom';
  description?: string;
  result: 'normal' | 'positive' | 'negative' | 'inconclusive';
  notes: string;
  values?: Record<string, number | string | boolean | null>;
}

/**
 * Builds findings text from test entry and definition
 * Uses only actual values and status - no diagnostic language
 */
function buildFindingsText(
  entry: EvaluationTestEntry,
  definition: MskTestDefinition | undefined
): string {
  const parts: string[] = [];
  
  // Start with test name
  parts.push(entry.name);

  // Add specific values if available
  if (entry.values && definition?.fields) {
    const valueParts: string[] = [];
    
    definition.fields.forEach((field) => {
      const value = entry.values?.[field.id];
      
      // Skip null, undefined, empty, false, or 0 values (unless they're meaningful)
      if (value === null || value === undefined || value === '' || value === false) {
        return;
      }

      // Format based on field type
      if (field.kind === 'angle_bilateral' || field.kind === 'angle_unilateral') {
        const unit = field.unit === 'deg' ? '°' : field.unit === 'kg' ? 'kg' : field.unit === 'cm' ? 'cm' : '';
        // Include side if present in label
        if (field.label.toLowerCase().includes('right')) {
          valueParts.push(`right: ${value}${unit}`);
        } else if (field.label.toLowerCase().includes('left')) {
          valueParts.push(`left: ${value}${unit}`);
        } else {
          valueParts.push(`${field.label}: ${value}${unit}`);
        }
      } else if (field.kind === 'yes_no' && value === true) {
        // Only include if positive
        valueParts.push(field.label.toLowerCase());
      } else if (field.kind === 'score_0_10') {
        valueParts.push(`${field.label}: ${value}/10`);
      } else if (field.kind === 'text' && typeof value === 'string' && value.trim()) {
        valueParts.push(`${field.label}: ${value.trim()}`);
      }
    });

    if (valueParts.length > 0) {
      parts.push(valueParts.join('; '));
    }
  }

  // Add result status
  if (entry.result === 'positive') {
    parts.push('positive');
  } else if (entry.result === 'negative') {
    parts.push('negative');
  } else if (entry.result === 'inconclusive') {
    parts.push('inconclusive');
  } else if (entry.result === 'normal') {
    // For normal results, use normalTemplate if available
    if (definition?.normalTemplate) {
      parts.push(definition.normalTemplate);
    } else {
      parts.push('within normal limits');
    }
  }

  // Add free-text notes if present
  if (entry.notes?.trim()) {
    parts.push(entry.notes.trim());
  }

  return parts.join('; ');
}

/**
 * Builds PhysicalExamResult[] from EvaluationTestEntry[]
 */
export function buildPhysicalExamResults(
  evaluationEntries: EvaluationTestEntry[],
  library: (MskTestDefinition | any)[]
): PhysicalExamResult[] {
  return evaluationEntries.map((entry) => {
    // Find definition by testId, by entry.id, or by matching name (for custom tests)
    let definition: MskTestDefinition | undefined;
    
    if (entry.testId) {
      definition = library.find((t) => t.id === entry.testId) as MskTestDefinition | undefined;
    } else if (entry.id && !entry.id.startsWith('custom-')) {
      // Try to find by entry.id (which might be the test ID for library tests)
      definition = library.find((t) => t.id === entry.id) as MskTestDefinition | undefined;
    }
    
    // Fallback: try to match by name
    if (!definition) {
      definition = library.find((t) => 
        t.name.toLowerCase() === entry.name.toLowerCase()
      ) as MskTestDefinition | undefined;
    }

    const findingsText = buildFindingsText(entry, definition);

    // Determine testId: use entry.testId, or entry.id if it matches a library test, or undefined
    // In ProfessionalWorkflowPage, entry.id is set to test.id for library tests
    const testId = entry.testId || (definition ? definition.id : (entry.id && !entry.id.startsWith('custom-') ? entry.id : undefined));

    const result: PhysicalExamResult = {
      testId: testId,
      testName: entry.name,
      segment: entry.region || undefined,
      result: entry.result === 'normal' ? 'normal' : 
              entry.result === 'positive' ? 'positive' : 
              entry.result === 'negative' ? 'negative' : 'inconclusive',
      notes: entry.notes?.trim() || undefined,
      findingsText: findingsText,
      values: entry.values ?? {},
    };

    return result;
  });
}

/**
 * Builds a human-readable summary of physical exam results
 * Used as narrative support in SOAP prompts
 */
export function buildPhysicalEvaluationSummary(
  results: PhysicalExamResult[]
): string {
  if (results.length === 0) {
    return 'No physical tests performed.';
  }

  const summaryLines = results.map((result, idx) => {
    const statusLabel = result.result === 'normal' ? 'Normal' :
                       result.result === 'positive' ? 'Positive' :
                       result.result === 'negative' ? 'Negative' : 'Inconclusive';
    
    return `${idx + 1}. ${result.testName}: ${statusLabel}${result.notes ? ` — ${result.notes}` : ''}`;
  });

  return summaryLines.join('\n');
}

