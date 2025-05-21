import supabase from '@/core/auth/supabaseClient';
import { Patient, PatientSchema } from '../domain/patientType';

export class PatientDataSourceSupabase {
  private supabase;

  constructor() {
    this.supabase = supabase;
  }

  /**
   * Obtiene todos los pacientes del profesional actual
   * Filtra los pacientes por el user_id del profesional autenticado
   */
  async getAllPatients(): Promise<Patient[]> {
    // Primero obtenemos la sesión actual para conocer el usuario autenticado
    const { data: sessionData } = await this.supabase.auth.getSession();
    
    // Si no hay sesión, devolver array vacío
    if (!sessionData?.session?.user) {
      return [];
    }
    
    // Con RLS activado, esta consulta solo devolverá los pacientes asociados al usuario
    const { data, error } = await this.supabase
      .from('patients')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw new Error(`Error fetching patients: ${error.message}`);
    
    // Validar datos con Zod
    const validatedData = data.map(patient => {
      try {
        return PatientSchema.parse(patient);
      } catch (e) {
        console.error(`Validation error for patient ${patient.id}:`, e);
        throw e;
      }
    });
    
    return validatedData;
  }

  /**
   * Obtiene un paciente por su ID
   */
  async getPatientById(patientId: string): Promise<Patient | null> {
    const { data, error } = await this.supabase
      .from('patients')
      .select('*')
      .eq('id', patientId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No se encontró el paciente
      throw new Error(`Error fetching patient: ${error.message}`);
    }
    
    if (!data) return null;
    
    // Validar datos con Zod
    try {
      return PatientSchema.parse(data);
    } catch (e) {
      console.error(`Validation error for patient ${patientId}:`, e);
      throw e;
    }
  }

  /**
   * Obtiene un paciente por su user_id (para pacientes que tienen acceso al sistema)
   */
  async getPatientByUserId(userId: string): Promise<Patient | null> {
    const { data, error } = await this.supabase
      .from('patients')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(`Error fetching patient by user_id: ${error.message}`);
    }
    
    if (!data) return null;
    
    // Validar datos con Zod
    try {
      return PatientSchema.parse(data);
    } catch (e) {
      console.error(`Validation error for patient with user_id ${userId}:`, e);
      throw e;
    }
  }

  /**
   * Crea un nuevo paciente asociado al profesional actual
   */
  async createPatient(patientData: Omit<Patient, 'id' | 'created_at' | 'updated_at'>): Promise<Patient> {
    // Obtener el ID del usuario actual
    const { data: sessionData } = await this.supabase.auth.getSession();
    
    // Si no hay sesión, lanzar error
    if (!sessionData?.session?.user) {
      throw new Error('No hay sesión de usuario activa para crear paciente');
    }
    
    const currentUserId = sessionData.session.user.id;
    
    // Asignar el user_id del profesional actual
    const patientWithUserId = {
      ...patientData,
      user_id: currentUserId
    };
    
    const { data, error } = await this.supabase
      .from('patients')
      .insert([patientWithUserId])
      .select()
      .single();

    if (error) throw new Error(`Error creating patient: ${error.message}`);
    
    // Validar datos con Zod
    try {
      return PatientSchema.parse(data);
    } catch (e) {
      console.error('Validation error for new patient:', e);
      throw e;
    }
  }

  /**
   * Actualiza un paciente existente
   */
  async updatePatient(patientId: string, patientData: Partial<Omit<Patient, 'id' | 'created_at' | 'updated_at'>>): Promise<Patient> {
    const { data, error } = await this.supabase
      .from('patients')
      .update(patientData)
      .eq('id', patientId)
      .select()
      .single();

    if (error) throw new Error(`Error updating patient: ${error.message}`);
    
    // Validar datos con Zod
    try {
      return PatientSchema.parse(data);
    } catch (e) {
      console.error(`Validation error for updated patient ${patientId}:`, e);
      throw e;
    }
  }

  /**
   * Elimina un paciente
   */
  async deletePatient(patientId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('patients')
      .delete()
      .eq('id', patientId);

    if (error) throw new Error(`Error deleting patient: ${error.message}`);
    
    return true;
  }
}

// Exportar una instancia singleton para uso en toda la aplicación
export const patientDataSourceSupabase = new PatientDataSourceSupabase(); 