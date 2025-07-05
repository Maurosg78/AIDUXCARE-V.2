import { describe, it, expect, vi, beforeEach } from "vitest";
import { SuggestionIntegrationService } from "../../agent/SuggestionIntegrationService";
import {
  AgentSuggestion,
  SuggestionType,
  SuggestionField,
} from "../../../types/agent";
import supabase from "../../../core/auth/supabaseClient";
import { AuditLogger } from "../../../core/audit/AuditLogger";
import { track } from "../../../lib/analytics";

// Mock para Supabase
vi.mock("../../../core/auth/supabaseClient", () => {
  const mockFrom = vi.fn();
  return {
    default: {
      from: mockFrom,
    },
  };
});

// Mock para el sistema de analytics
vi.mock("../../../lib/analytics", () => ({
  track: vi.fn(),
}));

// Mock para AuditLogger
vi.mock("../../../core/audit/AuditLogger", () => ({
  AuditLogger: {
    log: vi.fn(),
  },
}));

describe("SuggestionIntegrationService", () => {
  // Datos para las pruebas
  const visitId = "visit-123";
  const userId = "user-456";
  const suggestion: AgentSuggestion = {
    id: "suggestion-789",
    type: "recommendation" as SuggestionType,
    field: "diagnosis" as SuggestionField,
    content: "Considerar evaluación de dolor abdominal",
    sourceBlockId: "block-123",
    createdAt: new Date("2023-05-15T10:30:00Z"),
    updatedAt: new Date("2023-05-15T10:30:00Z"),
  };

  // Mocks para las respuestas de Supabase
  const mockInsert = vi.fn().mockReturnValue({ error: null });
  const mockSingleVisit = vi.fn();
  const mockSingleField = vi.fn();
  const mockUpsert = vi.fn().mockReturnValue({ error: null });

  beforeEach(() => {
    // Limpiar todos los mocks antes de cada prueba
    vi.clearAllMocks();

    // Configurar respuestas por defecto
    mockSingleVisit.mockResolvedValue({ data: { id: visitId }, error: null });
    mockSingleField.mockResolvedValue({
      data: null,
      error: { code: "PGRST116" },
    });

    // Configurar el mock de supabase.from para diferentes tablas
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === "integrated_suggestions") {
        return {
          insert: mockInsert,
        } as unknown as ReturnType<typeof supabase.from>;
      } else if (table === "visits") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: mockSingleVisit,
            }),
          }),
        } as unknown as ReturnType<typeof supabase.from>;
      } else if (table === "emr_fields") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: mockSingleField,
              }),
            }),
          }),
          upsert: mockUpsert,
        } as unknown as ReturnType<typeof supabase.from>;
      }
      return {} as ReturnType<typeof supabase.from>;
    });
  });

  it("debe integrar correctamente una sugerencia en un campo vacío", async () => {
    // Configuración específica para este test (campo vacío)
    mockSingleField.mockResolvedValueOnce({
      data: null,
      error: { code: "PGRST116" },
    });

    // Ejecutar el método a probar
    await SuggestionIntegrationService.integrateSuggestion(
      suggestion,
      visitId,
      userId,
    );

    // Verificar que se registró la integración en la base de datos
    expect(supabase.from).toHaveBeenCalledWith("integrated_suggestions");
    expect(mockInsert).toHaveBeenCalledWith({
      suggestion_id: suggestion.id,
      visit_id: visitId,
      user_id: userId,
      integrated_at: expect.any(String),
    });

    // Verificar que se registró el tracking
    expect(track).toHaveBeenCalledWith("suggestions_integrated", {
      suggestion_id: suggestion.id,
      suggestion_type: suggestion.type,
      suggestion_field: suggestion.field,
    });

    // Verificar que se verificó la existencia de la visita
    expect(supabase.from).toHaveBeenCalledWith("visits");

    // Verificar que se hizo upsert del campo
    expect(supabase.from).toHaveBeenCalledWith("emr_fields");
    expect(mockUpsert).toHaveBeenCalledWith({
      visit_id: visitId,
      field_name: suggestion.field,
      content: suggestion.content,
      updated_at: expect.any(String),
    });

    // Verificar registro en audit log
    expect(AuditLogger.log).toHaveBeenCalledWith(
      "suggestion.integrated",
      expect.objectContaining({
        visitId,
        userId,
        suggestionId: suggestion.id,
        field: suggestion.field,
      }),
    );
  });

  it("debe integrar correctamente una sugerencia en un campo con contenido previo", async () => {
    // Configuración específica para este test (campo con contenido)
    const existingField = {
      id: "field-123",
      visit_id: visitId,
      field_name: suggestion.field,
      content: "Contenido previo en el campo",
      updated_at: "2023-01-01T00:00:00Z",
    };

    mockSingleField.mockResolvedValueOnce({ data: existingField, error: null });

    // Ejecutar el método a probar
    await SuggestionIntegrationService.integrateSuggestion(
      suggestion,
      visitId,
      userId,
    );

    // Verificar que se hizo upsert del campo con contenido concatenado
    expect(mockUpsert).toHaveBeenCalledWith({
      visit_id: visitId,
      field_name: suggestion.field,
      content: `${existingField.content}\n\n🔎 ${suggestion.content}`,
      updated_at: expect.any(String),
    });
  });

  it("debe lanzar un error si la visita no existe", async () => {
    // Configuración específica para este test (visita no encontrada)
    mockSingleVisit.mockResolvedValueOnce({
      data: null,
      error: { message: "No se encontró la visita" },
    });

    // Verificar que se lanza el error esperado
    await expect(
      SuggestionIntegrationService.integrateSuggestion(
        suggestion,
        visitId,
        userId,
      ),
    ).rejects.toThrow(`La visita ${visitId} no existe`);

    // Verificar que no se insertó nada en las otras tablas
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("debe manejar errores en la inserción de integrated_suggestions", async () => {
    // Configuración específica para este test (error en insert)
    mockInsert.mockReturnValueOnce({
      error: { message: "Error en la inserción de datos" },
    });

    // Verificar que se lanza el error adecuado
    await expect(
      SuggestionIntegrationService.integrateSuggestion(
        suggestion,
        visitId,
        userId,
      ),
    ).rejects.toThrow(
      "Error al registrar la integración de la sugerencia: Error en la inserción de datos",
    );

    // Verificar que no se actualizó el campo
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("debe manejar errores en el upsert de emr_fields", async () => {
    // Configuración específica para este test (error en upsert)
    mockUpsert.mockReturnValueOnce({
      error: { message: "Error en el upsert" },
    });

    // Verificar que se lanza el error adecuado
    await expect(
      SuggestionIntegrationService.integrateSuggestion(
        suggestion,
        visitId,
        userId,
      ),
    ).rejects.toThrow("Error al integrar la sugerencia: Error en el upsert");
  });

  it("debe rechazar sugerencias con contenido vacío", async () => {
    const emptySuggestion: AgentSuggestion = {
      ...suggestion,
      content: "",
    };

    await expect(
      SuggestionIntegrationService.integrateSuggestion(
        emptySuggestion,
        visitId,
        userId,
      ),
    ).rejects.toThrow("La sugerencia no puede tener contenido vacío");

    // Verificar que no se intentó ninguna operación en la base de datos
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("debe rechazar campos inválidos", async () => {
    const invalidFieldSuggestion: AgentSuggestion = {
      ...suggestion,
      field: "invalid_field" as SuggestionField,
    };

    await expect(
      SuggestionIntegrationService.integrateSuggestion(
        invalidFieldSuggestion,
        visitId,
        userId,
      ),
    ).rejects.toThrow("Campo inválido para la integración");

    // Verificar que no se intentó ninguna operación en la base de datos
    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it("debe registrar métricas de error cuando falla la integración", async () => {
    // Configurar error en la inserción
    mockInsert.mockReturnValueOnce({
      error: { message: "Error en la inserción de datos" },
    });

    try {
      await SuggestionIntegrationService.integrateSuggestion(
        suggestion,
        visitId,
        userId,
      );
    } catch (error) {
      // Verificar que se registró el error en analytics
      expect(track).toHaveBeenCalledWith("suggestion_integration_error", {
        suggestion_id: suggestion.id,
        suggestion_type: suggestion.type,
        suggestion_field: suggestion.field,
        error_message: "Error en la inserción de datos",
      });

      // Verificar que se registró en el audit log
      expect(AuditLogger.log).toHaveBeenCalledWith(
        "suggestion.integration_error",
        expect.objectContaining({
          visitId,
          userId,
          suggestionId: suggestion.id,
          error: "Error en la inserción de datos",
        }),
      );
    }
  });
});
