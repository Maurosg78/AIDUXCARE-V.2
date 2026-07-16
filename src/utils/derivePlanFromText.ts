/**
 * WO-FU-PLAN-SPLIT-01: Derivación In-Clinic vs HEP desde planSummary (texto).
 * Solo presentación; no persiste datos. Heurística v1 documentada.
 */

import { PLAN_SPLIT_KEYWORDS } from './planSplitKeywords';
import { ensureSpanishClinicalText } from './normalizers/es/ensureSpanishClinicalText';

export interface DerivedPlan {
  inClinic: string[];
  homeProgram: string[];
}

type DerivePlanInput =
  | string
  | {
      planText?: string | null;
      inClinicText?: string | null;
      homeProgramText?: string | null;
    }
  | null
  | undefined;

/**
 * WO-ES-PLAN-SPLIT-02: Cortar plan por cabeceras Vertex EN/ES antes de heurísticas por línea.
 * Evita mezclar HEP en el bloque in-clinic cuando el texto trae ambas secciones en un solo párrafo.
 */
function trySplitStructuredPlanSections(planSummary: string): { inClinicText: string; hepText: string } | null {
  const lineEndingsNormalized = planSummary.replace(/\r\n/g, '\n');
  const normalizedPlan = lineEndingsNormalized.trim();
  if (!normalizedPlan) {
    return null;
  }
  const inClinicHeaderPattern =
    /(?:^|[\n.])\s*(?:IN-CLINIC\s+TREATMENT|TRATAMIENTO\s+EN\s+CL[ÍI]NICA)(?:\s*\([^)]*\))?\s*:\s*/i;
  const hepHeaderPattern =
    /(?:^|[\n.])\s*(?:HOME\s+EXERCISE\s+PROGRAM|PROGRAMA\s+DE\s+EJERCICIOS\s+EN\s+CASA)(?:\s*\([^)]*\))?\s*:\s*/i;
  const inClinicHeaderMatch = normalizedPlan.match(inClinicHeaderPattern);
  const hepHeaderMatch = normalizedPlan.match(hepHeaderPattern);
  const hasInClinicHeader = inClinicHeaderMatch != null && inClinicHeaderMatch.index !== undefined;
  const hasHepHeader = hepHeaderMatch != null && hepHeaderMatch.index !== undefined;
  if (!hasInClinicHeader && !hasHepHeader) {
    return null;
  }
  const inStartIdx = hasInClinicHeader ? inClinicHeaderMatch!.index! : -1;
  const hepStartIdx = hasHepHeader ? hepHeaderMatch!.index! : -1;
  const inBodyStart = hasInClinicHeader ? inStartIdx + inClinicHeaderMatch![0].length : -1;
  const hepBodyStart = hasHepHeader ? hepStartIdx + hepHeaderMatch![0].length : -1;

  let inClinicSlice = '';
  let hepSlice = '';
  if (hasInClinicHeader && hasHepHeader) {
    const inFirst = inStartIdx < hepStartIdx;
    if (inFirst) {
      inClinicSlice = normalizedPlan.slice(inBodyStart, hepStartIdx).trim();
      hepSlice = normalizedPlan.slice(hepBodyStart).trim();
    } else {
      hepSlice = normalizedPlan.slice(hepBodyStart, inStartIdx).trim();
      inClinicSlice = normalizedPlan.slice(inBodyStart).trim();
    }
  } else if (hasInClinicHeader) {
    inClinicSlice = normalizedPlan.slice(inBodyStart).trim();
  } else if (hasHepHeader) {
    hepSlice = normalizedPlan.slice(hepBodyStart).trim();
  }
  const hasInClinicBody = inClinicSlice.length > 0;
  const hasHepBody = hepSlice.length > 0;
  if (!hasInClinicBody && !hasHepBody) {
    return null;
  }
  return { inClinicText: inClinicSlice, hepText: hepSlice };
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

function mergeOrphanedParentheticalLines(lines: string[]): string[] {
  const mergedLines: string[] = [];
  for (const line of lines) {
    const trimmedLine = line.trim();
    const isParentheticalLine = /^\(.+\)\.?$/.test(trimmedLine);
    const previousLineIndex = mergedLines.length - 1;
    const previousLine = mergedLines[previousLineIndex];
    let trimmedPreviousLine = '';
    if (previousLine !== undefined) {
      trimmedPreviousLine = previousLine.trim();
    }
    const hasPreviousItemLine = trimmedPreviousLine.length > 0;
    const previousLineEndsWithParentheses = /\)\.?$/.test(trimmedPreviousLine);
    const previousLineAcceptsParentheticalNote = !previousLineEndsWithParentheses;
    const isParentheticalLineWithPreviousItem = isParentheticalLine && hasPreviousItemLine;
    const shouldMergeWithPreviousLine = isParentheticalLineWithPreviousItem && previousLineAcceptsParentheticalNote;
    if (shouldMergeWithPreviousLine) {
      const mergedLine = `${trimmedPreviousLine} ${trimmedLine}`;
      mergedLines[previousLineIndex] = mergedLine;
      continue;
    }
    mergedLines.push(line);
  }
  return mergedLines;
}

/** Extrae ítems de un bloque (líneas no vacías, sin el bullet inicial). */
function linesToItems(lines: string[]): string[] {
  const items: string[] = [];
  const mergedLines = mergeOrphanedParentheticalLines(lines);
  for (const line of mergedLines) {
    const withoutMarkdown = line.replace(/\*\*/g, '');
    const withoutBullet = withoutMarkdown.replace(/^[\s•\-*]+\s*/, '');
    const normalizedInlineBullets = withoutBullet.replace(/\s+-\s+/g, '\n- ');
    const candidateSegments = normalizedInlineBullets.split('\n');
    for (const segment of candidateSegments) {
      const trimmed = segment.replace(/^[\s•\-*]+\s*/, '').trim();
      const withoutTrailingPunctuation = trimmed.replace(/[.;]\s*$/, '').trim();
      if (withoutTrailingPunctuation.length > 0) items.push(withoutTrailingPunctuation);
    }
  }
  return items;
}

function normalizePlanSummary(planSummary: string): string {
  const withoutMarkdown = planSummary.replace(/\*\*/g, '');
  const withoutTabs = withoutMarkdown.replace(/\t/g, ' ');
  const normalizedBullets = withoutTabs.replace(/\s+-\s+/g, '\n- ');
  const normalizedHeaders = normalizedBullets.replace(/(^[A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑ ()/-]{6,}:)/gm, '\n$1');
  const normalizedLanguage = ensureSpanishClinicalText(normalizedHeaders);
  return normalizedLanguage.trim();
}

/**
 * WO-FU-PLAN-SPLIT-01: Deriva in-clinic y HEP desde planSummary.
 * A) Secciones primero; B) línea por línea con keywords; C) híbridos → HEP; D) EN/ES.
 * Todo el texto del plan aparece en alguno de los dos bloques (no pérdida de información).
 */
export function derivePlanFromText(planInput: DerivePlanInput): DerivedPlan {
  const inClinic: string[] = [];
  const homeProgram: string[] = [];
  const planDocument = typeof planInput === 'object' && planInput !== null ? planInput : null;
  const inClinicText = planDocument?.inClinicText?.trim() ?? '';
  const homeProgramText = planDocument?.homeProgramText?.trim() ?? '';
  const hasStructuredPlanFields = Boolean(inClinicText || homeProgramText);

  if (hasStructuredPlanFields) {
    const splitStructuredText = (text: string): string[] => {
      const newlineSegments = text.split('\n');
      const flattenedSegments = newlineSegments.flatMap((segment) => segment.split(/\s-\s/g));
      return flattenedSegments;
    };
    const inClinicSegments = inClinicText ? splitStructuredText(inClinicText) : [];
    const homeProgramSegments = homeProgramText ? splitStructuredText(homeProgramText) : [];
    const inClinicLines = linesToItems(inClinicSegments);
    const homeProgramLines = linesToItems(homeProgramSegments);
    const structuredResult = {
      inClinic: [...new Set(inClinicLines)].filter(Boolean),
      homeProgram: [...new Set(homeProgramLines)].filter(Boolean),
    };
    return structuredResult;
  }

  const rawPlanSummary = typeof planInput === 'string' ? planInput : planDocument?.planText;
  const planSummary = rawPlanSummary ? normalizePlanSummary(rawPlanSummary) : rawPlanSummary;

  if (!planSummary || typeof planSummary !== 'string') {
    return { inClinic, homeProgram };
  }

  const structuredSections = trySplitStructuredPlanSections(planSummary);
  if (structuredSections) {
    const inClinicLines = structuredSections.inClinicText.split('\n');
    const hepLines = structuredSections.hepText.split('\n');
    const inClinicParsed = linesToItems(inClinicLines);
    const hepParsed = linesToItems(hepLines);
    const hasInClinicItems = inClinicParsed.length > 0;
    const hasHepItems = hepParsed.length > 0;
    if (hasInClinicItems || hasHepItems) {
      const inClinicDeduped = [...new Set(inClinicParsed)].filter(Boolean);
      const hepDeduped = [...new Set(hepParsed)].filter(Boolean);
      return { inClinic: inClinicDeduped, homeProgram: hepDeduped };
    }
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
    const allLines = planSummary
      .split(/\n/)
      .map(l => l.replace(/^[\s•\-*]+\s*/, '').trim())
      .flatMap((line) => line.split(/;(?=\s+[A-ZÁÉÍÓÚÑa-záéíóúñ])/))
      .map((line) => line.replace(/[.;]\s*$/, '').trim())
      .map((line) => line.trim())
      .filter(Boolean);
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
