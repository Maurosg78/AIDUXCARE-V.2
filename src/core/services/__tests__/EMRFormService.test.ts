import { z } from "zod";
import { supabase } from "@/lib/supabaseClient";
import { formDataSourceSupabase } from "@/core/dataSources/formDataSourceSupabase";
import { AuditLogger } from "@/core/audit/AuditLogger";
import { trackMetric } from "@/services/UsageAnalyticsService";
import { EMRFormService, type EMRSection } from "@/core/services/EMRFormService";
import type { FormDataSource, Form } from "@/core/dataSources/FormDataSource";
import type { ClinicalFormData, EMRForm, SuggestionToIntegrate } from "@/types/forms";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock del cliente Supabase
vi.mock("@/lib/supabaseClient", () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      then: vi.fn().mockResolvedValue({ data: null, error: null })
    }))
  }
}));

// Mock completo de formDataSourceSupabase
vi.mock("@/core/dataSources/formDataSourceSupabase", () => {
  const mockFormDataSource = {
    getFormsByVisitId: vi.fn().mockImplementation(async (visitId: string) => {
      return [mockForm];
    }),
    getFormById: vi.fn().mockImplementation(async (formId: string) => {
      return mockForm;
    }),
    createForm: vi.fn().mockImplementation(async (formData: unknown) => {
      return mockForm;
    }),
    updateForm: vi.fn().mockImplementation(async (formId: string, formData: unknown) => {
      return mockForm;
    }),
    deleteForm: vi.fn().mockImplementation(async (formId: string) => {
      return;
    })
  };
  return {
    formDataSourceSupabase: mockFormDataSource
  };
});

// Mock de AuditLogger
vi.mock("@/core/audit/AuditLogger", () => ({
  AuditLogger: {
    logSuggestionIntegration: vi.fn(),
    log: vi.fn()
  }
}));

// Mock de UsageAnalyticsService
vi.mock("@/services/UsageAnalyticsService", () => ({
  trackMetric: vi.fn()
}));

const mockForm = {
  id: "form-1",
  visit_id: "visit-1",
  patient_id: "patient-1",
  professional_id: "prof-1",
  form_type: "SOAP",
  content: JSON.stringify({
    subjective: "subj",
    objective: "obj",
    assessment: "assess",
    plan: "plan",
    notes: "notes"
  }),
  updated_at: "2023-01-01T00:00:00Z",
  created_at: "2023-01-01T00:00:00Z",
  status: "draft",
  name: "SOAP Form",
  version: "1.0",
  fields: []
};

describe("EMRFormService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Resetear los mocks a sus valores por defecto
    vi.mocked(formDataSourceSupabase.getFormsByVisitId).mockResolvedValue([mockForm]);
    vi.mocked(formDataSourceSupabase.updateForm).mockResolvedValue(mockForm);
    vi.mocked(formDataSourceSupabase.createForm).mockResolvedValue(mockForm);
  });

  describe("getEMRForm", () => {
    it("should return EMR form for valid visit ID", async () => {
      const result = await EMRFormService.getEMRForm("visit-1");

      expect(result).toEqual({
        id: "form-1",
        visitId: "visit-1",
        patientId: "patient-1",
        professionalId: "prof-1",
        subjective: "subj",
        objective: "obj",
        assessment: "assess",
        plan: "plan",
        notes: "notes",
        updatedAt: "2023-01-01T00:00:00Z",
        createdAt: "2023-01-01T00:00:00Z"
      });
    });

    it("should insert suggestion successfully", async () => {
      const suggestion: SuggestionToIntegrate = {
        id: "sugg-1",
        content: "Test suggestion",
        type: "CLINICAL",
        sourceBlockId: "block-1"
      };

      const result = await EMRFormService.insertSuggestion(suggestion, "visit-1", "patient-1", "user-1");

      expect(result).toBe(true);
      expect(formDataSourceSupabase.updateForm).toHaveBeenCalled();
    });

    it("should not insert duplicate suggestion", async () => {
      const formWithSuggestion = {
        ...mockForm,
        content: JSON.stringify({
          subjective: "subj",
          objective: "obj",
          assessment: "assess",
          plan: "🔎 Test suggestion",
          notes: "notes"
        })
      };

      vi.mocked(formDataSourceSupabase.getFormsByVisitId).mockResolvedValueOnce([formWithSuggestion]);

      const suggestion: SuggestionToIntegrate = {
        id: "sugg-1",
        content: "Test suggestion",
        type: "CLINICAL",
        sourceBlockId: "block-1"
      };

      const result = await EMRFormService.insertSuggestion(suggestion, "visit-1", "patient-1", "user-1");

      expect(result).toBe(false);
      expect(formDataSourceSupabase.updateForm).not.toHaveBeenCalled();
    });
  });

  it("getEMRForm devuelve null si no hay forms", async () => {
    vi.mocked(formDataSourceSupabase.getFormsByVisitId).mockResolvedValueOnce([]);
    const result = await EMRFormService.getEMRForm("visit-1");
    expect(result).toBeNull();
  });

  it("getSectionContent devuelve el contenido correcto", async () => {
    const result = await EMRFormService.getSectionContent("visit-1", "plan");
    expect(result).toBe("plan");
  });

  it("updateEMRForm actualiza correctamente", async () => {
    const emrForm = {
      id: "form-1",
      visitId: "visit-1",
      patientId: "patient-1",
      professionalId: "prof-1",
      subjective: "subj",
      objective: "obj",
      assessment: "assess",
      plan: "plan",
      notes: "notes",
      updatedAt: "2023-01-01T00:00:00Z",
      createdAt: "2023-01-01T00:00:00Z"
    };
    const result = await EMRFormService.updateEMRForm(emrForm, "user-1");
    expect(result).toBe(true);
    expect(formDataSourceSupabase.updateForm).toHaveBeenCalled();
  });

  it("debe manejar errores de red al integrar sugerencias", async () => {
    vi.mocked(formDataSourceSupabase.updateForm).mockRejectedValueOnce(new Error("Error de red simulado"));
    
    const suggestion = { 
      id: "sug-1", 
      content: "Nueva sugerencia", 
      type: "CLINICAL" as const, 
      sourceBlockId: "block-1" 
    };
    
    const result = await EMRFormService.insertSuggestion(suggestion, "visit-1", "patient-1", "user-1");
    expect(result).toBe(false);
  });
  describe("Edge Cases y Validación Adicional", () => {
    it("getEMRForm debe retornar null para visitId inexistente", async () => {
      vi.mocked(formDataSourceSupabase.getFormsByVisitId).mockResolvedValueOnce([]);
      const result = await EMRFormService.getEMRForm("visit-inexistente");
      expect(result).toBeNull();
      expect(formDataSourceSupabase.getFormsByVisitId).toHaveBeenCalledWith("visit-inexistente");
    });
    it("insertSuggestion debe evitar duplicados al llamar consecutivamente", async () => {
      const suggestion: SuggestionToIntegrate = {
        id: "sugg-duplicate",
        content: "Sugerencia duplicada",
        type: "CLINICAL",
        sourceBlockId: "block-duplicate"
      };
      const result1 = await EMRFormService.insertSuggestion(suggestion, "visit-1", "patient-1", "user-1");
      expect(result1).toBe(true);
      const formWithDuplicateSuggestion = {
        ...mockForm,
        content: JSON.stringify({
          subjective: "subj",
          objective: "obj",
          assessment: "assess",
          plan: "🔎 Sugerencia duplicada",
          notes: "notes"
        })
      };
      vi.mocked(formDataSourceSupabase.getFormsByVisitId).mockResolvedValueOnce([formWithDuplicateSuggestion]);
      const result2 = await EMRFormService.insertSuggestion(suggestion, "visit-1", "patient-1", "user-1");
      expect(result2).toBe(false);
      expect(formDataSourceSupabase.updateForm).toHaveBeenCalledTimes(1);
    });
    it("updateEMRForm debe crear nuevo formulario cuando no existe el ID", async () => {
      const emrFormSinId: EMRForm = {
        visitId: "visit-new",
        patientId: "patient-new",
        professionalId: "prof-new",
        subjective: "nueva subj",
        objective: "nueva obj",
        assessment: "nueva assess",
        plan: "nuevo plan",
        notes: "nuevas notas"
      };
      const result = await EMRFormService.updateEMRForm(emrFormSinId, "user-1");
      expect(result).toBe(true);
      expect(formDataSourceSupabase.createForm).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.stringContaining("nueva subj"),
          visit_id: "visit-new",
          patient_id: "patient-new",
          professional_id: "prof-new"
        })
      );
      expect(formDataSourceSupabase.updateForm).not.toHaveBeenCalled();
    });
    it("updateEMRForm debe actualizar formulario existente cuando tiene ID", async () => {
      const emrFormConId: EMRForm = {
        id: "existing-form-123",
        visitId: "visit-existing",
        patientId: "patient-existing",
        professionalId: "prof-existing",
        subjective: "subj actualizada",
        objective: "obj actualizada",
        assessment: "assess actualizada",
        plan: "plan actualizado",
        notes: "notas actualizadas"
      };
      const result = await EMRFormService.updateEMRForm(emrFormConId, "user-1");
      expect(result).toBe(true);
      expect(formDataSourceSupabase.updateForm).toHaveBeenCalledWith(
        "existing-form-123",
        expect.objectContaining({
          content: expect.stringContaining("subj actualizada")
        })
      );
      expect(formDataSourceSupabase.createForm).not.toHaveBeenCalled();
    });
    it("getSectionContent debe retornar null para formulario inexistente", async () => {
      vi.mocked(formDataSourceSupabase.getFormsByVisitId).mockResolvedValueOnce([]);
      const result = await EMRFormService.getSectionContent("visit-inexistente", "plan");
      expect(result).toBeNull();
    });
    it("getSectionContent debe retornar string vacío para sección válida pero contenido vacío", async () => {
      const formWithEmptySection = {
        ...mockForm,
        content: JSON.stringify({
          subjective: "subj",
          objective: "obj",
          assessment: "assess",
          plan: "",
          notes: "notes"
        })
      };
      vi.mocked(formDataSourceSupabase.getFormsByVisitId).mockResolvedValueOnce([formWithEmptySection]);
      const result = await EMRFormService.getSectionContent("visit-1", "plan");
      expect(result).toBe("");
    });
  });
});
