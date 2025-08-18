import { AgentContext, AgentSuggestion, MemoryBlock } from '../../types/agent';

export class ClinicalAgent {
  private context: AgentContext;
  private suggestions: AgentSuggestion[] = [];

  constructor(visitId: string, patientId?: string) {
    this.context = {
      visitId,
      patientId,
      blocks: [],
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        patientId,
        visitDate: new Date().toISOString(),
      },
    };
  }

  async addMemoryBlock(content: string, type: MemoryBlock["type"]): Promise<string> {
    const block: MemoryBlock = {
      id: `block-${Date.now()}`,
      type,
      content,
      created_at: new Date().toISOString(),
    };

    this.context.blocks.push(block);
    this.context.metadata.updatedAt = new Date();
    
    return block.id;
  }

  async generateSuggestions(): Promise<AgentSuggestion[]> {
    // Lógica para generar sugerencias basadas en el contexto
    const suggestions: AgentSuggestion[] = [];
    
    for (const block of this.context.blocks) {
      if (block.type === "clinical") {
        suggestions.push({
          id: `suggestion-${Date.now()}`,
          type: "diagnostic",
          field: "diagnosis",
          content: `Análisis basado en: ${block.content}`,
          sourceBlockId: block.id,
          explanation: `Generado desde bloque clínico: ${block.id}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    this.suggestions = suggestions;
    return suggestions;
  }

  getContext(): AgentContext {
    return this.context;
  }

  getSuggestions(): AgentSuggestion[] {
    return this.suggestions;
  }
}
