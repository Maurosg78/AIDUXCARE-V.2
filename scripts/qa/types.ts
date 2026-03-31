import type { ClinicalAnalysis } from '@/utils/cleanVertexResponse';
import type { PhysicalExamResult } from '@/types/vertex-ai';

/** visitType en JSON puede venir como follow_up */
export type QAVisitTypeInput = 'initial' | 'follow-up' | 'follow_up';

export interface QACaseFile {
  id: string;
  /** Si true, el gate (--gate) exige pass + estabilidad en este caso */
  critical?: boolean;
  description?: string;
  visitType: QAVisitTypeInput;
  transcript: string;
  /** Análisis Tab 1 parcial; se fusiona sobre plantilla vacía */
  analysis?: Partial<ClinicalAnalysis> | null;
  physicalTests: PhysicalExamResult[];
  patientContext?: {
    previousVisits?: number;
    lastVisitDate?: string;
    ongoingTreatment?: string;
    painScale?: string;
    patientAge?: number;
  };
  expectations?: QAExpectations;
}

export interface QAExpectations {
  /** Debe haber objeto soap (Vertex no cortó por guard) */
  expectSoap?: boolean;
  /** Al menos una sección SOAP con contenido sustancial */
  expectNonTrivialSoap?: boolean;
  /** false = solo evaluador básico (casos ambiguos / exploratorios) */
  clinicalStrict?: boolean;
  /**
   * true = el input describe mejora global; el SOAP no debe afirmar empeoramiento explícito
   * (no aplica si clinicalStrict === false).
   */
  trajectoryImprovement?: boolean;
  /** Cada string debe aparecer en el texto SOAP concatenado (insensible a mayúsculas) */
  mustContain?: string[];
  /** Ninguno debe aparecer en el texto SOAP */
  mustNotContain?: string[];
  /** Al menos uno debe aparecer (p. ej. sinónimos de urgencia) */
  suggestContainAny?: string[];
}

export interface QARunCaseResult {
  caseId: string;
  critical?: boolean;
  description?: string;
  /** Índice 0..N-1 cuando --runs > 1 */
  runIndex: number;
  /** Hash del SOAP para comparar estabilidad entre corridas */
  soapHash?: string;
  /** p. ej. strip_pain_scale; undefined si no hubo mutación */
  mutationId?: string;
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  /** Trazabilidad por corrida (modelo / prompt brain) */
  model?: string;
  promptBrainVersion?: string;
  input: {
    visitType: string;
    transcriptPreview: string;
  };
  output: {
    soap: import('@/types/vertex-ai').SOAPNote | null;
    metadata: unknown;
  };
  evaluation: {
    pass: boolean;
    checks: Record<string, boolean>;
    failures: string[];
  };
  error?: string;
}

export interface QAUnstableCaseSummary {
  caseId: string;
  critical?: boolean;
  mutationId?: string;
  runs: number;
  distinctSoapHashes: number;
  passCount: number;
  failCount: number;
  reasons: string[];
}

export interface QARunReport {
  schemaVersion: 3;
  startedAt: string;
  finishedAt: string;
  gitSha: string | null;
  /** Igual que en entorno de build / .env */
  promptBrainVersion?: string;
  nodeVersion: string;
  env: {
    viteEnableEsPilot: boolean;
    firebaseProject?: string;
  };
  /** Opciones de esta corrida */
  runOptions?: {
    runsPerCase: number;
    mutatorId?: string;
    gate?: boolean;
  };
  gate?: {
    enabled: boolean;
    ok: boolean;
    reasons: string[];
    thresholds: { passRateMin: number; p95MaxMs: number };
  };
  cases: QARunCaseResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
  aggregate?: {
    passRate: number;
    /** Fracción de grupos (caso×mutador) con ≥2 corridas donde todas comparten el mismo soapHash */
    stabilityRate: number;
    /** Media de (hashes distintos / n corridas) por grupo multi-corrida; 0 si no hay grupos ≥2 */
    distinctHashRate: number;
    latencyMs: { mean: number; p95: number; max: number };
    failuresByRule: Record<string, number>;
    unstableCases: QAUnstableCaseSummary[];
  };
}
