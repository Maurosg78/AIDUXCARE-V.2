/**
 * WO-FLOW-005: Parseo determinista del plan previo a focos clínicos editables
 * 
 * NO usa IA, solo estructura el texto del plan en items editables.
 * Fuente de verdad: lastEncounter.soap.plan (read-only)
 */

export interface TodayFocusItem {
  id: string;
  label: string;      // editable
  notes?: string;      // editable
  source: 'plan';     // fijo
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

  // Extraer Interventions
  const interventionsMatch = planText.match(/interventions?:\s*([^\n]+(?:\n(?!-?\s*(?:Modalities?|Home|Patient|Goals?|Follow-up|Next))[^\n]+)*)/i);
  if (interventionsMatch) {
    const interventionsText = interventionsMatch[1];
    // Parsear lista (bullets, dashes, o comas)
    const interventionList = interventionsText
      .split(/[•\-\n]/)
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.match(/^(Interventions?|Modalities?|Home|Patient|Goals?|Follow-up|Next)/i));
    
    interventionList.forEach((intervention, idx) => {
      if (intervention.length > 0) {
        items.push({
          id: `intervention-${itemId++}`,
          label: intervention,
          source: 'plan',
        });
      }
    });
  }

  // Extraer Home Exercises
  const homeExercisesMatch = planText.match(/home\s+exercises?:\s*([^\n]+(?:\n(?!-?\s*(?:Patient|Goals?|Follow-up|Next|Modalities?|Interventions?))[^\n]+)*)/i);
  if (homeExercisesMatch) {
    const exercisesText = homeExercisesMatch[1];
    // Parsear lista (bullets, dashes, o comas)
    const exerciseList = exercisesText
      .split(/[•\-\n]/)
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.match(/^(Home\s+Exercises?|Patient|Goals?|Follow-up|Next|Modalities?|Interventions?)/i));
    
    exerciseList.forEach((exercise, idx) => {
      if (exercise.length > 0) {
        items.push({
          id: `exercise-${itemId++}`,
          label: exercise,
          source: 'plan',
        });
      }
    });
  }

  // Si no se encontraron items estructurados, intentar extraer del texto general
  if (items.length === 0) {
    // Buscar líneas que parezcan focos (empiezan con bullet o dash)
    const lines = planText.split('\n');
    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.match(/^[•\-\*]\s+/) && trimmed.length > 3) {
        const label = trimmed.replace(/^[•\-\*]\s+/, '').trim();
        if (label.length > 0) {
          items.push({
            id: `general-${itemId++}`,
            label: label,
            source: 'plan',
          });
        }
      }
    });
  }

  // Limitar a máximo 5 items para no sobrecargar la UI
  return items.slice(0, 5);
}
