/* Módulos que podrían no existir aún en el árbol real */
declare module '../../components/professional/EnhancedAudioCapture' {
  import React from 'react';
  export const EnhancedAudioCapture: React.FC<any>;
  export default EnhancedAudioCapture;
}
declare module '../services/AudioCaptureServiceReal' {
  export type CaptureStatus = 'idle'|'recording'|'stopped';
  export interface CaptureSession { stop: () => void; }
  export const AudioCaptureServiceReal: { start: (opts?: any) => Promise<CaptureSession> };
}
declare module '../services/WebSpeechSTTService' {
  export class WebSpeechSTTService { start(): void; stop(): void; }
}

/* Tipos que ModelSelector intenta importar desde PromptFactory */
declare module './PromptFactory' {
  export type CaseComplexity = 'low'|'medium'|'high';
  export type MedicalSpecialty = 'fisioterapia'|'psicologia'|'medicina_general';
}

/* Compat con vi.mocked y compañía (tests) */
declare const vi: any;

/* Relaja tipos usados por la UI si el modelo real es más estricto */
declare interface ClinicalEntity { id?: string; text?: string; type?: string; }
declare interface ClinicalAnalysis {
  entities?: ClinicalEntity[];
  redFlags?: any[];
  yellowFlags?: string[];
  evaluaciones_fisicas_sugeridas?: string[];
  rawResponse?: string;
}

/* FHIR comodín para tests utilitarios */
type FhirBundle = any;
