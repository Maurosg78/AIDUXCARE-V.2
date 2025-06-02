import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { formDataSourceSupabase } from '../dataSources/formDataSourceSupabase';
import { AuditLogger } from '../audit/AuditLogger';
import { trackMetric } from '../services/UsageAnalyticsService';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/env';
import { FormDataSource } from '../dataSources/FormDataSource';
import { ClinicalFormData, EMRContent, EMRForm } from '@/types/forms';
import { SuggestionType } from '@/types/agent';

/**
 * Tipos de secciones del EMR donde se pueden integrar sugerencias
 */
export type EMRSection = 'subjective' | 'objective' | 'assessment' | 'plan' | 'notes';

/**
 * Tipos de sugerencias que se pueden integrar al EMR
 */
export const INTEGRABLE_SUGGESTION_TYPES = ['recommendation', 'warning', 'info'] as const;
export type IntegrableSuggestionType = typeof INTEGRABLE_SUGGESTION_TYPES[number];

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
 * Interfaz para representar una sugerencia que se integrará al EMR
 */
export interface SuggestionToIntegrate {
  id: string;
  content: string;
  type: IntegrableSuggestionType;
  sourceBlockId: string;
  field?: string;
}

/**
 * Servicio para gestionar la integración de sugerencias al EMR estructurado
 */
export class EMRFormService {
  private static supabase = createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
  );
  private formDataSource: FormDataSource;

  constructor(formDataSource: FormDataSource) {
    this.formDataSource = formDataSource;
  }

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
      let emrContent: EMRContent;
      
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
    suggestionType: SuggestionType
  ): EMRSection {
    switch (suggestionType) {
      case 'recommendation':
        return 'plan';
      case 'warning':
        return 'assessment';
      case 'info':
        return 'notes';
      case 'diagnostic':
        return 'assessment';
      case 'treatment':
        return 'plan';
      case 'followup':
        return 'plan';
      case 'contextual':
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
      // Verificar que el tipo de sugerencia sea integrable
      if (!INTEGRABLE_SUGGESTION_TYPES.includes(suggestion.type)) {
        console.warn('Tipo de sugerencia no soportado para integración:', suggestion.type);
        return false;
      }

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
      emrForm[section] = emrForm[section]
        ? `${emrForm[section]}\n\n${prefixedContent}`
        : prefixedContent;

      // Actualizar el formulario en la base de datos
      const { error } = await this.supabase
        .from('forms')
        .update({
          content: JSON.stringify({
            subjective: emrForm.subjective,
            objective: emrForm.objective,
            assessment: emrForm.assessment,
            plan: emrForm.plan,
            notes: emrForm.notes
          }),
          updated_at: new Date().toISOString()
        })
        .eq('id', emrForm.id);

      if (error) {
        console.error('Error updating form:', error);
        return false;
      }

      // Registrar el evento de auditoría
      await AuditLogger.logEvent(
        'suggestion.integrated',
        userId,
        {
          suggestionId: suggestion.id,
          suggestionType: suggestion.type,
          section,
          content: suggestion.content
        },
        visitId
      );

      // Registrar métrica de uso
      trackMetric(
        'suggestion_integrated',
        userId,
        visitId,
        1,
        {
          suggestionType: suggestion.type,
          section
        }
      );

      return true;
    } catch (error) {
      console.error('Error inserting suggestion:', error);
      return false;
    }
  }

  /**
   * Obtiene el contenido de una sección específica del EMR
   * @param visitId ID de la visita
   * @param section Sección del EMR a obtener
   * @returns Contenido de la sección o cadena vacía si no existe
   */
  public static async getSectionContent(
    visitId: string,
    section: EMRSection
  ): Promise<string> {
    try {
      const emrForm = await this.getEMRForm(visitId);
      return emrForm ? emrForm[section] : '';
    } catch (error) {
      console.error('Error getting section content:', error);
      return '';
    }
  }

  /**
   * Actualiza el formulario EMR con nuevos datos
   * @param formData Datos del formulario a actualizar
   * @param userId ID del usuario que realiza la actualización
   * @returns true si se actualizó correctamente, false en caso contrario
   */
  public static async updateEMRForm(
    formData: EMRForm,
    userId: string
  ): Promise<boolean> {
    try {
      // Validar los datos del formulario
      const validatedData = EMRFormSchema.parse(formData);

      // Actualizar el formulario en la base de datos
      const { error } = await this.supabase
        .from('forms')
        .update({
          content: JSON.stringify({
            subjective: validatedData.subjective,
            objective: validatedData.objective,
            assessment: validatedData.assessment,
            plan: validatedData.plan,
            notes: validatedData.notes
          }),
          updated_at: new Date().toISOString()
        })
        .eq('id', validatedData.id);

      if (error) {
        console.error('Error updating form:', error);
        return false;
      }

      // Registrar el evento de auditoría
      await AuditLogger.logEvent(
        'form.updated',
        userId,
        {
          formId: validatedData.id,
          visitId: validatedData.visitId,
          patientId: validatedData.patientId
        },
        validatedData.visitId
      );

      return true;
    } catch (error) {
      console.error('Error updating EMR form:', error);
      return false;
    }
  }
} 