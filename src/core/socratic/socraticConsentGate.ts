export interface SocraticConsentState {
  readonly personalizationFromPatientData?: boolean;
  readonly allowAssistantMemoryAcrossSessions?: boolean;
}

export const hasSocraticLongitudinalConsent = (
  consent: SocraticConsentState | null | undefined
): boolean => {
  const patientDataConsentGranted = consent?.personalizationFromPatientData === true;
  const longitudinalMemoryConsentGranted = consent?.allowAssistantMemoryAcrossSessions === true;
  return patientDataConsentGranted && longitudinalMemoryConsentGranted;
};
