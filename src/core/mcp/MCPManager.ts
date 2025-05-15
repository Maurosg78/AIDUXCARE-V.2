import { MCPContext, MCPMemoryBlock } from './schema';
import { buildMCPContext } from './MCPContextBuilder';
import {
  getContextualMemory,
  getPersistentMemory,
  getSemanticMemory,
  updateMemoryBlocks
} from "./MCPDataSourceSupabase";
import { AuditLogger } from './AuditLogger';

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

  /**
   * Guarda un contexto MCP actualizado en la base de datos
   * @param updatedContext Contexto MCP con cambios realizados por el usuario
   * @returns Boolean indicando si la operación fue exitosa
   */
  async saveContext(updatedContext: MCPContext): Promise<boolean> {
    try {
      // Primero recuperamos los bloques originales para auditoría
      const visitId = this.getVisitIdFromContext(updatedContext);
      const patientId = this.getPatientIdFromContext(updatedContext);
      
      if (!visitId) {
        console.error("[MCP] Error saving context: Missing visit_id");
        return false;
      }
      
      // Obtener los bloques originales
      const [contextualMemory, persistentMemory, semanticMemory] = await Promise.all([
        getContextualMemory(visitId),
        getPersistentMemory(patientId || ''),
        getSemanticMemory()
      ]);
      
      // Combinar los bloques originales
      const originalBlocks = [
        ...contextualMemory.map(block => ({ ...block, type: 'contextual' })),
        ...persistentMemory.map(block => ({ ...block, type: 'persistent' })),
        ...semanticMemory.map(block => ({ ...block, type: 'semantic' }))
      ];
      
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
      
      // Combinar todos los bloques actualizados
      const allBlocks = [
        ...contextualBlocks,
        ...persistentBlocks,
        ...semanticBlocks
      ];
      
      // Registrar operaciones en el log de auditoría
      // Por ahora utilizamos un ID de usuario fijo
      AuditLogger.logBlockUpdates(originalBlocks, allBlocks, "admin-test-001", visitId);
      
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

  /**
   * Obtiene el ID de visita del contexto
   * @param context Contexto MCP
   * @returns ID de visita o undefined si no se encuentra
   */
  private getVisitIdFromContext(context: MCPContext): string | undefined {
    // Buscar en los bloques contextuales primero, ya que suelen tener el visit_id
    for (const block of context.contextual.data) {
      if ('visit_id' in block && typeof block.visit_id === 'string') {
        return block.visit_id;
      }
    }
    
    // Si no lo encontramos, buscar en los bloques de memoria persistente
    for (const block of context.persistent.data) {
      if ('visit_id' in block && typeof block.visit_id === 'string') {
        return block.visit_id;
      }
    }
    
    // Si aún no lo encontramos, buscar en los bloques de memoria semántica
    for (const block of context.semantic.data) {
      if ('visit_id' in block && typeof block.visit_id === 'string') {
        return block.visit_id;
      }
    }
    
    return undefined;
  }
  
  /**
   * Obtiene el ID de paciente del contexto
   * @param context Contexto MCP
   * @returns ID de paciente o undefined si no se encuentra
   */
  private getPatientIdFromContext(context: MCPContext): string | undefined {
    // Buscar en los bloques de memoria persistente primero, ya que suelen tener el patient_id
    for (const block of context.persistent.data) {
      if ('patient_id' in block && typeof block.patient_id === 'string') {
        return block.patient_id;
      }
    }
    
    // Si no lo encontramos, buscar en los bloques contextuales
    for (const block of context.contextual.data) {
      if ('patient_id' in block && typeof block.patient_id === 'string') {
        return block.patient_id;
      }
    }
    
    // Si aún no lo encontramos, buscar en los bloques de memoria semántica
    for (const block of context.semantic.data) {
      if ('patient_id' in block && typeof block.patient_id === 'string') {
        return block.patient_id;
      }
    }
    
    return undefined;
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