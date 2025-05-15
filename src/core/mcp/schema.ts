import { z } from 'zod';

/**
 * Tipos de memoria en el MCP
 */
const MemoryTypeEnum = z.enum(['contextual', 'persistent', 'semantic']);

/**
 * Esquema para un elemento de memoria individual
 */
const MemoryItemSchema = z.object({
  id: z.string(),
  timestamp: z.string().datetime(),
  type: MemoryTypeEnum,
  content: z.string()
});

/**
 * Esquema para un conjunto de datos de memoria
 */
const MemoryDataSchema = z.object({
  source: z.string(),
  data: z.array(MemoryItemSchema)
});

/**
 * Esquema para validar la estructura del contexto MCP
 */
export const MCPContextSchema = z.object({
  contextual: MemoryDataSchema,
  persistent: MemoryDataSchema,
  semantic: MemoryDataSchema
});

/**
 * Tipo inferido del esquema MCPContext
 */
export type MCPContext = z.infer<typeof MCPContextSchema>; 