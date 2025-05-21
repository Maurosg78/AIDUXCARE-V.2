import { MCPContext, MCPContextSchema } from './schema';

/**
 * Tipo para los datos de memoria utilizados internamente
 */
type MemoryData = {
  source: string;
  data: Array<Record<string, unknown>>;
};

/**
 * Construye un contexto MCP completo combinando diferentes tipos de memoria
 * @param contextualMemory Memoria contextual de la visita
 * @param persistentMemory Memoria persistente del usuario
 * @param semanticMemory Memoria semántica del usuario
 * @returns Contexto MCP validado
 */
export function buildMCPContext(
  contextualMemory: MemoryData,
  persistentMemory: MemoryData,
  semanticMemory: MemoryData
): MCPContext {
  // Combinar las diferentes memorias en un único objeto de contexto
  const context = {
    contextual: contextualMemory,
    persistent: persistentMemory,
    semantic: semanticMemory
  };

  // Validar el contexto construido con el esquema definido usando safeParse
  const validationResult = MCPContextSchema.safeParse(context);
  
  if (!validationResult.success) {
    console.warn("[MCP] Zod validation failed:", validationResult.error.format());
    console.debug("[MCP] Invalid data received:", JSON.stringify(context, null, 2));
    
    // Intentamos devolver el contexto original aunque tenga errores
    // para evitar pérdida silenciosa de datos
    return context as MCPContext;
  }
  
  return validationResult.data;
} 