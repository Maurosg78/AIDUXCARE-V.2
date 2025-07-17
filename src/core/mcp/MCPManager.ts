import { MCPMemoryBlock } from './schema';

export class MCPManager {
  async getContextForVisit(visitId: string): Promise<Record<string, unknown>> {
    return { context: 'mocked context for visitId ' + visitId };
  }

  async saveContext(visitId: string, context: Record<string, unknown>) {
    console.log(`[MCPManager] Context saved for ${visitId}`, context);
  }

  /**
   * Construye un contexto completo a partir de datos en Firestore (migrado)
   * @param visitId ID de la visita para obtener memoria contextual
   * @param patientId ID del paciente para obtener memoria persistente
   * @returns Contexto estructurado con datos de Firestore
   */
  async buildContext(visitId: string, patientId: string) {
    // TODO: Implementar integración real con Firestore
    // Por ahora, devolver estructura mockeada
    return {
      contextual: { source: 'firestore', data: [] },
      persistent: { source: 'firestore', data: [] },
      semantic: { source: 'firestore', data: [] }
    };
  }
}
