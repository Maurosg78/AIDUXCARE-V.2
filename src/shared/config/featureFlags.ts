export const featureFlags = {
  emrAdapter: (process.env.AIDUX_EMR_ADAPTER ?? 'fhir') as 'fhir' | 'jane' | 'noterro',
  spainPilot: (process.env.AIDUX_FEATURE_SPAIN_PILOT ?? 'false') === 'true',
} as const;
