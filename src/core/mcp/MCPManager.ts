import { MCPContext, MCPMemoryBlock } from './schema';
import { buildMCPContext } from './MCPContextBuilder';
import {
  getContextualMemory,
  getPersistentMemory,
  getSemanticMemory,
  // ❌ Desactivado hasta v2.2.1-persistence
  // updateMemoryBlocks
} from "./MCPDataSourceSupabase";

/**
 * Clase principal que gestiona la creación y orquestación del contexto MCP
 */
export class MCPManager {
  /**
   * Adapta los datos de Supabase al formato requerido por el esquema de validación
   * Específicamente, asegura que cada elemento tenga el campo timestamp
   */
  private adaptMemoryItems(items: MCPMemoryBlock[]): Array<Record<string, unknown>> {
    return (items || []).map(item => ({
      ...item,
      // Asegurar que existe timestamp, usando created_at si es necesario
      timestamp: item.created_at
    }));
  }

  /**
   * Construye un contexto MCP completo para una visita y paciente específicos
   * @param visitId Identificador de la visita
   * @param patientId Identificador del paciente
   * @returns Contexto MCP completo
   */
  async buildContext(visitId: string, patientId: string): Promise<MCPContext> {
    try {
      // Obtener las diferentes memorias en paralelo desde Supabase
      const [contextualMemory, persistentMemory, semanticMemory] = await Promise.all([
        getContextualMemory(visitId),
        getPersistentMemory(patientId),
        getSemanticMemory()
      ]);
      
      // Adaptar los datos al formato esperado por el esquema
      const adaptedContext = {
        contextual: { 
          source: "supabase", 
          data: this.adaptMemoryItems(contextualMemory || [])
        },
        persistent: { 
          source: "supabase", 
          data: this.adaptMemoryItems(persistentMemory || [])
        },
        semantic: { 
          source: "supabase", 
          data: this.adaptMemoryItems(semanticMemory || [])
        }
      };

      // Loguear la construcción del contexto
      console.log("[MCP] Context built:", JSON.stringify(adaptedContext, null, 2));
      
      // Validar y retornar el contexto MCP
      return buildMCPContext(
        adaptedContext.contextual,
        adaptedContext.persistent,
        adaptedContext.semantic
      );
    } catch (error) {
      console.error("[MCP] Error building context:", error);
      // En caso de error, devolver un contexto con arrays vacíos
      return buildMCPContext(
        { source: "supabase", data: [] },
        { source: "supabase", data: [] },
        { source: "supabase", data: [] }
      );
    }
  }

  // ❌ Desactivado hasta v2.2.1-persistence
  /**
   * Guarda un contexto MCP actualizado en la base de datos
   * @param updatedContext Contexto MCP con cambios realizados por el usuario
   * @returns Boolean indicando si la operación fue exitosa
   */
  /*
  async saveContext(updatedContext: MCPContext): Promise<boolean> {
    try {
      // Extrae todos los bloques de memoria de las diferentes secciones
      const contextualBlocks = updatedContext.contextual.data.map(block => ({
        ...block,
        type: 'contextual' // Asegurar que el tipo sea correcto
      }));
      
      const persistentBlocks = updatedContext.persistent.data.map(block => ({
        ...block,
        type: 'persistent' // Asegurar que el tipo sea correcto
      }));
      
      const semanticBlocks = updatedContext.semantic.data.map(block => ({
        ...block,
        type: 'semantic' // Asegurar que el tipo sea correcto
      }));
      
      // Combinar todos los bloques
      const allBlocks = [
        ...contextualBlocks,
        ...persistentBlocks,
        ...semanticBlocks
      ];
      
      // Actualizar los bloques en Supabase
      const result = await updateMemoryBlocks(allBlocks);
      
      // Loguear el resultado
      console.log(`[MCP] Context saved. Updated ${result.length} blocks.`);
      
      return true;
    } catch (error) {
      console.error("[MCP] Error saving context:", error);
      return false;
    }
  }
  */

  /**
   * Función temporal de simulación de guardado para la versión actual sin persistencia
   * @param updatedContext Contexto MCP con cambios realizados por el usuario
   * @returns Promise que siempre resuelve a true
   */
  async saveContext(updatedContext: MCPContext): Promise<boolean> {
    console.log("✅ Contexto validado y listo para guardar");
    console.log("[MCP] Persistencia real desactivada hasta v2.2.1-persistence");
    
    // Loguear los datos que se guardarían (para debugging y desarrollo)
    console.log("Datos que se guardarían:", JSON.stringify({
      contextual: updatedContext.contextual.data.length,
      persistent: updatedContext.persistent.data.length,
      semantic: updatedContext.semantic.data.length
    }));
    
    return true;
  }

  /**
   * Función de prueba para el MCP
   * @returns El resultado de la construcción de un contexto con datos de prueba
   */
  async testMCP(): Promise<void> {
    const testVisitId = "mock-visit-123";
    const testPatientId = "mock-patient-456";
    const context = await this.buildContext(testVisitId, testPatientId);
    console.log(JSON.stringify(context, null, 2));
  }
} 