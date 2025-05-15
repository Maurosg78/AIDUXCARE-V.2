import { z } from 'zod';

/**
 * Tipos de memoria en el MCP
 */
const MemoryTypeEnum = z.enum(['contextual', 'persistent', 'semantic']);

/**
 * Esquema para un bloque de memoria recuperado de fuentes de datos
 */
export const MCPMemoryBlockSchema = z.object({
  id: z.string(),
  created_at: z.string().datetime(),
  type: MemoryTypeEnum,
  content: z.string(),
  metadata: z.record(z.unknown()).optional(),
  visit_id: z.string().optional(),
  patient_id: z.string().optional(),
  tags: z.array(z.string()).optional(),
  // Propiedad agregada para soporte de validación de bloques (no se persiste en esta versión)
  validated: z.boolean().optional()
});

/**
 * Tipo para un bloque de memoria
 */
export type MCPMemoryBlock = z.infer<typeof MCPMemoryBlockSchema>;

/**
 * Esquema para un elemento de memoria individual
 * Modificado para permitir que created_at se use como timestamp si no existe
 */
const MemoryItemSchema = z.object({
  id: z.string(),
  // Permitimos que timestamp sea opcional si existe created_at
  timestamp: z.string().datetime().optional(),
  // Agregamos created_at como campo opcional para compatibilidad
  created_at: z.string().datetime().optional(),
  type: MemoryTypeEnum,
  content: z.string(),
  // Propiedad agregada para soporte de validación local (no persiste en versión actual)
  validated: z.boolean().optional()
})
// Transformar los datos para agregar timestamp si no existe pero hay created_at
.transform(data => {
  if (!data.timestamp && data.created_at) {
    return {
      ...data,
      timestamp: data.created_at
    };
  }
  return data;
})
// Refinamiento para asegurar que hay al menos timestamp o created_at
.refine(data => data.timestamp || data.created_at, {
  message: "Debe existir al menos 'timestamp' o 'created_at'"
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