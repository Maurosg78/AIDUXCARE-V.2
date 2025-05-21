import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/env';
import { FormDataSource } from './FormDataSource';
import { Form, ClinicalFormData } from '@/types/forms';

class FormDataSourceSupabase implements FormDataSource {
  private supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  async getFormsByVisitId(visitId: string): Promise<Form[]> {
    const { data, error } = await this.supabase
      .from('forms')
      .select('*')
      .eq('visit_id', visitId);

    if (error) throw error;
    return data as Form[];
  }

  async getFormById(formId: string): Promise<Form | null> {
    const { data, error } = await this.supabase
      .from('forms')
      .select('*')
      .eq('id', formId)
      .single();

    if (error) throw error;
    return data as Form;
  }

  async createForm(formData: ClinicalFormData & {
    visit_id: string;
    patient_id: string;
    professional_id: string;
  }): Promise<Form> {
    const { data, error } = await this.supabase
      .from('forms')
      .insert([formData])
      .select()
      .single();

    if (error) throw error;
    return data as Form;
  }

  async updateForm(formId: string, formData: ClinicalFormData): Promise<Form> {
    const { data, error } = await this.supabase
      .from('forms')
      .update(formData)
      .eq('id', formId)
      .select()
      .single();

    if (error) throw error;
    return data as Form;
  }

  async deleteForm(formId: string): Promise<void> {
    const { error } = await this.supabase
      .from('forms')
      .delete()
      .eq('id', formId);

    if (error) throw error;
  }
}

export const formDataSourceSupabase = new FormDataSourceSupabase();

