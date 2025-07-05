import supabase from "@/core/auth/supabaseClient";
import { MCPMemoryBlock, MCPMemoryBlockSchema } from "./schema";
import { SupabaseClient, PostgrestError } from "@supabase/supabase-js";

// Función de ayuda para manejar errores de Supabase y registrar detalles
const handleSupabaseError = (operation: string, error: PostgrestError) => {
  const errorMessage = error?.message || "Error desconocido";
  const statusCode = error?.code || "N/A";
  console.error(
    `Error en operación de Supabase [${operation}]: ${errorMessage} (código: ${statusCode})`,
  );

  // Registrar detalles adicionales en desarrollo
  if (import.meta.env.DEV) {
    console.error("Detalles completos del error:", error);
  }

  return [];
};

/**
 * Recupera datos de memoria contextual para una visita específica desde Supabase
 * @param visitId Identificador único de la visita
 * @returns Array de bloques de memoria contextual
 */
export async function getContextualMemory(
  visitId: string,
): Promise<MCPMemoryBlock[]> {
  try {
    if (!visitId) {
      console.warn(
        "Se intentó recuperar memoria contextual sin proporcionar un ID de visita válido",
      );
      return [];
    }

    // Verificar que supabase esté inicializado correctamente
    const client = supabase as SupabaseClient;
    if (!client || !client.from) {
      console.error("Cliente de Supabase no disponible o mal inicializado");
      return [];
    }

    const { data, error } = await client
      .from("contextual_memory")
      .select("*")
      .eq("visit_id", visitId)
      .order("created_at", { ascending: false });

    if (error) {
      return handleSupabaseError("getContextualMemory", error);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Validar los datos con el esquema Zod - manejo más robusto para tests
    try {
      const validationResult = MCPMemoryBlockSchema.array().safeParse(data);
      if (!validationResult.success) {
        console.error(
          "Error de validación en memoria contextual:",
          validationResult.error,
        );
        return [];
      }
      return validationResult.data;
    } catch (validationError) {
      console.error(
        "Error inesperado durante la validación de datos:",
        validationError,
      );
      return [];
    }
  } catch (error) {
    console.error("Error inesperado al recuperar memoria contextual:", error);
    return [];
  }
}

/**
 * Recupera datos de memoria persistente para un paciente específico desde Supabase
 * @param patientId Identificador único del paciente
 * @returns Array de bloques de memoria persistente
 */
export async function getPersistentMemory(
  patientId: string,
): Promise<MCPMemoryBlock[]> {
  try {
    if (!patientId) {
      console.warn(
        "Se intentó recuperar memoria persistente sin proporcionar un ID de paciente válido",
      );
      return [];
    }

    // Verificar que supabase esté inicializado correctamente
    const client = supabase as SupabaseClient;
    if (!client || !client.from) {
      console.error("Cliente de Supabase no disponible o mal inicializado");
      return [];
    }

    const { data, error } = await client
      .from("persistent_memory")
      .select("*")
      .eq("patient_id", patientId)
      .order("created_at", { ascending: false });

    if (error) {
      return handleSupabaseError("getPersistentMemory", error);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Validar los datos con el esquema Zod - manejo más robusto para tests
    try {
      const validationResult = MCPMemoryBlockSchema.array().safeParse(data);
      if (!validationResult.success) {
        console.error(
          "Error de validación en memoria persistente:",
          validationResult.error,
        );
        return [];
      }
      return validationResult.data;
    } catch (validationError) {
      console.error(
        "Error inesperado durante la validación de datos:",
        validationError,
      );
      return [];
    }
  } catch (error) {
    console.error("Error inesperado al recuperar memoria persistente:", error);
    return [];
  }
}

/**
 * Recupera datos de memoria semántica general desde Supabase
 * @returns Array de bloques de memoria semántica
 */
export async function getSemanticMemory(): Promise<MCPMemoryBlock[]> {
  try {
    // Verificar que supabase esté inicializado correctamente
    const client = supabase as SupabaseClient;
    if (!client || !client.from) {
      console.error("Cliente de Supabase no disponible o mal inicializado");
      return [];
    }

    const { data, error } = await client
      .from("semantic_memory")
      .select("*")
      .eq("type", "semantic")
      .order("created_at", { ascending: false });

    if (error) {
      return handleSupabaseError("getSemanticMemory", error);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Validar los datos con el esquema Zod - manejo más robusto para tests
    try {
      const validationResult = MCPMemoryBlockSchema.array().safeParse(data);
      if (!validationResult.success) {
        console.error(
          "Error de validación en memoria semántica:",
          validationResult.error,
        );
        return [];
      }
      return validationResult.data;
    } catch (validationError) {
      console.error(
        "Error inesperado durante la validación de datos:",
        validationError,
      );
      return [];
    }
  } catch (error) {
    console.error("Error inesperado al recuperar memoria semántica:", error);
    return [];
  }
}

/**
 * Actualiza múltiples bloques de memoria en las tablas correspondientes
 * @param blocks Array de bloques de memoria a actualizar
 * @returns Array con los IDs de los bloques actualizados exitosamente
 */
export async function updateMemoryBlocks(
  blocks: Record<string, unknown>[],
): Promise<string[]> {
  if (!blocks || blocks.length === 0) {
    return [];
  }

  try {
    // Verificar que supabase esté inicializado correctamente
    const client = supabase as SupabaseClient;
    if (!client || !client.from) {
      console.error("Cliente de Supabase no disponible o mal inicializado");
      return [];
    }

    // Agrupar bloques por tipo para actualizarlos en sus respectivas tablas
    const contextualBlocks = blocks.filter(
      (block) => block.type === "contextual",
    );
    const persistentBlocks = blocks.filter(
      (block) => block.type === "persistent",
    );
    const semanticBlocks = blocks.filter((block) => block.type === "semantic");

    // Función para actualizar un bloque en la tabla correspondiente
    const updateBlock = async (
      block: Record<string, unknown>,
      tableName: string,
    ): Promise<string | null> => {
      try {
        const { id, content, metadata, validated } = block;

        if (!id) return null;

        // Solo actualizamos content, metadata y validated
        // Los demás campos permanecen iguales para mantener la trazabilidad
        const { error } = await client
          .from(tableName)
          .update({
            content,
            metadata,
            validated,
          })
          .eq("id", id);

        if (error) {
          console.error(
            `Error al actualizar bloque ${id} en ${tableName}:`,
            error.message,
          );
          return null;
        }

        return id as string;
      } catch (err) {
        console.error(
          `Error inesperado al actualizar bloque en ${tableName}:`,
          err,
        );
        return null;
      }
    };

    // Actualizar todos los bloques en paralelo
    const updatePromises: Promise<string | null>[] = [
      ...contextualBlocks.map((block) =>
        updateBlock(block, "contextual_memory"),
      ),
      ...persistentBlocks.map((block) =>
        updateBlock(block, "persistent_memory"),
      ),
      ...semanticBlocks.map((block) => updateBlock(block, "semantic_memory")),
    ];

    const results = await Promise.all(updatePromises);

    // Filtrar resultados nulos (actualizaciones fallidas)
    const updatedIds = results.filter((id) => id !== null) as string[];

    return updatedIds;
  } catch (error) {
    console.error("Error al actualizar bloques de memoria:", error);
    return [];
  }
}
