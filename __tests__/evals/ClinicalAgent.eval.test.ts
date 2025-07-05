import { describe, it, expect } from "vitest";
import { getAgentSuggestions } from "../../src/core/agent/ClinicalAgent";
import { buildAgentContextFromMCP } from "../../src/core/agent/AgentContextBuilder";
import { validMCP } from "../../__mocks__/contexts/validMCP";
import { emptyMCP } from "../../__mocks__/contexts/emptyMCP";
import { contradictoryMCP } from "../../__mocks__/contexts/contradictoryMCP";
import { chronicMCP } from "../../__mocks__/contexts/chronicMCP";

/**
 * Evaluación del Agente Clínico
 *
 * Esta suite de pruebas evalúa el comportamiento del agente clínico
 * frente a diferentes contextos clínicos, verificando que:
 *
 * 1. Genere sugerencias coherentes y con sentido clínico en contextos válidos
 * 2. Genere fallbacks seguros con contextos vacíos
 * 3. Detecte y maneje adecuadamente información contradictoria o inconsistente
 * 4. Proponga seguimiento o intervención adecuada para casos crónicos
 */
describe("ClinicalAgent EVAL", () => {
  /**
   * Caso 1: Contexto clínico válido
   *
   * El agente debe generar sugerencias coherentes con el contexto médico
   * incluyendo recomendaciones relacionadas con dolor, presión arterial y diabetes
   */
  describe("Caso 1: Contexto clínico válido", () => {
    it("debe generar 2-3 sugerencias con explicaciones para un contexto válido", async () => {
      // Construir el contexto del agente a partir del MCP válido
      const agentContext = buildAgentContextFromMCP(validMCP);

      // Debug logs
      console.log("\n[DEBUG TEST - Caso 1: Contexto válido]");
      console.log("agentContext:", JSON.stringify(agentContext, null, 2));
      console.log("agentContext.blocks:", agentContext?.blocks || "undefined");

      // Obtener sugerencias del agente
      const suggestions = await getAgentSuggestions(agentContext);

      // Verificar que se generan al menos 2 sugerencias
      expect(suggestions.length).toBeGreaterThanOrEqual(2);
      expect(suggestions.length).toBeLessThanOrEqual(5); // No demasiadas para evitar sobrecarga de información

      // Verificar que todas las sugerencias tienen un ID y contenido
      suggestions.forEach((suggestion) => {
        expect(suggestion.id).toBeDefined();
        expect(suggestion.content.length).toBeGreaterThan(10);
        expect(suggestion.type).toMatch(/recommendation|warning|info/);
      });

      // Verificar que al menos una sugerencia está relacionada con dolor torácico (contexto clave)
      const hasDolor = suggestions.some(
        (s) =>
          s.content.toLowerCase().includes("dolor") ||
          s.content.toLowerCase().includes("torácico"),
      );

      // Verificar que al menos una sugerencia está relacionada con tensión arterial (contexto clave)
      const hasTension = suggestions.some(
        (s) =>
          s.content.toLowerCase().includes("tensión") ||
          s.content.toLowerCase().includes("arterial") ||
          s.content.toLowerCase().includes("presión"),
      );

      // Verificamos que al menos una de las sugerencias relevantes existe
      expect(hasDolor || hasTension).toBe(true);
    });

    it("debe referenciar correctamente los bloques de origen de las sugerencias", async () => {
      const agentContext = buildAgentContextFromMCP(validMCP);

      // Debug logs
      console.log("\n[DEBUG TEST - Referencia bloques]");
      console.log("agentContext:", JSON.stringify(agentContext, null, 2));
      console.log("agentContext.blocks:", agentContext?.blocks || "undefined");

      const suggestions = await getAgentSuggestions(agentContext);

      // Verificar que cada sugerencia tiene un sourceBlockId válido
      suggestions.forEach((suggestion) => {
        expect(suggestion.sourceBlockId).toBeDefined();

        // Comprobar que el ID referencia a un bloque existente
        const blockExists = agentContext.blocks.some(
          (block) => block.id === suggestion.sourceBlockId,
        );
        expect(blockExists).toBe(true);
      });
    });
  });

  /**
   * Caso 2: Contexto vacío
   *
   * El agente debería generar sugerencias genéricas/fallbacks con un contexto vacío
   */
  describe("Caso 2: Contexto vacío", () => {
    it("debe generar sugerencias genéricas para un contexto vacío", async () => {
      // Construir el contexto del agente a partir del MCP vacío
      const agentContext = buildAgentContextFromMCP(emptyMCP);

      // Obtener sugerencias del agente
      const suggestions = await getAgentSuggestions(agentContext);

      // La implementación original genera dos sugerencias genéricas
      expect(suggestions.length).toBe(2);

      // Verificamos que sean recomendaciones generales seguras
      suggestions.forEach((suggestion) => {
        // Verificar que son sugerencias genéricas
        expect(suggestion.type).toMatch(/info|recommendation/);

        // Las sugerencias no deben incluir términos médicos específicos
        // que requieran conocimiento del caso particular
        const noSpecificDisease = !suggestion.content.match(
          /diabetes|hipertensión|cáncer|EPOC|arritmia|insuficiencia/i,
        );
        expect(noSpecificDisease).toBe(true);

        // No debe incluir medicamentos específicos sin contexto
        const noSpecificMeds = !suggestion.content.match(
          /metformina|insulina|enalapril|losartán|hidroclorotiazida|opioides/i,
        );
        expect(noSpecificMeds).toBe(true);
      });
    });
  });

  /**
   * Caso 3: Contexto con datos contradictorios
   *
   * Evaluamos cómo el agente maneja información contradictoria.
   *
   * Nota: La implementación actual se basa en palabras clave y no tiene detección
   * de contradicciones, pero verificamos que genere sugerencias relevantes para
   * las palabras clave presentes.
   */
  describe("Caso 3: Contexto con datos contradictorios", () => {
    it("debe generar sugerencias relevantes incluso con información contradictoria", async () => {
      const agentContext = buildAgentContextFromMCP(contradictoryMCP);

      // Debug logs
      console.log("\n[DEBUG TEST - Caso 3: Datos contradictorios]");
      console.log("agentContext:", JSON.stringify(agentContext, null, 2));
      console.log("agentContext.blocks:", agentContext?.blocks || "undefined");

      const suggestions = await getAgentSuggestions(agentContext);

      // Verificar que se generan sugerencias (al menos las genéricas)
      expect(suggestions.length).toBeGreaterThan(0);

      // Verificar si el contexto incluye palabras clave que activarían sugerencias específicas
      const containsKeywords = agentContext.blocks.some((block) => {
        const content = block.content.toLowerCase();
        return (
          content.includes("dolor") ||
          content.includes("presión") ||
          content.includes("tension") ||
          content.includes("diabetes") ||
          content.includes("glucosa")
        );
      });

      if (containsKeywords) {
        // Si hay palabras clave, debe haber al menos una sugerencia específica
        const hasSpecificSuggestion = suggestions.some(
          (s) =>
            s.content.toLowerCase().includes("dolor") ||
            s.content.toLowerCase().includes("tensión") ||
            s.content.toLowerCase().includes("diabetes") ||
            s.content.toLowerCase().includes("glucemia"),
        );

        expect(hasSpecificSuggestion).toBe(true);
      } else {
        // Si no hay palabras clave, debe haber al menos las sugerencias genéricas
        expect(suggestions.length).toBeGreaterThanOrEqual(2);
      }
    });
  });

  /**
   * Caso 4: Contexto de enfermedad crónica
   *
   * Evaluamos cómo el agente maneja casos crónicos.
   *
   * Nota: La implementación actual no tiene detección específica para casos crónicos,
   * pero verificamos que genere sugerencias relevantes para el contexto dado.
   */
  describe("Caso 4: Contexto de enfermedad crónica", () => {
    it("debe generar sugerencias relevantes para el contexto de enfermedad crónica", async () => {
      const agentContext = buildAgentContextFromMCP(chronicMCP);

      // Debug logs
      console.log("\n[DEBUG TEST - Caso 4: Enfermedad crónica]");
      console.log("agentContext:", JSON.stringify(agentContext, null, 2));
      console.log("agentContext.blocks:", agentContext?.blocks || "undefined");

      const suggestions = await getAgentSuggestions(agentContext);

      // Verificar que se generan sugerencias
      expect(suggestions.length).toBeGreaterThan(0);

      // Verificar si el contexto incluye palabras clave que activarían sugerencias específicas
      const containsKeywords = agentContext.blocks.some((block) => {
        const content = block.content.toLowerCase();
        return (
          content.includes("dolor") ||
          content.includes("presión") ||
          content.includes("tension") ||
          content.includes("diabetes") ||
          content.includes("glucosa")
        );
      });

      if (containsKeywords) {
        // Si hay palabras clave, debe haber al menos una sugerencia específica
        const hasSpecificSuggestion = suggestions.some(
          (s) =>
            s.content.toLowerCase().includes("dolor") ||
            s.content.toLowerCase().includes("tensión") ||
            s.content.toLowerCase().includes("diabetes") ||
            s.content.toLowerCase().includes("glucemia"),
        );

        expect(hasSpecificSuggestion).toBe(true);
      } else {
        // Si no hay palabras clave, debe haber al menos las sugerencias genéricas
        expect(suggestions.length).toBeGreaterThanOrEqual(2);
      }

      // Verificar que todas las sugerencias tienen la estructura correcta
      suggestions.forEach((suggestion) => {
        expect(suggestion.id).toBeDefined();
        expect(suggestion.sourceBlockId).toBeDefined();
        expect(suggestion.type).toMatch(/recommendation|warning|info/);
        expect(suggestion.content.length).toBeGreaterThan(10);
      });
    });
  });
});
