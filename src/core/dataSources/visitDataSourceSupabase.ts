import { vi } from "vitest";
import supabase from '@/core/auth/supabaseClient';
import { Visit, VisitSchema } from '../domain/visitType';
import { SupabaseClient } from '@supabase/supabase-js';

export class VisitDataSourceSupabase {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = supabase;
  }

  /**
   * Obtiene las visitas para un profesional específico
   */
  async getVisitsByProfessionalId(professionalId: string): Promise<Visit[]> {
    const { data, error } = await this.supabase
      .from('visits')
      .select('*')
      .eq('professional_id', professionalId)
      .order('date', { ascending: false });

    if (error) throw new Error(`Error fetching visits: ${error.message}`);
    
    // Validar datos con Zod
    const validatedData = data.map((visit: Record<string, unknown>) => {
      try {
        return VisitSchema.parse(visit);
      } catch (e) {
        console.error(`Validation error for visit ${visit.id}:`, e);
        throw e;
      }
    });
    
    return validatedData;
  }

  /**
   * Obtiene una visita por su ID
   */
  async getVisitById(visitId: string): Promise<Visit | null> {
    const { data, error } = await this.supabase
      .from('visits')
      .select('*')
      .eq('id', visitId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No se encontró la visita
      throw new Error(`Error fetching visit: ${error.message}`);
    }
    
    if (!data) return null;
    
    // Validar datos con Zod
    try {
      return VisitSchema.parse(data);
    } catch (e) {
      console.error(`Validation error for visit ${visitId}:`, e);
      throw e;
    }
  }

  /**
   * Crea una nueva visita
   */
  async createVisit(visitData: Omit<Visit, 'id' | 'created_at' | 'updated_at'>): Promise<Visit> {
    const { data, error } = await this.supabase
      .from('visits')
      .insert([visitData])
      .select()
      .single();

    if (error) throw new Error(`Error creating visit: ${error.message}`);
    return data as Visit;
  }

  /**
   * Actualiza una visita existente
   */
  async updateVisit(visitId: string, visitData: Partial<Visit>): Promise<Visit> {
    const { data, error } = await this.supabase
      .from('visits')
      .update(visitData)
      .eq('id', visitId)
      .select()
      .single();

    if (error) throw new Error(`Error updating visit: ${error.message}`);
    return data as Visit;
  }

  /**
   * Obtiene las visitas para un paciente específico
   */
  async getVisitsByPatientId(patientId: string): Promise<Visit[]> {
    const { data, error } = await this.supabase
      .from('visits')
      .select('*')
      .eq('patient_id', patientId)
      .order('date', { ascending: false });

    if (error) throw new Error(`Error fetching visits for patient: ${error.message}`);
    
    // Validar datos con Zod
    const validatedData = data.map((visit: Record<string, unknown>) => {
      try {
        return VisitSchema.parse(visit);
      } catch (e) {
        console.error(`Validation error for visit ${visit.id}:`, e);
        throw e;
      }
    });
    
    return validatedData;
  }

  async deleteVisit(visitId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('visits')
      .delete()
      .eq('id', visitId);

    if (error) throw new Error(`Error deleting visit: ${error.message}`);
    return true;
  }

  async getAllVisits(): Promise<Visit[]> {
    const { data, error } = await this.supabase
      .from('visits')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Error fetching visits: ${error.message}`);
    return data as Visit[];
  }
}

// Exportar una instancia singleton para uso en toda la aplicación
export const visitDataSourceSupabase = new VisitDataSourceSupabase(); 