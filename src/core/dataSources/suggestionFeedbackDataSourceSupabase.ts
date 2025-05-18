import supabase from '../auth/supabaseClient';

/**
 * Interfaz que define la estructura de los datos de feedback de sugerencias
 */
export interface SuggestionFeedback {
  id: string;
  user_id: string;
  visit_id: string;
  suggestion_id: string;
  feedback_type: 'useful' | 'irrelevant' | 'incorrect' | 'dangerous';
  created_at: string;
}

/**
 * Fuente de datos para la gestión del feedback de sugerencias en Supabase
 */
export const suggestionFeedbackDataSourceSupabase = {
  /**
   * Obtiene el feedback asociado a una sugerencia específica
   * @param visitId ID de la visita
   * @param suggestionId ID de la sugerencia
   * @returns Objeto con el feedback si existe, null en caso contrario
   */
  async getFeedbackBySuggestion(visitId: string, suggestionId: string): Promise<SuggestionFeedback | null> {
    try {
      const { data, error } = await supabase
        .from('suggestion_feedback')
        .select('*')
        .eq('visit_id', visitId)
        .eq('suggestion_id', suggestionId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          // No se encontró un resultado, lo que es válido
          return null;
        }
        
        console.error('Error al obtener feedback de sugerencia:', error);
        return null;
      }
      
      return data as SuggestionFeedback;
    } catch (error) {
      console.error('Error al consultar feedback de sugerencia:', error);
      return null;
    }
  },
  
  /**
   * Obtiene todos los feedbacks asociados a una visita
   * @param visitId ID de la visita
   * @returns Array de objetos de feedback
   */
  async getFeedbacksByVisit(visitId: string): Promise<SuggestionFeedback[]> {
    try {
      const { data, error } = await supabase
        .from('suggestion_feedback')
        .select('*')
        .eq('visit_id', visitId);
      
      if (error) {
        console.error('Error al obtener feedbacks de visita:', error);
        return [];
      }
      
      return data as SuggestionFeedback[];
    } catch (error) {
      console.error('Error al consultar feedbacks de visita:', error);
      return [];
    }
  }
}; 