import { vi } from "vitest";
import * as SupabaseDataSource from './MCPDataSourceSupabase';
import { MCPMemoryBlock } from './schema';

export class MCPManager {
  async getContextForVisit(visitId: string): Promise<any> {
    return { context: 'mocked context for visitId ' + visitId };
  }

  async saveContext(visitId: string, context: any) {
    console.log(`[MCPManager] Context saved for ${visitId}`, context);
  }

  /**
   * Construye un contexto completo a partir de datos en Supabase
   * @param visitId ID de la visita para obtener memoria contextual
   * @param patientId ID del paciente para obtener memoria persistente
   * @returns Contexto estructurado con datos de supabase
   */
  async buildContext(visitId: string, patientId: string) {
    try {
      // Intentar obtener datos de memoria contextual
      // Si falla, devolver estructura base con arrays vacíos
      const contextualPromise = SupabaseDataSource.getContextualMemory(visitId);
      
      try {
        await contextualPromise;
      } catch (error) {
        console.error('[MCPManager] Error al obtener memoria contextual:', error);
        // Si falla la memoria contextual, devolvemos un contexto vacío
        return {
          contextual: { source: 'supabase', data: [] },
          persistent: { source: 'supabase', data: [] },
          semantic: { source: 'supabase', data: [] }
        };
      }
      
      // Si llegamos aquí, la memoria contextual fue exitosa
      // Obtener el resto de datos
      const [contextualMemory, persistentMemory, semanticMemory] = await Promise.all([
        contextualPromise,
        SupabaseDataSource.getPersistentMemory(patientId).catch(() => []),
        SupabaseDataSource.getSemanticMemory().catch(() => [])
      ]);

      // Procesar los bloques de memoria
      const processBlocks = (blocks: MCPMemoryBlock[] = []) => 
        blocks.map(block => ({
          id: block.id,
          created_at: block.created_at,
          type: block.type,
          content: block.content,
          timestamp: block.created_at,
        }));

      // Construir el objeto de contexto final
      return {
        contextual: { 
          source: 'supabase', 
          data: processBlocks(contextualMemory) 
        },
        persistent: { 
          source: 'supabase', 
          data: processBlocks(persistentMemory) 
        },
        semantic: { 
          source: 'supabase', 
          data: processBlocks(semanticMemory) 
        }
      };
    } catch (error) {
      console.error('[MCPManager] Error inesperado al construir contexto:', error);
      // En caso de error, devolver estructura base con arrays vacíos
      return {
        contextual: { source: 'supabase', data: [] },
        persistent: { source: 'supabase', data: [] },
        semantic: { source: 'supabase', data: [] }
      };
    }
  }
}
