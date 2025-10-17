/**
 * Hook for signing clinical notes
 * Provides loading state and error handling for sign operations
 * 
 * @example
 * const { signNote, isLoading, error } = useSignNote();
 * await signNote(noteId);
 */

import { useState, useCallback } from 'react';
import { signNote as signNoteAPI } from '@/api/__mocks__/notes';
// TODO: Switch to real API when backend ready
// import { signNote as signNoteAPI } from '@/api/notes';

export interface UseSignNoteResult {
  signNote: (noteId: string) => Promise<void>;
  isLoading: boolean;
  error: Error | null;
  clearError: () => void;
}

export const useSignNote = (): UseSignNoteResult => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const signNote = useCallback(async (noteId: string): Promise<void> => {
    if (!noteId) {
      throw new Error('Note ID is required');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await signNoteAPI(noteId);
      
      if (!response.success) {
        throw new Error('Failed to sign note');
      }

      console.log('✅ Note signed successfully:', response.note);
      
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error signing note');
      setError(error);
      console.error('❌ Failed to sign note:', error);
      throw error;
      
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    signNote,
    isLoading,
    error,
    clearError
  };
};
