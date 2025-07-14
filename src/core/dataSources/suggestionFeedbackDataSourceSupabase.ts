import supabase from '@/core/auth/supabaseClient';
import { SuggestionFeedback, SuggestionFeedbackDataSource } from './SuggestionFeedbackDataSource';

export const suggestionFeedbackDataSourceSupabase: SuggestionFeedbackDataSource = {
  getFeedbacksByVisit: async (visitId: string) => {
    const { data, error } = await supabase
      .from('suggestion_feedback')
      .select('*')
      .eq('visit_id', visitId);
    
    if (error) throw error;
    return (data || []) as SuggestionFeedback[];
  },

  getFeedbackBySuggestion: async (suggestionId: string) => {
    // @ts-expect-error DEUDA TÉCNICA: Eliminar Supabase y migrar a Firebase
    const { data, error } = await supabase
      .from('suggestion_feedback')
      .select('*')
      .eq('suggestion_id', suggestionId);
    
    if (error) throw error;
    return data as SuggestionFeedback | null;
  }
};

const saveFeedback = async (feedback: SuggestionFeedback): Promise<void> => {
  // @ts-expect-error DEUDA TÉCNICA: Eliminar Supabase y migrar a Firebase
  const { data, error } = await supabase
    .from('suggestion_feedback')
    .insert([feedback]);

  if (error) {
    console.error('Error saving feedback:', error);
    throw error;
  }
};

export { saveFeedback }; 