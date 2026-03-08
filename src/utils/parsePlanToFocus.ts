/**
 * WO-FLOW-005: Parseo determinista del plan previo a focos clínicos editables
 * 
 * NO usa IA, solo estructura el texto del plan en items editables.
 * Fuente de verdad: lastEncounter.soap.plan (read-only)
 */

export interface TodayFocusItem {
  id: string;
  label: string;      // editable
  completed: boolean; // checkbox state
  notes?: string;      // editable (collapsible)
  source: 'plan';     // fijo
}

/** WO-PLAN-TITLE-001: Discard section headers so they don't render as checklist items. */
function isSectionHeaderLine(line: string): boolean {
  const stripped = line.replace(/^[\d\.\)\-\•\*\s]+/, '').trim();
  if (stripped.length < 4) return true;
  if (/^(plan|treatment\s+plan|home\s+program|hep|assessment|subjective|objective|soap|interventions?|modalities?|goals?|follow-?up|next):?\s*$/i.test(stripped)) return true;
  if (/^[A-Z][A-Z\s]+:?\s*$/.test(stripped)) return true;
  return false;
}

/**
 * Parsea el plan previo (texto estructurado) a focos clínicos editables
 * 
 * Inputs permitidos:
 * - plan.Interventions (sección "Interventions:")
 * - plan.HomeExercises (sección "Home Exercises:")
 * - (opcional, read-only) plan.Goals
 * 
 * @param planText - Texto del plan previo (lastEncounter.soap.plan)
 * @returns Array de focos clínicos editables
 */
export function parsePlanToFocusItems(planText: string | null | undefined): TodayFocusItem[] {
  if (!planText || typeof planText !== 'string') {
    return [];
  }

  const items: TodayFocusItem[] = [];
  let itemId = 0;

  // Extraer Interventions (incluye variantes recientes del modelo como "In-clinic treatment today:")
  const interventionsMatch = planText.match(/(?:interventions?|in-?clinic treatment(?: today)?):\s*([^\n]+(?:\n(?!-?\s*(?:Modalities?|Home|Patient|Goals?|Follow-up|Next))[^\n]+)*)/i);
  if (interventionsMatch) {
    const interventionsText = interventionsMatch[1];
    // Parsear lista (bullets, dashes, o comas)
    const interventionList = interventionsText
      .split(/[•\-\n]/)
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.match(/^(Interventions?|Modalities?|Home|Patient|Goals?|Follow-up|Next)/i));
    
    interventionList.forEach((intervention) => {
      if (intervention.length > 0 && !isSectionHeaderLine(intervention)) {
        items.push({
          id: `intervention-${itemId++}`,
          label: intervention,
          completed: false,
          source: 'plan',
        });
      }
    });
  }

  // Extraer Home Exercises (incluye variantes como "Home Exercise Program:")
  const homeExercisesMatch = planText.match(/(?:home\s+exercises?|home\s+exercise\s+program(?:\s*\(hep\))?):\s*([^\n]+(?:\n(?!-?\s*(?:Patient|Goals?|Follow-up|Next|Modalities?|Interventions?))[^\n]+)*)/i);
  if (homeExercisesMatch) {
    const exercisesText = homeExercisesMatch[1];
    // Parsear lista (bullets, dashes, o comas)
    const exerciseList = exercisesText
      .split(/[•\-\n]/)
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.match(/^(Home\s+Exercises?|Patient|Goals?|Follow-up|Next|Modalities?|Interventions?)/i));
    
    exerciseList.forEach((exercise) => {
      if (exercise.length > 0 && !isSectionHeaderLine(exercise)) {
        items.push({
          id: `exercise-${itemId++}`,
          label: exercise,
          completed: false,
          source: 'plan',
        });
      }
    });
  }

  // Si no se encontraron items estructurados, intentar extraer del texto general
  if (items.length === 0) {
    // Buscar líneas que parezcan focos (empiezan con bullet o dash)
    const lines = planText.split('\n');
    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.match(/^[•\-*]\s+/) && trimmed.length > 3) {
        const label = trimmed.replace(/^[•\-*]\s+/, '').trim();
        if (label.length > 0 && !isSectionHeaderLine(label)) {
          items.push({
            id: `general-${itemId++}`,
            label: label,
            completed: false,
            source: 'plan',
          });
        }
      }
    });
  }

  // Limitar a máximo 5 items para no sobrecargar la UI
  return items.slice(0, 5);
}
