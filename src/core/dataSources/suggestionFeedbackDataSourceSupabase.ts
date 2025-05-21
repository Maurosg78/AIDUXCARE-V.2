import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/config/env';
import { SuggestionFeedback, SuggestionFeedbackDataSource } from './SuggestionFeedbackDataSource';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    const { data, error } = await supabase
      .from('suggestion_feedback')
      .select('*')
      .eq('suggestion_id', suggestionId)
      .single();
    
    if (error) throw error;
    return data as SuggestionFeedback | null;
  }
}; 