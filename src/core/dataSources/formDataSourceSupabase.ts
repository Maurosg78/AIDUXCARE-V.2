import { supabase } from '@/lib/supabase';
import { FormDataSource } from './FormDataSource';
import { Form, ClinicalFormData } from '@/types/forms';

class FormDataSourceSupabase implements FormDataSource {

  async getFormsByVisitId(visitId: string): Promise<Form[]> {
    const { data, error } = await supabase
      .from('forms')
      .select('*')
      .eq('visit_id', visitId);

    if (error) throw error;
    return data as Form[];
  }

  async getFormById(formId: string): Promise<Form | null> {
    const { data, error } = await supabase
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
    const { data, error } = await supabase
      .from('forms')
      .insert([formData])
      .select()
      .single();

    if (error) throw error;
    return data as Form;
  }

  async updateForm(formId: string, formData: ClinicalFormData): Promise<Form> {
    const { data, error } = await supabase
      .from('forms')
      .update(formData)
      .eq('id', formId)
      .select()
      .single();

    if (error) throw error;
    return data as Form;
  }

  async deleteForm(formId: string): Promise<void> {
    const { error } = await supabase
      .from('forms')
      .delete()
      .eq('id', formId);

    if (error) throw error;
  }
}

export const formDataSourceSupabase = new FormDataSourceSupabase();

