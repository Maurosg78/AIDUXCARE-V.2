import { formDataSourceSupabase } from '@/core/dataSources/formDataSourceSupabase';
import { AuditLogger } from '@/core/audit/AuditLogger';
import { trackMetric } from '@/services/UsageAnalyticsService';
import type { EMRForm, SuggestionToIntegrate, Form } from '@/types/forms';

export type EMRSection = 'subjective' | 'objective' | 'assessment' | 'plan' | 'notes';

export class EMRFormService {
  /**
   * Obtiene el formulario EMR para una visita específica
   */
  static async getEMRForm(visitId: string): Promise<EMRForm | null> {
    try {
      const forms = await formDataSourceSupabase.getFormsByVisitId(visitId);
      
      if (!forms || forms.length === 0) {
        return null;
      }

      const form = forms[0]; // Tomamos el primer formulario
      const content = JSON.parse(form.content);

      return {
        id: form.id,
        visitId: form.visit_id,
        patientId: form.patient_id,
        professionalId: form.professional_id,
        subjective: content.subjective || '',
        objective: content.objective || '',
        assessment: content.assessment || '',
        plan: content.plan || '',
        notes: content.notes || '',
        updatedAt: form.updated_at,
        createdAt: form.created_at
      };
    } catch (error) {
      console.error('Error getting EMR form:', error);
      return null;
    }
  }

  /**
   * Obtiene el contenido de una sección específica del formulario EMR
   */
  static async getSectionContent(visitId: string, section: EMRSection): Promise<string | null> {
    try {
      const emrForm = await this.getEMRForm(visitId);
      if (!emrForm) return null;
      
      return emrForm[section] || "";
    } catch (error) {
      console.error('Error getting section content:', error);
      return null;
    }
  }

  /**
   * Actualiza un formulario EMR
   */
  static async updateEMRForm(emrForm: EMRForm, userId: string): Promise<boolean> {
    try {
      console.log("💾 Guardando formulario EMR");
      
      // Preparar contenido para actualización
      const content = {
        subjective: emrForm.subjective,
        objective: emrForm.objective,
        assessment: emrForm.assessment,
        plan: emrForm.plan,
        notes: emrForm.notes
      };

      const formData = {
        content: JSON.stringify(content),
        form_type: 'SOAP' as const,
        status: 'DRAFT' as const,
        visit_id: emrForm.visitId,
        patient_id: emrForm.patientId,
        professional_id: emrForm.professionalId,
        updated_at: new Date().toISOString()
      };

      if (emrForm.id) {
        // Actualizar formulario existente
        await formDataSourceSupabase.updateForm(emrForm.id, formData);
      } else {
        // Crear nuevo formulario
        await formDataSourceSupabase.createForm({
          ...formData,
          visit_id: emrForm.visitId,
          patient_id: emrForm.patientId,
          professional_id: emrForm.professionalId
        });
      }

      // Log de auditoría
      AuditLogger.log('EMR_FORM_UPDATED', {
        userId,
        formId: emrForm.id,
        visitId: emrForm.visitId,
        patientId: emrForm.patientId
      });

      // Tracking de métricas
      trackMetric('suggestions_generated', {
        suggestionId: emrForm.id || 'unknown',
        suggestionType: 'info',
        suggestionField: 'form_update'
      }, userId, emrForm.visitId);

      return true;
    } catch (error) {
      console.error('Error updating EMR form:', error);
      return false;
    }
  }

  /**
   * Inserta una sugerencia en el formulario EMR
   */
  static async insertSuggestion(
    suggestion: SuggestionToIntegrate,
    visitId: string,
    patientId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const forms = await formDataSourceSupabase.getFormsByVisitId(visitId);
      
      let form: Form;
      if (!forms || forms.length === 0) {
        // Crear formulario nuevo si no existe
        const newFormData = {
          form_type: 'SOAP' as const,
          content: JSON.stringify({
            subjective: '',
            objective: '',
            assessment: '',
            plan: '',
            notes: ''
          }),
          status: 'DRAFT' as const,
          visit_id: visitId,
          patient_id: patientId,
          professional_id: userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        form = await formDataSourceSupabase.createForm(newFormData);
      } else {
        form = forms[0];
      }

      const content = JSON.parse(form.content);
      
      // Verificar si la sugerencia ya existe
      const suggestionText = `🔎 ${suggestion.content}`;
      const planContent = content.plan || '';
      
      if (planContent.includes(suggestion.content)) {
        return false; // Sugerencia duplicada
      }

      // Agregar sugerencia al plan
      content.plan = planContent ? `${planContent}\n${suggestionText}` : suggestionText;

      // Actualizar formulario
      const updatedFormData = {
        content: JSON.stringify(content),
        form_type: 'SOAP' as const,
        status: 'DRAFT' as const,
        visit_id: visitId,
        patient_id: patientId,
        professional_id: userId,
        updated_at: new Date().toISOString()
      };

      await formDataSourceSupabase.updateForm(form.id, updatedFormData);

      // Log de auditoría
      AuditLogger.logSuggestionIntegration(
        userId,
        visitId,
        suggestion.id,
        'info',
        suggestion.content,
        'plan'
      );

      return true;
    } catch (error) {
      console.error('Error inserting suggestion:', error);
      return false;
    }
  }
} 