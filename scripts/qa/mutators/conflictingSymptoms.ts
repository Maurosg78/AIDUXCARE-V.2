export const CONFLICTING_SYMPTOMS_ID = 'conflicting_symptoms' as const;

/** Contradicción narrativa leve para probar síntesis y priorización. */
export function conflictingSymptomsTranscript(transcript: string): string {
  const injection =
    '\n\nConflicto narrativo (mutación QA): la semana pasada refiere que mejoró bastante con reposo y actividad ligera, ' +
    'pero hoy insiste en que el dolor y la limitación están peor que en cualquier momento del último mes.';
  return (transcript + injection).trim();
}
