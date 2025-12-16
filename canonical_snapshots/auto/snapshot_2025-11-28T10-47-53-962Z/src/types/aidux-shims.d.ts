/** Shims para módulos opcionales/legados: sólo tipos. */
declare module '../../services/geolocationService' { const x: any; export = x; }
declare module '../../data/spanishCities' { const x: any; export = x; }
declare module '../LegalChecklist' { const x: any; export = x; }
declare module '../../context/ProfessionalProfileContext' {
  export const useProfessionalProfile: any; const x: any; export default x;
}
declare module '../services/AudioCaptureServiceReal' { const x: any; export default x; }
declare module '../services/WebSpeechSTTService' { const x: any; export default x; }
declare module '../../components/professional/EnhancedAudioCapture' { const x: any; export default x; }
/** Corrige import nombrados no disponibles en tiempo de tipos */
declare module '@/integrations/firebase' {
  export const app: any; export const db: any; const def: any; export default def;
}
/** Tests utilitarios de FHIR que no están presentes */
declare module '../../../../../tests/utils/fhirTestUtils' { const x: any; export default x; }
