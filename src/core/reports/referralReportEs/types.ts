/**
 * Referral Report (ES) - Core Types
 *
 * Clinical-fact oriented model, FHIR-friendly and narrative-agnostic.
 * Rule: these types describe recorded clinical data and high-level
 * report sections, not UI or transport (PDF/HTML/FHIR) concerns.
 */

export interface ReferralReportPatientInfo {
  nombre: string;
  edad?: number;
  idHistoria?: string;
}

export interface ReferralReportEpisodeInfo {
  motivoPrincipal?: string;
  fechaInicio?: string; // already formatted for human consumption
}

export interface ReferralReportPainInfo {
  inicial?: number; // 0–10
  actual?: number; // 0–10
  contexto?: string; // "en reposo", "al esfuerzo", etc.
  localizacion?: string;
  irradiacion?: string;
  cursoTextoLibre?: string;
}

export interface ReferralReportMobilityItem {
  segmento: string; // e.g. "columna lumbar", "hombro derecho"
  rangoInicial?: string; // "60° de flexión"
  rangoActual?: string; // "80° de flexión"
}

export interface ReferralReportTestItem {
  nombre: string; // "Lasegue", "Neer"
  resultado: string; // "negativo", "dolor moderado", etc.
}

export interface ReferralReportTreatment {
  ejercicios?: string[];
  tecnicasManuales?: string[];
  educacion?: string[];
}

export interface ReferralReportPlan {
  frecuenciaSesiones?: string;
  horizonteTiempo?: string;
  objetivoPrincipal?: string;
  recomendacionesRevision?: string;
  textoLibre?: string;
}

/**
 * Clinical facts snapshot for one referral report.
 * All fields are optional: the generator must only use what exists.
 */
export interface ReferralReportData {
  paciente: ReferralReportPatientInfo;
  episodio?: ReferralReportEpisodeInfo;
  diagnosticoFuncional?: string;
  antecedentesRelevantes?: string;
  /** Optional human-readable session date (e.g. 18/03/2026). */
  sessionDate?: string;
  dolor?: ReferralReportPainInfo;
  movilidad?: ReferralReportMobilityItem[];
  tests?: ReferralReportTestItem[];
  evolucionTextoLibre?: string;
  tratamiento?: ReferralReportTreatment;
  plan?: ReferralReportPlan;
}

/**
 * Intermediate, narrative-agnostic structure for referral reports.
 * This allows rendering to text, PDF, HTML or FHIR Composition
 * from the same sectioned representation.
 */
export interface ReferralReportSections {
  headerLines: string[];
  /**
   * Optional clinical alert block (e.g. red flags / urgent findings).
   */
  alertLines?: string[];
  diagnosisParagraph?: string;
  evolutionParagraph?: string;
  findingsLines: string[];
  treatmentLines: string[];
  planParagraph?: string;
}

