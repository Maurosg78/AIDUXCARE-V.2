/**
 * WO-METRICS-00: workflowSessionId = visitId (1 visita: initial / follow-up / discharge)
 * No generamos UUID; el visitId es la sesión clínica.
 */

export function getWorkflowSessionIdFromVisitId(visitId: string): string {
  return visitId;
}
