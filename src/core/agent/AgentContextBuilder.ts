import type { AgentContext, MemoryBlock } from "@/types/agent";
import supabase from "@/core/auth/supabaseClient";
import { MCPContext } from "@/core/mcp/schema";

interface RawMemoryBlock {
  id?: string;
  type?: string;
  content?: string;
  created_at?: string;
  visit_id?: string;
  patient_id?: string;
  timestamp?: string;
}

interface ExtendedMemoryBlock extends RawMemoryBlock {
  visit_id?: string;
  patient_id?: string;
}

/**
 * Normaliza una fecha a formato ISO sin milisegundos
 */
function normalizeDate(date: string | Date): string {
  const d = new Date(date);
  return d.toISOString().replace(/\.\d{3}Z$/, "Z");
}

/**
 * Valida si un bloque de memoria es válido
 */
function isValidMemoryBlock(block: RawMemoryBlock): block is MemoryBlock {
  if (!block) return false;

  // Validar campos requeridos
  if (typeof block.id !== "string" || !block.id) return false;
  if (typeof block.type !== "string" || !block.type) return false;
  if (typeof block.content !== "string" || !block.content.trim()) return false;

  // Validar que al menos una fecha sea válida
  const dateStr = block.created_at || block.timestamp;
  if (dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;
  }

  return true;
}

/**
 * Construye un contexto estructurado para el agente LLM a partir del ID de la visita
 *
 * @param visitId - ID de la visita para la cual construir el contexto
 * @returns Un objeto AgentContext limpio y estructurado
 */
export async function buildAgentContext(
  visitId: string,
): Promise<AgentContext> {
  try {
    // Obtener los bloques de memoria de la visita
    const { data: blocks, error } = await supabase
      .from("memory_blocks")
      .select("*")
      .eq("visit_id", visitId)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    // Filtrar y validar los bloques
    const validBlocks = (blocks || [])
      .filter(isValidMemoryBlock)
      .map((block) => ({
        id: block.id,
        type: block.type,
        content: block.content.trim(),
        created_at: normalizeDate(block.created_at),
      }));

    return {
      visitId,
      blocks: validBlocks,
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
  } catch (error) {
    console.error("Error al construir el contexto del agente:", error);
    throw error;
  }
}

/**
 * Construye un AgentContext a partir de un MCPContext (función pura para testing)
 */
export function buildAgentContextFromMCP(mcpContext: MCPContext): AgentContext {
  // Extraer visitId y patientId de los bloques si existen
  let visitId = "";
  let patientId = "";
  const blocks: MemoryBlock[] = [];

  // Unificar todos los bloques de los tres tipos
  const allBlocks = [
    ...(mcpContext.contextual?.data || []),
    ...(mcpContext.persistent?.data || []),
    ...(mcpContext.semantic?.data || []),
  ];

  for (const block of allBlocks) {
    // Validar bloque completo
    if (!isValidMemoryBlock(block)) continue;

    // Extraer visitId y patientId si existen en el bloque
    const blockWithExtras = block as ExtendedMemoryBlock;
    if (blockWithExtras.visit_id && !visitId) {
      visitId = blockWithExtras.visit_id;
    }
    if (blockWithExtras.patient_id && !patientId) {
      patientId = blockWithExtras.patient_id;
    }

    // Agregar bloque tipado con fecha normalizada
    blocks.push({
      id: block.id,
      type: block.type,
      content: block.content.trim(),
      created_at: normalizeDate(
        block.created_at || block.timestamp || new Date(),
      ),
    });
  }

  // Si no hay bloques válidos, mantener visitId vacío
  if (blocks.length === 0) {
    return {
      visitId: "",
      patientId: "",
      blocks: [],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
  }

  return {
    visitId,
    patientId,
    blocks,
    metadata: {
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };
}
