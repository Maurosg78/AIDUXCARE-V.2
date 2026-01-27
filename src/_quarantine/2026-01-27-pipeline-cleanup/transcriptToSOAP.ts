// @ts-nocheck
// src/core/notes/transcriptToSOAP.ts
import { SOAPBuilder, ChecklistSignal } from './SOAPBuilder';

/**
 * Tipos locales mínimos (no intrusivos).
 */
export type StructurableTag =
  | 'symptom'
  | 'finding'
  | 'test'
  | 'diagnosis'
  | 'intervention'
  | 'plan';

export type AnalysisEntityType =
  | StructurableTag
  | 'medication'
  | 'observation'
  | 'measurement'
  | 'redFlag'
  | 'yellowFlag'
  | 'other';

export interface AnalysisEntity {
  type: AnalysisEntityType;
  name?: string;
  text?: string;
  actor?: 'clinician' | 'patient' | 'other' | string;
}

export interface AnalysisResultsLike {
  entities?: AnalysisEntity[];
}

/**
 * Mapea entities → ChecklistSignal[] usando SOLO analysisResults.
 * Si no hay analysisResults o no hay entities válidas → []
 */
export function transcriptToChecklist(
  analysis?: AnalysisResultsLike
): ChecklistSignal[] {
  // Guardrail adicional solicitado por CTO
  if (!analysis?.entities || !Array.isArray(analysis.entities) || analysis.entities.length === 0) {
    return [];
  }

  const mapTypeToTag: Partial<Record<AnalysisEntityType, StructurableTag>> = {
    symptom: 'symptom',
    finding: 'finding',
    test: 'test',
    diagnosis: 'diagnosis',
    intervention: 'intervention',
    plan: 'plan',
  };

  const toSpeaker = (
    actor?: AnalysisEntity['actor']
  ): ChecklistSignal['speaker'] => {
    if (actor === 'clinician') return 'clinician';
    if (actor === 'patient') return 'patient';
    return 'other';
  };

  const signals: ChecklistSignal[] = [];

  for (const e of analysis.entities) {
    const tag = mapTypeToTag[e.type];
    if (!tag) continue; // ignoramos no-estructurables
    const content = (e.text ?? e.name ?? '').trim();
    if (!content) continue;

    signals.push({
      speaker: toSpeaker(e.actor),
      text: content,
      tag,
    });
  }

  return signals;
}

/**
 * Tipo local mínimo para la nota SOAP que cubre lo que usa el Preview.
 */
export type MinimalSOAPNote = {
  sections: {
    subjective: string[];
    objective: string[];
    assessment: string[];
    plan: string[];
  };
  locale: string;
};

/**
 * Construye una SOAP a partir de analysisResults.
 * Si no hay contenido estructurable → SOAP vacía (secciones vacías).
 */
export function buildSOAPFromAnalysis(
  analysis?: AnalysisResultsLike
): MinimalSOAPNote {
  const checklist = transcriptToChecklist(analysis);
  return SOAPBuilder.fromChecklist(checklist) as MinimalSOAPNote;
}
