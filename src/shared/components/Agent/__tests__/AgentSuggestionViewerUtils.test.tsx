import {
  formatSuggestionType,
  formatSuggestionStatus,
  calculateSuccessRate,
  calculateAverageResponseTime,
  groupSuggestionsByType,
  filterSuggestionsByStatus,
  sortSuggestionsByPriority,
} from "../AgentSuggestionViewerUtils";

describe("AgentSuggestionViewerUtils", () => {
  describe("formatSuggestionType", () => {
    it("debe formatear correctamente el tipo de recomendación", () => {
      expect(formatSuggestionType("recommendation")).toBe("Recomendación");
    });

    it("debe formatear correctamente el tipo de advertencia", () => {
      expect(formatSuggestionType("warning")).toBe("Advertencia");
    });

    it("debe formatear correctamente el tipo de información", () => {
      expect(formatSuggestionType("info")).toBe("Información");
    });

    it("debe manejar tipos desconocidos", () => {
      expect(formatSuggestionType("unknown")).toBe("Desconocido");
    });
  });

  describe("formatSuggestionStatus", () => {
    it("debe formatear correctamente el estado de integrado", () => {
      expect(formatSuggestionStatus("integrated")).toBe("Integrado");
    });

    it("debe formatear correctamente el estado de rechazado", () => {
      expect(formatSuggestionStatus("rejected")).toBe("Rechazado");
    });

    it("debe formatear correctamente el estado de pendiente", () => {
      expect(formatSuggestionStatus("pending")).toBe("Pendiente");
    });

    it("debe formatear correctamente el estado de error", () => {
      expect(formatSuggestionStatus("error")).toBe("Error");
    });

    it("debe manejar estados desconocidos", () => {
      expect(formatSuggestionStatus("unknown")).toBe("Desconocido");
    });
  });

  describe("calculateSuccessRate", () => {
    it("debe calcular correctamente la tasa de éxito", () => {
      const suggestions = [
        { id: "1", status: "integrated" },
        { id: "2", status: "rejected" },
        { id: "3", status: "integrated" },
        { id: "4", status: "pending" },
      ];

      expect(calculateSuccessRate(suggestions)).toBe(0.5); // 2 integradas / 4 totales
    });

    it("debe manejar lista vacía", () => {
      expect(calculateSuccessRate([])).toBe(0);
    });

    it("debe manejar solo sugerencias pendientes", () => {
      const suggestions = [
        { id: "1", status: "pending" },
        { id: "2", status: "pending" },
      ];

      expect(calculateSuccessRate(suggestions)).toBe(0);
    });
  });

  describe("calculateAverageResponseTime", () => {
    it("debe calcular correctamente el tiempo promedio de respuesta", () => {
      const suggestions = [
        { id: "1", responseTime: 2 },
        { id: "2", responseTime: 4 },
        { id: "3", responseTime: 6 },
      ];

      expect(calculateAverageResponseTime(suggestions)).toBe(4);
    });

    it("debe manejar lista vacía", () => {
      expect(calculateAverageResponseTime([])).toBe(0);
    });

    it("debe manejar sugerencias sin tiempo de respuesta", () => {
      const suggestions = [
        { id: "1", responseTime: 2 },
        { id: "2" },
        { id: "3", responseTime: 6 },
      ];

      expect(calculateAverageResponseTime(suggestions)).toBe(4);
    });
  });

  describe("groupSuggestionsByType", () => {
    it("debe agrupar correctamente las sugerencias por tipo", () => {
      const suggestions = [
        { id: "1", type: "recommendation" },
        { id: "2", type: "warning" },
        { id: "3", type: "recommendation" },
        { id: "4", type: "info" },
      ];

      const grouped = groupSuggestionsByType(suggestions);

      expect(grouped.recommendation).toHaveLength(2);
      expect(grouped.warning).toHaveLength(1);
      expect(grouped.info).toHaveLength(1);
    });

    it("debe manejar lista vacía", () => {
      const grouped = groupSuggestionsByType([]);

      expect(grouped.recommendation).toHaveLength(0);
      expect(grouped.warning).toHaveLength(0);
      expect(grouped.info).toHaveLength(0);
    });
  });

  describe("filterSuggestionsByStatus", () => {
    it("debe filtrar correctamente las sugerencias por estado", () => {
      const suggestions = [
        { id: "1", status: "integrated" },
        { id: "2", status: "rejected" },
        { id: "3", status: "integrated" },
        { id: "4", status: "pending" },
      ];

      const integrated = filterSuggestionsByStatus(suggestions, "integrated");
      const rejected = filterSuggestionsByStatus(suggestions, "rejected");
      const pending = filterSuggestionsByStatus(suggestions, "pending");

      expect(integrated).toHaveLength(2);
      expect(rejected).toHaveLength(1);
      expect(pending).toHaveLength(1);
    });

    it("debe manejar lista vacía", () => {
      expect(filterSuggestionsByStatus([], "integrated")).toHaveLength(0);
    });
  });

  describe("sortSuggestionsByPriority", () => {
    it("debe ordenar correctamente las sugerencias por prioridad", () => {
      const suggestions = [
        { id: "1", type: "info", priority: 1 },
        { id: "2", type: "warning", priority: 3 },
        { id: "3", type: "recommendation", priority: 2 },
      ];

      const sorted = sortSuggestionsByPriority(suggestions);

      expect(sorted[0].id).toBe("2"); // warning
      expect(sorted[1].id).toBe("3"); // recommendation
      expect(sorted[2].id).toBe("1"); // info
    });

    it("debe manejar lista vacía", () => {
      expect(sortSuggestionsByPriority([])).toHaveLength(0);
    });

    it("debe manejar sugerencias sin prioridad", () => {
      const suggestions = [
        { id: "1", type: "info" },
        { id: "2", type: "warning", priority: 3 },
        { id: "3", type: "recommendation" },
      ];

      const sorted = sortSuggestionsByPriority(suggestions);

      expect(sorted[0].id).toBe("2"); // warning
      expect(sorted[1].id).toBe("1"); // info
      expect(sorted[2].id).toBe("3"); // recommendation
    });
  });
});
