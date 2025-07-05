import { describe, expect, it } from "vitest";
import { MCPContext, MCPContextSchema } from "@/core/mcp/schema";

describe("MCPContextBuilder Tests", () => {
  it("debe validar la estructura correcta del contexto MCP", () => {
    // Crear un contexto de prueba con la estructura correcta
    const testContext: MCPContext = {
      contextual: {
        source: "test-source",
        data: [
          {
            id: "ctx-test-1",
            timestamp: new Date().toISOString(),
            type: "contextual",
            content: "Contenido contextual de prueba",
            validated: true,
          },
        ],
      },
      persistent: {
        source: "test-source",
        data: [
          {
            id: "per-test-1",
            timestamp: new Date().toISOString(),
            type: "persistent",
            content: "Contenido persistente de prueba",
            validated: true,
          },
        ],
      },
      semantic: {
        source: "test-source",
        data: [
          {
            id: "sem-test-1",
            timestamp: new Date().toISOString(),
            type: "semantic",
            content: "Contenido semántico de prueba",
            validated: true,
          },
        ],
      },
    };

    // Validar la estructura usando el schema de Zod
    const result = MCPContextSchema.safeParse(testContext);
    expect(result.success).toBe(true);
  });

  it("debe detectar estructuras incorrectas del contexto MCP", () => {
    // Crear un contexto con estructura incorrecta (falta semantic)
    const invalidContext = {
      contextual: {
        source: "test-source",
        data: [
          {
            id: "ctx-test-1",
            timestamp: new Date().toISOString(),
            type: "contextual",
            content: "Contenido contextual de prueba",
          },
        ],
      },
      persistent: {
        source: "test-source",
        data: [],
      },
      // Falta la sección semantic, lo que debería provocar un error
    };

    // Validar que falla la validación del esquema
    const result = MCPContextSchema.safeParse(invalidContext);
    expect(result.success).toBe(false);
  });

  it("debe validar el formato correcto de los campos de fecha", () => {
    // Crear un contexto con timestamp en formato inválido
    const contextWithBadDate: any = {
      contextual: {
        source: "test-source",
        data: [
          {
            id: "ctx-test-1",
            timestamp: "fecha-invalida", // Formato inválido
            type: "contextual",
            content: "Contenido contextual de prueba",
          },
        ],
      },
      persistent: {
        source: "test-source",
        data: [],
      },
      semantic: {
        source: "test-source",
        data: [],
      },
    };

    // Validar que falla la validación del esquema
    const result = MCPContextSchema.safeParse(contextWithBadDate);
    expect(result.success).toBe(false);
  });
});
