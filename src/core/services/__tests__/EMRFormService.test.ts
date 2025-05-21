import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { formDataSourceSupabase } from '@/core/dataSources/formDataSourceSupabase';
import { AuditLogger } from '@/core/audit/AuditLogger';
import { trackMetric } from '@/services/UsageAnalyticsService';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/env';
import type { FormDataSource, Form } from '@/core/dataSources/FormDataSource';
import type { ClinicalFormData, EMRForm, SuggestionToIntegrate } from '@/types/forms';

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
        userId,
        visitId,
        1,
        {
          suggestion_id: suggestion.id,
          suggestion_type: suggestion.type,
          emr_section: sec
        }
      );
      return true;
    } catch (e) {
      console.error('Error inserting suggestion:', e);
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