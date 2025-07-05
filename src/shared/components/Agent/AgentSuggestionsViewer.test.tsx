import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AgentSuggestionsViewer from "./AgentSuggestionsViewer";
import { EMRFormService } from "@/core/services/EMRFormService";
import { trackMetric } from "@/services/UsageAnalyticsService";
import { AuditLogger } from "@/core/audit/AuditLogger";
import { AgentSuggestion, SuggestionType } from "@/types/agent";

// Mock de los servicios
vi.mock("@/core/services/EMRFormService", () => ({
  EMRFormService: {
    insertSuggestion: vi.fn(),
    mapSuggestionTypeToEMRSection: vi.fn((type) => {
      switch (type) {
        case "recommendation":
          return "plan";
        case "warning":
          return "assessment";
        case "info":
          return "notes";
        case "diagnostic":
          return "assessment";
        case "treatment":
          return "plan";
        case "followup":
          return "plan";
        case "contextual":
          return "notes";
        default:
          return "notes";
      }
    }),
  },
}));

vi.mock("@/services/UsageAnalyticsService", () => ({
  trackMetric: vi.fn(),
}));

vi.mock("@/core/audit/AuditLogger", () => ({
  AuditLogger: {
    log: vi.fn(),
  },
}));

describe("AgentSuggestionsViewer", () => {
  const mockSuggestions: AgentSuggestion[] = [
    {
      id: "1",
      type: "recommendation" as SuggestionType,
      content: "Sugerencia de prueba 1",
      field: "diagnosis",
      sourceBlockId: "block1",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "2",
      type: "warning" as SuggestionType,
      content: "Sugerencia de prueba 2",
      field: "treatment",
      sourceBlockId: "block2",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const defaultProps = {
    visitId: "visit-123",
    suggestions: mockSuggestions,
    onSuggestionAccepted: vi.fn(),
    onSuggestionRejected: vi.fn(),
    userId: "user-123",
    patientId: "patient-123",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Configurar el mock de insertSuggestion para que solo retorne true
    (
      EMRFormService.insertSuggestion as unknown as ReturnType<typeof vi.fn>
    ).mockResolvedValue(true);
  });

  it("debe renderizar correctamente con sugerencias", () => {
    render(<AgentSuggestionsViewer {...defaultProps} />);

    expect(
      screen.getByText("Sugerencias del Copiloto (2)"),
    ).toBeInTheDocument();
    expect(screen.getByText("Mostrar")).toBeInTheDocument();
  });

  it("debe mostrar las sugerencias al expandir", () => {
    render(<AgentSuggestionsViewer {...defaultProps} />);

    fireEvent.click(screen.getByText("Mostrar"));

    expect(screen.getByText("Sugerencia de prueba 1")).toBeInTheDocument();
    expect(screen.getByText("Sugerencia de prueba 2")).toBeInTheDocument();
  });

  it("debe manejar correctamente la aceptación de una sugerencia", async () => {
    render(<AgentSuggestionsViewer {...defaultProps} />);
    fireEvent.click(screen.getByText("Mostrar"));
    fireEvent.click(screen.getAllByText("Integrar")[0]);
    await waitFor(() => {
      expect(EMRFormService.insertSuggestion).toHaveBeenCalledWith(
        expect.objectContaining({
          id: "1",
          content: "Sugerencia de prueba 1",
          type: "recommendation",
        }),
        "visit-123",
        "patient-123",
        "user-123",
      );
    });
    expect(trackMetric).toHaveBeenCalledWith(
      "suggestions_integrated",
      expect.any(Object),
      "user-123",
      "visit-123",
    );
    expect(AuditLogger.log).toHaveBeenCalledWith(
      "suggestion_integrated",
      expect.objectContaining({
        userId: "user-123",
        visitId: "visit-123",
        patientId: "patient-123",
        section: "plan",
        content: "Sugerencia de prueba 1",
        suggestionId: "1",
      }),
    );
  });

  it("debe manejar correctamente el rechazo de una sugerencia", () => {
    render(<AgentSuggestionsViewer {...defaultProps} />);
    fireEvent.click(screen.getByText("Mostrar"));
    fireEvent.click(screen.getAllByText("Rechazar")[0]);
    expect(defaultProps.onSuggestionRejected).toHaveBeenCalledWith(
      mockSuggestions[0],
    );
    expect(AuditLogger.log).toHaveBeenCalledWith(
      "suggestion_rejected",
      expect.objectContaining({
        userId: "user-123",
        visitId: "visit-123",
        patientId: "patient-123",
        suggestionId: "1",
        suggestionType: "recommendation",
        suggestionField: "diagnosis",
      }),
    );
  });

  it("debe mostrar mensaje cuando no hay sugerencias", () => {
    render(<AgentSuggestionsViewer {...defaultProps} suggestions={[]} />);

    fireEvent.click(screen.getByText("Mostrar"));

    expect(
      screen.getByText("No hay sugerencias disponibles"),
    ).toBeInTheDocument();
  });

  it("debe manejar errores de red al integrar sugerencias", async () => {
    (
      EMRFormService.insertSuggestion as unknown as ReturnType<typeof vi.fn>
    ).mockRejectedValueOnce(new Error("network error"));
    render(<AgentSuggestionsViewer {...defaultProps} />);
    fireEvent.click(screen.getByText("Mostrar"));
    fireEvent.click(screen.getAllByText("Integrar")[0]);
    await waitFor(() => {
      expect(
        screen.getByText("Error de conexión al integrar la sugerencia"),
      ).toBeInTheDocument();
    });
    expect(AuditLogger.log).toHaveBeenCalledWith(
      "suggestion_integration_error",
      expect.objectContaining({
        userId: "user-123",
        visitId: "visit-123",
        patientId: "patient-123",
        error: "Error de conexión al integrar la sugerencia",
        suggestionId: "1",
        suggestionType: "recommendation",
        suggestionField: "diagnosis",
      }),
    );
  });

  it("debe ser accesible", () => {
    render(<AgentSuggestionsViewer {...defaultProps} />);

    const toggleButton = screen.getByRole("button", { name: /mostrar/i });
    expect(toggleButton).toHaveAttribute("aria-expanded", "false");
    expect(toggleButton).toHaveAttribute(
      "aria-controls",
      "suggestions-content",
    );

    fireEvent.click(toggleButton);

    // Verificar roles principales
    expect(
      screen.getByRole("region", { name: /sugerencias del copiloto/i }),
    ).toBeInTheDocument();
    const allRegions = screen.getAllByRole("region");
    const suggestionRegions = allRegions.filter((region) =>
      region.getAttribute("aria-label")?.match(/^Sugerencia [0-9]+$/),
    );
    expect(suggestionRegions).toHaveLength(2);
  });

  it("debe manejar correctamente sugerencias no integrables", async () => {
    const nonIntegrableSuggestions: AgentSuggestion[] = [
      {
        id: "3",
        type: "diagnostic" as SuggestionType,
        content: "Diagnóstico sugerido",
        field: "diagnosis",
        sourceBlockId: "block3",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "4",
        type: "followup" as SuggestionType,
        content: "Seguimiento sugerido",
        field: "followup",
        sourceBlockId: "block4",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
    render(
      <AgentSuggestionsViewer
        {...defaultProps}
        suggestions={nonIntegrableSuggestions}
      />,
    );
    fireEvent.click(screen.getByText("Mostrar"));
    expect(screen.getByText("Diagnóstico sugerido")).toBeInTheDocument();
    expect(screen.getByText("Seguimiento sugerido")).toBeInTheDocument();
    // Verificar que los botones de No integrable están presentes
    const notIntegrableButtons = screen.getAllByText("No integrable");
    expect(notIntegrableButtons).toHaveLength(2);
    // Intentar aceptar una sugerencia no integrable
    fireEvent.click(notIntegrableButtons[0]);
    // Verificar que no se llamó a insertSuggestion
    await waitFor(() => {
      expect(EMRFormService.insertSuggestion).not.toHaveBeenCalled();
    });
    // Verificar que sí hay botones de Rechazar
    expect(screen.getAllByText("Rechazar")).toHaveLength(2);
  });
});
