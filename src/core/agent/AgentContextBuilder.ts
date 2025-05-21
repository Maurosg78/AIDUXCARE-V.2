import { vi } from "vitest";
import { AgentContext, MemoryBlock } from '@/types/agent';
import supabase from '@/core/auth/supabaseClient';

/**
 * Construye un contexto estructurado para el agente LLM a partir del ID de la visita
 * 
 * @param visitId - ID de la visita para la cual construir el contexto
 * @returns Un objeto AgentContext limpio y estructurado
 */
export async function buildAgentContext(visitId: string): Promise<AgentContext> {
  try {
    // Obtener los bloques de memoria de la visita
    const { data: blocks, error } = await supabase
      .from('memory_blocks')
      .select('*')
      .eq('visit_id', visitId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return {
      visitId,
      blocks: blocks as MemoryBlock[],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };
  } catch (error) {
    console.error('Error al construir el contexto del agente:', error);
    throw error;
  }
}