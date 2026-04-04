/**
 * WO-FLOW-005: Parseo determinista del plan previo a focos clínicos editables
 * 
 * NO usa IA, solo estructura el texto del plan en items editables.
 * Fuente de verdad: lastEncounter.soap.plan (read-only)
 */

import { derivePlanFromText } from './derivePlanFromText';

export interface TodayFocusItem {
  id: string;
  label: string;      // editable
  completed: boolean; // checkbox state
  notes?: string;      // editable (collapsible)
  source: 'plan';     // fijo
}

type PlanToFocusInput =
  | string
  | {
      inClinicText?: string | null;
      homeProgramText?: string | null;
      planText?: string | null;
    }
  | null
  | undefined;

/** WO-PLAN-TITLE-001: Discard section headers so they don't render as checklist items. */
function isSectionHeaderLine(line: string): boolean {
  const stripped = line.replace(/^[\d\.\)\-\•\*\s]+/, '').trim();
  if (stripped.length < 4) return true;
  if (/^(plan|treatment\s+plan|home\s+program|hep|assessment|subjective|objective|soap|interventions?|modalities?|goals?|follow-?up|next):?\s*$/i.test(stripped)) return true;
  if (/^[A-Z][A-Z\s]+:?\s*$/.test(stripped)) return true;
  return false;
}

function splitFallbackCandidateLines(planText: string): string[] {
  const normalizedPlanText = planText.replace(/\*\*/g, '');
  const normalizedBullets = normalizedPlanText.replace(/\s+-\s+/g, '\n- ');
  const newlineSegments = normalizedBullets.split('\n');
  const sentenceSegments = newlineSegments.flatMap((segment) => segment.split(/;(?=\s+[A-ZÁÉÍÓÚÑa-záéíóúñ])/));
  const cleanedSegments = sentenceSegments.map((segment) => segment.replace(/^[•\-*]\s+/, '').replace(/[.;]\s*$/, '').trim());
  const filteredSegments = cleanedSegments.filter(Boolean);
  return filteredSegments;
}

/**
 * Parsea el plan previo (texto estructurado) a focos clínicos editables
 * 
 * Inputs permitidos:
 * - plan.Interventions (sección "Interventions:")
 * - plan.HomeExercises (sección "Home Exercises:")
 * - (opcional, read-only) plan.Goals
 * 
 * @param planInput - Texto legacy o plan estructurado previo
 * @returns Array de focos clínicos editables
 */
export function parsePlanToFocusItems(planInput: PlanToFocusInput): TodayFocusItem[] {
  const hasStringInput = typeof planInput === 'string';
  const hasObjectInput = typeof planInput === 'object' && planInput !== null;
  if (!hasStringInput && !hasObjectInput) {
    return [];
  }

  const derivedLabels = derivePlanFromText(planInput).inClinic;
  if (derivedLabels.length > 0) {
    const maxFocusItems = 5;
    const limitedLabels = derivedLabels.slice(0, maxFocusItems);
    const focusItems: TodayFocusItem[] = limitedLabels.map((label, itemIdx) => ({
      id: `intervention-${itemIdx}`,
      label,
      completed: false,
      source: 'plan',
    }));
    return focusItems;
  }

  const fallbackItems: TodayFocusItem[] = [];
  let itemId = 0;
  const planTextForFallback = hasStringInput
    ? planInput
    : (planInput?.inClinicText ?? planInput?.planText ?? '');
  const fallbackSegments = splitFallbackCandidateLines(planTextForFallback);
  fallbackSegments.forEach((segment) => {
    const labelFromSegment = segment.trim();
    const hasUsefulLength = labelFromSegment.length > 3;
    const isHeader = isSectionHeaderLine(labelFromSegment);
    if (hasUsefulLength && !isHeader) {
      fallbackItems.push({
        id: `general-${itemId++}`,
        label: labelFromSegment,
        completed: false,
        source: 'plan',
      });
    }
  });
  const maxFocusItemsFallback = 5;
  return fallbackItems.slice(0, maxFocusItemsFallback);
}
