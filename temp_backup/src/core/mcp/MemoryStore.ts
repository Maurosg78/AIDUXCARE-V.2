/**
 * Clase para gestionar el almacenamiento y recuperación de diferentes tipos de memoria en el MCP
 */
export class MemoryStore {
  /**
   * Obtiene la memoria contextual relacionada con una visita específica
   * @param visitId Identificador de la visita
   * @returns Datos de memoria contextual simulados
   */
  getContextualMemory(visitId: string) {
    // Simulación de datos de memoria contextual
    return {
      source: 'mock',
      data: [
        {
          id: `ctx-${visitId}`,
          timestamp: new Date().toISOString(),
          type: 'contextual',
          content: 'Información contextual de la visita actual'
        }
      ]
    };
  }

  /**
   * Obtiene la memoria persistente asociada a un usuario
   * @param userId Identificador del usuario
   * @returns Datos de memoria persistente simulados
   */
  getPersistentMemory(userId: string) {
    // Simulación de datos de memoria persistente
    return {
      source: 'mock',
      data: [
        {
          id: `per-${userId}`,
          timestamp: new Date().toISOString(),
          type: 'persistent',
          content: 'Historial médico persistente del paciente'
        }
      ]
    };
  }

  /**
   * Obtiene la memoria semántica asociada a un usuario
   * @param userId Identificador del usuario
   * @returns Datos de memoria semántica simulados
   */
  getSemanticMemory(userId: string) {
    // Simulación de datos de memoria semántica
    return {
      source: 'mock',
      data: [
        {
          id: `sem-${userId}`,
          timestamp: new Date().toISOString(),
          type: 'semantic',
          content: 'Conocimiento médico general aplicable al caso'
        }
      ]
    };
  }
} 