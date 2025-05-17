import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { formDataSourceSupabase } from '../dataSources/formDataSourceSupabase';
import { AuditLogger } from '../audit/AuditLogger';
import { track } from '../../services/UsageAnalyticsService';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../../config/env';

/**
 * Tipos de secciones del EMR donde se pueden integrar sugerencias
 */
export type EMRSection = 'subjective' | 'objective' | 'assessment' | 'plan' | 'notes';

/**
 * Esquema de validación para el formulario estructurado del EMR
 */
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

/**
 * Tipo derivado del esquema
 */
export type EMRForm = z.infer<typeof EMRFormSchema>;

/**
 * Interfaz para representar una sugerencia que se integrará al EMR
 */
export interface SuggestionToIntegrate {
  id: string;
  content: string;
  type: 'recommendation' | 'warning' | 'info';
  sourceBlockId: string;
}

/**
 * Servicio para gestionar la integración de sugerencias al EMR estructurado
 */
export class EMRFormService {
  private static supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );

  /**
   * Obtiene el formulario EMR para una visita específica
   * @param visitId ID de la visita
   * @returns Formulario EMR o null si no existe
   */
  public static async getEMRForm(visitId: string): Promise<EMRForm | null> {
    try {
      // Obtener el formulario clínico desde Supabase
      const forms = await formDataSourceSupabase.getFormsByVisitId(visitId);
      
      // Buscar un formulario de tipo SOAP (o el primero que exista)
      const soapForm = forms.find(form => form.form_type === 'SOAP') || forms[0];
      
      if (!soapForm) return null;
      
      // Convertir al formato EMRForm
      let emrContent: Record<string, string> = {};
      
      try {
        // Intentar parsear el contenido JSON
        emrContent = JSON.parse(soapForm.content);
      } catch (e) {
        console.error('Error parsing form content:', e);
        return null;
      }
      
      // Construir y validar el objeto EMRForm
      const emrForm: EMRForm = {
        id: soapForm.id,
        visitId: soapForm.visit_id,
        patientId: soapForm.patient_id,
        professionalId: soapForm.professional_id,
        subjective: emrContent.subjective || '',
        objective: emrContent.objective || '',
        assessment: emrContent.assessment || '',
        plan: emrContent.plan || '',
        notes: emrContent.notes || '',
        updatedAt: soapForm.updated_at,
        createdAt: soapForm.created_at
      };
      
      // Validar con Zod
      return EMRFormSchema.parse(emrForm);
    } catch (error) {
      console.error('Error fetching EMR form:', error);
      return null;
    }
  }

  /**
   * Determina la sección del EMR donde debe insertarse una sugerencia según su tipo
   * @param suggestionType Tipo de sugerencia
   * @returns Sección del EMR correspondiente
   */
  public static mapSuggestionTypeToEMRSection(
    suggestionType: 'recommendation' | 'warning' | 'info'
  ): EMRSection {
    switch (suggestionType) {
      case 'recommendation':
        return 'plan';
      case 'warning':
        return 'assessment';
      case 'info':
        return 'notes';
      default:
        return 'notes';
    }
  }

  /**
   * Verifica si una sugerencia ya ha sido integrada anteriormente
   * @param emrForm Formulario EMR
   * @param suggestion Sugerencia a verificar
   * @returns true si ya existe, false en caso contrario
   */
  private static suggestionAlreadyIntegrated(
    emrForm: EMRForm,
    suggestion: SuggestionToIntegrate
  ): boolean {
    const section = this.mapSuggestionTypeToEMRSection(suggestion.type);
    const prefixedContent = `🔎 ${suggestion.content}`;
    
    return emrForm[section].includes(prefixedContent);
  }

  /**
   * Inserta una sugerencia en el EMR estructurado
   * @param suggestion Sugerencia a insertar
   * @param visitId ID de la visita
   * @param patientId ID del paciente
   * @param userId ID del usuario que realiza la acción
   * @returns true si se insertó correctamente, false en caso contrario
   */
  public static async insertSuggestion(
    suggestion: SuggestionToIntegrate,
    visitId: string,
    patientId: string,
    userId: string = 'anonymous'
  ): Promise<boolean> {
    try {
      // Obtener o crear el formulario EMR para esta visita
      let emrForm = await this.getEMRForm(visitId);
      
      if (!emrForm) {
        // Si no hay formulario, verificar si obtenemos el professionalId
        const { data, error } = await this.supabase
          .from('visits')
          .select('professional_id')
          .eq('id', visitId)
          .single();
          
        if (error || !data) {
          console.error('Error fetching professional_id for visit:', error);
          return false;
        }
        
        const professionalId = data.professional_id;
        
        // Crear un nuevo formulario EMR
        emrForm = {
          visitId,
          patientId,
          professionalId,
          subjective: '',
          objective: '',
          assessment: '',
          plan: '',
          notes: '',
          updatedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
      }

      // Verificar si la sugerencia ya ha sido integrada
      if (this.suggestionAlreadyIntegrated(emrForm, suggestion)) {
        return false; // No integrar sugerencias duplicadas
      }

      // Determinar la sección donde insertar la sugerencia
      const section = this.mapSuggestionTypeToEMRSection(suggestion.type);
      
      // Prefijo visual para indicar que es una sugerencia integrada
      const prefixedContent = `🔎 ${suggestion.content}`;
      
      // Concatenar la sugerencia al contenido existente
      const currentContent = emrForm[section];
      emrForm[section] = currentContent 
        ? `${currentContent}\n${prefixedContent}`
        : prefixedContent;
      
      // Actualizar la marca de tiempo
      emrForm.updatedAt = new Date().toISOString();
      
      // Convertir al formato esperado por formDataSourceSupabase
      const formContent = {
        subjective: emrForm.subjective,
        objective: emrForm.objective,
        assessment: emrForm.assessment,
        plan: emrForm.plan,
        notes: emrForm.notes
      };
      
      // Si existe el formulario, actualizarlo
      if (emrForm.id) {
        await formDataSourceSupabase.updateForm(emrForm.id, {
          content: JSON.stringify(formContent),
          status: 'draft'
        });
      } else {
        // Si no existe, crear uno nuevo
        await formDataSourceSupabase.createForm({
          visit_id: emrForm.visitId,
          patient_id: emrForm.patientId,
          professional_id: emrForm.professionalId,
          form_type: 'SOAP',
          content: JSON.stringify(formContent),
          status: 'draft'
        });
      }
      
      // Registrar en el log de auditoría
      AuditLogger.logSuggestionIntegration(
        userId,
        visitId,
        suggestion.id,
        suggestion.type,
        suggestion.content,
        section
      );
      
      // Registrar métricas
      track('suggestions_integrated', userId, visitId, 1, {
        suggestion_id: suggestion.id,
        suggestion_type: suggestion.type,
        emr_section: section
      });
      
      return true;
    } catch (error) {
      console.error('Error al insertar sugerencia en EMR:', error);
      return false;
    }
  }

  /**
   * Obtiene el contenido actual de una sección del EMR
   * @param visitId ID de la visita
   * @param section Sección del EMR
   * @returns Contenido de la sección o cadena vacía si no existe
   */
  public static async getSectionContent(
    visitId: string,
    section: EMRSection
  ): Promise<string> {
    const form = await this.getEMRForm(visitId);
    return form ? form[section] : '';
  }
  
  /**
   * Actualiza el formulario EMR completo
   * @param formData Datos del formulario EMR
   * @param userId ID del usuario que realiza la actualización
   * @returns true si se actualizó correctamente, false en caso contrario
   */
  public static async updateEMRForm(
    formData: EMRForm,
    userId: string
  ): Promise<boolean> {
    try {
      // Validar los datos del formulario
      EMRFormSchema.parse(formData);
      
      // Actualizar la marca de tiempo
      formData.updatedAt = new Date().toISOString();
      
      // Convertir al formato esperado por formDataSourceSupabase
      const formContent = {
        subjective: formData.subjective,
        objective: formData.objective,
        assessment: formData.assessment,
        plan: formData.plan,
        notes: formData.notes
      };
      
      if (formData.id) {
        // Actualizar formulario existente
        await formDataSourceSupabase.updateForm(formData.id, {
          content: JSON.stringify(formContent),
          status: 'draft'
        });
      } else {
        // Crear nuevo formulario
        await formDataSourceSupabase.createForm({
          visit_id: formData.visitId,
          patient_id: formData.patientId,
          professional_id: formData.professionalId,
          form_type: 'SOAP',
          content: JSON.stringify(formContent),
          status: 'draft'
        });
      }
      
      // Registrar en el log de auditoría
      AuditLogger.log(
        'emr.form.update',
        userId,
        {
          visit_id: formData.visitId,
          patient_id: formData.patientId,
          form_type: 'SOAP'
        }
      );
      
      return true;
    } catch (error) {
      console.error('Error al actualizar formulario EMR:', error);
      return false;
    }
  }
} 