import { v4 as uuidv4 } from 'uuid';

/**
 * Interfaz que define la estructura de un bloque de memoria semántica
 */
export interface SemanticMemoryBlock {
  id: string;
  visit_id: string;
  patient_id: string;
  user_id: string;
  concept: string;
  category: string; // Ej: "diagnóstico", "riesgo", "alerta", "observación"
  importance: "low" | "medium" | "high";
  relevance_score: number; // entre 0 y 1
  source_block_id?: string;
  source_text?: string;
  created_at: string;
}

/**
 * Servicio para gestionar bloques de memoria semántica
 * Implementación inicial con almacenamiento en memoria (in-memory),
 * preparado para migración futura a Supabase
 */
export class SemanticMemoryService {
  // Almacenamiento en memoria para desarrollo y pruebas
  private static _semanticBlocks: SemanticMemoryBlock[] = [];

  /**
   * Guarda un bloque de memoria semántica
   * @param block El bloque a guardar
   * @returns Promise<boolean> Resultado de la operación
   */
  public async saveSemanticBlock(block: SemanticMemoryBlock): Promise<boolean> {
    try {
      // Validación básica
      if (!block.visit_id || !block.patient_id || !block.user_id || !block.concept) {
        console.error('Error: Campos obligatorios faltantes en bloque semántico');
        return false;
      }

      // Validación de relevance_score
      if (block.relevance_score < 0 || block.relevance_score > 1) {
        console.error('Error: relevance_score debe estar entre 0 y 1');
        return false;
      }

      // Asegurar que el bloque tiene ID y timestamp
      const blockToSave: SemanticMemoryBlock = {
        ...block,
        id: block.id || uuidv4(),
        created_at: block.created_at || new Date().toISOString()
      };

      // Si el bloque ya existe (mismo ID), actualizarlo
      const existingIndex = SemanticMemoryService._semanticBlocks.findIndex(b => b.id === blockToSave.id);
      if (existingIndex >= 0) {
        SemanticMemoryService._semanticBlocks[existingIndex] = blockToSave;
      } else {
        // Si no existe, agregarlo al array
        SemanticMemoryService._semanticBlocks.push(blockToSave);
      }

      /* 
      // Código para migración futura a Supabase
      // const { data, error } = await supabase
      //   .from('semantic_memory')
      //   .upsert(blockToSave)
      //   .select();
      // 
      // if (error) {
      //   console.error('Error al guardar bloque semántico en Supabase:', error);
      //   return false;
      // }
      // 
      // return !!data;
      */

      return true;
    } catch (error) {
      console.error('Error al guardar bloque semántico:', error);
      return false;
    }
  }

  /**
   * Obtiene los bloques semánticos asociados a una visita específica
   * @param visitId ID de la visita
   * @returns Promise<SemanticMemoryBlock[]> Array de bloques semánticos
   */
  public async getSemanticBlocksByVisit(visitId: string): Promise<SemanticMemoryBlock[]> {
    try {
      if (!visitId) {
        console.error('Error: visitId es requerido');
        return [];
      }

      // Filtrar bloques por visitId
      const blocks = SemanticMemoryService._semanticBlocks.filter(
        block => block.visit_id === visitId
      );

      /*
      // Código para migración futura a Supabase
      // const { data, error } = await supabase
      //   .from('semantic_memory')
      //   .select('*')
      //   .eq('visit_id', visitId);
      // 
      // if (error) {
      //   console.error('Error al obtener bloques semánticos de Supabase:', error);
      //   return [];
      // }
      // 
      // return data || [];
      */

      return blocks;
    } catch (error) {
      console.error('Error al obtener bloques semánticos por visita:', error);
      return [];
    }
  }

  /**
   * Obtiene bloques semánticos importantes para un paciente con un puntaje mínimo de relevancia
   * @param patientId ID del paciente
   * @param minScore Puntaje mínimo de relevancia (entre 0 y 1)
   * @returns Promise<SemanticMemoryBlock[]> Array de bloques semánticos importantes
   */
  public async getImportantSemanticBlocksByPatient(
    patientId: string,
    minScore: number
  ): Promise<SemanticMemoryBlock[]> {
    try {
      if (!patientId) {
        console.error('Error: patientId es requerido');
        return [];
      }

      // Validar minScore
      const validatedMinScore = Math.max(0, Math.min(1, minScore));

      // Filtrar bloques por patientId y relevance_score
      const blocks = SemanticMemoryService._semanticBlocks.filter(
        block => block.patient_id === patientId && block.relevance_score >= validatedMinScore
      );

      // Ordenar por relevance_score (mayor a menor)
      const sortedBlocks = [...blocks].sort(
        (a, b) => b.relevance_score - a.relevance_score
      );

      /*
      // Código para migración futura a Supabase
      // const { data, error } = await supabase
      //   .from('semantic_memory')
      //   .select('*')
      //   .eq('patient_id', patientId)
      //   .gte('relevance_score', validatedMinScore)
      //   .order('relevance_score', { ascending: false });
      // 
      // if (error) {
      //   console.error('Error al obtener bloques semánticos importantes de Supabase:', error);
      //   return [];
      // }
      // 
      // return data || [];
      */

      return sortedBlocks;
    } catch (error) {
      console.error('Error al obtener bloques semánticos importantes:', error);
      return [];
    }
  }

  /**
   * Elimina un bloque semántico por su ID
   * @param id ID del bloque a eliminar
   * @returns Promise<boolean> Resultado de la operación
   */
  public async deleteSemanticBlock(id: string): Promise<boolean> {
    try {
      if (!id) {
        console.error('Error: id es requerido para eliminar un bloque semántico');
        return false;
      }

      // Obtener el índice del bloque a eliminar
      const blockIndex = SemanticMemoryService._semanticBlocks.findIndex(
        block => block.id === id
      );

      // Si el bloque existe, eliminarlo
      if (blockIndex >= 0) {
        SemanticMemoryService._semanticBlocks.splice(blockIndex, 1);
        return true;
      }

      /*
      // Código para migración futura a Supabase
      // const { error } = await supabase
      //   .from('semantic_memory')
      //   .delete()
      //   .eq('id', id);
      // 
      // if (error) {
      //   console.error('Error al eliminar bloque semántico de Supabase:', error);
      //   return false;
      // }
      // 
      // return true;
      */

      // Si no se encontró el bloque, devolver false
      return false;
    } catch (error) {
      console.error('Error al eliminar bloque semántico:', error);
      return false;
    }
  }

  /**
   * Método para acceso controlado al almacenamiento interno (solo para testing)
   * @returns Array de bloques semánticos
   */
  public static _getSemanticBlocksArray(): SemanticMemoryBlock[] {
    return SemanticMemoryService._semanticBlocks;
  }

  /**
   * Método para restablecer el almacenamiento interno (solo para testing)
   */
  public static _resetSemanticBlocksArray(): void {
    SemanticMemoryService._semanticBlocks = [];
  }
} 