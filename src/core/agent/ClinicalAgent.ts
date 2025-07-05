import supabase from "@/core/auth/supabaseClient";
import {
  AgentContext,
  AgentSuggestion,
  MemoryBlock,
  SuggestionType,
} from "@/types/agent";
import { v4 as uuidv4 } from "uuid";

/**
 * STUB: Genera sugerencias basadas en el contexto del agente
 *
 * Esta es una implementación simulada que genera sugerencias ficticias basadas
 * en el contenido de los bloques de memoria contextual y semántica.
 *
 * En una implementación real, esta función llamaría a un servicio LLM para generar
 * sugerencias basadas en un análisis más profundo del contexto.
 *
 * @param ctx El contexto del agente con los bloques de memoria
 * @returns Array de sugerencias generadas
 */
export async function getAgentSuggestions(
  ctx: AgentContext,
): Promise<AgentSuggestion[]> {
  // Asegurar que blocks sea un array
  const blocks = ctx.blocks || [];

  // Array para almacenar las sugerencias generadas
  const suggestions: AgentSuggestion[] = [];

  // Filtrar bloques de tipo contextual y semantico
  const contextualBlocks = blocks.filter(
    (block: MemoryBlock) => block.type === "contextual",
  );
  const semanticBlocks = blocks.filter(
    (block: MemoryBlock) => block.type === "semantic",
  );

  // STUB: Generar sugerencias basadas en bloques contextuales
  for (const block of contextualBlocks) {
    const now = new Date();
    // Solo generamos sugerencias para bloques que contengan ciertas palabras clave
    if (block.content.toLowerCase().includes("dolor")) {
      suggestions.push({
        id: uuidv4(),
        sourceBlockId: block.id,
        type: "recommendation",
        content:
          "Considerar evaluación de escala de dolor y administrar analgésicos según protocolo.",
        field: "symptoms",
        createdAt: now,
        updatedAt: now,
        context_origin: {
          source_block: block.id,
          text: "dolor",
        },
      });
    }

    if (
      block.content.toLowerCase().includes("presión") ||
      block.content.toLowerCase().includes("tension")
    ) {
      suggestions.push({
        id: uuidv4(),
        sourceBlockId: block.id,
        type: "warning",
        content:
          "Monitorizar tensión arterial cada 4 horas. Valores fuera de rango requieren atención.",
        field: "vitals",
        createdAt: now,
        updatedAt: now,
        context_origin: {
          source_block: block.id,
          text: "presión",
        },
      });
    }
  }

  // STUB: Generar sugerencias basadas en bloques semánticos
  for (const block of semanticBlocks) {
    const now = new Date();
    if (
      block.content.toLowerCase().includes("diabetes") ||
      block.content.toLowerCase().includes("glucosa")
    ) {
      suggestions.push({
        id: uuidv4(),
        sourceBlockId: block.id,
        type: "info",
        content:
          "Paciente con historial de diabetes. Considerar monitorización de glucemia.",
        field: "diagnosis",
        createdAt: now,
        updatedAt: now,
        context_origin: {
          source_block: block.id,
          text: "diabetes",
        },
      });
    }
  }

  // Si no se generaron sugerencias basadas en keywords, generar al menos 2 genéricas
  if (suggestions.length === 0) {
    const now = new Date();
    // Usar el primer bloque contextual si existe
    const sourceBlockId =
      contextualBlocks.length > 0
        ? contextualBlocks[0].id
        : semanticBlocks.length > 0
          ? semanticBlocks[0].id
          : "default-block-id";

    suggestions.push({
      id: uuidv4(),
      sourceBlockId,
      type: "info",
      content:
        "Recordar documentar signos vitales en cada visita según protocolo institucional.",
      field: "vitals",
      createdAt: now,
      updatedAt: now,
      context_origin: {
        source_block: sourceBlockId,
        text: "Recordar documentar signos vitales en cada visita según protocolo institucional.",
      },
    });

    suggestions.push({
      id: uuidv4(),
      sourceBlockId,
      type: "recommendation",
      content: "Evaluar estado de hidratación y balance hídrico del paciente.",
      field: "symptoms",
      createdAt: now,
      updatedAt: now,
      context_origin: {
        source_block: sourceBlockId,
        text: "Evaluar estado de hidratación y balance hídrico del paciente.",
      },
    });
  }

  return suggestions;
}

/**
 * Genera un resumen clínico basado en el contexto de la visita
 * @param visitId ID de la visita
 * @returns Resumen clínico en formato texto
 */
export async function runSummaryAgent(visitId: string): Promise<string> {
  try {
    // Obtener contexto completo de la visita
    const context = await buildAgentContext(visitId);

    // Filtrar bloques relevantes para el resumen
    const relevantBlocks: MemoryBlock[] = context.blocks.filter(
      (block: MemoryBlock) =>
        block.type === "contextual" ||
        block.type === "semantic" ||
        block.type === "clinical",
    );

    if (relevantBlocks.length === 0) {
      return "No hay suficiente información clínica para generar un resumen.";
    }

    // TODO: En el futuro, aquí se integrará con el LLM real
    // Por ahora, generamos un resumen simulado basado en los bloques
    const mockSummary = `Resumen clínico generado para la visita ${visitId}:

${relevantBlocks
  .map((block: MemoryBlock) => {
    switch (block.type) {
      case "contextual":
        return `Contexto: ${block.content}`;
      case "semantic":
        return `Análisis: ${block.content}`;
      case "clinical":
        return `Datos clínicos: ${block.content}`;
      default:
        return "";
    }
  })
  .filter(Boolean)
  .join("\n\n")}

Nota: Este es un resumen generado automáticamente. Por favor, revise y ajuste según sea necesario.`;

    return mockSummary;
  } catch (error) {
    console.error("Error al generar resumen clínico:", error);
    throw new Error("Error al generar el resumen clínico");
  }
}

export async function buildAgentContext(
  visitId: string,
): Promise<AgentContext> {
  try {
    // Obtener bloques de memoria para la visita
    const { data: blocks, error } = await supabase
      .from("memory_blocks")
      .select("*")
      .eq("visit_id", visitId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    const now = new Date();
    return {
      visitId,
      blocks: blocks || [], // Asegurar que blocks sea un array
      metadata: {
        createdAt: now,
        updatedAt: now,
      },
    };
  } catch (err) {
    console.error("Error building agent context:", err);
    // En caso de error, devolver un contexto con array vacío
    return {
      visitId,
      blocks: [],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
  }
}

export class ClinicalAgent {
  private context: AgentContext;
  private suggestions: AgentSuggestion[] = [];

  constructor(context: AgentContext) {
    this.context = context;
  }

  public static async create(visitId: string): Promise<ClinicalAgent> {
    const context = await buildAgentContext(visitId);
    return new ClinicalAgent(context);
  }

  public getSuggestions(): AgentSuggestion[] {
    return this.suggestions;
  }

  public addSuggestion(
    suggestion: Omit<AgentSuggestion, "createdAt" | "updatedAt">,
  ): void {
    const now = new Date();
    this.suggestions.push({
      ...suggestion,
      createdAt: now,
      updatedAt: now,
    });
  }

  public getContext(): AgentContext {
    return this.context;
  }

  public getMemoryBlocks(): MemoryBlock[] {
    return this.context.blocks;
  }

  public getSuggestionTypes(): SuggestionType[] {
    return [
      "diagnostic",
      "treatment",
      "followup",
      "contextual",
      "recommendation",
      "warning",
      "info",
    ];
  }
}
