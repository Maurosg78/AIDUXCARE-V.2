/**
 * WO-FU-PLAN-SPLIT-01: Derivación In-Clinic vs HEP desde planSummary (texto).
 * Solo presentación; no persiste datos. Heurística v1 documentada.
 */

import { PLAN_SPLIT_KEYWORDS } from './planSplitKeywords';

export interface DerivedPlan {
  inClinic: string[];
  homeProgram: string[];
}

/**
 * Detecta si una línea es un encabezado de sección in-clinic o HEP (case-insensitive).
 */
function getSectionType(line: string): 'inClinic' | 'homeProgram' | null {
  const trimmed = line.trim();
  const lower = trimmed.toLowerCase();
  for (const h of PLAN_SPLIT_KEYWORDS.sectionInClinic) {
    if (lower === h.toLowerCase() || lower.startsWith(h.toLowerCase() + ':') || lower.startsWith(h.toLowerCase() + ' ')) {
      return 'inClinic';
    }
  }
  for (const h of PLAN_SPLIT_KEYWORDS.sectionHomeProgram) {
    if (lower === h.toLowerCase() || lower.startsWith(h.toLowerCase() + ':') || lower.startsWith(h.toLowerCase() + ' ')) {
      return 'homeProgram';
    }
  }
  return null;
}

/**
 * Clasifica una línea por palabras clave (fallback). WO: si contiene HEP → HEP, else in-clinic.
 */
function classifyLine(line: string): 'inClinic' | 'homeProgram' {
  const lower = line.toLowerCase();
  const hepEn = PLAN_SPLIT_KEYWORDS.lineHomeProgramEn.some(k => lower.includes(k));
  const hepEs = PLAN_SPLIT_KEYWORDS.lineHomeProgramEs.some(k => lower.includes(k));
  if (hepEn || hepEs) return 'homeProgram';
  return 'inClinic';
}

/** Extrae ítems de un bloque (líneas no vacías, sin el bullet inicial). */
function linesToItems(lines: string[]): string[] {
  const items: string[] = [];
  for (const line of lines) {
    const trimmed = line.replace(/^[\s•\-*]+\s*/, '').trim();
    if (trimmed.length > 0) items.push(trimmed);
  }
  return items;
}

/**
 * WO-FU-PLAN-SPLIT-01: Deriva in-clinic y HEP desde planSummary.
 * A) Secciones primero; B) línea por línea con keywords; C) híbridos → HEP; D) EN/ES.
 * Todo el texto del plan aparece en alguno de los dos bloques (no pérdida de información).
 */
export function derivePlanFromText(planSummary: string | null | undefined): DerivedPlan {
  const inClinic: string[] = [];
  const homeProgram: string[] = [];

  if (!planSummary || typeof planSummary !== 'string') {
    return { inClinic, homeProgram };
  }

  const lines = planSummary.split(/\n/);
  let currentSection: 'inClinic' | 'homeProgram' | null = null;
  let currentBlock: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const section = getSectionType(line);

    if (section) {
      if (currentSection && currentBlock.length > 0) {
        const items = linesToItems(currentBlock);
        if (currentSection === 'inClinic') inClinic.push(...items);
        else homeProgram.push(...items);
      }
      currentSection = section;
      currentBlock = [];
      continue;
    }

    if (currentSection) {
      currentBlock.push(line);
      continue;
    }

    // No section yet: classify line by keywords (fallback)
    const trimmed = line.replace(/^[\s•\-*]+\s*/, '').trim();
    if (trimmed.length > 0) {
      const bucket = classifyLine(trimmed);
      if (bucket === 'inClinic') inClinic.push(trimmed);
      else homeProgram.push(trimmed);
    }
  }

  if (currentSection && currentBlock.length > 0) {
    const items = linesToItems(currentBlock);
    if (currentSection === 'inClinic') inClinic.push(...items);
    else homeProgram.push(...items);
  }

  // Si no hubo secciones ni líneas clasificadas, tratar todo el texto como una lista mixta por línea
  if (inClinic.length === 0 && homeProgram.length === 0 && planSummary.trim()) {
    const allLines = planSummary.split(/\n/).map(l => l.replace(/^[\s•\-*]+\s*/, '').trim()).filter(Boolean);
    for (const l of allLines) {
      const bucket = classifyLine(l);
      if (bucket === 'inClinic') inClinic.push(l);
      else homeProgram.push(l);
    }
  }

  return {
    inClinic: [...new Set(inClinic)].filter(Boolean),
    homeProgram: [...new Set(homeProgram)].filter(Boolean),
  };
}
