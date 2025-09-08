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
declare module './PromptFactory' {
  export type CaseComplexity = 'low'|'medium'|'high';
  export type MedicalSpecialty = 'fisioterapia'|'psicologia'|'medicina_general';
}
declare const vi: any;
interface ClinicalEntity { id?: string; text?: string; type?: string; }
interface ClinicalAnalysis {
  entities?: ClinicalEntity[];
  redFlags?: any[];
  yellowFlags?: string[];
  evaluaciones_fisicas_sugeridas?: string[];
  rawResponse?: string;
}
type FhirBundle = any;
