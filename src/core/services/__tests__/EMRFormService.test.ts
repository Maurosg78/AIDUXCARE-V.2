import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { formDataSourceSupabase } from '@/core/dataSources/formDataSourceSupabase';
import { AuditLogger } from '@/core/audit/AuditLogger';
import { trackMetric } from '@/services/UsageAnalyticsService';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/env';
import type { FormDataSource, Form } from '@/core/dataSources/FormDataSource';
import type { ClinicalFormData, EMRForm, SuggestionToIntegrate } from '@/types/forms';
import { describe, it, expect, vi, beforeEach } from 'vitest';

export type EMRSection = 'subjective' | 'objective' | 'assessment' | 'plan' | 'notes';

export const EMRFormSchema = z.object({
  id: z.string().optional(),
  visitId: z.string(),
  patientId: z.string(),
  professionalId: z.string(),
  subjective: z.string().default(''),
  objective: z.string().default(''),
  assessment: z.string().default(''),
  plan: z.string().default(''),
  notes: z.string().default(''),
  updatedAt: z.string().optional(),
  createdAt: z.string().optional()
});

export class EMRFormService {
  private static supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  private formDataSource: FormDataSource;

  constructor(formDataSource: FormDataSource) {
    this.formDataSource = formDataSource;
  }

  public static async getEMRForm(visitId: string): Promise<EMRForm | null> {
    try {
      const forms: Form[] = await formDataSourceSupabase.getFormsByVisitId(visitId);
      const soapForm = forms.find(f => f.form_type === 'SOAP') || forms[0];
      if (!soapForm) return null;
      let contentObj: Record<string, string> = {};
      try { contentObj = JSON.parse(soapForm.content); } catch { return null; }
      const emrForm: EMRForm = {
        id: soapForm.id,
        visitId: soapForm.visit_id,
        patientId: soapForm.patient_id,
        professionalId: soapForm.professional_id,
        subjective: contentObj.subjective || '',
        objective: contentObj.objective || '',
        assessment: contentObj.assessment || '',
        plan: contentObj.plan || '',
        notes: contentObj.notes || '',
        updatedAt: soapForm.updated_at,
        createdAt: soapForm.created_at
      };
      return EMRFormSchema.parse(emrForm);
    } catch (e) {
      console.error('Error fetching EMR form:', e);
      return null;
    }
  }

  public static mapSuggestionTypeToEMRSection(
    type: SuggestionToIntegrate['type']
  ): EMRSection {
    if (type === 'recommendation') return 'plan';
    if (type === 'warning') return 'assessment';
    return 'notes';
  }

  private static suggestionAlreadyIntegrated(
    form: EMRForm,
    suggestion: SuggestionToIntegrate
  ): boolean {
    const sec = this.mapSuggestionTypeToEMRSection(suggestion.type);
    const pref = `🔎 ${suggestion.content}`;
    return form[sec].includes(pref);
  }

  public static async insertSuggestion(
    suggestion: SuggestionToIntegrate,
    visitId: string,
    patientId: string,
    userId = 'anonymous'
  ): Promise<boolean> {
    try {
      let emr = await this.getEMRForm(visitId);
      if (!emr) {
        const { data, error } = await this.supabase
          .from('visits')
          .select('professional_id')
          .eq('id', visitId)
          .single();
        if (error || !data) return false;
        emr = {
          visitId,
          patientId,
          professionalId: data.professional_id,
          subjective: '',
          objective: '',
          assessment: '',
          plan: '',
          notes: '',
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
      }
      if (this.suggestionAlreadyIntegrated(emr, suggestion)) return false;
      const sec = this.mapSuggestionTypeToEMRSection(suggestion.type);
      const pref = `🔎 ${suggestion.content}`;
      emr[sec] = emr[sec] ? `${emr[sec]}\n${pref}` : pref;
      emr.updatedAt = new Date().toISOString();
      const payload: ClinicalFormData = {
        visit_id: visitId,
        patient_id: patientId,
        professional_id: emr.professionalId,
        form_type: 'SOAP',
        content: JSON.stringify({
          subjective: emr.subjective,
          objective: emr.objective,
          assessment: emr.assessment,
          plan: emr.plan,
          notes: emr.notes
        }),
        status: 'draft'
      };
      if (emr.id) {
        await formDataSourceSupabase.updateForm(emr.id, payload);
      } else {
        await formDataSourceSupabase.createForm(payload);
      }
      AuditLogger.logSuggestionIntegration(
        userId,
        visitId,
        suggestion.id,
        suggestion.type,
        suggestion.content,
        sec
      );
      trackMetric(
        'suggestions_integrated',
        {
          suggestionId: suggestion.id,
          suggestionType: suggestion.type,
          suggestionField: sec
        },
        userId,
        visitId
      );
      return true;
    } catch (e) {
      console.error('Error inserting suggestion:', e);
      
      // Registrar el error en el audit log
      AuditLogger.log('suggestion_integration_error', {
        userId,
        visitId,
        patientId,
        error: e instanceof Error ? e.message : String(e),
        suggestionId: suggestion.id,
        suggestionType: suggestion.type
      });
      
      return false;
    }
  }

  public static async insertSuggestedContent(
    visitId: string,
    section: EMRSection,
    content: string,
    source: 'agent' | 'professional' = 'agent',
    suggestionId?: string
  ): Promise<boolean> {
    return this.insertSuggestion(
      { id: suggestionId || '', content, type: source === 'agent' ? 'recommendation' : 'info', sourceBlockId: '' },
      visitId,
      '',
      'anonymous'
    );
  }

  public static async getSectionContent(
    visitId: string,
    section: EMRSection
  ): Promise<string> {
    const form = await this.getEMRForm(visitId);
    return form ? form[section] : '';
  }

  public static async updateEMRForm(
    form: EMRForm,
    userId: string
  ): Promise<boolean> {
    try {
      EMRFormSchema.parse(form);
      form.updatedAt = new Date().toISOString();
      const payload: ClinicalFormData = {
        visit_id: form.visitId,
        patient_id: form.patientId,
        professional_id: form.professionalId,
        form_type: 'SOAP',
        content: JSON.stringify({
          subjective: form.subjective,
          objective: form.objective,
          assessment: form.assessment,
          plan: form.plan,
          notes: form.notes
        }),
        status: 'draft'
      };
      if (form.id) {
        await formDataSourceSupabase.updateForm(form.id, payload);
      } else {
        await formDataSourceSupabase.createForm(payload);
      }
      AuditLogger.log('emr.form.update', { userId, visitId: form.visitId, patientId: form.patientId });
      return true;
    } catch (e) {
      console.error('Error updating EMR form:', e);
      return false;
    }
  }
}

// Mock de dependencias externas
vi.mock('@/core/dataSources/formDataSourceSupabase', () => ({
  formDataSourceSupabase: {
    getFormsByVisitId: vi.fn(),
    updateForm: vi.fn(),
    createForm: vi.fn()
  }
}));
vi.mock('@/core/audit/AuditLogger', () => ({
  AuditLogger: {
    logSuggestionIntegration: vi.fn(),
    log: vi.fn()
  }
}));
vi.mock('@/services/UsageAnalyticsService', () => ({
  trackMetric: vi.fn()
}));

const mockForm = {
  id: 'form-1',
  visit_id: 'visit-1',
  patient_id: 'patient-1',
  professional_id: 'prof-1',
  form_type: 'SOAP',
  content: JSON.stringify({
    subjective: 'subj',
    objective: 'obj',
    assessment: 'assess',
    plan: 'plan',
    notes: 'notes'
  }),
  updated_at: '2023-01-01T00:00:00Z',
  created_at: '2023-01-01T00:00:00Z',
  status: 'draft'
};

describe('EMRFormService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getEMRForm devuelve un EMRForm válido', async () => {
    vi.mocked(formDataSourceSupabase.getFormsByVisitId).mockResolvedValue([mockForm]);
    const result = await EMRFormService.getEMRForm('visit-1');
    expect(result).toBeTruthy();
    expect(result?.visitId).toBe('visit-1');
    expect(result?.subjective).toBe('subj');
  });

  it('getEMRForm devuelve null si no hay forms', async () => {
    vi.mocked(formDataSourceSupabase.getFormsByVisitId).mockResolvedValue([]);
    const result = await EMRFormService.getEMRForm('visit-1');
    expect(result).toBeNull();
  });

  it('insertSuggestion integra una sugerencia nueva', async () => {
    vi.mocked(formDataSourceSupabase.getFormsByVisitId).mockResolvedValue([mockForm]);
    vi.mocked(formDataSourceSupabase.updateForm).mockResolvedValue(mockForm);
    const suggestion = { id: 'sug-1', content: 'Nueva sugerencia', type: 'recommendation' as const, sourceBlockId: 'block-1' };
    const result = await EMRFormService.insertSuggestion(suggestion, 'visit-1', 'patient-1', 'user-1');
    expect(result).toBe(true);
    expect(formDataSourceSupabase.updateForm).toHaveBeenCalled();
    expect(AuditLogger.logSuggestionIntegration).toHaveBeenCalled();
    expect(trackMetric).toHaveBeenCalled();
  });

  it('getSectionContent devuelve el contenido correcto', async () => {
    vi.mocked(formDataSourceSupabase.getFormsByVisitId).mockResolvedValue([mockForm]);
    const result = await EMRFormService.getSectionContent('visit-1', 'plan');
    expect(result).toBe('plan');
  });

  it('updateEMRForm actualiza correctamente', async () => {
    vi.mocked(formDataSourceSupabase.updateForm).mockResolvedValue(mockForm);
    const emrForm = {
      id: 'form-1',
      visitId: 'visit-1',
      patientId: 'patient-1',
      professionalId: 'prof-1',
      subjective: 'subj',
      objective: 'obj',
      assessment: 'assess',
      plan: 'plan',
      notes: 'notes',
      updatedAt: '2023-01-01T00:00:00Z',
      createdAt: '2023-01-01T00:00:00Z'
    };
    const result = await EMRFormService.updateEMRForm(emrForm, 'user-1');
    expect(result).toBe(true);
    expect(formDataSourceSupabase.updateForm).toHaveBeenCalled();
    expect(AuditLogger.log).toHaveBeenCalled();
  });

  it('debe manejar errores de red al integrar sugerencias', async () => {
    // Configurar mock para que falle con error de red
    vi.mocked(formDataSourceSupabase.updateForm).mockRejectedValueOnce(new Error('Error de red simulado'));
    vi.mocked(formDataSourceSupabase.getFormsByVisitId).mockResolvedValue([mockForm]);
    
    const suggestion = { 
      id: 'sug-1', 
      content: 'Nueva sugerencia', 
      type: 'recommendation' as const, 
      sourceBlockId: 'block-1' 
    };
    
    const result = await EMRFormService.insertSuggestion(suggestion, 'visit-1', 'patient-1', 'user-1');
    
    // Debe retornar false en caso de error
    expect(result).toBe(false);
    
    // Debe llamar a AuditLogger.log con el evento de error
    expect(AuditLogger.log).toHaveBeenCalledWith(
      'suggestion_integration_error',
      expect.objectContaining({
        error: 'Error de red simulado',
        userId: 'user-1',
        visitId: 'visit-1',
        suggestionId: 'sug-1'
      })
    );
  });
});